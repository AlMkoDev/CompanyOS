import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  ApproveDisputeResolutionDto,
  CollectionActionDto,
  CreateARInvoiceDto,
  CreateDisputeAttachmentDto,
  CreateDisputeActivityDto,
  CreateDisputeDto,
  CreateDisputeResolutionDto,
  CreateCustomerDto,
  MarkResolutionPostedDto,
  RecordPaymentDto,
  SendReminderDto,
  UpdateDisputeStatusDto,
} from './dto/ar.dto';

@Injectable()
export class ArService {
  constructor(private prisma: PrismaService) {}

  private readonly disputeSlaTargets: Record<
    string,
    { initialResponseHours: number; evidenceDays: number; resolutionDays: number; escalationDays: number }
  > = {
    CRITICAL: { initialResponseHours: 2, evidenceDays: 1, resolutionDays: 3, escalationDays: 2 },
    HIGH: { initialResponseHours: 4, evidenceDays: 2, resolutionDays: 5, escalationDays: 3 },
    MEDIUM: { initialResponseHours: 24, evidenceDays: 3, resolutionDays: 7, escalationDays: 5 },
    LOW: { initialResponseHours: 48, evidenceDays: 5, resolutionDays: 10, escalationDays: 8 },
  };

  private readonly writeOffApprovalThresholds = [
    { role: 'AR_Officer', min: 0, max: 50 },
    { role: 'Finance_Manager', min: 51, max: 200 },
    { role: 'Operations_Director', min: 201, max: 500 },
    { role: 'CEO', min: 501, max: Number.POSITIVE_INFINITY },
  ];

  private getOverdueDays(dueDate: Date | string, now = new Date()) {
    const diffMs = now.getTime() - new Date(dueDate).getTime();
    if (diffMs <= 0) return 0;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  private getNextDunningStage(overdueDays: number, reminderCount: number) {
    const stages = [3, 7, 15];
    const nextStage = stages.find((stage) => overdueDays >= stage && reminderCount < stages.indexOf(stage) + 1);
    return nextStage ?? null;
  }

  private async getCompanyInvoice(companyId: string, invoiceId: string) {
    const invoice = await this.prisma.aRInvoice.findFirst({
      where: { id: invoiceId, company_id: companyId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  private async getCompanyDispute(companyId: string, disputeId: string) {
    const dispute = await this.prisma.disputeCase.findFirst({
      where: { id: disputeId, company_id: companyId },
      include: {
        invoice: { include: { customer: true } },
        activities: { orderBy: { created_at: 'desc' } },
        resolutions: { orderBy: { created_at: 'desc' } },
        attachments: { orderBy: { created_at: 'desc' } },
      },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');
    return dispute;
  }

  private async getCompanyResolution(companyId: string, resolutionId: string) {
    const resolution = await this.prisma.disputeResolution.findFirst({
      where: { id: resolutionId, company_id: companyId },
      include: {
        dispute: {
          include: {
            invoice: { include: { customer: true } },
          },
        },
      },
    });
    if (!resolution) throw new NotFoundException('Dispute resolution not found');
    return resolution;
  }

  private getOutstandingBalance(invoice: { amount: any; paid_amount: any }) {
    return Number(invoice.amount) - Number(invoice.paid_amount);
  }

  private hasOutstandingBalance(invoice?: { amount?: any; paid_amount?: any } | null) {
    if (!invoice) return false;
    return this.getOutstandingBalance({
      amount: invoice.amount ?? 0,
      paid_amount: invoice.paid_amount ?? 0,
    }) > 0;
  }

  private normalizeDisputePriority(priority?: string) {
    return (priority || 'MEDIUM').toUpperCase();
  }

  private getDisputeDueDate(priority?: string, raisedDate = new Date()) {
    const normalized = this.normalizeDisputePriority(priority);
    const target = this.disputeSlaTargets[normalized] || this.disputeSlaTargets.MEDIUM;
    const dueDate = new Date(raisedDate);
    dueDate.setDate(dueDate.getDate() + target.resolutionDays);
    return dueDate;
  }

  private getDisputeEvidenceDueDate(priority?: string, raisedDate = new Date()) {
    const normalized = this.normalizeDisputePriority(priority);
    const target = this.disputeSlaTargets[normalized] || this.disputeSlaTargets.MEDIUM;
    const dueDate = new Date(raisedDate);
    dueDate.setDate(dueDate.getDate() + target.evidenceDays);
    return dueDate;
  }

  private isActiveDisputeStatus(status: string) {
    return ['OPEN', 'RAISED', 'UNDER_REVIEW', 'EVIDENCE_PENDING', 'ESCALATED', 'RESOLUTION_PROPOSED', 'CUSTOMER_APPROVAL', 'NEGOTIATION'].includes(
      status,
    );
  }

  private getResolutionAmount(data: { credit_amount?: number | null; writeoff_amount?: number | null }) {
    return Number(data.credit_amount || 0) + Number(data.writeoff_amount || 0);
  }

  private getRequiredApprovers(totalAmount: number) {
    const primary =
      this.writeOffApprovalThresholds.find((threshold) => totalAmount >= threshold.min && totalAmount <= threshold.max) ||
      this.writeOffApprovalThresholds[this.writeOffApprovalThresholds.length - 1];

    return ['Finance_Manager', primary.role];
  }

  private async applyCustomerDisputeControls(tx: any, companyId: string, customerId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentDisputeCount = await tx.disputeCase.count({
      where: {
        company_id: companyId,
        customer_id: customerId,
        raised_date: { gte: thirtyDaysAgo },
      },
    });

    if (recentDisputeCount > 3) {
      await tx.customer.update({
        where: { id: customerId },
        data: {
          credit_on_hold: true,
          status: 'credit_review',
          credit_hold_reason: 'Customer exceeded 3 disputes within 30 days; credit frozen pending review.',
          last_dispute_review_at: new Date(),
        },
      });
    }
  }

  private async getCompanyCollectionCase(companyId: string, caseId: string) {
    const collectionCase = await this.prisma.collectionCase.findFirst({
      where: { id: caseId, company_id: companyId },
      include: {
        invoice: {
          include: { customer: true },
        },
      },
    });
    if (!collectionCase) throw new NotFoundException('Collection case not found');
    return collectionCase;
  }

  private appendCollectionLog(existingNotes?: string | null, userId?: string, action?: string, notes?: string) {
    const entry = [
      `[${new Date().toISOString()}]`,
      action || 'update',
      userId ? `by ${userId}` : undefined,
      notes?.trim() ? `- ${notes.trim()}` : undefined,
    ]
      .filter(Boolean)
      .join(' ');

    return [existingNotes?.trim(), entry].filter(Boolean).join('\n');
  }

  // --- Customers ---

  async createCustomer(companyId: string, data: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });
  }

  async getCustomers(companyId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { company_id: companyId },
      orderBy: { name: 'asc' },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const disputes = await this.prisma.disputeCase.findMany({
      where: {
        company_id: companyId,
        raised_date: { gte: thirtyDaysAgo },
      },
      select: {
        customer_id: true,
        disputed_amount: true,
        status: true,
      },
    });

    return customers.map((customer) => {
      const customerDisputes = disputes.filter((dispute) => dispute.customer_id === customer.id);
      return {
        ...customer,
        dispute_count_30d: customerDisputes.length,
        disputed_value_30d: customerDisputes.reduce((sum, dispute) => sum + Number(dispute.disputed_amount), 0),
        has_open_disputes: customerDisputes.some((dispute) => this.isActiveDisputeStatus(dispute.status)),
      };
    });
  }

  // --- Sales Invoices ---

  async createInvoice(companyId: string, data: CreateARInvoiceDto) {
    return this.prisma.aRInvoice.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });
  }

  async getInvoices(companyId: string) {
    return this.prisma.aRInvoice.findMany({
      where: { company_id: companyId },
      include: { customer: true },
      orderBy: { due_date: 'asc' },
    });
  }

  async getInvoiceReceipts(companyId: string, invoiceId: string) {
    const invoice = await this.prisma.aRInvoice.findFirst({
      where: { id: invoiceId, company_id: companyId },
      include: {
        customer: true,
        payments: {
          orderBy: [{ payment_date: 'desc' }, { created_at: 'desc' }],
        },
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    const totalReceived = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const outstandingBalance = Math.max(0, Number(invoice.amount) - totalReceived);

    return {
      invoice,
      total_received: totalReceived,
      outstanding_balance: outstandingBalance,
      payment_count: invoice.payments.length,
    };
  }

  async getInvoiceDunning(companyId: string, invoiceId: string) {
    const invoice = await this.prisma.aRInvoice.findFirst({
      where: { id: invoiceId, company_id: companyId },
      include: {
        customer: true,
        dunning_events: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    const outstandingBalance = this.getOutstandingBalance(invoice);
    const overdueDays = outstandingBalance > 0 ? this.getOverdueDays(invoice.due_date) : 0;
    const nextReminderStage = outstandingBalance > 0 ? this.getNextDunningStage(overdueDays, invoice.reminder_count || 0) : null;

    return {
      invoice,
      overdue_days: overdueDays,
      outstanding_balance: Math.max(0, outstandingBalance),
      next_reminder_stage: nextReminderStage,
      reminder_history: invoice.dunning_events,
    };
  }

  async createDispute(companyId: string, userId: string, data: CreateDisputeDto) {
    const invoice = await this.prisma.aRInvoice.findFirst({
      where: { id: data.invoice_id, company_id: companyId },
      include: { customer: true },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    const outstandingBalance = this.getOutstandingBalance(invoice);
    if (outstandingBalance <= 0) {
      throw new BadRequestException('A settled invoice cannot be disputed');
    }

    if (Number(data.disputed_amount) > outstandingBalance + 0.009) {
      throw new BadRequestException(`Disputed amount exceeds outstanding balance of ${outstandingBalance.toFixed(2)}`);
    }

    const raisedDate = new Date();
    const priority = this.normalizeDisputePriority(data.priority);
    const dueDate = this.getDisputeDueDate(priority, raisedDate);
    const evidenceDueDate = this.getDisputeEvidenceDueDate(priority, raisedDate);

    return this.prisma.$transaction(async (tx) => {
      const dispute = await tx.disputeCase.create({
        data: {
          company_id: companyId,
          invoice_id: invoice.id,
          customer_id: invoice.customer_id,
          status: 'OPEN',
          priority,
          dispute_type: data.dispute_type,
          reason_code: data.reason_code,
          disputed_amount: data.disputed_amount,
          due_date: dueDate,
          assigned_to: userId,
          created_by: userId,
          affects_revenue: data.affects_revenue ?? true,
          blocks_payment: data.blocks_payment ?? true,
          product_code: data.product_code,
          evidence_required: data.evidence_required || [],
          evidence_due_date: evidenceDueDate,
        },
        include: {
          invoice: { include: { customer: true } },
          activities: true,
          attachments: true,
        },
      });

      await tx.disputeActivity.create({
        data: {
          company_id: companyId,
          dispute_id: dispute.id,
          activity_type: 'DISPUTE_RAISED',
          notes: data.notes || `Dispute opened for invoice ${invoice.invoice_no}.`,
          actor_user_id: userId,
        },
      });

      await this.applyCustomerDisputeControls(tx, companyId, invoice.customer_id);

      return dispute;
    });
  }

  async getDisputes(companyId: string) {
    return this.prisma.disputeCase.findMany({
      where: { company_id: companyId },
      include: {
        invoice: { include: { customer: true } },
        activities: {
          take: 3,
          orderBy: { created_at: 'desc' },
        },
        resolutions: {
          orderBy: { created_at: 'desc' },
        },
        attachments: {
          orderBy: { created_at: 'desc' },
        },
      },
      orderBy: [{ due_date: 'asc' }, { created_at: 'desc' }],
    });
  }

  async getInvoiceDisputes(companyId: string, invoiceId: string) {
    await this.getCompanyInvoice(companyId, invoiceId);

    return this.prisma.disputeCase.findMany({
      where: { company_id: companyId, invoice_id: invoiceId },
      include: {
        activities: {
          orderBy: { created_at: 'desc' },
        },
        resolutions: {
          orderBy: { created_at: 'desc' },
        },
        attachments: {
          orderBy: { created_at: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async addDisputeActivity(companyId: string, disputeId: string, userId: string, data: CreateDisputeActivityDto) {
    await this.getCompanyDispute(companyId, disputeId);

    return this.prisma.disputeActivity.create({
      data: {
        company_id: companyId,
        dispute_id: disputeId,
        activity_type: data.activity_type,
        notes: data.notes,
        actor_user_id: userId,
      },
    });
  }

  async createDisputeResolution(companyId: string, disputeId: string, userId: string, data: CreateDisputeResolutionDto) {
    const dispute = await this.getCompanyDispute(companyId, disputeId);

    if (!['RESOLUTION_PROPOSED', 'RESOLVED', 'CUSTOMER_APPROVAL', 'NEGOTIATION'].includes(dispute.status)) {
      throw new BadRequestException('Resolution records can only be created once the dispute is in a resolution phase');
    }

    const resolutionAmount = this.getResolutionAmount(data);
    if (resolutionAmount <= 0) {
      throw new BadRequestException('A credit amount or write-off amount is required');
    }

    if (resolutionAmount > Number(dispute.disputed_amount) + 0.009) {
      throw new BadRequestException('Resolution amount cannot exceed the disputed amount');
    }

    const approvalChain = this.getRequiredApprovers(resolutionAmount).map((role, index) => ({
      level: index + 1,
      role,
      status: index === 0 ? 'pending' : 'queued',
      approved_by: null,
      timestamp: null,
    }));

    return this.prisma.$transaction(async (tx) => {
      const resolution = await tx.disputeResolution.create({
        data: {
          company_id: companyId,
          dispute_id: disputeId,
          resolution_type: data.resolution_type,
          credit_amount: data.credit_amount,
          writeoff_amount: data.writeoff_amount,
          approval_chain: approvalChain,
        },
      });

      await tx.disputeActivity.create({
        data: {
          company_id: companyId,
          dispute_id: disputeId,
          activity_type: 'RESOLUTION_RECORDED',
          notes: `${data.resolution_type} recorded for ${resolutionAmount.toFixed(2)} and routed for approval.`,
          actor_user_id: userId,
        },
      });

      return resolution;
    });
  }

  async addDisputeAttachment(companyId: string, disputeId: string, userId: string, data: CreateDisputeAttachmentDto) {
    const dispute = await this.getCompanyDispute(companyId, disputeId);

    return this.prisma.$transaction(async (tx) => {
      const attachment = await tx.disputeAttachment.create({
        data: {
          company_id: companyId,
          dispute_id: disputeId,
          file_name: data.file_name,
          file_type: data.file_type,
          category: data.category,
          file_url: data.file_url,
          notes: data.notes,
          uploaded_by: userId,
        },
      });

      const nextStatus =
        ['OPEN', 'RAISED'].includes(dispute.status) && (dispute.evidence_required?.length || 0) > 0
          ? 'EVIDENCE_PENDING'
          : dispute.status;

      if (nextStatus !== dispute.status) {
        await tx.disputeCase.update({
          where: { id: disputeId },
          data: { status: nextStatus },
        });
      }

      await tx.disputeActivity.create({
        data: {
          company_id: companyId,
          dispute_id: disputeId,
          activity_type: 'EVIDENCE_UPLOADED',
          notes: `${data.category} uploaded: ${data.file_name}`,
          actor_user_id: userId,
        },
      });

      return attachment;
    });
  }

  async approveDisputeResolution(companyId: string, resolutionId: string, userId: string, data: ApproveDisputeResolutionDto) {
    const resolution = await this.getCompanyResolution(companyId, resolutionId);
    const action = data.action.toUpperCase();

    if (!['APPROVE', 'REJECT'].includes(action)) {
      throw new BadRequestException('Resolution action must be APPROVE or REJECT');
    }

    const chain = Array.isArray(resolution.approval_chain) ? [...(resolution.approval_chain as any[])] : [];
    const currentStepIndex = chain.findIndex((step) => step.status === 'pending');

    if (currentStepIndex === -1 && action === 'APPROVE') {
      throw new BadRequestException('No approval is currently pending for this resolution');
    }

    const now = new Date().toISOString();
    let nextStatus = resolution.status;

    if (action === 'REJECT') {
      nextStatus = 'REJECTED';
      chain.forEach((step) => {
        if (step.status === 'pending' || step.status === 'queued') {
          step.status = 'cancelled';
        }
      });
    } else {
      chain[currentStepIndex] = {
        ...chain[currentStepIndex],
        status: 'approved',
        approved_by: userId,
        timestamp: now,
      };

      const nextQueuedIndex = chain.findIndex((step) => step.status === 'queued');
      if (nextQueuedIndex >= 0) {
        chain[nextQueuedIndex] = {
          ...chain[nextQueuedIndex],
          status: 'pending',
        };
        nextStatus = 'PENDING_APPROVAL';
      } else {
        nextStatus = 'APPROVED';
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedResolution = await tx.disputeResolution.update({
        where: { id: resolutionId },
        data: {
          status: nextStatus,
          approval_chain: chain,
          approved_by: action === 'APPROVE' ? userId : resolution.approved_by,
        },
      });

      await tx.disputeActivity.create({
        data: {
          company_id: companyId,
          dispute_id: resolution.dispute_id,
          activity_type: 'RESOLUTION_APPROVAL',
          notes: action === 'APPROVE' ? `Resolution approved at level ${currentStepIndex + 1}.` : 'Resolution rejected.',
          actor_user_id: userId,
        },
      });

      return updatedResolution;
    });
  }

  async markResolutionPosted(companyId: string, resolutionId: string, userId: string, data?: MarkResolutionPostedDto) {
    const resolution = await this.getCompanyResolution(companyId, resolutionId);

    if (resolution.status !== 'APPROVED') {
      throw new BadRequestException('Resolution must be approved before posting to GL');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.disputeResolution.update({
        where: { id: resolutionId },
        data: {
          posted_to_gl: data?.posted_to_gl ?? true,
          status: 'POSTED',
        },
      });

      await tx.disputeActivity.create({
        data: {
          company_id: companyId,
          dispute_id: resolution.dispute_id,
          activity_type: 'RESOLUTION_POSTED',
          notes: 'Resolution marked as posted to the general ledger.',
          actor_user_id: userId,
        },
      });

      return updated;
    });
  }

  async updateDisputeStatus(companyId: string, disputeId: string, userId: string, data: UpdateDisputeStatusDto) {
    const dispute = await this.getCompanyDispute(companyId, disputeId);
    const nextStatus = data.status.toUpperCase();
    const resolvedStates = ['RESOLVED', 'CLOSED', 'CREDIT_ISSUED', 'AUTO_CLOSED'];

    if (['CLOSED', 'CREDIT_ISSUED'].includes(nextStatus)) {
      const latestResolution = dispute.resolutions[0];
      if (!latestResolution || latestResolution.status !== 'POSTED') {
        throw new BadRequestException('Dispute cannot close until the resolution is approved and posted to GL');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.disputeCase.update({
        where: { id: disputeId },
        data: {
          status: nextStatus,
          resolved_amount: data.resolved_amount,
          resolution_notes: data.resolution_notes ?? dispute.resolution_notes,
          resolved_date: resolvedStates.includes(nextStatus) ? new Date() : null,
        },
        include: {
          invoice: { include: { customer: true } },
          activities: { orderBy: { created_at: 'desc' } },
          resolutions: { orderBy: { created_at: 'desc' } },
        },
      });

      await tx.disputeActivity.create({
        data: {
          company_id: companyId,
          dispute_id: disputeId,
          activity_type: 'STATUS_CHANGED',
          notes: data.resolution_notes ? `${nextStatus}: ${data.resolution_notes}` : `Status changed to ${nextStatus}.`,
          actor_user_id: userId,
        },
      });

      return updated;
    });
  }

  // --- Payments ---

  async recordPayment(companyId: string, data: RecordPaymentDto, userId?: string) {
    const { invoice_id, amount, ...paymentData } = data;

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.aRInvoice.findFirst({
        where: { id: invoice_id, company_id: companyId },
      });
      if (!invoice) throw new NotFoundException('Invoice not found');

      const outstandingBalance = this.getOutstandingBalance(invoice);

      if (outstandingBalance <= 0) {
        throw new BadRequestException('Invoice is already fully settled');
      }

      if (Number(amount) > outstandingBalance + 0.009) {
        throw new BadRequestException(`Payment exceeds outstanding balance of ${outstandingBalance.toFixed(2)}`);
      }

      const payment = await tx.payment.create({
        data: {
          ...paymentData,
          amount,
          invoice_id,
          company_id: companyId,
          recorded_by: userId,
        },
      });

      const updatedInvoice = await tx.aRInvoice.update({
        where: { id: invoice_id },
        data: {
          paid_amount: { increment: amount },
        },
      });

      // Update status based on total paid
      const remainingBalance = Math.max(0, Number(updatedInvoice.amount) - Number(updatedInvoice.paid_amount));
      const newStatus =
        remainingBalance <= 0
          ? 'paid'
          : new Date(updatedInvoice.due_date).getTime() < Date.now()
            ? 'overdue'
            : 'partially_paid';

      const finalInvoice = await tx.aRInvoice.update({
        where: { id: invoice_id },
        data: { status: newStatus },
      });

      const activeCases = await tx.collectionCase.findMany({
        where: {
          company_id: companyId,
          invoice_id,
          escalation_level: { gt: 0 },
        },
      });

      for (const collectionCase of activeCases) {
        const resolved = newStatus === 'paid';
        await tx.collectionCase.update({
          where: { id: collectionCase.id },
          data: {
            escalation_level: resolved ? 0 : collectionCase.escalation_level,
            last_action_date: new Date(),
            assigned_to: collectionCase.assigned_to ?? userId,
            notes: this.appendCollectionLog(
              collectionCase.notes,
              userId,
              resolved ? 'payment_applied_resolved' : 'payment_applied',
              `Payment of ${amount} recorded. Remaining balance is ${remainingBalance.toFixed(2)} and invoice status is now ${newStatus}.`,
            ),
          },
        });
      }

      return {
        payment,
        invoice: finalInvoice,
        applied_amount: Number(amount),
        remaining_balance: remainingBalance,
      };
    });
  }

  // --- AR Aging & Collections (VF-FIN-003) ---

  async getAgingReport(companyId: string) {
    const [invoices, activeDisputes] = await Promise.all([
      this.prisma.aRInvoice.findMany({
        where: {
          company_id: companyId,
          status: { not: 'paid' },
        },
      }),
      this.prisma.disputeCase.findMany({
        where: {
          company_id: companyId,
          blocks_payment: true,
        },
      }),
    ]);

    const disputedInvoiceMap = new Map<string, number>();
    activeDisputes
      .filter((dispute) => this.isActiveDisputeStatus(dispute.status))
      .forEach((dispute) => {
        disputedInvoiceMap.set(
          dispute.invoice_id,
          (disputedInvoiceMap.get(dispute.invoice_id) || 0) + Number(dispute.disputed_amount),
        );
      });

    const now = new Date();
    const buckets = {
      current: 0,
      '1-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90plus': 0,
      disputed: 0,
    };

    invoices.forEach((inv) => {
      const dueDate = new Date(inv.due_date);
      const diffTime = now.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const balance = Number(inv.amount) - Number(inv.paid_amount);
      const disputedAmount = disputedInvoiceMap.get(inv.id) || 0;
      const collectibleBalance = Math.max(0, balance - disputedAmount);

      if (disputedAmount > 0) buckets.disputed += disputedAmount;

      if (collectibleBalance <= 0) return;

      if (diffDays <= 0) buckets.current += collectibleBalance;
      else if (diffDays <= 30) buckets['1-30'] += collectibleBalance;
      else if (diffDays <= 60) buckets['31-60'] += collectibleBalance;
      else if (diffDays <= 90) buckets['61-90'] += collectibleBalance;
      else buckets['90plus'] += collectibleBalance;
    });

    return buckets;
  }

  async getCollectionQueue(companyId: string) {
    const collectionCases = await this.prisma.collectionCase.findMany({
      where: {
        company_id: companyId,
        escalation_level: { gt: 0 },
      },
      include: {
        invoice: {
          include: { customer: true },
        },
      },
      orderBy: [
        { escalation_level: 'desc' },
        { last_action_date: 'desc' },
        { created_at: 'desc' },
      ],
    });

    return collectionCases.filter((collectionCase) => this.hasOutstandingBalance(collectionCase.invoice));
  }

  async createCollectionCase(companyId: string, invoiceId: string, notes?: string, userId?: string) {
    await this.getCompanyInvoice(companyId, invoiceId);

    const existingCase = await this.prisma.collectionCase.findFirst({
      where: {
        company_id: companyId,
        invoice_id: invoiceId,
        escalation_level: { gt: 0 },
      },
      include: {
        invoice: {
          include: { customer: true },
        },
      },
    });

    if (existingCase) {
      return this.prisma.collectionCase.update({
        where: { id: existingCase.id },
        data: {
          assigned_to: existingCase.assigned_to ?? userId,
          last_action_date: new Date(),
          notes: this.appendCollectionLog(existingCase.notes, userId, 'case_reopened', notes || 'Collection case already open; queue item refreshed.'),
        },
        include: {
          invoice: {
            include: { customer: true },
          },
        },
      });
    }

    return this.prisma.collectionCase.create({
      data: {
        company_id: companyId,
        invoice_id: invoiceId,
        assigned_to: userId,
        notes: this.appendCollectionLog(undefined, userId, 'case_opened', notes || 'Collection case created from AR workflow.'),
        escalation_level: 1,
        last_action_date: new Date(),
      },
      include: {
        invoice: {
          include: { customer: true },
        },
      },
    });
  }

  async addCollectionAction(companyId: string, caseId: string, userId: string, data: CollectionActionDto) {
    const collectionCase = await this.getCompanyCollectionCase(companyId, caseId);

    return this.prisma.collectionCase.update({
      where: { id: caseId },
      data: {
        assigned_to: collectionCase.assigned_to ?? userId,
        last_action_date: new Date(),
        notes: this.appendCollectionLog(collectionCase.notes, userId, data.action, data.notes),
      },
      include: {
        invoice: {
          include: { customer: true },
        },
      },
    });
  }

  async escalateCollectionCase(companyId: string, caseId: string, userId: string, notes?: string) {
    const collectionCase = await this.getCompanyCollectionCase(companyId, caseId);
    const nextLevel = Math.min((collectionCase.escalation_level || 1) + 1, 4);

    return this.prisma.collectionCase.update({
      where: { id: caseId },
      data: {
        escalation_level: nextLevel,
        assigned_to: collectionCase.assigned_to ?? userId,
        last_action_date: new Date(),
        notes: this.appendCollectionLog(
          collectionCase.notes,
          userId,
          'case_escalated',
          notes || `Escalated collection case to level ${nextLevel}.`,
        ),
      },
      include: {
        invoice: {
          include: { customer: true },
        },
      },
    });
  }

  async resolveCollectionCase(companyId: string, caseId: string, userId: string, notes?: string) {
    const collectionCase = await this.getCompanyCollectionCase(companyId, caseId);

    return this.prisma.collectionCase.update({
      where: { id: caseId },
      data: {
        escalation_level: 0,
        assigned_to: collectionCase.assigned_to ?? userId,
        last_action_date: new Date(),
        notes: this.appendCollectionLog(
          collectionCase.notes,
          userId,
          'case_resolved',
          notes || 'Collection case resolved and removed from active queue.',
        ),
      },
      include: {
        invoice: {
          include: { customer: true },
        },
      },
    });
  }

  async getARDashboard(companyId: string) {
    const [customers, invoices, aging, collectionCases, disputes] = await Promise.all([
      this.prisma.customer.count({ where: { company_id: companyId } }),
      this.prisma.aRInvoice.findMany({
        where: { company_id: companyId, status: { not: 'paid' } },
        include: { customer: true },
        take: 10,
        orderBy: { due_date: 'asc' },
      }),
      this.getAgingReport(companyId),
      this.prisma.collectionCase.findMany({
        where: {
          company_id: companyId,
          escalation_level: { gt: 0 },
        },
        include: {
          invoice: {
            include: { customer: true },
          },
        },
        orderBy: [
          { escalation_level: 'desc' },
          { last_action_date: 'desc' },
          { created_at: 'desc' },
        ],
        take: 3,
      }),
      this.prisma.disputeCase.findMany({
        where: { company_id: companyId },
      }),
    ]);

    const totalAr = Object.entries(aging)
      .filter(([bucket]) => bucket !== 'disputed')
      .reduce((sum, [, value]) => sum + value, 0);
    const remindersDue = invoices.filter((invoice) => {
      const outstandingBalance = this.getOutstandingBalance(invoice);
      if (outstandingBalance <= 0) return false;

      const overdueDays = this.getOverdueDays(invoice.due_date);
      return this.getNextDunningStage(overdueDays, invoice.reminder_count || 0) !== null;
    }).length;
    const openDisputes = disputes.filter((dispute) => this.isActiveDisputeStatus(dispute.status));
    const disputedAmount = openDisputes.reduce((sum, dispute) => sum + Number(dispute.disputed_amount), 0);
    const overdueDisputeValue = openDisputes
      .filter((dispute) => new Date(dispute.due_date).getTime() < Date.now())
      .reduce((sum, dispute) => sum + Number(dispute.disputed_amount), 0);
    const healthPenalty = totalAr > 0 ? Math.min(15, (overdueDisputeValue / totalAr) * 100) : 0;
    const evidencePendingCount = openDisputes.filter((dispute) => dispute.status === 'EVIDENCE_PENDING').length;
    const overdueEvidenceCount = openDisputes.filter(
      (dispute) => dispute.status === 'EVIDENCE_PENDING' && dispute.evidence_due_date && new Date(dispute.evidence_due_date).getTime() < Date.now(),
    ).length;

    const activeEscalations = collectionCases.filter((collectionCase) => this.hasOutstandingBalance(collectionCase.invoice));

    return {
      customerCount: customers,
      totalAr,
      aging,
      pendingInvoices: invoices,
      collectionCases: activeEscalations.length,
      topEscalations: activeEscalations,
      remindersDue,
      disputesAtRisk: {
        total: disputedAmount,
        openCount: openDisputes.length,
        overdueValue: overdueDisputeValue,
        healthPenalty,
        evidencePendingCount,
        overdueEvidenceCount,
      },
    };
  }

  async sendInvoice(companyId: string, invoiceId: string, userId?: string) {
    const invoice = await this.getCompanyInvoice(companyId, invoiceId);
    const now = new Date();

    // Mock PDF generation and email sending
    console.log(`[AR] Generating PDF for Invoice #${invoice.invoice_no}...`);
    console.log(`[AR] Dispatching email to customer ${invoice.customer_id}...`);

    return this.prisma.$transaction(async (tx) => {
      const updatedInvoice = await tx.aRInvoice.update({
        where: { id: invoiceId },
        data: {
          status: 'sent',
          sent_at: now,
          delivered_at: now,
          delivery_method: 'email',
        },
      });

      await tx.aRDunningEvent.create({
        data: {
          company_id: companyId,
          invoice_id: invoiceId,
          event_type: 'invoice_sent',
          channel: 'email',
          performed_by: userId,
          details: {
            invoice_no: invoice.invoice_no,
            delivered: true,
          },
        },
      });

      return updatedInvoice;
    });
  }

  async sendReminder(companyId: string, invoiceId: string, userId?: string, data?: SendReminderDto) {
    const invoice = await this.getCompanyInvoice(companyId, invoiceId);
    const outstandingBalance = this.getOutstandingBalance(invoice);

    if (outstandingBalance <= 0) {
      throw new BadRequestException('Invoice is already fully settled');
    }

    const overdueDays = this.getOverdueDays(invoice.due_date);
    const stage = this.getNextDunningStage(overdueDays, invoice.reminder_count || 0);

    if (!stage) {
      throw new BadRequestException('No reminder is currently due for this invoice');
    }

    const channel = data?.channel || invoice.delivery_method || 'email';
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const updatedInvoice = await tx.aRInvoice.update({
        where: { id: invoiceId },
        data: {
          last_reminder_at: now,
          reminder_count: { increment: 1 },
          status: overdueDays > 0 ? 'overdue' : invoice.status,
        },
      });

      const event = await tx.aRDunningEvent.create({
        data: {
          company_id: companyId,
          invoice_id: invoiceId,
          event_type: 'reminder_sent',
          stage,
          channel,
          performed_by: userId,
          details: {
            overdue_days: overdueDays,
            outstanding_balance: outstandingBalance,
          },
        },
      });

      return {
        invoice: updatedInvoice,
        event,
        overdue_days: overdueDays,
        next_stage_after_send: this.getNextDunningStage(overdueDays, (invoice.reminder_count || 0) + 1),
      };
    });
  }
}
