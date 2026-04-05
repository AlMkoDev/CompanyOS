import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';

describe('CompanyController integration', () => {
  let app: INestApplication;
  let guardSpy: jest.SpyInstance;
  let companyService: {
    findOne: jest.Mock;
    updateCompany: jest.Mock;
    updateSetupProgress: jest.Mock;
    previewAccountingTemplateRecommendation: jest.Mock;
    previewAccountingTemplateActivation: jest.Mock;
    listAccountingProfileAuditHistory: jest.Mock;
  };

  beforeEach(async () => {
    companyService = {
      findOne: jest.fn(),
      updateCompany: jest.fn(),
      updateSetupProgress: jest.fn(),
    previewAccountingTemplateRecommendation: jest.fn(),
    previewAccountingTemplateActivation: jest.fn(),
    activateAccountingTemplate: jest.fn(),
    listAccountingProfileAuditHistory: jest.fn(),
  };

    guardSpy = jest
      .spyOn(JwtAuthGuard.prototype, 'canActivate')
      .mockImplementation((context) => {
        const req = context.switchToHttp().getRequest();
        req.user = { companyId: 'company-1', userId: 'user-1', roles: ['Super Admin'] };
        return true;
      });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        {
          provide: CompanyService,
          useValue: companyService,
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

  it('loads the current company through company-scoped context', async () => {
    companyService.findOne.mockResolvedValue({ id: 'company-1', name: 'CompanyOS' });

    const response = await request(app.getHttpServer()).get('/company').expect(200);

    expect(companyService.findOne).toHaveBeenCalledWith('company-1');
    expect(response.body).toEqual({ id: 'company-1', name: 'CompanyOS' });
  });

  it('updates company profile through company-scoped context', async () => {
    companyService.updateCompany.mockResolvedValue({ id: 'company-1', tagline: 'Run everything' });

    const response = await request(app.getHttpServer())
      .patch('/company')
      .send({
        tagline: 'Run everything',
        accounting_profile: {
          primary_jurisdiction: 'ZA',
          reporting_framework: 'IFRS_FULL',
          functional_currency: 'ZAR',
          presentation_currency: 'ZAR',
        },
      })
      .expect(200);

    expect(companyService.updateCompany).toHaveBeenCalledWith(
      'company-1',
      {
        tagline: 'Run everything',
        accounting_profile: {
          primary_jurisdiction: 'ZA',
          reporting_framework: 'IFRS_FULL',
          functional_currency: 'ZAR',
          presentation_currency: 'ZAR',
        },
      },
      ['Super Admin'],
      'user-1',
    );
    expect(response.body).toEqual({ id: 'company-1', tagline: 'Run everything' });
  });

  it('loads accounting profile audit history through company-scoped context', async () => {
    companyService.listAccountingProfileAuditHistory.mockResolvedValue([{ id: 'audit-1' }]);

    const response = await request(app.getHttpServer())
      .get('/company/accounting-profile/history')
      .expect(200);

    expect(companyService.listAccountingProfileAuditHistory).toHaveBeenCalledWith('company-1');
    expect(response.body).toEqual([{ id: 'audit-1' }]);
  });

  it('updates setup progress through company-scoped context', async () => {
    companyService.updateSetupProgress.mockResolvedValue({ current_step: 3 });

    const response = await request(app.getHttpServer())
      .patch('/company/setup')
      .send({ step: 3, config: { access: true }, isComplete: false })
      .expect(200);

    expect(companyService.updateSetupProgress).toHaveBeenCalledWith('company-1', {
      step: 3,
      config: { access: true },
      isComplete: false,
    });
    expect(response.body).toEqual({ current_step: 3 });
  });

  it('previews accounting template recommendation through company-scoped context', async () => {
    companyService.previewAccountingTemplateRecommendation.mockResolvedValue({
      recommendation: { template_code: 'FULL_INTEGRATED' },
    });

    const response = await request(app.getHttpServer())
      .post('/company/accounting-template-recommendation/preview')
      .send({
        accounting_profile: {
          primary_jurisdiction: 'ZA',
          reporting_framework: 'IFRS_FULL',
        },
      })
      .expect(201);

    expect(companyService.previewAccountingTemplateRecommendation).toHaveBeenCalledWith('company-1', {
      primary_jurisdiction: 'ZA',
      reporting_framework: 'IFRS_FULL',
    });
    expect(response.body).toEqual({
      recommendation: { template_code: 'FULL_INTEGRATED' },
    });
  });

  it('previews accounting template activation dry-run through company-scoped context', async () => {
    companyService.previewAccountingTemplateActivation.mockResolvedValue({
      dry_run: { accounts_to_create: 12 },
    });

    const response = await request(app.getHttpServer())
      .post('/company/accounting-template-activation/dry-run')
      .send({
        accounting_profile: {
          primary_jurisdiction: 'ZA',
          reporting_framework: 'IFRS_FULL',
        },
      })
      .expect(201);

    expect(companyService.previewAccountingTemplateActivation).toHaveBeenCalledWith('company-1', {
      primary_jurisdiction: 'ZA',
      reporting_framework: 'IFRS_FULL',
    });
    expect(response.body).toEqual({
      dry_run: { accounts_to_create: 12 },
    });
  });

  it('activates the recommended accounting template through company-scoped context', async () => {
    companyService.activateAccountingTemplate.mockResolvedValue({
      activated: true,
      created_count: 8,
    });

    const response = await request(app.getHttpServer())
      .post('/company/accounting-template-activation')
      .send({
        accounting_profile: {
          primary_jurisdiction: 'ZA',
          reporting_framework: 'IFRS_FULL',
        },
      })
      .expect(201);

    expect(companyService.activateAccountingTemplate).toHaveBeenCalledWith(
      'company-1',
      ['Super Admin'],
      'user-1',
      {
        primary_jurisdiction: 'ZA',
        reporting_framework: 'IFRS_FULL',
      },
    );
    expect(response.body).toEqual({
      activated: true,
      created_count: 8,
    });
  });
});
