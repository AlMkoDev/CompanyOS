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
    getAccounts: jest.Mock;
    postJournalEntry: jest.Mock;
    reverseJournalEntry: jest.Mock;
    closePeriod: jest.Mock;
  };

  beforeEach(async () => {
    accountingService = {
      getAccounts: jest.fn(),
      postJournalEntry: jest.fn(),
      reverseJournalEntry: jest.fn(),
      closePeriod: jest.fn(),
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

  it('posts journal entries through company-scoped context', async () => {
    accountingService.postJournalEntry.mockResolvedValue({ id: 'entry-1', status: 'posted' });

    const response = await request(app.getHttpServer())
      .post('/accounting/journal-entries/entry-1/post')
      .expect(201);

    expect(accountingService.postJournalEntry).toHaveBeenCalledWith('company-1', 'entry-1');
    expect(response.body).toEqual({ id: 'entry-1', status: 'posted' });
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
});
