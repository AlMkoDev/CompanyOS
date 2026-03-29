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
      findMany: jest.fn(),
    },
    aRDunningEvent: {
      create: jest.fn(),
    },
    disputeCase: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    disputeResolution: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    disputeAttachment: {
      create: jest.fn(),
    },
    disputeActivity: {
      create: jest.fn(),
    },
    customer: {
      count: jest.fn(),
      findMany: jest.fn(),
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

  it('creates a blocked-payment dispute with SLA due date and activity log', async () => {
    prisma.aRInvoice.findFirst.mockResolvedValue({
      id: 'invoice-1',
      company_id: 'company-1',
      customer_id: 'customer-1',
      invoice_no: 'AR-001',
      amount: 500,
      paid_amount: 100,
      due_date: new Date('2026-03-31T00:00:00.000Z'),
      customer: { name: 'North Buyer' },
    });

    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        disputeCase: {
          create: jest.fn().mockResolvedValue({
            id: 'dispute-1',
            status: 'OPEN',
            priority: 'HIGH',
            disputed_amount: 200,
            invoice: { customer: { name: 'North Buyer' } },
            activities: [],
          }),
          count: jest.fn().mockResolvedValue(1),
        },
        disputeActivity: {
          create: jest.fn().mockResolvedValue({ id: 'activity-1' }),
        },
        customer: {
          update: jest.fn(),
        },
      }),
    );

    const result = await service.createDispute('company-1', 'user-1', {
      invoice_id: 'invoice-1',
      dispute_type: 'QUALITY',
      priority: 'HIGH',
      disputed_amount: 200,
      notes: 'Cracked shells in delivered batch.',
      blocks_payment: true,
      affects_revenue: true,
    });

    expect(result.status).toBe('OPEN');
    expect(result.priority).toBe('HIGH');
  });

  it('moves blocked-payment disputes into the disputed aging bucket', async () => {
    prisma.aRInvoice.findMany.mockResolvedValue([
      {
        id: 'invoice-1',
        company_id: 'company-1',
        amount: 500,
        paid_amount: 100,
        due_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    ]);
    prisma.disputeCase.findMany.mockResolvedValue([
      {
        id: 'dispute-1',
        invoice_id: 'invoice-1',
        status: 'OPEN',
        blocks_payment: true,
        disputed_amount: 250,
      },
    ]);

    const aging = await service.getAgingReport('company-1');

    expect(aging.disputed).toBe(250);
    expect(aging['1-30']).toBe(150);
  });

  it('blocks dispute closure until resolution is posted to GL', async () => {
    prisma.disputeCase.findFirst.mockResolvedValue({
      id: 'dispute-1',
      company_id: 'company-1',
      status: 'RESOLVED',
      disputed_amount: 200,
      invoice: { customer: { name: 'North Buyer' } },
      activities: [],
      resolutions: [
        {
          id: 'resolution-1',
          status: 'APPROVED',
          posted_to_gl: false,
        },
      ],
    });

    await expect(
      service.updateDisputeStatus('company-1', 'dispute-1', 'user-1', {
        status: 'CLOSED',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates a dispute resolution with a two-level approval chain', async () => {
    prisma.disputeCase.findFirst.mockResolvedValue({
      id: 'dispute-1',
      company_id: 'company-1',
      status: 'RESOLUTION_PROPOSED',
      disputed_amount: 300,
      invoice: { customer: { name: 'North Buyer' } },
      activities: [],
      resolutions: [],
    });

    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        disputeResolution: {
          create: jest.fn().mockResolvedValue({
            id: 'resolution-1',
            status: 'PENDING_APPROVAL',
            approval_chain: [
              { role: 'Finance_Manager', status: 'pending' },
              { role: 'Operations_Director', status: 'queued' },
            ],
          }),
        },
        disputeActivity: {
          create: jest.fn().mockResolvedValue({ id: 'activity-1' }),
        },
      }),
    );

    const resolution = await service.createDisputeResolution('company-1', 'dispute-1', 'user-1', {
      resolution_type: 'WRITE_OFF',
      writeoff_amount: 250,
    });

    expect(resolution.status).toBe('PENDING_APPROVAL');
    expect(resolution.approval_chain).toHaveLength(2);
  });

  it('sets an evidence due date when a dispute is opened', async () => {
    prisma.aRInvoice.findFirst.mockResolvedValue({
      id: 'invoice-1',
      company_id: 'company-1',
      customer_id: 'customer-1',
      invoice_no: 'AR-001',
      amount: 500,
      paid_amount: 0,
      due_date: new Date('2026-03-31T00:00:00.000Z'),
      customer: { name: 'North Buyer' },
    });

    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        disputeCase: {
          create: jest.fn().mockResolvedValue({
            id: 'dispute-1',
            status: 'OPEN',
            priority: 'HIGH',
            evidence_due_date: new Date('2026-03-30T00:00:00.000Z'),
            invoice: { customer: { name: 'North Buyer' } },
            activities: [],
            attachments: [],
          }),
          count: jest.fn().mockResolvedValue(1),
        },
        disputeActivity: {
          create: jest.fn().mockResolvedValue({ id: 'activity-1' }),
        },
        customer: {
          update: jest.fn(),
        },
      }),
    );

    const dispute = await service.createDispute('company-1', 'user-1', {
      invoice_id: 'invoice-1',
      dispute_type: 'QUALITY',
      priority: 'HIGH',
      disputed_amount: 150,
      evidence_required: ['PHOTO', 'POD'],
    });

    expect(dispute.evidence_due_date).toBeDefined();
  });

  it('logs dispute evidence and records an activity', async () => {
    prisma.disputeCase.findFirst.mockResolvedValue({
      id: 'dispute-1',
      company_id: 'company-1',
      status: 'OPEN',
      evidence_required: ['PHOTO'],
      invoice: { customer: { name: 'North Buyer' } },
      activities: [],
      resolutions: [],
      attachments: [],
    });

    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        disputeAttachment: {
          create: jest.fn().mockResolvedValue({
            id: 'attachment-1',
            category: 'PHOTO',
            file_name: 'dispatch-photo.jpg',
          }),
        },
        disputeCase: {
          update: jest.fn().mockResolvedValue({ id: 'dispute-1', status: 'EVIDENCE_PENDING' }),
        },
        disputeActivity: {
          create: jest.fn().mockResolvedValue({ id: 'activity-1' }),
        },
      }),
    );

    const attachment = await service.addDisputeAttachment('company-1', 'dispute-1', 'user-1', {
      file_name: 'dispatch-photo.jpg',
      file_type: 'image',
      category: 'PHOTO',
      notes: 'Visible shell damage on arrival.',
    });

    expect(attachment.category).toBe('PHOTO');
  });

  it('puts a customer on credit review after more than 3 disputes in 30 days', async () => {
    prisma.aRInvoice.findFirst.mockResolvedValue({
      id: 'invoice-1',
      company_id: 'company-1',
      customer_id: 'customer-1',
      invoice_no: 'AR-001',
      amount: 500,
      paid_amount: 0,
      due_date: new Date('2026-03-31T00:00:00.000Z'),
      customer: { name: 'North Buyer' },
    });

    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        disputeCase: {
          create: jest.fn().mockResolvedValue({
            id: 'dispute-1',
            status: 'OPEN',
            priority: 'MEDIUM',
            invoice: { customer: { name: 'North Buyer' } },
            activities: [],
            attachments: [],
          }),
          count: jest.fn().mockResolvedValue(4),
        },
        disputeActivity: {
          create: jest.fn().mockResolvedValue({ id: 'activity-1' }),
        },
        customer: {
          update: jest.fn().mockResolvedValue({
            id: 'customer-1',
            credit_on_hold: true,
            status: 'credit_review',
          }),
        },
      }),
    );

    const dispute = await service.createDispute('company-1', 'user-1', {
      invoice_id: 'invoice-1',
      dispute_type: 'QUALITY',
      disputed_amount: 100,
    });

    expect(dispute.status).toBe('OPEN');
  });

  it('returns dispute analytics by product and customer on the AR dashboard', async () => {
    prisma.customer.count.mockResolvedValue(4);
    prisma.aRInvoice.findMany.mockResolvedValue([
      {
        id: 'invoice-1',
        company_id: 'company-1',
        invoice_no: 'AR-001',
        amount: 500,
        paid_amount: 0,
        due_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        reminder_count: 0,
        customer: { name: 'North Buyer' },
      },
    ]);
    prisma.collectionCase.findMany.mockResolvedValue([
      {
        id: 'case-1',
        escalation_level: 2,
        invoice: {
          amount: 500,
          paid_amount: 0,
          due_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
          customer: { name: 'North Buyer' },
        },
      },
    ]);
    prisma.disputeCase.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'dispute-1',
          customer_id: 'customer-1',
          product_code: 'EGG',
          disputed_amount: 300,
          priority: 'HIGH',
          status: 'OPEN',
          due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          created_at: new Date('2026-03-01T00:00:00.000Z'),
          resolved_date: null,
          evidence_due_date: null,
          invoice: { customer: { name: 'North Buyer' } },
        },
        {
          id: 'dispute-2',
          customer_id: 'customer-1',
          product_code: 'EGG',
          disputed_amount: 120,
          priority: 'MEDIUM',
          status: 'RESOLVED',
          due_date: new Date('2026-03-10T00:00:00.000Z'),
          created_at: new Date('2026-03-01T00:00:00.000Z'),
          resolved_date: new Date('2026-03-05T00:00:00.000Z'),
          evidence_due_date: null,
          invoice: { customer: { name: 'North Buyer' } },
        },
        {
          id: 'dispute-3',
          customer_id: 'customer-2',
          product_code: 'MARROW',
          disputed_amount: 180,
          priority: 'LOW',
          status: 'EVIDENCE_PENDING',
          due_date: new Date('2026-03-12T00:00:00.000Z'),
          created_at: new Date('2026-03-02T00:00:00.000Z'),
          resolved_date: null,
          evidence_due_date: new Date(Date.now() - 24 * 60 * 60 * 1000),
          invoice: { customer: { name: 'South Buyer' } },
        },
      ]);

    const dashboard = await service.getARDashboard('company-1');

    expect(dashboard.disputesAtRisk?.total).toBe(480);
    expect(dashboard.disputesAtRisk?.byProduct?.[0]).toMatchObject({
      product_code: 'EGG',
      disputed_value: 300,
    });
    expect(dashboard.disputesAtRisk?.topCustomers?.[0]).toMatchObject({
      customer_name: 'North Buyer',
      dispute_count: 1,
    });
    expect(dashboard.disputesAtRisk?.resolvedWithinSlaRate).toBeGreaterThan(0);
  });

  it('creates a portal dispute intake with case number and intake evidence', async () => {
    prisma.aRInvoice.findFirst
      .mockResolvedValueOnce({
        id: 'invoice-1',
        company_id: 'company-1',
        customer_id: 'customer-1',
        invoice_no: 'AR-1001',
        amount: 500,
        paid_amount: 100,
        invoice_date: new Date('2026-03-01T00:00:00.000Z'),
        due_date: new Date('2026-03-31T00:00:00.000Z'),
        customer: { name: 'North Buyer' },
      });
    prisma.disputeCase.findFirst.mockResolvedValue(null);

    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        disputeCase: {
          create: jest.fn().mockResolvedValue({
            id: 'dispute-portal-1',
            case_number: 'DSP-2026-00000111',
            status: 'UNDER_REVIEW',
            evidence_required: ['PHOTO'],
            invoice: { customer: { name: 'North Buyer' } },
            activities: [],
            attachments: [],
          }),
          count: jest.fn().mockResolvedValue(1),
        },
        disputeActivity: {
          create: jest.fn().mockResolvedValue({ id: 'activity-1' }),
        },
        disputeAttachment: {
          create: jest.fn().mockResolvedValue({ id: 'attachment-1' }),
        },
        customer: {
          update: jest.fn(),
        },
      }),
    );

    const result = await service.createPortalDisputeIntake({
      invoice_no: 'AR-1001',
      dispute_type: 'QUALITY',
      disputed_amount: 150,
      customer_name: 'North Buyer',
      submitter_email: 'buyer@example.com',
      brief_description: 'Damaged batch received.',
      evidence_items: [
        {
          category: 'PHOTO',
          file_name: 'damage-photo.jpg',
          file_type: 'image',
        },
      ],
    });

    expect(result.case_number).toContain('DSP-');
    expect(result.status).toBe('UNDER_REVIEW');
    expect(result.evidence_complete).toBe(true);
  });

  it('returns public dispute status by case number and invoice number', async () => {
    prisma.disputeCase.findFirst.mockResolvedValue({
      id: 'dispute-1',
      case_number: 'DSP-2026-12345678',
      status: 'UNDER_REVIEW',
      priority: 'HIGH',
      dispute_type: 'QUALITY',
      disputed_amount: 180,
      raised_date: new Date('2026-03-29T10:00:00.000Z'),
      due_date: new Date('2026-04-03T10:00:00.000Z'),
      evidence_due_date: new Date('2026-03-31T10:00:00.000Z'),
      invoice: {
        invoice_no: 'AR-1001',
        customer: { name: 'North Buyer' },
      },
      activities: [
        {
          id: 'activity-1',
          activity_type: 'DISPUTE_SUBMITTED',
          notes: 'Submitted via portal.',
          created_at: new Date('2026-03-29T10:00:00.000Z'),
        },
      ],
      attachments: [
        {
          id: 'attachment-1',
          category: 'PHOTO',
          file_name: 'damage-photo.jpg',
        },
      ],
      resolutions: [],
    });

    const result = await service.getPortalDisputeStatus('DSP-2026-12345678', 'AR-1001');

    expect(result.case_number).toBe('DSP-2026-12345678');
    expect(result.timeline).toHaveLength(1);
    expect(result.evidence_items).toHaveLength(1);
  });
});
