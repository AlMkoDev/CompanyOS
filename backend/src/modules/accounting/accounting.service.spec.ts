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
      count: jest.fn(),
    },
    gLAccountAuditTrail: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    gLAccountChangeRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    reportCertification: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    reportCertificationAudit: {
      create: jest.fn(),
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
    Object.values(prisma).forEach((group: any) => {
      if (group && typeof group === 'object') {
        Object.values(group).forEach((fn: any) => {
          if (fn?.mockReset) {
            fn.mockReset();
          }
        });
      }
    });

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
    prisma.gLAccountAuditTrail.create.mockResolvedValue({ id: 'audit-1' });

    await service.createAccount(
      'company-1',
      'user-1',
      {
        code: '1113',
        name: 'Main Checking Account',
        type: 'asset',
        category: 'Current Assets',
        subtype: 'Cash and Cash Equivalents',
        parent_id: 'parent-1',
        is_header: false,
        sensitivity_tier: 'T3',
        fs_placement: 'Current Assets',
        account_owner_id: 'emp-1',
      },
      ['Super Admin'],
    );

    expect(prisma.gLAccount.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          code: '1113',
          category: 'Current Assets',
          subtype: 'Cash and Cash Equivalents',
          normal_balance: 'DR',
          sensitivity_tier: 'T3',
          fs_placement: 'Current Assets',
          account_owner_id: 'emp-1',
          full_path: '1000 > 1113',
          created_by: 'user-1',
        }),
      }),
    );
    expect(prisma.gLAccountAuditTrail.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          account_id: 'acct-1',
          action: 'account_created',
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

  it('blocks invalid financial statement placements for account type', async () => {
    await expect(
      service.createAccount(
        'company-1',
        'user-1',
        {
          code: '2110',
          name: 'Trade Payables',
          type: 'liability',
          is_header: false,
          parent_id: '',
          sensitivity_tier: 'T3',
          fs_placement: 'Revenue',
        } as any,
        ['System Administrator'],
      ),
    ).rejects.toThrow('Revenue is not a valid financial statement placement for liability accounts');
  });

  it('blocks non-privileged users from directly creating T2 accounts', async () => {
    await expect(
      service.createAccount(
        'company-1',
        'user-1',
        {
          code: '1114',
          name: 'Restricted Treasury Clearing',
          type: 'asset',
          is_header: false,
          parent_id: '',
          sensitivity_tier: 'T2',
        } as any,
        ['Contributor'],
      ),
    ).rejects.toThrow('Protected T1/T2 accounts must be raised through a governed create request');
  });

  it('blocks non-privileged users from directly editing T1 accounts', async () => {
    prisma.gLAccount.findFirst.mockResolvedValue({
      id: 'acct-1',
      company_id: 'company-1',
      code: '1115',
      name: 'Treasury Sweep',
      type: 'asset',
      is_header: false,
      is_contra: false,
      parent_id: 'parent-1',
      account_owner_id: null,
      sensitivity_tier: 'T1',
      is_active: true,
    });

    await expect(
      service.updateAccount(
        'company-1',
        'user-1',
        'acct-1',
        {
          name: 'Treasury Sweep Updated',
        },
        ['finance_analyst'],
      ),
    ).rejects.toThrow('T1 accounts require system-administrator approval for direct maintenance');
  });

  it('blocks direct creation of T1 accounts even for privileged users', async () => {
    await expect(
      service.createAccount(
        'company-1',
        'user-1',
        {
          code: '1116',
          name: 'Operating Treasury',
          type: 'asset',
          is_header: false,
          parent_id: '',
          sensitivity_tier: 'T1',
        } as any,
        ['System Administrator'],
      ),
    ).rejects.toThrow('Protected T1/T2 accounts must be raised through a governed create request');
  });

  it('blocks protected structural changes on T2 accounts even for privileged users', async () => {
    prisma.gLAccount.findFirst.mockResolvedValue({
      id: 'acct-4',
      company_id: 'company-1',
      code: '1211',
      name: 'Treasury Buffer',
      type: 'asset',
      sensitivity_tier: 'T2',
      is_header: false,
      is_contra: false,
      parent_id: 'parent-1',
      account_owner_id: 'emp-1',
      is_active: true,
    });

    await expect(
      service.updateAccount(
        'company-1',
        'user-1',
        'acct-4',
        {
          parent_id: 'parent-2',
        },
        ['finance_manager'],
      ),
    ).rejects.toThrow('Protected T1/T2 account structural changes must be raised through a governed change request');
  });

  it('creates account change requests with current account snapshots', async () => {
    prisma.gLAccount.findFirst.mockResolvedValue({
      id: 'acct-1',
      company_id: 'company-1',
      code: '6100',
      name: 'Utilities',
      type: 'expense',
      is_header: false,
      is_contra: false,
      is_active: true,
      budget_enabled: false,
      sunset_candidate: false,
    });
    prisma.gLAccountChangeRequest.create.mockResolvedValue({ id: 'req-1', title: 'Deactivate utilities' });
    prisma.gLAccountAuditTrail.create.mockResolvedValue({ id: 'audit-2' });

    const result = await service.createAccountChangeRequest('company-1', 'user-1', {
      account_id: 'acct-1',
      request_type: 'deactivate',
      title: 'Deactivate utilities',
      rationale: 'Dormant account after meter consolidation',
      proposed_changes: { is_active: false },
    });

    expect(prisma.gLAccountChangeRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          account_id: 'acct-1',
          request_type: 'deactivate',
          requested_by: 'user-1',
        }),
      }),
    );
    expect(prisma.gLAccountAuditTrail.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'change_request_created',
          change_request_id: 'req-1',
        }),
      }),
    );
    expect(result).toEqual({ id: 'req-1', title: 'Deactivate utilities' });
  });

  it('implements approved deactivate requests and writes account audit', async () => {
    prisma.gLAccountChangeRequest.findFirst.mockResolvedValue({
      id: 'req-1',
      company_id: 'company-1',
      request_type: 'deactivate',
      status: 'pending',
      rationale: 'No longer used',
      account: {
        id: 'acct-1',
        company_id: 'company-1',
        code: '6100',
        name: 'Utilities',
        type: 'expense',
        is_header: false,
        is_contra: false,
        is_active: true,
        budget_enabled: false,
        sunset_candidate: false,
        dormant_since: null,
      },
      requester: null,
      reviewer: null,
    });
    prisma.gLAccount.count.mockResolvedValue(0);
    prisma.gLAccount.update.mockResolvedValue({
      id: 'acct-1',
      code: '6100',
      name: 'Utilities',
      type: 'expense',
      is_header: false,
      is_contra: false,
      is_active: false,
      budget_enabled: false,
      sunset_candidate: false,
      dormant_since: new Date('2026-04-01T08:00:00.000Z'),
    });
    prisma.gLAccountChangeRequest.update.mockResolvedValue({ id: 'req-1', status: 'implemented' });
    prisma.gLAccountAuditTrail.create.mockResolvedValue({ id: 'audit-3' });

    const result = await service.reviewAccountChangeRequest('company-1', 'user-2', ['finance_manager'], 'req-1', {
      decision: 'approved',
      review_notes: 'Approved for sunset prep',
    });

    expect(prisma.gLAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'acct-1' },
        data: expect.objectContaining({
          is_active: false,
          modified_by: 'user-2',
        }),
      }),
    );
    expect(prisma.gLAccountChangeRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'req-1' },
        data: expect.objectContaining({
          status: 'implemented',
          reviewed_by: 'user-2',
        }),
      }),
    );
    expect(prisma.gLAccountAuditTrail.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'change_request_implemented',
          change_request_id: 'req-1',
        }),
      }),
    );
    expect(result).toEqual({ id: 'req-1', status: 'implemented' });
  });

  it('blocks self-review on account change requests', async () => {
    prisma.gLAccountChangeRequest.findFirst.mockResolvedValue({
      id: 'req-2',
      company_id: 'company-1',
      request_type: 'sunset',
      status: 'pending',
      requested_by: 'user-1',
      rationale: 'Dormant account',
      account: {
        id: 'acct-1',
        company_id: 'company-1',
        code: '6100',
        name: 'Utilities',
        type: 'expense',
        sensitivity_tier: 'T3',
        is_header: false,
        is_contra: false,
        is_active: true,
        budget_enabled: false,
        sunset_candidate: false,
        dormant_since: null,
      },
      requester: null,
      reviewer: null,
    });

    await expect(
      service.reviewAccountChangeRequest('company-1', 'user-1', ['finance_manager'], 'req-2', {
        decision: 'approved',
      }),
    ).rejects.toThrow('Requesters may not review their own account change requests');
  });

  it('blocks non-privileged reviewers from approving T2 account requests', async () => {
    prisma.gLAccountChangeRequest.findFirst.mockResolvedValue({
      id: 'req-3',
      company_id: 'company-1',
      request_type: 'update',
      status: 'pending',
      requested_by: 'user-7',
      requested_payload: { sensitivity_tier: 'T2' },
      rationale: 'Adjust reporting placement',
      current_snapshot: { sensitivity_tier: 'T2' },
      account: {
        id: 'acct-2',
        company_id: 'company-1',
        code: '1210',
        name: 'Treasury Clearing',
        type: 'asset',
        sensitivity_tier: 'T2',
        is_header: false,
        is_contra: false,
        is_active: true,
        budget_enabled: false,
        sunset_candidate: false,
        dormant_since: null,
      },
      requester: null,
      reviewer: null,
    });

    await expect(
      service.reviewAccountChangeRequest(
        'company-1',
        'user-2',
        ['finance_analyst'],
        'req-3',
        { decision: 'approved' },
      ),
    ).rejects.toThrow('T2 account change requests must be reviewed by finance leadership or a system administrator');
  });

  it('allows system administrators to approve T1 account requests', async () => {
    prisma.gLAccountChangeRequest.findFirst.mockResolvedValue({
      id: 'req-4',
      company_id: 'company-1',
      request_type: 'sunset',
      status: 'pending',
      requested_by: 'user-7',
      requested_payload: { sensitivity_tier: 'T1' },
      rationale: 'Treasury consolidation',
      current_snapshot: { sensitivity_tier: 'T1' },
      account: {
        id: 'acct-3',
        company_id: 'company-1',
        code: '1101',
        name: 'Operating Cash',
        type: 'asset',
        sensitivity_tier: 'T1',
        is_header: false,
        is_contra: false,
        is_active: true,
        budget_enabled: false,
        sunset_candidate: false,
        dormant_since: null,
      },
      requester: null,
      reviewer: null,
    });
    prisma.gLAccount.update.mockResolvedValue({
      id: 'acct-3',
      code: '1101',
      name: 'Operating Cash',
      type: 'asset',
      sensitivity_tier: 'T1',
      is_header: false,
      is_contra: false,
      is_active: true,
      budget_enabled: false,
      sunset_candidate: true,
      dormant_since: null,
    });
    prisma.gLAccountChangeRequest.update.mockResolvedValue({ id: 'req-4', status: 'implemented' });
    prisma.gLAccountAuditTrail.create.mockResolvedValue({ id: 'audit-4' });

    const result = await service.reviewAccountChangeRequest(
      'company-1',
      'user-99',
      ['System Administrator'],
      'req-4',
      { decision: 'approved', review_notes: 'Approved by security admin.' },
    );

    expect(result).toEqual({ id: 'req-4', status: 'implemented' });
  });

  it('blocks report certification when material COA blockers remain', async () => {
    prisma.gLAccount.findMany.mockResolvedValue([
      {
        id: 'acct-1',
        code: '4000',
        name: 'Produce Sales',
        type: 'revenue',
        is_header: false,
        fs_placement: null,
        sensitivity_tier: 'T3',
        account_owner_id: 'emp-1',
      },
    ]);

    await expect(
      service.certifyReport('company-1', 'user-1', ['finance_manager'], 2026, 4, 'pnl', 'Month-end pack'),
    ).rejects.toThrow('Reporting cannot be certified while material COA blockers remain.');
  });

  it('creates a report certification and audit entry when posture is clean', async () => {
    prisma.gLAccount.findMany.mockResolvedValue([
      {
        id: 'acct-1',
        code: '4000',
        name: 'Produce Sales',
        type: 'revenue',
        is_header: false,
        fs_placement: 'Revenue',
        sensitivity_tier: 'T3',
        account_owner_id: 'emp-1',
      },
      {
        id: 'acct-2',
        code: '6100',
        name: 'Operating Costs',
        type: 'expense',
        is_header: false,
        fs_placement: 'Operating Expenses',
        sensitivity_tier: 'T3',
        account_owner_id: 'emp-2',
      },
    ]);
    prisma.accountingPeriod.upsert.mockResolvedValue({
      id: 'period-1',
      company_id: 'company-1',
      year: 2026,
      month: 4,
      status: 'open',
    });
    prisma.reportCertification.upsert.mockResolvedValue({
      id: 'cert-1',
      company_id: 'company-1',
      period_id: 'period-1',
      report_type: 'pnl',
      status: 'certified',
      certified_by: 'user-9',
      certifier: { id: 'user-9', first_name: 'Jane', last_name: 'Done', email: 'jane@example.com' },
    });
    prisma.reportCertificationAudit.create.mockResolvedValue({ id: 'audit-cert-1' });
    prisma.accountingPeriod.findFirst.mockResolvedValue({
      id: 'period-1',
      company_id: 'company-1',
      year: 2026,
      month: 4,
      status: 'open',
    });
    prisma.reportCertification.findFirst.mockResolvedValue({
      id: 'cert-1',
      company_id: 'company-1',
      period_id: 'period-1',
      report_type: 'pnl',
      status: 'certified',
      certified_by: 'user-9',
      certifier: { id: 'user-9', first_name: 'Jane', last_name: 'Done', email: 'jane@example.com' },
      audits: [],
    });

    const result = await service.certifyReport('company-1', 'user-9', ['finance_manager'], 2026, 4, 'pnl', 'Month-end pack');

    expect(prisma.reportCertification.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          report_type: 'pnl',
          status: 'certified',
          coverage_percent: 100,
          blocker_count: 0,
        }),
      }),
    );
    expect(prisma.reportCertificationAudit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          certification_id: 'cert-1',
          action: 'certified',
        }),
      }),
    );
    expect(result.certification?.status).toBe('certified');
    expect(result.posture.canCertify).toBe(true);
  });

  it('blocks non-finance users from certifying reports', async () => {
    await expect(
      service.certifyReport('company-1', 'user-3', ['finance_analyst'], 2026, 4, 'bs'),
    ).rejects.toThrow('Only finance leadership or system administrators can certify reporting.');
  });
});
