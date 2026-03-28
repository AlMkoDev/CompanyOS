import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateAPGoodsReceiptDto,
  CreateAPInvoiceDto,
  CreatePurchaseOrderDto,
  CreateVendorDto,
} from './dto/ap.dto';

@Injectable()
export class ApService {
  constructor(private prisma: PrismaService) {}

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

  // --- Vendors ---

  async createVendor(companyId: string, data: CreateVendorDto) {
    return this.prisma.vendor.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });
  }

  async getVendors(companyId: string) {
    return this.prisma.vendor.findMany({
      where: { company_id: companyId },
    });
  }

  // --- Purchase Orders ---

  async createPurchaseOrder(companyId: string, data: CreatePurchaseOrderDto) {
    return this.prisma.purchaseOrder.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });
  }

  async approvePurchaseOrder(companyId: string, poId: string, approverId: string) {
    await this.getCompanyPurchaseOrder(companyId, poId);

    return this.prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: 'approved',
        approved_by: approverId,
      },
    });
  }

  // --- Invoices & 3-Way Match ---

  async createInvoice(companyId: string, data: CreateAPInvoiceDto) {
    return this.prisma.invoice.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });
  }

  // --- Goods Receipts (VF-FIN-002) ---

  async createGoodsReceipt(companyId: string, data: CreateAPGoodsReceiptDto) {
    return this.prisma.goodsReceipt.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });
  }

  // --- 3-Way Match & Approval Logic ---

  async runThreeWayMatch(companyId: string, invoiceId: string) {
    const invoice = await this.getCompanyInvoice(companyId, invoiceId);

    if (!invoice.po) return { matched: false, reason: 'No PO linked' };

    const poTotal = Number(invoice.po.total);
    const invoiceAmount = Number(invoice.amount);
    
    // Check amounts
    const amountMatch = Math.abs(poTotal - invoiceAmount) < 0.01;
    
    // Check receipts (simplified: ensure at least one receipt exists)
    const hasReceipts = invoice.po.goods_receipts.length > 0;

    const matched = amountMatch && hasReceipts;

    if (matched) {
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'matched' },
      });
    }

    return { matched, amountMatch, hasReceipts };
  }

  async approveInvoice(companyId: string, invoiceId: string, userId: string) {
    // Tiered approval logic could be added here based on userId's authority
    const invoice = await this.getCompanyInvoice(companyId, invoiceId);

    if (invoice.status !== 'matched') {
      throw new BadRequestException('Invoice must be matched before approval');
    }

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'approved',
      },
    });
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

    return this.prisma.paymentRun.findUnique({
      where: { id: paymentRun.id },
      include: { invoices: true } as any, // Cast to any to bypass temporary lint discrepancy
    });
  }

  async getAPDashboard(companyId: string) {
    const [vendors, pos, invoices, paymentRuns] = await Promise.all([
      this.prisma.vendor.count({ where: { company_id: companyId } }),
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
      totalOutstanding,
      recentPOs: pos,
      pendingInvoices: invoices,
      recentPaymentRuns: paymentRuns.map((run) => ({
        ...run,
        invoice_count: run.invoices.length,
      })),
    };
  }
}
