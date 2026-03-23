import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateARInvoiceDto,
  CreateCustomerDto,
  RecordPaymentDto,
} from './dto/ar.dto';

@Injectable()
export class ArService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyInvoice(companyId: string, invoiceId: string) {
    const invoice = await this.prisma.aRInvoice.findFirst({
      where: { id: invoiceId, company_id: companyId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
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
    return this.prisma.customer.findMany({
      where: { company_id: companyId },
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
    });
  }

  // --- Payments ---

  async recordPayment(companyId: string, data: RecordPaymentDto) {
    const { invoice_id, amount, ...paymentData } = data;

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.aRInvoice.findFirst({
        where: { id: invoice_id, company_id: companyId },
      });
      if (!invoice) throw new NotFoundException('Invoice not found');

      const payment = await tx.payment.create({
        data: {
          ...paymentData,
          amount,
          invoice_id,
          company_id: companyId,
        },
      });

      const updatedInvoice = await tx.aRInvoice.update({
        where: { id: invoice_id },
        data: {
          paid_amount: { increment: amount },
        },
      });

      // Update status based on total paid
      const newStatus = Number(updatedInvoice.paid_amount) >= Number(updatedInvoice.amount) 
        ? 'paid' 
        : 'partially_paid';

      await tx.aRInvoice.update({
        where: { id: invoice_id },
        data: { status: newStatus },
      });

      return payment;
    });
  }

  // --- AR Aging & Collections (VF-FIN-003) ---

  async getAgingReport(companyId: string) {
    const invoices = await this.prisma.aRInvoice.findMany({
      where: {
        company_id: companyId,
        status: { not: 'paid' },
      },
    });

    const now = new Date();
    const buckets = {
      current: 0,
      '1-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90plus': 0,
    };

    invoices.forEach((inv) => {
      const dueDate = new Date(inv.due_date);
      const diffTime = now.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const balance = Number(inv.amount) - Number(inv.paid_amount);

      if (diffDays <= 0) buckets.current += balance;
      else if (diffDays <= 30) buckets['1-30'] += balance;
      else if (diffDays <= 60) buckets['31-60'] += balance;
      else if (diffDays <= 90) buckets['61-90'] += balance;
      else buckets['90plus'] += balance;
    });

    return buckets;
  }

  async getCollectionQueue(companyId: string) {
    return this.prisma.collectionCase.findMany({
      where: { company_id: companyId },
      include: {
        invoice: {
          include: { customer: true },
        },
      },
    });
  }

  async createCollectionCase(companyId: string, invoiceId: string, notes?: string) {
    await this.getCompanyInvoice(companyId, invoiceId);

    return this.prisma.collectionCase.create({
      data: {
        company_id: companyId,
        invoice_id: invoiceId,
        notes,
        escalation_level: 1,
      },
    });
  }

  async getARDashboard(companyId: string) {
    const [customers, invoices, aging] = await Promise.all([
      this.prisma.customer.count({ where: { company_id: companyId } }),
      this.prisma.aRInvoice.findMany({
        where: { company_id: companyId, status: { not: 'paid' } },
        include: { customer: true },
        take: 10,
        orderBy: { due_date: 'asc' },
      }),
      this.getAgingReport(companyId),
    ]);

    const totalAr = Object.values(aging).reduce((a, b) => a + b, 0);

    return {
      customerCount: customers,
      totalAr,
      aging,
      pendingInvoices: invoices,
    };
  }

  async sendInvoice(companyId: string, invoiceId: string) {
    const invoice = await this.getCompanyInvoice(companyId, invoiceId);

    // Mock PDF generation and email sending
    console.log(`[AR] Generating PDF for Invoice #${invoice.invoice_no}...`);
    console.log(`[AR] Dispatching email to customer ${invoice.customer_id}...`);

    return this.prisma.aRInvoice.update({
      where: { id: invoiceId },
      data: { status: 'sent' },
    });
  }
}
