import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { CompanyService } from './company.service';

describe('CompanyService', () => {
  let service: CompanyService;
  const prisma: any = {
    company: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    coaTemplate: {
      findUnique: jest.fn(),
    },
    companySetup: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    department: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
  });

  it('rejects missing company lookups', async () => {
    prisma.company.findFirst.mockResolvedValue(null);

    await expect(service.findOne('company-1')).rejects.toThrow(NotFoundException);
  });

  it('checks existence before updateCompany', async () => {
    prisma.company.findFirst.mockResolvedValue({ id: 'company-1' });
    prisma.company.update.mockResolvedValue({ id: 'company-1' });

    await service.updateCompany('company-1', { tagline: 'Tag' });

    expect(prisma.company.findFirst).toHaveBeenCalledWith({
      where: { id: 'company-1' },
      include: {
        accounting_profile: true,
        setup: true,
        gap_statuses: true,
        departments: {
          include: {
            gap_statuses: true,
            kpis: true,
          },
        },
      },
    });
    expect(prisma.company.update).toHaveBeenCalledWith({
      where: { id: 'company-1' },
      data: {
        tagline: 'Tag',
        industry: undefined,
        description: undefined,
        brand_colors: undefined,
        accounting_profile: undefined,
      },
      include: {
        accounting_profile: true,
        setup: true,
      },
    });
  });

  it('recommends Zimbabwe integrated template with mandatory IAS 29 and cross-border modules', async () => {
    prisma.coaTemplate.findUnique.mockResolvedValue({
      code: 'ZW_FULL_INTEGRATED',
      name: 'Zimbabwe Full Integrated Chart',
      description: 'Zimbabwe chart',
      modules: [
        { module_code: 'ZW_TAX', module_name: 'Zimbabwe Tax Pack', is_required: true },
        { module_code: 'MULTI_CURRENCY', module_name: 'Multi-currency Accounting', is_required: true },
        { module_code: 'IAS29', module_name: 'IAS 29 Restatement', is_required: false },
      ],
    });

    const result = await service.previewAccountingTemplateRecommendation('company-1', {
      primary_jurisdiction: 'ZW',
      operating_jurisdictions: ['ZW', 'ZA'],
      reporting_framework: 'ZW_IFRS29',
      functional_currency: 'USD',
      presentation_currency: 'USD',
      functional_currency_justification: 'USD is the primary revenue and treasury currency.',
      zw_ias29_applicable: true,
      cross_border_operations: true,
      consolidates_subsidiaries: true,
    });

    expect(result.recommendation.template_code).toBe('ZW_FULL_INTEGRATED');
    expect(result.recommendation.modules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'ZW_TAX', required: true }),
        expect.objectContaining({ code: 'MULTI_CURRENCY', required: true }),
        expect.objectContaining({ code: 'IAS29', required: true }),
        expect.objectContaining({ code: 'CROSS_BORDER_INTERCOMPANY', required: true }),
      ]),
    );
    expect(result.recommendation.regulatory_packs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'ZA_ZW_DTA' }),
      ]),
    );
    expect(result.recommendation.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining('IAS 29'),
        expect.stringContaining('USD functional currency'),
        expect.stringContaining('Cross-border ZA/ZW'),
      ]),
    );
  });

  it('upserts accounting profile when jurisdiction settings are supplied', async () => {
    prisma.company.findFirst.mockResolvedValue({ id: 'company-1' });
    prisma.company.update.mockResolvedValue({
      id: 'company-1',
      accounting_profile: { primary_jurisdiction: 'ZW' },
    });

    await service.updateCompany('company-1', {
      accounting_profile: {
        primary_jurisdiction: 'ZW',
        operating_jurisdictions: ['ZW', 'ZA'],
        reporting_framework: 'ZW_IFRS_FULL',
        functional_currency: 'USD',
        presentation_currency: 'USD',
        functional_currency_justification: 'USD is the primary economic environment for revenue and treasury.',
        zw_ias29_applicable: true,
      },
    }, ['Super Admin']);

    expect(prisma.company.update).toHaveBeenCalledWith({
      where: { id: 'company-1' },
      data: expect.objectContaining({
        accounting_profile: {
          upsert: {
            update: expect.objectContaining({
              primary_jurisdiction: 'ZW',
              reporting_framework: 'ZW_IFRS_FULL',
              functional_currency: 'USD',
              presentation_currency: 'USD',
              zw_ias29_applicable: true,
            }),
            create: expect.objectContaining({
              primary_jurisdiction: 'ZW',
              reporting_framework: 'ZW_IFRS_FULL',
            }),
          },
        },
      }),
      include: {
        accounting_profile: true,
        setup: true,
      },
    });
  });

  it('blocks non-admin users from changing the accounting profile', async () => {
    prisma.company.findFirst.mockResolvedValue({ id: 'company-1' });

    await expect(
      service.updateCompany(
        'company-1',
        {
          accounting_profile: {
            primary_jurisdiction: 'ZA',
            reporting_framework: 'IFRS_FULL',
            functional_currency: 'ZAR',
            presentation_currency: 'ZAR',
          },
        },
        ['Finance Manager'],
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(prisma.company.update).not.toHaveBeenCalled();
  });

  it('merges setup config and creates missing selected departments once', async () => {
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        companySetup: {
          findUnique: jest.fn().mockResolvedValue({
            company_id: 'company-1',
            steps_config: { selectedDepartments: ['fin'], theme: 'classic' },
            completed_steps: [1, 2],
            is_complete: false,
          }),
          upsert: prisma.companySetup.upsert,
        },
        department: {
          findMany: jest.fn().mockResolvedValue([{ template_key: 'fin' }]),
          create: prisma.department.create,
        },
      }),
    );
    prisma.companySetup.upsert.mockResolvedValue({
      company_id: 'company-1',
      current_step: 3,
      completed_steps: [1, 2, 3],
      steps_config: { selectedDepartments: ['fin', 'hr'], theme: 'classic' },
      is_complete: false,
    });

    const result = await service.updateSetupProgress('company-1', {
      step: 3,
      config: { selectedDepartments: ['fin', 'hr'] },
      isComplete: false,
    });

    expect(prisma.department.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        company_id: 'company-1',
        template_key: 'hr',
        name: 'Human Resources',
      }),
    });
    expect(prisma.companySetup.upsert).toHaveBeenCalledWith({
      where: { company_id: 'company-1' },
      update: {
        current_step: 3,
        steps_config: { selectedDepartments: ['fin', 'hr'], theme: 'classic' },
        completed_steps: [1, 2, 3],
        is_complete: false,
      },
      create: {
        company_id: 'company-1',
        current_step: 3,
        steps_config: { selectedDepartments: ['fin', 'hr'], theme: 'classic' },
        completed_steps: [3],
        is_complete: false,
      },
    });
    expect(result.current_step).toBe(3);
  });
});
