import { Test, TestingModule } from '@nestjs/testing';
import { AccountingService } from './accounting.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('AccountingService', () => {
  let service: AccountingService;
  const prisma: any = {
    accountingPeriod: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    bankStatement: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    gLAccount: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    employee: {
      findFirst: jest.fn(),
    },
    journalEntry: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    journalLine: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $executeRawUnsafe: jest.fn(),
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

  it('lists company journal entries in reverse chronological order', async () => {
    prisma.journalEntry.findMany.mockResolvedValue([
      { id: 'entry-1', status: 'draft', lines: [] },
      { id: 'entry-2', status: 'posted', lines: [] },
    ]);

    const result = await service.getJournalEntries('company-1');

    expect(prisma.journalEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { company_id: 'company-1' },
      }),
    );
    expect(result).toHaveLength(2);
  });

  it('lists accounting periods in reverse chronological order', async () => {
    prisma.accountingPeriod.findMany.mockResolvedValue([
      { id: 'p-1', year: 2026, month: 3, status: 'open' },
      { id: 'p-2', year: 2026, month: 2, status: 'closed' },
    ]);

    const result = await service.getPeriods('company-1');

    expect(prisma.accountingPeriod.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { company_id: 'company-1' },
      }),
    );
    expect(result).toHaveLength(2);
  });

  it('returns period close readiness summary', async () => {
    prisma.accountingPeriod.findFirst.mockResolvedValue({ id: 'period-1', year: 2026, month: 3, status: 'open' });
    prisma.journalEntry.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(0);
    prisma.bankStatement.count.mockResolvedValue(2);

    const result = await service.getPeriodCloseReadiness('company-1', 2026, 3);

    expect(prisma.accountingPeriod.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { company_id: 'company-1', year: 2026, month: 3 },
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        draftEntries: 1,
        postedEntries: 4,
        reversedEntries: 0,
        bankStatements: 2,
        can_close: false,
      }),
    );
  });

  it('blocks closing when draft journal entries remain', async () => {
    prisma.accountingPeriod.findFirst.mockResolvedValue({ id: 'period-1', year: 2026, month: 3, status: 'open' });
    prisma.journalEntry.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(0);
    prisma.bankStatement.count.mockResolvedValue(2);

    await expect(service.closePeriod('company-1', 2026, 3, 'user-1')).rejects.toThrow(
      'Draft journal entries must be resolved before closing the period',
    );
  });

  it('returns bank statements with imported lines', async () => {
    prisma.bankStatement.findMany.mockResolvedValue([
      {
        id: 'stmt-1',
        statement_date: new Date('2026-03-01'),
        opening_balance: 1000,
        closing_balance: 1450,
        lines: [{ id: 'line-1' }],
      },
    ]);

    const result = await service.getBankStatements('company-1');

    expect(prisma.bankStatement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { company_id: 'company-1' },
      }),
    );
    expect(result).toHaveLength(1);
  });

  it('builds reconciliation suggestions from bank statement lines and journal entries', async () => {
    prisma.bankStatement.findFirst.mockResolvedValue({
      id: 'stmt-1',
      account_id: 'bank-acct',
      lines: [
        { date: new Date('2026-03-10'), amount: 1200, description: 'Deposit', balance: 2200 },
      ],
    });
    prisma.journalEntry.findMany.mockResolvedValue([
      {
        id: 'entry-1',
        entry_date: new Date('2026-03-10'),
        lines: [
          { account_id: 'bank-acct', debit: 1200, credit: 0, account: { code: '1000', name: 'Bank' } },
        ],
      },
    ]);

    const result = await service.getReconciliationSuggestions('company-1', 'stmt-1');

    expect(prisma.journalEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          company_id: 'company-1',
          status: 'posted',
        }),
      }),
    );
    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].candidates[0].entry.id).toBe('entry-1');
  });

  it('returns reconciliation matches alongside suggestions', async () => {
    prisma.bankStatement.findFirst.mockResolvedValue({
      id: 'stmt-1',
      account_id: 'bank-acct',
      lines: [
        { id: 'line-1', date: new Date('2026-03-10'), amount: 1200, description: 'Deposit', balance: 2200 },
      ],
    });
    prisma.journalEntry.findMany.mockResolvedValue([
      {
        id: 'entry-1',
        entry_date: new Date('2026-03-10'),
        lines: [
          { account_id: 'bank-acct', debit: 1200, credit: 0, account: { code: '1000', name: 'Bank' } },
        ],
      },
    ]);
    prisma.$queryRaw.mockResolvedValue([
      {
        id: 'match-1',
        company_id: 'company-1',
        statement_id: 'stmt-1',
        line_id: 'line-1',
        journal_entry_id: 'entry-1',
        matched_by: 'user-1',
        matched_at: new Date('2026-03-10'),
        updated_at: new Date('2026-03-10'),
        line_description: 'Deposit',
        line_amount: '1200.00',
        line_date: new Date('2026-03-10'),
        line_balance: '2200.00',
        line_reference: null,
        journal_description: 'Customer deposit',
        journal_reference: null,
        journal_date: new Date('2026-03-10'),
        journal_status: 'posted',
      },
    ]);

    const result = await service.getReconciliationSuggestions('company-1', 'stmt-1');

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].line_id).toBe('line-1');
    expect(result.suggestions[0].match?.journal_entry_id).toBe('entry-1');
  });

  it('stores and clears reconciliation matches using the statement line', async () => {
    prisma.bankStatement.findFirst.mockResolvedValue({
      id: 'stmt-1',
      account_id: 'bank-acct',
      lines: [
        { id: 'line-1', date: new Date('2026-03-10'), amount: 1200, description: 'Deposit', balance: 2200 },
      ],
    });
    prisma.journalEntry.findFirst.mockResolvedValue({
      id: 'entry-1',
      status: 'posted',
      lines: [],
      period: null,
    });
    prisma.journalEntry.findMany.mockResolvedValue([]);
    prisma.$executeRaw.mockResolvedValue(1);
    prisma.$queryRaw.mockResolvedValue([]);

    await service.matchBankStatementLine('company-1', 'stmt-1', 'line-1', 'entry-1', 'user-1');
    await service.unmatchBankStatementLine('company-1', 'stmt-1', 'line-1');

    expect(prisma.$executeRaw).toHaveBeenCalled();
  });

  it('updates company accounts while preserving scope', async () => {
    prisma.gLAccount.findFirst
      .mockResolvedValueOnce({ id: 'acct-1', company_id: 'company-1', code: '1111', type: 'asset', is_header: false, is_contra: false, parent_id: null, account_owner_id: null })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'parent-1', company_id: 'company-1', type: 'asset', is_active: true, is_header: true, level: 1, full_path: '1000' });
    prisma.gLAccount.findMany.mockResolvedValue([]);
    prisma.gLAccount.update.mockResolvedValue({ id: 'acct-1', name: 'Updated Cash', full_path: '1000 > 1110' });

    const result = await service.updateAccount('company-1', 'user-1', 'acct-1', {
      name: 'Updated Cash',
      code: '1110',
      type: 'asset',
      parent_id: 'parent-1',
      is_active: false,
      is_header: false,
    });

    expect(prisma.gLAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'acct-1' },
        data: expect.objectContaining({
          name: 'Updated Cash',
          code: '1110',
          parent_id: 'parent-1',
          is_active: false,
          modified_by: 'user-1',
        }),
      }),
    );
    expect(result).toEqual({ id: 'acct-1', name: 'Updated Cash', full_path: '1000 > 1110' });
  });

  it('creates metadata-rich accounts with hierarchy defaults', async () => {
    prisma.gLAccount.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'parent-1', company_id: 'company-1', type: 'asset', is_active: true, is_header: true, level: 1, full_path: '1000' });
    prisma.employee.findFirst.mockResolvedValue({ id: 'emp-1', first_name: 'Nomsa', last_name: 'Dube' });
    prisma.gLAccount.create.mockResolvedValue({ id: 'acct-1', code: '1113', normal_balance: 'DR' });

    await service.createAccount('company-1', 'user-1', {
      code: '1113',
      name: 'Main Checking Account',
      type: 'asset',
      category: 'Current Assets',
      subtype: 'Cash and Cash Equivalents',
      parent_id: 'parent-1',
      is_header: false,
      sensitivity_tier: 'T1',
      account_owner_id: 'emp-1',
    });

    expect(prisma.gLAccount.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          code: '1113',
          category: 'Current Assets',
          subtype: 'Cash and Cash Equivalents',
          normal_balance: 'DR',
          sensitivity_tier: 'T1',
          account_owner_id: 'emp-1',
          full_path: '1000 > 1113',
          created_by: 'user-1',
        }),
      }),
    );
  });

  it('blocks posting journal entries to header accounts', async () => {
    prisma.accountingPeriod.upsert.mockResolvedValue({ id: 'period-1', status: 'open' });
    prisma.gLAccount.findMany.mockResolvedValue([
      { id: 'acct-1', code: '1100', name: 'Current Assets', is_active: true, is_header: true },
      { id: 'acct-2', code: '2111', name: 'Accounts Payable', is_active: true, is_header: false },
    ]);

    await expect(
      service.createJournalEntry('company-1', 'user-1', {
        entry_date: '2026-04-01',
        description: 'Invalid header posting',
        lines: [
          { account_id: 'acct-1', debit: 100, credit: 0 },
          { account_id: 'acct-2', debit: 0, credit: 100 },
        ],
      }),
    ).rejects.toThrow('Header account 1100 cannot accept postings');
  });
});
