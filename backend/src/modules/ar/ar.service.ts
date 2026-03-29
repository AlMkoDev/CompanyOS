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
  CreatePortalDisputeIntakeDto,
  CreateCustomerDto,
  IntakeEvidenceItemDto,
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
        activities: {
          orderBy: { created_at: 'desc' },
          include: {
            actor: true,
            task_assignee: true,
          },
        },
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

  private getDisputeResolutionDays(dispute: { created_at?: Date | string; resolved_date?: Date | string | null }) {
    if (!dispute.created_at || !dispute.resolved_date) return null;
    const start = new Date(dispute.created_at).getTime();
    const end = new Date(dispute.resolved_date).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
    return Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  }

  private getDisputeSlaDays(priority?: string | null) {
    const normalized = this.normalizeDisputePriority(priority || undefined);
    return (this.disputeSlaTargets[normalized] || this.disputeSlaTargets.MEDIUM).resolutionDays;
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

  private getPortalEvidenceRequirements(disputeType: string) {
    const normalized = disputeType.toUpperCase();
    if (normalized === 'QUALITY') return ['PHOTO'];
    if (normalized === 'QUANTITY') return ['POD'];
    if (normalized === 'PRICING') return ['DOCUMENT'];
    if (normalized === 'DELIVERY') return ['DELIVERY_PROOF'];
    return [];
  }

  private getPortalRouting(disputeType: string, disputedAmount: number) {
    const normalized = disputeType.toUpperCase();
    const route =
      normalized === 'PRICING'
        ? 'Sales/Contracts'
        : normalized === 'QUALITY' || normalized === 'DELIVERY'
          ? 'Operations/Logistics'
          : normalized === 'FRAUD' || normalized === 'UNAUTHORIZED'
            ? 'Risk/Fraud Team'
            : 'AR Specialist';

    const priority = disputedAmount >= 500 ? 'CRITICAL' : normalized === 'QUALITY' || normalized === 'DELIVERY' ? 'HIGH' : 'MEDIUM';

    return { route, priority };
  }

  private async generatePortalCaseNumber() {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const timestamp = new Date();
      const year = timestamp.getFullYear();
      const suffix = `${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
      const candidate = `DSP-${year}-${suffix}`;
      const existing = await this.prisma.disputeCase.findFirst({
        where: { case_number: candidate },
        select: { id: true },
      });
      if (!existing) return candidate;
    }

    throw new BadRequestException('Unable to generate a unique dispute case number');
  }

  private mapPortalEvidenceItems(evidenceItems?: IntakeEvidenceItemDto[]) {
    return (evidenceItems || []).map((item) => ({
      category: item.category,
      file_name: item.file_name,
      file_type: item.file_type,
      file_url: item.file_url,
      notes: [item.reference, item.notes, item.file_size_mb ? `${item.file_size_mb}MB` : undefined].filter(Boolean).join(' | ') || null,
    }));
  }

  private areRequiredEvidenceItemsComplete(
    dispute: { evidence_required?: string[] | null },
    attachments: Array<{ category?: string | null }>,
  ) {
    const required = (dispute.evidence_required || []).map((item) => item.toUpperCase());
    if (!required.length) {
      return true;
    }

    const available = new Set(attachments.map((attachment) => (attachment.category || '').toUpperCase()).filter(Boolean));
    return required.every((item) => available.has(item));
  }

  private async createDisputeActivityRecord(
    tx: any,
    params: {
      companyId: string;
      disputeId: string;
      activityType: string;
      actorUserId?: string | null;
      notes?: string | null;
      internalOnly?: boolean;
      customerVisible?: boolean;
      mentions?: string[];
      taskTitle?: string | null;
      taskAssigneeId?: string | null;
      taskDueDate?: Date | null;
      taskPriority?: string | null;
      taskStatus?: string | null;
      notificationChannel?: string | null;
      templateKey?: string | null;
      metadata?: Record<string, unknown> | null;
    },
  ) {
    return tx.disputeActivity.create({
      data: {
        company_id: params.companyId,
        dispute_id: params.disputeId,
        activity_type: params.activityType,
        notes: params.notes ?? undefined,
        actor_user_id: params.actorUserId ?? undefined,
        internal_only: params.internalOnly ?? false,
        customer_visible: params.customerVisible ?? false,
        mentions: params.mentions || [],
        task_title: params.taskTitle ?? undefined,
        task_assignee_id: params.taskAssigneeId ?? undefined,
        task_due_date: params.taskDueDate ?? undefined,
        task_priority: params.taskPriority ?? undefined,
        task_status: params.taskStatus ?? undefined,
        notification_channel: params.notificationChannel ?? undefined,
        template_key: params.templateKey ?? undefined,
        metadata: params.metadata ?? undefined,
      },
    });
  }

  private async createCustomerNotificationActivity(
    tx: any,
    params: {
      companyId: string;
      disputeId: string;
      channel?: string;
      templateKey: string;
      notes: string;
      actorUserId?: string | null;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.createDisputeActivityRecord(tx, {
      companyId: params.companyId,
      disputeId: params.disputeId,
      activityType: 'CUSTOMER_NOTIFICATION',
      actorUserId: params.actorUserId,
      notes: params.notes,
      customerVisible: true,
      notificationChannel: params.channel || 'email',
      templateKey: params.templateKey,
      metadata: params.metadata,
    });
  }

  private async createInternalTaskActivity(
    tx: any,
    params: {
      companyId: string;
      disputeId: string;
      actorUserId?: string | null;
      notes: string;
      taskTitle: string;
      taskAssigneeId?: string | null;
      taskDueDate?: Date | null;
      taskPriority?: string | null;
      mentions?: string[];
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.createDisputeActivityRecord(tx, {
      companyId: params.companyId,
      disputeId: params.disputeId,
      activityType: 'TASK_CREATED',
      actorUserId: params.actorUserId,
      notes: params.notes,
      internalOnly: true,
      mentions: params.mentions,
      taskTitle: params.taskTitle,
      taskAssigneeId: params.taskAssigneeId,
      taskDueDate: params.taskDueDate ?? null,
      taskPriority: params.taskPriority ?? 'MEDIUM',
      taskStatus: 'OPEN',
      metadata: params.metadata,
    });
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

  async getPortalInvoiceContext(invoiceNo: string) {
    const invoice = await this.prisma.aRInvoice.findFirst({
      where: { invoice_no: invoiceNo },
      include: {
        customer: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found for dispute intake');
    }

    return {
      invoice_id: invoice.id,
      company_id: invoice.company_id,
      invoice_no: invoice.invoice_no,
      customer_name: invoice.customer?.name,
      open_balance: Math.max(0, this.getOutstandingBalance(invoice)),
      invoice_amount: Number(invoice.amount),
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      status: invoice.status,
    };
  }

  async createPortalDisputeIntake(data: CreatePortalDisputeIntakeDto) {
    const invoice = await this.prisma.aRInvoice.findFirst({
      where: { invoice_no: data.invoice_no },
      include: { customer: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found. The case should be routed for manual review.');
    }

    const outstandingBalance = this.getOutstandingBalance(invoice);
    if (outstandingBalance <= 0) {
      throw new BadRequestException('This invoice is already settled and cannot be disputed.');
    }

    if (Number(data.disputed_amount) > outstandingBalance + 0.009) {
      throw new BadRequestException(`Disputed amount exceeds outstanding balance of ${outstandingBalance.toFixed(2)}`);
    }

    const { route, priority } = this.getPortalRouting(data.dispute_type, Number(data.disputed_amount));
    const raisedDate = new Date();
    const caseNumber = await this.generatePortalCaseNumber();
    const evidenceRequired = this.getPortalEvidenceRequirements(data.dispute_type);
    const evidenceItems = this.mapPortalEvidenceItems(data.evidence_items);
    const evidenceCategories = new Set(evidenceItems.map((item) => item.category.toUpperCase()));
    const evidenceComplete = evidenceRequired.every((required) => evidenceCategories.has(required.toUpperCase()));
    const status = evidenceRequired.length > 0 && !evidenceComplete ? 'EVIDENCE_PENDING' : 'UNDER_REVIEW';

    return this.prisma.$transaction(async (tx) => {
      const dispute = await tx.disputeCase.create({
        data: {
          company_id: invoice.company_id,
          invoice_id: invoice.id,
          customer_id: invoice.customer_id,
          case_number: caseNumber,
          intake_channel: 'portal',
          submitter_name: data.customer_name,
          submitter_email: data.submitter_email,
          submitter_phone: data.submitter_phone,
          status,
          priority,
          dispute_type: data.dispute_type,
          reason_code: data.reason_code,
          disputed_amount: data.disputed_amount,
          due_date: this.getDisputeDueDate(priority, raisedDate),
          evidence_due_date: this.getDisputeEvidenceDueDate(priority, raisedDate),
          affects_revenue: true,
          blocks_payment: true,
          evidence_required: evidenceRequired,
        },
        include: {
          invoice: { include: { customer: true } },
          activities: { orderBy: { created_at: 'asc' } },
          attachments: { orderBy: { created_at: 'asc' } },
        },
      });

      await this.createDisputeActivityRecord(tx, {
        companyId: invoice.company_id,
        disputeId: dispute.id,
        activityType: 'DISPUTE_SUBMITTED',
        notes: `${data.brief_description} | Routed to ${route}. Preferred resolution: ${data.preferred_resolution || 'not specified'}.`,
        customerVisible: true,
        templateKey: 'portal_intake_confirmation',
        metadata: {
          route_to: route,
          preferred_resolution: data.preferred_resolution || null,
        },
      });

      await this.createCustomerNotificationActivity(tx, {
        companyId: invoice.company_id,
        disputeId: dispute.id,
        templateKey: 'dispute_acknowledgement',
        notes: `Acknowledgement sent to ${data.submitter_email} for case ${caseNumber}. Initial response target: ${this.disputeSlaTargets[priority]?.initialResponseHours ?? this.disputeSlaTargets.MEDIUM.initialResponseHours} hours.`,
        metadata: {
          trigger_id: 'T-001',
          submitter_email: data.submitter_email,
          case_number: caseNumber,
        },
      });

      await this.createDisputeActivityRecord(tx, {
        companyId: invoice.company_id,
        disputeId: dispute.id,
        activityType: 'STATUS_CHANGED',
        notes: `Portal intake validated against invoice ${invoice.invoice_no}. Status set to ${status}.`,
        customerVisible: true,
      });

      for (const item of evidenceItems) {
        await tx.disputeAttachment.create({
          data: {
            company_id: invoice.company_id,
            dispute_id: dispute.id,
            file_name: item.file_name,
            file_type: item.file_type,
            category: item.category,
            file_url: item.file_url,
            notes: item.notes,
          },
        });
      }

      if (evidenceItems.length) {
        await this.createDisputeActivityRecord(tx, {
          companyId: invoice.company_id,
          disputeId: dispute.id,
          activityType: 'EVIDENCE_CAPTURED_AT_INTAKE',
          notes: `${evidenceItems.length} evidence item(s) captured during submission.`,
          customerVisible: true,
        });
      }

      await this.applyCustomerDisputeControls(tx, invoice.company_id, invoice.customer_id);

      return {
        case_number: caseNumber,
        dispute_id: dispute.id,
        status,
        route_to: route,
        evidence_complete: evidenceComplete,
        evidence_required: dispute.evidence_required,
        invoice_no: invoice.invoice_no,
        customer_name: invoice.customer?.name,
        initial_response_hours: this.disputeSlaTargets[priority]?.initialResponseHours ?? this.disputeSlaTargets.MEDIUM.initialResponseHours,
      };
    });
  }

  async getPortalDisputeStatus(caseNumber: string, invoiceNo: string) {
    const dispute = await this.prisma.disputeCase.findFirst({
      where: {
        case_number: caseNumber,
        invoice: {
          invoice_no: invoiceNo,
        },
      },
      include: {
        invoice: { include: { customer: true } },
        activities: {
          orderBy: { created_at: 'asc' },
          where: {
            internal_only: false,
          },
        },
        attachments: { orderBy: { created_at: 'asc' } },
        resolutions: { orderBy: { created_at: 'desc' } },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute case not found');
    }

    return {
      case_number: dispute.case_number,
      status: dispute.status,
      priority: dispute.priority,
      dispute_type: dispute.dispute_type,
      disputed_amount: Number(dispute.disputed_amount),
      submitted_at: dispute.raised_date,
      due_date: dispute.due_date,
      evidence_due_date: dispute.evidence_due_date,
      customer_name: dispute.invoice?.customer?.name,
      invoice_no: dispute.invoice?.invoice_no,
      timeline: dispute.activities.filter((activity) => activity.activity_type !== 'INTERNAL_COMMENT'),
      evidence_items: dispute.attachments,
      latest_resolution: dispute.resolutions[0] || null,
    };
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

      await this.createDisputeActivityRecord(tx, {
        companyId,
        disputeId: dispute.id,
        activityType: 'DISPUTE_RAISED',
        notes: data.notes || `Dispute opened for invoice ${invoice.invoice_no}.`,
        actorUserId: userId,
        customerVisible: true,
      });

      await this.createCustomerNotificationActivity(tx, {
        companyId,
        disputeId: dispute.id,
        actorUserId: userId,
        templateKey: 'dispute_acknowledgement',
        notes: `Acknowledgement sent for dispute on invoice ${invoice.invoice_no}. Resolution target is ${dueDate.toLocaleDateString()}.`,
        metadata: {
          trigger_id: 'T-001',
          invoice_no: invoice.invoice_no,
          due_date: dueDate.toISOString(),
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
          orderBy: { created_at: 'desc' },
          include: {
            actor: true,
            task_assignee: true,
          },
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
          include: {
            actor: true,
            task_assignee: true,
          },
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
    const dispute = await this.getCompanyDispute(companyId, disputeId);

    return this.createDisputeActivityRecord(this.prisma, {
      companyId,
      disputeId,
      activityType: data.activity_type,
      notes: data.notes,
      actorUserId: userId,
      internalOnly: data.internal_only ?? true,
      customerVisible: data.customer_visible ?? false,
      mentions: data.mentions,
      taskTitle: data.task_title,
      taskAssigneeId: dispute.assigned_to,
      taskDueDate: data.task_due_date ? new Date(data.task_due_date) : undefined,
      taskPriority: data.task_priority,
      taskStatus: data.task_title ? 'OPEN' : undefined,
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

      await this.createDisputeActivityRecord(tx, {
        companyId,
        disputeId,
        activityType: 'RESOLUTION_RECORDED',
        notes: `${data.resolution_type} recorded for ${resolutionAmount.toFixed(2)} and routed for approval.`,
        actorUserId: userId,
        internalOnly: true,
      });

      await this.createCustomerNotificationActivity(tx, {
        companyId,
        disputeId,
        actorUserId: userId,
        templateKey: 'resolution_summary',
        notes: `Resolution summary sent to customer for ${data.resolution_type.replaceAll('_', ' ')} in the amount of ${resolutionAmount.toFixed(2)}.`,
        metadata: {
          trigger_id: 'T-004',
          resolution_type: data.resolution_type,
          resolution_amount: resolutionAmount,
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

      const existingAttachments = dispute.attachments || [];
      const evidenceComplete = this.areRequiredEvidenceItemsComplete(dispute, [
        ...existingAttachments,
        { category: data.category },
      ]);
      const nextStatus =
        dispute.status === 'EVIDENCE_PENDING' && evidenceComplete
          ? 'UNDER_REVIEW'
          : ['OPEN', 'RAISED'].includes(dispute.status) && (dispute.evidence_required?.length || 0) > 0
            ? 'EVIDENCE_PENDING'
            : dispute.status;

      if (nextStatus !== dispute.status) {
        await tx.disputeCase.update({
          where: { id: disputeId },
          data: { status: nextStatus },
        });
      }

      await this.createDisputeActivityRecord(tx, {
        companyId,
        disputeId,
        activityType: 'EVIDENCE_UPLOADED',
        notes: `${data.category} uploaded: ${data.file_name}`,
        actorUserId: userId,
        customerVisible: true,
      });

      if (nextStatus === 'UNDER_REVIEW' && evidenceComplete) {
        await this.createDisputeActivityRecord(tx, {
          companyId,
          disputeId,
          activityType: 'STATUS_CHANGED',
          notes: 'Required evidence set is complete. Dispute moved back to UNDER REVIEW.',
          actorUserId: userId,
          customerVisible: true,
        });

        await this.createCustomerNotificationActivity(tx, {
          companyId,
          disputeId,
          actorUserId: userId,
          templateKey: 'evidence_set_complete',
          notes: 'Customer notified that the evidence set is complete and the dispute is under review.',
          metadata: {
            evidence_complete: true,
          },
        });

        await this.createInternalTaskActivity(tx, {
          companyId,
          disputeId,
          actorUserId: userId,
          notes: 'Evidence package is complete and ready for reviewer assessment.',
          taskTitle: 'Review completed evidence package',
          taskAssigneeId: dispute.assigned_to,
          taskDueDate: dispute.due_date,
          taskPriority: dispute.priority,
        });
      }

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

      await this.createDisputeActivityRecord(tx, {
        companyId,
        disputeId: resolution.dispute_id,
        activityType: 'RESOLUTION_APPROVAL',
        notes: action === 'APPROVE' ? `Resolution approved at level ${currentStepIndex + 1}.` : 'Resolution rejected.',
        actorUserId: userId,
        internalOnly: true,
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

      await this.createDisputeActivityRecord(tx, {
        companyId,
        disputeId: resolution.dispute_id,
        activityType: 'RESOLUTION_POSTED',
        notes: 'Resolution marked as posted to the general ledger.',
        actorUserId: userId,
        internalOnly: true,
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

      await this.createDisputeActivityRecord(tx, {
        companyId,
        disputeId,
        activityType: 'STATUS_CHANGED',
        notes: data.resolution_notes ? `${nextStatus}: ${data.resolution_notes}` : `Status changed to ${nextStatus}.`,
        actorUserId: userId,
        customerVisible: ['UNDER_REVIEW', 'EVIDENCE_PENDING', 'CUSTOMER_APPROVAL', 'NEGOTIATION', 'RESOLVED', 'CLOSED', 'CREDIT_ISSUED'].includes(nextStatus),
      });

      if (nextStatus === 'EVIDENCE_PENDING') {
        await this.createCustomerNotificationActivity(tx, {
          companyId,
          disputeId,
          actorUserId: userId,
          templateKey: 'evidence_requested',
          notes: 'Customer notified that more evidence is required to proceed with the dispute review.',
          metadata: {
            trigger_id: 'T-002',
            evidence_due_date: updated.evidence_due_date?.toISOString?.() || null,
          },
        });

        await this.createInternalTaskActivity(tx, {
          companyId,
          disputeId,
          actorUserId: userId,
          notes: 'Follow up with the customer on missing evidence and monitor the evidence deadline.',
          taskTitle: 'Follow up on customer evidence',
          taskAssigneeId: updated.assigned_to,
          taskDueDate: updated.evidence_due_date,
          taskPriority: updated.priority,
        });
      }

      if (nextStatus === 'CLOSED') {
        await this.createCustomerNotificationActivity(tx, {
          companyId,
          disputeId,
          actorUserId: userId,
          templateKey: 'dispute_closure_confirmation',
          notes: 'Closure confirmation and CSAT survey trigger sent to the customer.',
          metadata: {
            trigger_id: 'T-005',
            survey_triggered: true,
          },
        });
      }

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
        include: {
          invoice: {
            include: {
              customer: true,
            },
          },
        },
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
    const productHotspotsMap = new Map<string, { product_code: string; dispute_count: number; disputed_value: number }>();
    const topCustomersMap = new Map<string, { customer_id: string; customer_name: string; dispute_count: number; disputed_value: number }>();
    const resolvedDisputes = disputes.filter((dispute) => dispute.resolved_date);

    for (const dispute of openDisputes) {
      const productCode = dispute.product_code || 'UNSPECIFIED';
      const existingProduct = productHotspotsMap.get(productCode) || {
        product_code: productCode,
        dispute_count: 0,
        disputed_value: 0,
      };
      existingProduct.dispute_count += 1;
      existingProduct.disputed_value += Number(dispute.disputed_amount);
      productHotspotsMap.set(productCode, existingProduct);

      const customerId = dispute.customer_id;
      const customerName = dispute.invoice?.customer?.name || 'Unknown customer';
      const existingCustomer = topCustomersMap.get(customerId) || {
        customer_id: customerId,
        customer_name: customerName,
        dispute_count: 0,
        disputed_value: 0,
      };
      existingCustomer.dispute_count += 1;
      existingCustomer.disputed_value += Number(dispute.disputed_amount);
      topCustomersMap.set(customerId, existingCustomer);
    }

    const resolutionSamples = resolvedDisputes
      .map((dispute) => ({
        resolution_days: this.getDisputeResolutionDays(dispute),
        sla_days: this.getDisputeSlaDays(dispute.priority),
      }))
      .filter((sample) => sample.resolution_days !== null) as Array<{ resolution_days: number; sla_days: number }>;

    const averageResolutionDays = resolutionSamples.length
      ? resolutionSamples.reduce((sum, sample) => sum + sample.resolution_days, 0) / resolutionSamples.length
      : 0;
    const averageSlaDays = resolutionSamples.length
      ? resolutionSamples.reduce((sum, sample) => sum + sample.sla_days, 0) / resolutionSamples.length
      : 0;
    const resolvedWithinSlaCount = resolutionSamples.filter((sample) => sample.resolution_days <= sample.sla_days).length;

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
        averageResolutionDays,
        averageSlaDays,
        resolvedWithinSlaRate: resolutionSamples.length ? resolvedWithinSlaCount / resolutionSamples.length : 0,
        byProduct: Array.from(productHotspotsMap.values()).sort((a, b) => b.disputed_value - a.disputed_value).slice(0, 3),
        topCustomers: Array.from(topCustomersMap.values()).sort((a, b) => {
          if (b.dispute_count !== a.dispute_count) return b.dispute_count - a.dispute_count;
          return b.disputed_value - a.disputed_value;
        }).slice(0, 3),
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
