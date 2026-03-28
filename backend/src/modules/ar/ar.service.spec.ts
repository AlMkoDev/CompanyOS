import { Test, TestingModule } from '@nestjs/testing';
import { ArService } from './ar.service';
import { PrismaService } from '../../database/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ArService', () => {
  let service: ArService;
  const prisma: any = {
    aRInvoice: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    aRDunningEvent: {
      create: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
    collectionCase: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ArService>(ArService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects cross-company invoice send', async () => {
    prisma.aRInvoice.findFirst.mockResolvedValue(null);

    await expect(service.sendInvoice('company-1', 'invoice-1')).rejects.toThrow(NotFoundException);
  });

  it('rejects payments above the outstanding balance', async () => {
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        aRInvoice: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'invoice-1',
            company_id: 'company-1',
            amount: 100,
            paid_amount: 80,
            due_date: new Date('2026-03-31T00:00:00.000Z'),
          }),
        },
      }),
    );

    await expect(
      service.recordPayment('company-1', {
        invoice_id: 'invoice-1',
        amount: 30,
        payment_date: '2026-03-28T00:00:00.000Z',
        method: 'Bank Transfer',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns invoice receipt allocation summary', async () => {
    prisma.aRInvoice.findFirst.mockResolvedValue({
      id: 'invoice-1',
      amount: 250,
      paid_amount: 100,
      customer: { name: 'North Buyer' },
      payments: [
        { id: 'pay-2', amount: 40, payment_date: new Date('2026-03-27T00:00:00.000Z') },
        { id: 'pay-1', amount: 60, payment_date: new Date('2026-03-26T00:00:00.000Z') },
      ],
    });

    const summary = await service.getInvoiceReceipts('company-1', 'invoice-1');

    expect(summary.total_received).toBe(100);
    expect(summary.outstanding_balance).toBe(150);
    expect(summary.payment_count).toBe(2);
  });

  it('stamps delivery timestamps and logs an invoice sent event', async () => {
    const updatedInvoice = {
      id: 'invoice-1',
      invoice_no: 'AR-001',
      status: 'sent',
      sent_at: new Date('2026-03-28T10:00:00.000Z'),
      delivered_at: new Date('2026-03-28T10:00:00.000Z'),
      delivery_method: 'email',
    };

    prisma.aRInvoice.findFirst.mockResolvedValue({
      id: 'invoice-1',
      company_id: 'company-1',
      customer_id: 'customer-1',
      invoice_no: 'AR-001',
      amount: 100,
      paid_amount: 0,
      due_date: new Date('2026-03-31T00:00:00.000Z'),
      reminder_count: 0,
    });

    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        aRInvoice: {
          update: jest.fn().mockResolvedValue(updatedInvoice),
        },
        aRDunningEvent: {
          create: jest.fn().mockResolvedValue({ id: 'event-1' }),
        },
      }),
    );

    const result = await service.sendInvoice('company-1', 'invoice-1', 'user-1');

    expect(result).toEqual(updatedInvoice);
  });

  it('logs the next due reminder and increments reminder count', async () => {
    prisma.aRInvoice.findFirst.mockResolvedValue({
      id: 'invoice-1',
      company_id: 'company-1',
      customer_id: 'customer-1',
      invoice_no: 'AR-001',
      amount: 100,
      paid_amount: 0,
      due_date: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
      reminder_count: 1,
      delivery_method: 'email',
      status: 'sent',
    });

    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        aRInvoice: {
          update: jest.fn().mockResolvedValue({
            id: 'invoice-1',
            reminder_count: 2,
            status: 'overdue',
          }),
        },
        aRDunningEvent: {
          create: jest.fn().mockResolvedValue({
            id: 'event-1',
            event_type: 'reminder_sent',
            stage: 7,
          }),
        },
      }),
    );

    const result = await service.sendReminder('company-1', 'invoice-1', 'user-1', { channel: 'email' });

    expect(result.event.stage).toBe(7);
    expect(result.invoice.reminder_count).toBe(2);
    expect(result.next_stage_after_send).toBe(15);
  });
});
