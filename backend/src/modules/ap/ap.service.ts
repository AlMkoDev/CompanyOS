import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  ApproveAPRequisitionDto,
  CreateAPGoodsReceiptDto,
  CreateAPInvoiceDto,
  CreateAPManualEntryDto,
  CreateAPRequisitionDto,
  CreatePurchaseOrderDto,
  CreateVendorDto,
  LogAPExceptionDto,
} from './dto/ap.dto';

@Injectable()
export class ApService {
  constructor(private prisma: PrismaService) {}

  private toJson(value: unknown) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  private async appendAuditTrail(
    companyId: string,
    entityType: string,
    entityId: string,
    action: string,
    actorUserId?: string,
    beforeState?: unknown,
    afterState?: unknown,
    details?: string,
  ) {
    return this.prisma.aPAuditTrail.create({
      data: {
        company_id: companyId,
        entity_type: entityType,
        entity_id: entityId,
        action,
        actor_user_id: actorUserId,
        before_state: this.toJson(beforeState) as any,
        after_state: this.toJson(afterState) as any,
        details,
      },
    });
  }

  private async nextSequenceNumber(
    companyId: string,
    prefix: string,
    model: 'aPRequisition' | 'aPManualEntry' | 'aPMatchException' | 'invoice' = 'invoice',
  ) {
    const year = new Date().getFullYear();
    let count = 0;

    if (model === 'aPRequisition') {
      count = await this.prisma.aPRequisition.count({ where: { company_id: companyId } });
    } else if (model === 'aPManualEntry') {
      count = await this.prisma.aPManualEntry.count({ where: { company_id: companyId } });
    } else if (model === 'aPMatchException') {
      count = await this.prisma.aPMatchException.count({ where: { company_id: companyId } });
    } else {
      count = await this.prisma.invoice.count({ where: { company_id: companyId } });
    }

    const suffix = String(count + 1).padStart(4, '0');
    return `${prefix}-${year}-${suffix}`;
  }

  private async getCompanyPurchaseOrder(companyId: string, poId: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id: poId, company_id: companyId },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  private async getCompanyInvoice(companyId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, company_id: companyId },
      include: {
        po: {
          include: {
            goods_receipts: true,
          },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  private async getCompanyRequisition(companyId: string, requisitionId: string) {
    const requisition = await this.prisma.aPRequisition.findFirst({
      where: { id: requisitionId, company_id: companyId },
    });
    if (!requisition) throw new NotFoundException('Requisition not found');
    return requisition;
  }

  private async getCompanyManualEntry(companyId: string, entryId: string) {
    const entry = await this.prisma.aPManualEntry.findFirst({
      where: { id: entryId, company_id: companyId },
    });
    if (!entry) throw new NotFoundException('Manual AP entry not found');
    return entry;
  }

  async logMatchException(
    companyId: string,
    invoiceId: string,
    data: LogAPExceptionDto & { details?: unknown },
    userId?: string,
  ) {
    const exceptionNo = await this.nextSequenceNumber(companyId, 'APE', 'aPMatchException');
    const exception = await this.prisma.aPMatchException.create({
      data: {
        company_id: companyId,
        invoice_id: invoiceId,
        reason_code: data.reason_code,
        reason: data.reason,
        status: 'open',
        raised_by_id: userId,
        details: data.details as any,
      },
    });

    await this.appendAuditTrail(companyId, 'ap_match_exception', exception.id, 'create', userId, undefined, exception, `AP match exception ${exceptionNo}`);
    return exception;
  }

  private async getCompanyPaymentRun(companyId: string, runId: string) {
    const paymentRun = await this.prisma.paymentRun.findFirst({
      where: { id: runId, company_id: companyId },
      include: { invoices: true },
    });
    if (!paymentRun) throw new NotFoundException('Payment run not found');
    return paymentRun;
  }

  // --- Vendors ---

  async createVendor(companyId: string, data: CreateVendorDto) {
    const vendor = await this.prisma.vendor.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });

    await this.appendAuditTrail(companyId, 'vendor', vendor.id, 'create', undefined, undefined, vendor, 'Vendor onboarding');
    return vendor;
  }

  async getVendors(companyId: string) {
    return this.prisma.vendor.findMany({
      where: { company_id: companyId },
    });
  }

  // --- Purchase Orders ---

  async createPurchaseOrder(companyId: string, data: CreatePurchaseOrderDto) {
    const purchaseOrder = await this.prisma.purchaseOrder.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });

    await this.appendAuditTrail(companyId, 'purchase_order', purchaseOrder.id, 'create', undefined, undefined, purchaseOrder, 'Purchase order created');
    return purchaseOrder;
  }

  async approvePurchaseOrder(companyId: string, poId: string, approverId: string) {
    const beforeState = await this.getCompanyPurchaseOrder(companyId, poId);

    const updated = await this.prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: 'approved',
        approved_by: approverId,
      },
    });

    await this.appendAuditTrail(companyId, 'purchase_order', poId, 'approve', approverId, beforeState, updated, 'Purchase order approved');
    return updated;
  }

  // --- Requisitions ---

  async createRequisition(companyId: string, requesterId: string, data: CreateAPRequisitionDto) {
    if (data.vendor_id) {
      const vendor = await this.prisma.vendor.findFirst({
        where: { id: data.vendor_id, company_id: companyId },
      });
      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }
    }

    const requisitionNo = await this.nextSequenceNumber(companyId, 'APR', 'aPRequisition');
    const requisition = await this.prisma.aPRequisition.create({
      data: {
        company_id: companyId,
        requisition_no: requisitionNo,
        requester_id: requesterId,
        vendor_id: data.vendor_id || undefined,
        department_id: data.department_id || undefined,
        title: data.title,
        justification: data.justification,
        amount_estimate: data.amount_estimate,
        status: 'pending_approval',
        requires_secondary_approval: Boolean(data.amount_estimate && Number(data.amount_estimate) > 0),
        line_items: data.line_items || [],
      },
    });

    await this.appendAuditTrail(companyId, 'ap_requisition', requisition.id, 'create', requesterId, undefined, requisition, 'AP requisition created');
    return requisition;
  }

  async getRequisitions(companyId: string) {
    return this.prisma.aPRequisition.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      include: {
        vendor: true,
        requester: true,
        approver: true,
      },
    });
  }

  async approveRequisition(companyId: string, requisitionId: string, approverId: string, data: ApproveAPRequisitionDto) {
    const requisition = await this.getCompanyRequisition(companyId, requisitionId);
    const approved = (data.decision || 'approved') !== 'rejected';

    const updated = await this.prisma.aPRequisition.update({
      where: { id: requisitionId },
      data: {
        status: approved ? 'approved' : 'rejected',
        approver_id: approverId,
      },
    });

    await this.appendAuditTrail(
      companyId,
      'ap_requisition',
      requisitionId,
      approved ? 'approve' : 'reject',
      approverId,
      requisition,
      updated,
      data.comments,
    );

    return updated;
  }

  // --- Manual AP Entry ---

  async createManualEntry(companyId: string, requesterId: string, data: CreateAPManualEntryDto) {
    if (data.vendor_id) {
      const vendor = await this.prisma.vendor.findFirst({
        where: { id: data.vendor_id, company_id: companyId },
      });
      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }
    }

    const entryNo = await this.nextSequenceNumber(companyId, 'APM', 'aPManualEntry');
    const manualEntry = await this.prisma.aPManualEntry.create({
      data: {
        company_id: companyId,
        entry_no: entryNo,
        requester_id: requesterId,
        vendor_id: data.vendor_id || undefined,
        department_id: data.department_id || undefined,
        description: data.description,
        reason: data.reason,
        amount: data.amount,
        tax_amount: data.tax_amount,
        status: 'pending_secondary_approval',
        requires_secondary_approval: true,
      },
    });

    await this.appendAuditTrail(companyId, 'ap_manual_entry', manualEntry.id, 'create', requesterId, undefined, manualEntry, 'Manual AP entry created');
    return manualEntry;
  }

  async getManualEntries(companyId: string) {
    return this.prisma.aPManualEntry.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      include: {
        vendor: true,
        requester: true,
        approver: true,
      },
    });
  }

  async approveManualEntry(companyId: string, entryId: string, approverId: string, approved = true) {
    const beforeState = await this.getCompanyManualEntry(companyId, entryId);
    const updated = await this.prisma.aPManualEntry.update({
      where: { id: entryId },
      data: {
        status: approved ? 'approved' : 'rejected',
        approver_id: approverId,
      },
    });

    await this.appendAuditTrail(
      companyId,
      'ap_manual_entry',
      entryId,
      approved ? 'approve' : 'reject',
      approverId,
      beforeState,
      updated,
      approved ? 'Manual AP entry secondary approval' : 'Manual AP entry rejected',
    );

    return updated;
  }

  // --- Invoice Receipt & 3-Way Match ---

  async createInvoice(companyId: string, data: CreateAPInvoiceDto) {
    const invoice = await this.prisma.invoice.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });

    await this.appendAuditTrail(companyId, 'vendor_bill', invoice.id, 'create', undefined, undefined, invoice, 'Vendor bill received');
    return invoice;
  }

  // --- Goods Receipts (VF-FIN-002) ---

  async createGoodsReceipt(companyId: string, data: CreateAPGoodsReceiptDto) {
    const goodsReceipt = await this.prisma.goodsReceipt.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });

    await this.appendAuditTrail(companyId, 'goods_receipt', goodsReceipt.id, 'create', undefined, undefined, goodsReceipt, 'Goods receipt recorded');
    return goodsReceipt;
  }

  // --- 3-Way Match & Approval Logic ---

  async runThreeWayMatch(companyId: string, invoiceId: string, userId?: string) {
    const invoice = await this.getCompanyInvoice(companyId, invoiceId);

    if (!invoice.po) {
      await this.logMatchException(companyId, invoiceId, {
        reason_code: 'NO_PO_LINKED',
        reason: 'Bill has no linked purchase order',
      }, userId);
      return { matched: false, reason: 'No PO linked' };
    }

    const poTotal = Number(invoice.po.total);
    const invoiceAmount = Number(invoice.amount);
    
    // Check amounts
    const amountMatch = Math.abs(poTotal - invoiceAmount) < 0.01;
    
    // Check receipts (simplified: ensure at least one receipt exists)
    const hasReceipts = invoice.po.goods_receipts.length > 0;

    const matched = amountMatch && hasReceipts;

    if (matched) {
      const updated = await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'matched' },
      });
      await this.appendAuditTrail(companyId, 'vendor_bill', invoiceId, 'match', userId, invoice, updated, '3-way match successful');
    } else {
      const reasons: string[] = [];
      if (!amountMatch) reasons.push('Bill amount differs from PO total');
      if (!hasReceipts) reasons.push('No goods receipt found for linked PO');
      await this.logMatchException(companyId, invoiceId, {
        reason_code: 'THREE_WAY_MATCH_FAILED',
        reason: reasons.join('; ') || '3-way match failed',
        details: {
          amountMatch,
          hasReceipts,
          invoiceAmount,
          poTotal,
        },
      }, userId);
    }

    return { matched, amountMatch, hasReceipts };
  }

  async approveInvoice(companyId: string, invoiceId: string, userId: string) {
    // Tiered approval logic could be added here based on userId's authority
    const invoice = await this.getCompanyInvoice(companyId, invoiceId);

    if (invoice.status !== 'matched') {
      throw new BadRequestException('Invoice must be matched before approval');
    }

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'approved',
      },
    });

    await this.appendAuditTrail(companyId, 'vendor_bill', invoiceId, 'approve', userId, invoice, updated, 'Vendor bill approved for payment');
    return updated;
  }

  // --- Payment Runs ---

  async generatePaymentRun(companyId: string, invoiceIds: string[]) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        id: { in: invoiceIds },
        company_id: companyId,
        status: 'approved',
      },
    });

    if (invoices.length === 0) throw new Error('No approved invoices selected');

    const total = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

    // Create payment run first to get ID
    const paymentRun = await this.prisma.paymentRun.create({
      data: {
        company_id: companyId,
        run_date: new Date(),
        total_amount: total,
        status: 'draft',
      },
    });

    // Link invoices to the payment run
    await this.prisma.invoice.updateMany({
      where: { id: { in: invoiceIds }, company_id: companyId },
      data: { payment_run_id: paymentRun.id },
    });

    const created = await this.prisma.paymentRun.findUnique({
      where: { id: paymentRun.id },
      include: { invoices: true } as any, // Cast to any to bypass temporary lint discrepancy
    });

    await this.appendAuditTrail(companyId, 'payment_run', paymentRun.id, 'create', undefined, undefined, created, 'Payment run created');
    return created;
  }

  async approvePaymentRun(companyId: string, runId: string, approverId: string) {
    const paymentRun = await this.getCompanyPaymentRun(companyId, runId);

    if (paymentRun.status !== 'draft') {
      throw new BadRequestException('Payment run must be draft before approval');
    }

    const updated = await this.prisma.paymentRun.update({
      where: { id: runId },
      data: {
        status: 'approved',
        approved_by: approverId,
      },
      include: {
        invoices: true,
      } as any,
    });

    await this.appendAuditTrail(companyId, 'payment_run', runId, 'approve', approverId, paymentRun, updated, 'Payment run approved');
    return updated;
  }

  async completePaymentRun(companyId: string, runId: string) {
    const paymentRun = await this.getCompanyPaymentRun(companyId, runId);

    if (paymentRun.status !== 'approved') {
      throw new BadRequestException('Payment run must be approved before completion');
    }

    const updated = await this.prisma.paymentRun.update({
      where: { id: runId },
      data: {
        status: 'completed',
      },
      include: {
        invoices: true,
      } as any,
    });

    await this.appendAuditTrail(companyId, 'payment_run', runId, 'complete', undefined, paymentRun, updated, 'Payment run completed');
    return updated;
  }

  async getAPDashboard(companyId: string) {
    const [vendors, requisitions, manualEntries, exceptions, pos, invoices, paymentRuns] = await Promise.all([
      this.prisma.vendor.count({ where: { company_id: companyId } }),
      this.prisma.aPRequisition.count({ where: { company_id: companyId } }),
      this.prisma.aPManualEntry.count({ where: { company_id: companyId } }),
      this.prisma.aPMatchException.count({ where: { company_id: companyId, status: 'open' } }),
      this.prisma.purchaseOrder.findMany({ 
        where: { company_id: companyId },
        include: { vendor: true },
        orderBy: { created_at: 'desc' },
        take: 5 
      }),
      this.prisma.invoice.findMany({ 
        where: { company_id: companyId, status: { not: 'paid' } },
        include: {
          vendor: true,
          po: {
            include: {
              goods_receipts: true,
            },
          },
        }
      }),
      this.prisma.paymentRun.findMany({
        where: { company_id: companyId },
        orderBy: { created_at: 'desc' },
        take: 3,
        include: {
          invoices: true,
        },
      })
    ]);

    const totalOutstanding = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

    return {
      vendorCount: vendors,
      requisitionCount: requisitions,
      manualEntryCount: manualEntries,
      openExceptionCount: exceptions,
      totalOutstanding,
      recentPOs: pos,
      pendingInvoices: invoices,
      recentPaymentRuns: paymentRuns.map((run) => ({
        ...run,
        invoice_count: run.invoices.length,
      })),
    };
  }

  async getAPAuditTrail(companyId: string, limit = 50) {
    return this.prisma.aPAuditTrail.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        actor: true,
      },
    });
  }

  async getAPMatchExceptions(companyId: string, limit = 50) {
    return this.prisma.aPMatchException.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        raised_by: true,
        resolved_by: true,
      },
    });
  }
}
