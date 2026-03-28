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
});
