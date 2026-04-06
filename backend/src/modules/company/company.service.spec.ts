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
    gLAccount: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    gLAccountAuditTrail: {
      create: jest.fn(),
    },
    companyAccountingProfileAudit: {
      findMany: jest.fn(),
      create: jest.fn(),
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
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        company: prisma.company,
        gLAccount: prisma.gLAccount,
        gLAccountAuditTrail: prisma.gLAccountAuditTrail,
        companyAccountingProfileAudit: prisma.companyAccountingProfileAudit,
      }),
    );

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
    expect(prisma.companyAccountingProfileAudit.create).not.toHaveBeenCalled();
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
      accounts: [
        {
          module_dependency: null,
          catalog_account: {
            code: '1000',
            name: 'Cash and Cash Equivalents',
            account_type: 'asset',
            jurisdiction: null,
            is_core: true,
            is_regulatory: false,
            is_optional: false,
          },
        },
        {
          module_dependency: 'ZW_TAX',
          catalog_account: {
            code: '2311',
            name: 'ZIMRA VAT Output',
            account_type: 'liability',
            jurisdiction: 'ZW',
            is_core: true,
            is_regulatory: true,
            is_optional: false,
          },
        },
        {
          module_dependency: 'MULTI_CURRENCY',
          catalog_account: {
            code: '7000',
            name: 'Foreign Exchange Gain or Loss',
            account_type: 'expense',
            jurisdiction: null,
            is_core: false,
            is_regulatory: true,
            is_optional: true,
          },
        },
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
    expect(result.recommendation.catalog_preview).toEqual(
      expect.objectContaining({
        total_accounts: 3,
        core_accounts: 2,
        regulatory_accounts: 2,
        optional_accounts: 1,
        module_dependent_accounts: 2,
      }),
    );
  });

  it('upserts accounting profile when jurisdiction settings are supplied', async () => {
    prisma.company.findFirst.mockResolvedValue({
      id: 'company-1',
      accounting_profile: null,
    });
    prisma.company.update.mockResolvedValue({
      id: 'company-1',
      accounting_profile: { id: 'profile-1', primary_jurisdiction: 'ZW' },
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
    expect(prisma.companyAccountingProfileAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        company_id: 'company-1',
        profile_id: 'profile-1',
        actor_user_id: null,
        action: 'created',
        change_summary: expect.stringContaining('Primary jurisdiction'),
      }),
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

  it('lists recent accounting profile audit history', async () => {
    prisma.company.findFirst.mockResolvedValue({ id: 'company-1' });
    prisma.companyAccountingProfileAudit.findMany.mockResolvedValue([{ id: 'audit-1' }]);

    const result = await service.listAccountingProfileAuditHistory('company-1');

    expect(prisma.companyAccountingProfileAudit.findMany).toHaveBeenCalledWith({
      where: { company_id: 'company-1' },
      orderBy: { created_at: 'desc' },
      take: 10,
      include: {
        actor: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });
    expect(result).toEqual([{ id: 'audit-1' }]);
  });

  it('previews activation dry-run with create counts and collisions', async () => {
    prisma.company.findFirst.mockResolvedValue({
      id: 'company-1',
      accounting_profile: {
        primary_jurisdiction: 'ZA',
        operating_jurisdictions: ['ZA'],
        reporting_framework: 'IFRS_FULL',
        functional_currency: 'ZAR',
        presentation_currency: 'ZAR',
      },
    });
    prisma.coaTemplate.findUnique.mockResolvedValue({
      code: 'FULL_INTEGRATED',
      name: 'Full Integrated Chart',
      description: 'Integrated chart',
      modules: [{ module_code: 'SA_TAX', module_name: 'South Africa Tax Pack', is_required: true }],
      accounts: [
        {
          module_dependency: null,
          catalog_account: {
            code: '1000',
            name: 'Cash and Cash Equivalents',
            account_type: 'asset',
            jurisdiction: null,
            is_core: true,
            is_regulatory: false,
            is_optional: false,
          },
        },
        {
          module_dependency: 'SA_TAX',
          catalog_account: {
            code: '2310',
            name: 'SARS VAT Output',
            account_type: 'liability',
            jurisdiction: 'ZA',
            is_core: true,
            is_regulatory: true,
            is_optional: false,
          },
        },
      ],
    });
    prisma.gLAccount.findMany.mockResolvedValue([
      { id: 'gl-1', code: '1000', name: 'Cash Existing', type: 'asset', is_active: true },
    ]);

    const result = await service.previewAccountingTemplateActivation('company-1');

    expect(result.dry_run).toEqual(
      expect.objectContaining({
        existing_company_accounts: 1,
        template_accounts_considered: 2,
        accounts_to_create: 1,
        collisions: 1,
      }),
    );
    expect(result.dry_run.to_create_sample).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: '2310', name: 'SARS VAT Output', account_type: 'liability' }),
      ]),
    );
    expect(result.dry_run.collisions_sample).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: '1000', existing_name: 'Cash Existing' }),
      ]),
    );
  });

  it('supports scoped activation previews for core and regulatory selection', async () => {
    prisma.company.findFirst.mockResolvedValue({
      id: 'company-1',
      accounting_profile: {
        primary_jurisdiction: 'ZA',
        operating_jurisdictions: ['ZA'],
        reporting_framework: 'IFRS_FULL',
        functional_currency: 'ZAR',
        presentation_currency: 'ZAR',
      },
    });
    prisma.coaTemplate.findUnique.mockResolvedValue({
      code: 'FULL_INTEGRATED',
      name: 'Full Integrated Chart',
      description: 'Integrated chart',
      modules: [
        { module_code: 'SA_TAX', module_name: 'South Africa Tax Pack', is_required: true },
        { module_code: 'PAYROLL', module_name: 'Payroll Pack', is_required: false },
      ],
      accounts: [
        {
          module_dependency: null,
          catalog_account: {
            code: '1000',
            name: 'Cash and Cash Equivalents',
            account_type: 'asset',
            jurisdiction: null,
            is_core: true,
            is_regulatory: false,
            is_optional: false,
          },
        },
        {
          module_dependency: 'SA_TAX',
          catalog_account: {
            code: '2310',
            name: 'SARS VAT Output',
            account_type: 'liability',
            jurisdiction: 'ZA',
            is_core: true,
            is_regulatory: true,
            is_optional: false,
          },
        },
        {
          module_dependency: 'PAYROLL',
          catalog_account: {
            code: '5100',
            name: 'Payroll Tax Expense',
            account_type: 'expense',
            jurisdiction: null,
            is_core: false,
            is_regulatory: false,
            is_optional: true,
          },
        },
      ],
    });
    prisma.gLAccount.findMany.mockResolvedValue([]);

    const result = await service.previewAccountingTemplateActivation('company-1', {
      accounting_profile: {
        primary_jurisdiction: 'ZA',
        reporting_framework: 'IFRS_FULL',
      },
      activation_scope: 'CORE_AND_REGULATORY',
    });

    expect(result.dry_run).toEqual(
      expect.objectContaining({
        activation_scope: 'CORE_AND_REGULATORY',
        template_accounts_considered: 2,
        accounts_to_create: 2,
      }),
    );
    expect(result.dry_run.to_create_sample).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ code: '5100' }),
      ]),
    );
  });

  it('allows legacy collisions to be resolved by keeping the existing account and skipping the template duplicate', async () => {
    prisma.company.findFirst.mockResolvedValue({
      id: 'company-1',
      accounting_profile: {
        primary_jurisdiction: 'ZA',
        operating_jurisdictions: ['ZA'],
        reporting_framework: 'IFRS_FULL',
        functional_currency: 'ZAR',
        presentation_currency: 'ZAR',
      },
    });
    prisma.coaTemplate.findUnique.mockResolvedValue({
      code: 'FULL_INTEGRATED',
      name: 'Full Integrated Chart',
      description: 'Integrated chart',
      modules: [{ module_code: 'SA_TAX', module_name: 'South Africa Tax Pack', is_required: true }],
      accounts: [
        {
          module_dependency: null,
          catalog_account: {
            code: '1000',
            name: 'Cash and Cash Equivalents',
            account_type: 'asset',
            jurisdiction: null,
            is_core: true,
            is_regulatory: false,
            is_optional: false,
          },
        },
        {
          module_dependency: 'SA_TAX',
          catalog_account: {
            code: '2310',
            name: 'SARS VAT Output',
            account_type: 'liability',
            jurisdiction: 'ZA',
            is_core: true,
            is_regulatory: true,
            is_optional: false,
          },
        },
      ],
    });
    prisma.gLAccount.findMany.mockResolvedValue([
      { id: 'gl-1', code: '1000', name: 'Legacy Cash', type: 'asset', is_active: true },
    ]);

    const result = await service.previewAccountingTemplateActivation('company-1', {
      collision_resolutions: [
        {
          code: '1000',
          resolution: 'KEEP_EXISTING_SKIP_TEMPLATE',
        },
      ],
    });

    expect(result.dry_run).toEqual(
      expect.objectContaining({
        accounts_to_create: 1,
        collisions: 0,
        resolved_collisions: 1,
        skipped_existing_accounts: 1,
      }),
    );
    expect(result.dry_run.resolved_collisions_sample).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: '1000', existing_name: 'Legacy Cash' }),
      ]),
    );
  });

  it('keeps activation blocked when a collision is marked for template adoption until the legacy account is remediated', async () => {
    prisma.company.findFirst.mockResolvedValue({
      id: 'company-1',
      accounting_profile: {
        primary_jurisdiction: 'ZA',
        operating_jurisdictions: ['ZA'],
        reporting_framework: 'IFRS_FULL',
        functional_currency: 'ZAR',
        presentation_currency: 'ZAR',
      },
    });
    prisma.coaTemplate.findUnique.mockResolvedValue({
      code: 'FULL_INTEGRATED',
      name: 'Full Integrated Chart',
      description: 'Integrated chart',
      modules: [{ module_code: 'SA_TAX', module_name: 'South Africa Tax Pack', is_required: true }],
      accounts: [
        {
          module_dependency: null,
          catalog_account: {
            code: '1000',
            name: 'Cash and Cash Equivalents',
            account_type: 'asset',
            jurisdiction: null,
            is_core: true,
            is_regulatory: false,
            is_optional: false,
          },
        },
      ],
    });
    prisma.gLAccount.findMany.mockResolvedValue([
      { id: 'gl-1', code: '1000', name: 'Legacy Cash', type: 'asset', is_active: true },
    ]);

    const result = await service.previewAccountingTemplateActivation('company-1', {
      collision_resolutions: [
        {
          code: '1000',
          resolution: 'ADOPT_TEMPLATE_REMEDIATE_LEGACY',
        },
      ],
    });

    expect(result.dry_run).toEqual(
      expect.objectContaining({
        accounts_to_create: 0,
        collisions: 1,
        pending_template_adoptions: 1,
        resolved_collisions: 0,
      }),
    );
    expect(result.dry_run.pending_template_adoptions_sample).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: '1000', existing_name: 'Legacy Cash' }),
      ]),
    );
  });

  it('supports merging into the existing account while preserving legacy data and skipping the queued duplicate', async () => {
    prisma.company.findFirst.mockResolvedValue({
      id: 'company-1',
      accounting_profile: {
        primary_jurisdiction: 'ZA',
        operating_jurisdictions: ['ZA'],
        reporting_framework: 'IFRS_FULL',
        functional_currency: 'ZAR',
        presentation_currency: 'ZAR',
      },
    });
    prisma.coaTemplate.findUnique.mockResolvedValue({
      code: 'FULL_INTEGRATED',
      name: 'Full Integrated Chart',
      description: 'Integrated chart',
      modules: [{ module_code: 'SA_TAX', module_name: 'South Africa Tax Pack', is_required: true }],
      accounts: [
        {
          module_dependency: null,
          catalog_account: {
            code: '1000',
            name: 'Cash and Cash Equivalents',
            account_type: 'asset',
            jurisdiction: null,
            is_core: true,
            is_regulatory: false,
            is_optional: false,
          },
        },
        {
          module_dependency: 'SA_TAX',
          catalog_account: {
            code: '2310',
            name: 'SARS VAT Output',
            account_type: 'liability',
            jurisdiction: 'ZA',
            is_core: true,
            is_regulatory: true,
            is_optional: false,
          },
        },
      ],
    });
    prisma.gLAccount.findMany.mockResolvedValue([
      { id: 'gl-1', code: '1000', name: 'Legacy Cash', type: 'asset', is_active: true },
    ]);

    const result = await service.previewAccountingTemplateActivation('company-1', {
      collision_resolutions: [
        {
          code: '1000',
          resolution: 'MERGE_INTO_EXISTING_PRESERVE_DATA',
        },
      ],
    });

    expect(result.dry_run).toEqual(
      expect.objectContaining({
        accounts_to_create: 1,
        collisions: 0,
        merged_collisions: 1,
        resolved_collisions: 1,
        skipped_existing_accounts: 1,
      }),
    );
    expect(result.dry_run.merged_collisions_sample).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: '1000', existing_name: 'Legacy Cash' }),
      ]),
    );
  });

  it('activates the recommended template into the company chart when no collisions exist', async () => {
    prisma.company.findFirst.mockResolvedValue({
      id: 'company-1',
      accounting_profile: {
        primary_jurisdiction: 'ZA',
        operating_jurisdictions: ['ZA'],
        reporting_framework: 'IFRS_FULL',
        functional_currency: 'ZAR',
        presentation_currency: 'ZAR',
      },
    });
    prisma.coaTemplate.findUnique.mockResolvedValue({
      code: 'FULL_INTEGRATED',
      name: 'Full Integrated Chart',
      description: 'Integrated chart',
      modules: [{ module_code: 'SA_TAX', module_name: 'South Africa Tax Pack', is_required: true }],
      accounts: [
        {
          inclusion_reason: 'Cash baseline',
          module_dependency: null,
          catalog_account: {
            code: '1000',
            name: 'Cash and Cash Equivalents',
            description: 'Cash control',
            account_type: 'asset',
            jurisdiction: null,
            is_core: true,
            is_regulatory: false,
            is_optional: false,
          },
        },
        {
          inclusion_reason: 'VAT control',
          module_dependency: 'SA_TAX',
          catalog_account: {
            code: '2310',
            name: 'SARS VAT Output',
            description: 'VAT output control',
            account_type: 'liability',
            jurisdiction: 'ZA',
            is_core: true,
            is_regulatory: true,
            is_optional: false,
          },
        },
      ],
    });
    prisma.gLAccount.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    prisma.gLAccount.create
      .mockResolvedValueOnce({
        id: 'gl-1000',
        code: '1000',
        name: 'Cash and Cash Equivalents',
        level: 1,
        full_path: '1000',
      })
      .mockResolvedValueOnce({
        id: 'gl-2310',
        code: '2310',
        name: 'SARS VAT Output',
        level: 1,
        full_path: '2310',
      });

    const result = await service.activateAccountingTemplate(
      'company-1',
      ['Super Admin'],
      'user-1',
    );

    expect(result).toEqual(
      expect.objectContaining({
        activated: true,
        template_code: 'FULL_INTEGRATED',
        created_count: 2,
        created_accounts: expect.arrayContaining([
          expect.objectContaining({ code: '1000', account_type: 'asset' }),
          expect.objectContaining({ code: '2310', account_type: 'liability' }),
        ]),
      }),
    );
    expect(prisma.gLAccount.create).toHaveBeenCalledTimes(2);
    expect(prisma.gLAccountAuditTrail.create).toHaveBeenCalledTimes(2);
    expect(prisma.companyAccountingProfileAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        company_id: 'company-1',
        actor_user_id: 'user-1',
        action: 'template_activation',
        change_summary: expect.stringContaining('FULL_INTEGRATED'),
      }),
    });
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
