import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CollectionActionDto,
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

  async recordPayment(companyId: string, data: RecordPaymentDto, userId?: string) {
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
      const newStatus = Number(updatedInvoice.paid_amount) >= Number(updatedInvoice.amount) 
        ? 'paid' 
        : 'partially_paid';

      await tx.aRInvoice.update({
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
              `Payment of ${amount} recorded. Invoice status is now ${newStatus}.`,
            ),
          },
        });
      }

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
    const [customers, invoices, aging, collectionCases] = await Promise.all([
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
    ]);

    const totalAr = Object.values(aging).reduce((a, b) => a + b, 0);

    return {
      customerCount: customers,
      totalAr,
      aging,
      pendingInvoices: invoices,
      collectionCases: collectionCases.length,
      topEscalations: collectionCases,
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
