import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';

describe('AccountingController integration', () => {
  let app: INestApplication;
  let guardSpy: jest.SpyInstance;
  let accountingService: {
    getJournalEntries: jest.Mock;
    updateAccount: jest.Mock;
    getPeriods: jest.Mock;
    getPeriodCloseReadiness: jest.Mock;
    getAccounts: jest.Mock;
    postJournalEntry: jest.Mock;
    reverseJournalEntry: jest.Mock;
    closePeriod: jest.Mock;
    getBalanceSheet: jest.Mock;
    getBankStatements: jest.Mock;
    getBankStatement: jest.Mock;
    getReconciliationSuggestions: jest.Mock;
  };

  beforeEach(async () => {
    accountingService = {
      getJournalEntries: jest.fn(),
      updateAccount: jest.fn(),
      getPeriods: jest.fn(),
      getPeriodCloseReadiness: jest.fn(),
      getAccounts: jest.fn(),
      postJournalEntry: jest.fn(),
      reverseJournalEntry: jest.fn(),
      closePeriod: jest.fn(),
      getBalanceSheet: jest.fn(),
      getBankStatements: jest.fn(),
      getBankStatement: jest.fn(),
      getReconciliationSuggestions: jest.fn(),
    };

    guardSpy = jest
      .spyOn(JwtAuthGuard.prototype, 'canActivate')
      .mockImplementation((context) => {
        const req = context.switchToHttp().getRequest();
        req.user = { companyId: 'company-1', userId: 'user-1' };
        return true;
      });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AccountingController],
      providers: [
        {
          provide: AccountingService,
          useValue: accountingService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    guardSpy.mockRestore();
  });

  it('loads accounts through company-scoped context', async () => {
    accountingService.getAccounts.mockResolvedValue([{ id: 'acct-1', code: '1000' }]);

    const response = await request(app.getHttpServer()).get('/accounting/accounts').expect(200);

    expect(accountingService.getAccounts).toHaveBeenCalledWith('company-1');
    expect(response.body).toEqual([{ id: 'acct-1', code: '1000' }]);
  });

  it('updates accounts through company-scoped context', async () => {
    accountingService.updateAccount.mockResolvedValue({ id: 'acct-1', code: '1000', name: 'Cash' });

    const response = await request(app.getHttpServer())
      .patch('/accounting/accounts/acct-1')
      .send({ name: 'Cash' })
      .expect(200);

    expect(accountingService.updateAccount).toHaveBeenCalledWith('company-1', 'acct-1', { name: 'Cash' });
    expect(response.body).toEqual({ id: 'acct-1', code: '1000', name: 'Cash' });
  });

  it('posts journal entries through company-scoped context', async () => {
    accountingService.postJournalEntry.mockResolvedValue({ id: 'entry-1', status: 'posted' });

    const response = await request(app.getHttpServer())
      .post('/accounting/journal-entries/entry-1/post')
      .expect(201);

    expect(accountingService.postJournalEntry).toHaveBeenCalledWith('company-1', 'entry-1');
    expect(response.body).toEqual({ id: 'entry-1', status: 'posted' });
  });

  it('loads journal entries through company-scoped context', async () => {
    accountingService.getJournalEntries.mockResolvedValue([
      { id: 'entry-1', status: 'draft', lines: [] },
    ]);

    const response = await request(app.getHttpServer()).get('/accounting/journal-entries').expect(200);

    expect(accountingService.getJournalEntries).toHaveBeenCalledWith('company-1');
    expect(response.body).toEqual([{ id: 'entry-1', status: 'draft', lines: [] }]);
  });

  it('reverses journal entries through company-scoped context', async () => {
    accountingService.reverseJournalEntry.mockResolvedValue({ id: 'rev-1', status: 'posted' });

    const response = await request(app.getHttpServer())
      .post('/accounting/journal-entries/entry-1/reverse')
      .expect(201);

    expect(accountingService.reverseJournalEntry).toHaveBeenCalledWith('company-1', 'entry-1');
    expect(response.body).toEqual({ id: 'rev-1', status: 'posted' });
  });

  it('closes accounting periods with company and actor context', async () => {
    accountingService.closePeriod.mockResolvedValue({ status: 'closed' });

    const response = await request(app.getHttpServer())
      .post('/accounting/periods/close')
      .send({ year: 2026, month: 3 })
      .expect(201);

    expect(accountingService.closePeriod).toHaveBeenCalledWith('company-1', 2026, 3, 'user-1');
    expect(response.body).toEqual({ status: 'closed' });
  });

  it('loads balance sheet reports through company-scoped context', async () => {
    accountingService.getBalanceSheet.mockResolvedValue([
      { type: 'asset', name: 'Cash', balance: 1200 },
    ]);

    const response = await request(app.getHttpServer())
      .get('/accounting/reports/balance-sheet?toDate=2026-03-27')
      .expect(200);

    expect(accountingService.getBalanceSheet).toHaveBeenCalledWith('company-1', new Date('2026-03-27'));
    expect(response.body).toEqual([{ type: 'asset', name: 'Cash', balance: 1200 }]);
  });

  it('loads accounting periods through company-scoped context', async () => {
    accountingService.getPeriods.mockResolvedValue([
      { year: 2026, month: 3, status: 'open' },
    ]);

    const response = await request(app.getHttpServer()).get('/accounting/periods').expect(200);

    expect(accountingService.getPeriods).toHaveBeenCalledWith('company-1');
    expect(response.body).toEqual([{ year: 2026, month: 3, status: 'open' }]);
  });

  it('loads period close readiness through company-scoped context', async () => {
    accountingService.getPeriodCloseReadiness.mockResolvedValue({
      period: { year: 2026, month: 3, status: 'open' },
      draftEntries: 0,
      postedEntries: 3,
      reversedEntries: 0,
      bankStatements: 1,
      can_close: true,
      blockers: [],
    });

    const response = await request(app.getHttpServer())
      .get('/accounting/periods/close-readiness?year=2026&month=3')
      .expect(200);

    expect(accountingService.getPeriodCloseReadiness).toHaveBeenCalledWith('company-1', 2026, 3);
    expect(response.body.can_close).toBe(true);
  });

  it('loads bank statements through company-scoped context', async () => {
    accountingService.getBankStatements.mockResolvedValue([
      { id: 'stmt-1', lines: [{ id: 'line-1' }] },
    ]);

    const response = await request(app.getHttpServer()).get('/accounting/bank-statements').expect(200);

    expect(accountingService.getBankStatements).toHaveBeenCalledWith('company-1');
    expect(response.body).toEqual([{ id: 'stmt-1', lines: [{ id: 'line-1' }] }]);
  });

  it('loads bank reconciliation suggestions through company-scoped context', async () => {
    accountingService.getReconciliationSuggestions.mockResolvedValue({
      statement: { id: 'stmt-1' },
      suggestions: [],
    });

    const response = await request(app.getHttpServer())
      .get('/accounting/bank-statements/stmt-1/reconciliation')
      .expect(200);

    expect(accountingService.getReconciliationSuggestions).toHaveBeenCalledWith('company-1', 'stmt-1');
    expect(response.body).toEqual({ statement: { id: 'stmt-1' }, suggestions: [] });
  });
});
