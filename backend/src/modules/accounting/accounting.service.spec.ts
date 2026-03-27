import { Test, TestingModule } from '@nestjs/testing';
import { AccountingService } from './accounting.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('AccountingService', () => {
  let service: AccountingService;
  const prisma: any = {
    journalEntry: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    journalLine: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountingService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<AccountingService>(AccountingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects cross-company journal entry posting', async () => {
    prisma.journalEntry.findFirst.mockResolvedValue(null);

    await expect(service.postJournalEntry('company-1', 'entry-1')).rejects.toThrow(NotFoundException);
  });

  it('returns grouped balance sheet rows from journal lines', async () => {
    prisma.journalLine.findMany.mockResolvedValue([
      {
        account_id: 'acct-1',
        debit: 1500,
        credit: 0,
        account: { type: 'asset', name: 'Cash' },
      },
      {
        account_id: 'acct-2',
        debit: 0,
        credit: 600,
        account: { type: 'liability', name: 'Accounts Payable' },
      },
    ]);

    const result = await service.getBalanceSheet('company-1', new Date('2026-03-31'));

    expect(prisma.journalLine.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          entry: expect.objectContaining({
            company_id: 'company-1',
            status: 'posted',
          }),
        }),
      }),
    );
    expect(result).toEqual([
      { type: 'asset', name: 'Cash', balance: 1500 },
      { type: 'liability', name: 'Accounts Payable', balance: 600 },
    ]);
  });
});
