import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

const standardDepartments = [
  { template_key: 'fin', name: 'Finance', description: 'Accounting, Budgeting & P&L', icon: 'Wallet', color: '#B8860B' },
  { template_key: 'hr', name: 'Human Resources', description: 'Talent, Payroll & Culture', icon: 'Users', color: '#4682B4' },
  { template_key: 'ops', name: 'Operations', description: 'Processes & Supply Chain', icon: 'Settings', color: '#2E7D32' },
  { template_key: 'mkt', name: 'Marketing', description: 'Brand & Content Calendar', icon: 'Megaphone', color: '#C2185B' },
  { template_key: 'sls', name: 'Sales & CRM', description: 'Leads & Deal Pipelines', icon: 'TrendingUp', color: '#EF4444' },
  { template_key: 'leg', name: 'Legal', description: 'Contracts & Compliance', icon: 'Shield', color: '#475569' },
  { template_key: 'it', name: 'IT & Systems', description: 'Assets & Technical Debt', icon: 'Cpu', color: '#4F46E5' },
  { template_key: 'stg', name: 'Strategy & OKRs', description: 'Roadmaps & Goal Tracking', icon: 'Target', color: '#0891B2' },
  { template_key: 'adm', name: 'Administration', description: 'Records & Procurement', icon: 'Clipboard', color: '#0F766E' },
] as const;

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  private readonly supportedJurisdictions = new Set(['ZA', 'ZW']);
  private readonly accountingProfileAdminRoles = new Set([
    'super_admin',
    'system_admin',
    'system_administrator',
    'admin',
    'owner',
    'company_admin',
  ]);
  private readonly supportedFrameworksByJurisdiction: Record<string, string[]> = {
    ZA: ['IFRS_FULL', 'IFRS_SME', 'SA_GAAP_LEGACY'],
    ZW: ['ZW_IFRS_FULL', 'ZW_IFRS29'],
  };
  private readonly supportedCurrenciesByJurisdiction: Record<string, string[]> = {
    ZA: ['ZAR', 'USD', 'EUR', 'GBP'],
    ZW: ['ZIG', 'USD', 'ZAR', 'GBP'],
  };
  private readonly supportedActivationScopes = new Set([
    'FULL_RECOMMENDED',
    'CORE_ONLY',
    'CORE_AND_REGULATORY',
    'MODULE_SELECTED',
  ]);
  private readonly supportedCollisionResolutions = new Set([
    'KEEP_EXISTING_SKIP_TEMPLATE',
    'ADOPT_TEMPLATE_REMEDIATE_LEGACY',
    'MERGE_INTO_EXISTING_PRESERVE_DATA',
  ]);

  private isSchemaDriftError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2021' || error.code === 'P2022')
    );
  }

  async findOne(id: string) {
    let company = null;

    try {
      company = await this.prisma.company.findFirst({
        where: { id },
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
    } catch (error) {
      if (!this.isSchemaDriftError(error)) {
        throw error;
      }

      company = await this.prisma.company.findFirst({
        where: { id },
        include: {
          accounting_profile: true,
          setup: true,
          departments: {
            select: {
              id: true,
              company_id: true,
              template_key: true,
              name: true,
              description: true,
              icon: true,
              color: true,
              mandate: true,
              core_responsibilities: true,
              deliverables: true,
              roles: true,
              budget_allocation: true,
              status: true,
              created_at: true,
              updated_at: true,
            },
          },
        },
      });

      if (company) {
        company = {
          ...company,
          gap_statuses: [],
          departments: company.departments.map((department) => ({
            ...department,
            gap_statuses: [],
            kpis: [],
          })),
        };
      }
    }

    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  private normalizeJurisdiction(value?: string | null) {
    return value?.trim().toUpperCase() || null;
  }

  private normalizeCurrency(value?: string | null) {
    return value?.trim().toUpperCase() || null;
  }

  private normalizeFramework(value?: string | null) {
    return value?.trim().toUpperCase() || null;
  }

  private normalizeRoleName(role?: string | null) {
    if (!role) {
      return null;
    }

    return role.trim().toLowerCase().replace(/\s+/g, '_');
  }

  private getNormalizedRoles(roles?: string[] | null) {
    return Array.from(
      new Set((roles || []).map((role) => this.normalizeRoleName(role)).filter((role): role is string => Boolean(role))),
    );
  }

  private assertAccountingProfileAdminAccess(actorRoles?: string[] | null) {
    const roles = this.getNormalizedRoles(actorRoles);

    if (!roles.some((role) => this.accountingProfileAdminRoles.has(role))) {
      throw new ForbiddenException(
        'Only administrators can change the company accounting profile.',
      );
    }
  }

  private buildAccountingProfilePayload(data?: Record<string, any> | null) {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const primaryJurisdiction = this.normalizeJurisdiction(data.primary_jurisdiction) || 'ZA';
    if (!this.supportedJurisdictions.has(primaryJurisdiction)) {
      throw new BadRequestException(`Unsupported accounting jurisdiction: ${primaryJurisdiction}`);
    }

    const operatingJurisdictions = Array.from(
      new Set(
        (Array.isArray(data.operating_jurisdictions) ? data.operating_jurisdictions : [])
          .map((value) => this.normalizeJurisdiction(value))
          .filter((value): value is string => Boolean(value) && this.supportedJurisdictions.has(value)),
      ),
    );

    if (!operatingJurisdictions.includes(primaryJurisdiction)) {
      operatingJurisdictions.unshift(primaryJurisdiction);
    }

    const reportingFramework =
      this.normalizeFramework(data.reporting_framework) ||
      (primaryJurisdiction === 'ZW' ? 'ZW_IFRS_FULL' : 'IFRS_FULL');

    const allowedFrameworks = this.supportedFrameworksByJurisdiction[primaryJurisdiction] || [];
    if (!allowedFrameworks.includes(reportingFramework)) {
      throw new BadRequestException(
        `${reportingFramework} is not supported for ${primaryJurisdiction} entities`,
      );
    }

    const functionalCurrency =
      this.normalizeCurrency(data.functional_currency) ||
      (primaryJurisdiction === 'ZW' ? 'USD' : 'ZAR');
    const presentationCurrency =
      this.normalizeCurrency(data.presentation_currency) || functionalCurrency;

    const allowedCurrencies = this.supportedCurrenciesByJurisdiction[primaryJurisdiction] || [];
    if (!allowedCurrencies.includes(functionalCurrency)) {
      throw new BadRequestException(
        `${functionalCurrency} is not a supported functional currency for ${primaryJurisdiction}`,
      );
    }

    if (!allowedCurrencies.includes(presentationCurrency)) {
      throw new BadRequestException(
        `${presentationCurrency} is not a supported presentation currency for ${primaryJurisdiction}`,
      );
    }

    const justification = typeof data.functional_currency_justification === 'string'
      ? data.functional_currency_justification.trim()
      : null;

    if (primaryJurisdiction === 'ZW' && !justification) {
      throw new BadRequestException(
        'Zimbabwe entities require a functional currency justification on the accounting profile.',
      );
    }

    const annualPayrollEstimate =
      typeof data.annual_payroll_estimate === 'number' && Number.isFinite(data.annual_payroll_estimate)
        ? new Prisma.Decimal(data.annual_payroll_estimate)
        : null;

    const payload = {
      primary_jurisdiction: primaryJurisdiction,
      operating_jurisdictions: operatingJurisdictions,
      reporting_framework: reportingFramework,
      functional_currency: functionalCurrency,
      presentation_currency: presentationCurrency,
      functional_currency_justification: justification,
      zw_ias29_applicable: Boolean(data.zw_ias29_applicable),
      zw_prior_ias29_application: Boolean(data.zw_prior_ias29_application),
      cross_border_operations: Boolean(data.cross_border_operations),
      consolidates_subsidiaries: Boolean(data.consolidates_subsidiaries),
      vat_registered: Boolean(data.vat_registered),
      pfma_entity: Boolean(data.pfma_entity),
      sdl_exempt: Boolean(data.sdl_exempt),
      annual_payroll_estimate: annualPayrollEstimate,
    };

    if (primaryJurisdiction !== 'ZW') {
      payload.zw_ias29_applicable = false;
      payload.zw_prior_ias29_application = false;
    }

    return payload;
  }

  private async getResolvedAccountingProfile(companyId: string, data?: Record<string, any> | null) {
    if (data && Object.keys(data).length > 0) {
      return this.buildAccountingProfilePayload(data);
    }

    const company = await this.prisma.company.findFirst({
      where: { id: companyId },
      include: { accounting_profile: true },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.accounting_profile) {
      return this.buildAccountingProfilePayload(company.accounting_profile as unknown as Record<string, any>);
    }

    return this.buildAccountingProfilePayload({
      primary_jurisdiction: 'ZA',
      reporting_framework: 'IFRS_FULL',
      functional_currency: 'ZAR',
      presentation_currency: 'ZAR',
      operating_jurisdictions: ['ZA'],
    });
  }

  private extractAccountingProfileData(data?: Record<string, any> | null) {
    if (data?.accounting_profile && typeof data.accounting_profile === 'object') {
      return data.accounting_profile as Record<string, any>;
    }

    return data;
  }

  private resolveActivationScope(data?: Record<string, any> | null) {
    const requestedScope =
      typeof data?.activation_scope === 'string'
        ? data.activation_scope.trim().toUpperCase()
        : 'FULL_RECOMMENDED';

    const activationScope = this.supportedActivationScopes.has(requestedScope)
      ? requestedScope
      : 'FULL_RECOMMENDED';

    const selectedModuleCodes = Array.from(
      new Set(
        Array.isArray(data?.selected_module_codes)
          ? data.selected_module_codes
              .filter((value): value is string => typeof value === 'string')
              .map((value) => value.trim())
              .filter(Boolean)
          : [],
      ),
    );

    return {
      activation_scope: activationScope,
      selected_module_codes: selectedModuleCodes,
    };
  }

  private resolveCollisionResolutions(data?: Record<string, any> | null) {
    const requestedResolutions = Array.isArray(data?.collision_resolutions)
      ? data.collision_resolutions
      : [];

    return Array.from(
      new Map(
        requestedResolutions
          .map((item) => {
            const code =
              typeof item?.code === 'string' ? item.code.trim().toUpperCase() : '';
            const resolution =
              typeof item?.resolution === 'string'
                ? item.resolution.trim().toUpperCase()
                : '';
            const existingId =
              typeof item?.existing_id === 'string' && item.existing_id.trim()
                ? item.existing_id.trim()
                : null;

            if (!code || !this.supportedCollisionResolutions.has(resolution)) {
              return null;
            }

            return [code, { code, resolution, existing_id: existingId }] as const;
          })
          .filter((item): item is readonly [string, { code: string; resolution: string; existing_id: string | null }] => Boolean(item)),
      ).values(),
    );
  }

  private resolveLegacyRemediationStatus(options: {
    templateCode: string;
    existingCollision?: { is_active?: boolean | null } | null;
    trackedAccount?: { code: string; is_active: boolean } | null;
    latestRequest?: { request_type: string; status: string } | null;
  }) {
    const normalizedTemplateCode = options.templateCode.trim().toUpperCase();
    const trackedCode = options.trackedAccount?.code?.trim().toUpperCase();
    const latestRequestType = options.latestRequest?.request_type?.trim().toLowerCase();
    const latestRequestStatus = options.latestRequest?.status?.trim().toLowerCase();

    if (trackedCode && trackedCode !== normalizedTemplateCode) {
      return {
        status: 'recoded',
        note: `Legacy account now uses ${trackedCode}, so the template code ${normalizedTemplateCode} is no longer occupied.`,
      };
    }

    if (
      latestRequestType === 'reclassify' &&
      ['approved', 'implemented'].includes(latestRequestStatus || '')
    ) {
      return {
        status: 'reclassified',
        note: 'Legacy account has a reviewed reclassification record and should be checked before final template adoption.',
      };
    }

    if (options.existingCollision?.is_active === false || options.trackedAccount?.is_active === false) {
      return {
        status: 'inactive',
        note: `Legacy account is inactive but still occupies code ${normalizedTemplateCode}, so the template account cannot be created yet.`,
      };
    }

    return {
      status: 'active',
      note: `Legacy account is still active on code ${normalizedTemplateCode}, so template adoption remains blocked.`,
    };
  }

  private async buildTemplateRecommendationContext(companyId: string, data?: Record<string, any> | null) {
    const profile = await this.getResolvedAccountingProfile(companyId, this.extractAccountingProfileData(data));

    const warnings: string[] = [];
    const modules = new Map<string, { code: string; name: string; required: boolean; reason: string }>();
    const regulatoryPacks: Array<{ code: string; name: string; reason: string }> = [];
    let templateCode = 'FULL_INTEGRATED';
    let rationale =
      'Recommended as the broad integrated chart for operational finance, reporting, and control coverage.';

    const addModule = (code: string, name: string, required: boolean, reason: string) => {
      const existing = modules.get(code);
      if (existing) {
        modules.set(code, { ...existing, required: existing.required || required });
        return;
      }
      modules.set(code, { code, name, required, reason });
    };

    if (profile.primary_jurisdiction === 'ZW') {
      templateCode = 'ZW_FULL_INTEGRATED';
      rationale =
        'Zimbabwe entities need a chart prepared for local tax structure, multi-currency operations, and possible IAS 29 restatement.';
      addModule('ZW_TAX', 'Zimbabwe Tax Pack', true, 'Required for ZIMRA-aligned tax defaults.');
      addModule('MULTI_CURRENCY', 'Multi-currency Accounting', true, 'Zimbabwe setup requires explicit multi-currency readiness.');

      if (profile.zw_ias29_applicable || profile.reporting_framework === 'ZW_IFRS29') {
        addModule('IAS29', 'IAS 29 Restatement', true, 'Required when hyperinflationary reporting is applicable.');
        warnings.push(
          'IAS 29 restatement accounts and CPI setup must be completed before the first Zimbabwe period close.',
        );
      }

      if (profile.functional_currency === 'USD') {
        warnings.push(
          'USD functional currency is allowed for Zimbabwe only when supported by documented IAS 21 justification and exchange-control compliance.',
        );
      }
    } else {
      addModule('SA_TAX', 'South Africa Tax Pack', true, 'Required for SARS-aligned tax defaults.');

      if (profile.reporting_framework === 'IFRS_SME') {
        templateCode = 'SME_LITE';
        rationale =
          'Recommended as a leaner South African chart for private entities using IFRS for SMEs.';
      }

      if (profile.pfma_entity) {
        templateCode = 'ZA_PUBLIC_SECTOR_REVIEW';
        rationale =
          'Public-sector South African entities need a chart that is flagged for PFMA and SCOA review before go-live.';
        addModule('PFMA_SCOA_REVIEW', 'PFMA and SCOA Review', true, 'Required for public-sector reporting and control review.');
        warnings.push(
          'PFMA selection means the chart must be reviewed against SCOA and National Treasury guidance before activation.',
        );
      }

      if (!profile.sdl_exempt && profile.annual_payroll_estimate && new Prisma.Decimal(profile.annual_payroll_estimate).greaterThan(0)) {
        warnings.push(
          'SDL is active for this profile, so payroll tax accounts should be included during chart activation.',
        );
      }
    }

    if (profile.cross_border_operations && profile.operating_jurisdictions.includes('ZA') && profile.operating_jurisdictions.includes('ZW')) {
      addModule(
        'CROSS_BORDER_INTERCOMPANY',
        'Cross-border Intercompany',
        Boolean(profile.consolidates_subsidiaries),
        'Needed for ZA/ZW intercompany accounting, treaty handling, and cross-border reporting.',
      );
      regulatoryPacks.push({
        code: 'ZA_ZW_DTA',
        name: 'South Africa / Zimbabwe DTA Review',
        reason: 'Cross-border withholding and treaty-rate handling should be configured before payment journals are posted.',
      });
      warnings.push(
        'Cross-border ZA/ZW entities should configure DTA treaty rates and intercompany rules before activating payment workflows.',
      );
    }

    const template = await this.prisma.coaTemplate.findUnique({
      where: { code: templateCode },
      include: {
        modules: {
          orderBy: [{ is_required: 'desc' }, { module_name: 'asc' }],
        },
        accounts: {
          orderBy: { sort_order: 'asc' },
          include: {
            catalog_account: true,
          },
        },
      },
    });

    const templateModules = template?.modules ?? [];
    for (const module of templateModules) {
      addModule(
        module.module_code,
        module.module_name,
        module.is_required,
        `Seeded by the ${template?.name || templateCode} template.`,
      );
    }

    const activeModuleCodes = new Set(Array.from(modules.keys()));

    const templateAccounts = (template?.accounts || []).filter((account) => {
      if (!account.module_dependency) {
        return true;
      }

      return activeModuleCodes.has(account.module_dependency);
    });

    return {
      profile,
      warnings,
      modules,
      regulatoryPacks,
      templateCode,
      rationale,
      template,
      templateAccounts,
    };
  }

  private filterTemplateAccountsByScope(
    templateAccounts: Array<any>,
    activationScope: string,
    selectedModuleCodes: string[],
  ) {
    switch (activationScope) {
      case 'CORE_ONLY':
        return templateAccounts.filter(
          (account) =>
            account.catalog_account.is_core &&
            !account.catalog_account.is_regulatory &&
            !account.catalog_account.is_optional,
        );
      case 'CORE_AND_REGULATORY':
        return templateAccounts.filter(
          (account) =>
            (account.catalog_account.is_core || account.catalog_account.is_regulatory) &&
            !account.catalog_account.is_optional,
        );
      case 'MODULE_SELECTED': {
        const selected = new Set(selectedModuleCodes);
        return templateAccounts.filter((account) => {
          if (!account.module_dependency) {
            return account.catalog_account.is_core || account.catalog_account.is_regulatory;
          }

          return selected.has(account.module_dependency);
        });
      }
      case 'FULL_RECOMMENDED':
      default:
        return templateAccounts;
    }
  }

  private inferCatalogAccountType(account: { account_type?: string | null; code: string }) {
    if (account.account_type?.trim()) {
      return account.account_type.trim().toLowerCase();
    }

    if (account.code.startsWith('1')) return 'asset';
    if (account.code.startsWith('2')) return 'liability';
    if (account.code.startsWith('3')) return 'equity';
    if (account.code.startsWith('4')) return 'revenue';
    return 'expense';
  }

  private getDefaultFsPlacementForAccountType(type: string) {
    switch (type) {
      case 'asset':
        return 'Current Assets';
      case 'liability':
        return 'Current Liabilities';
      case 'equity':
        return 'Equity';
      case 'revenue':
        return 'Revenue';
      case 'expense':
        return 'Operating Expenses';
      default:
        return null;
    }
  }

  private getActivationParentCode(code: string) {
    const numericCode = Number(code);
    if (Number.isNaN(numericCode) || code.endsWith('00')) {
      return null;
    }

    const parentCode = String(Math.floor(numericCode / 100) * 100).padStart(4, '0');
    return parentCode === code ? null : parentCode;
  }

  async previewAccountingTemplateRecommendation(companyId: string, data?: Record<string, any> | null) {
    const {
      profile,
      warnings,
      modules,
      regulatoryPacks,
      templateCode,
      rationale,
      template,
      templateAccounts,
    } = await this.buildTemplateRecommendationContext(companyId, data);
    const scope = this.resolveActivationScope(data);
    const scopedAccounts = this.filterTemplateAccountsByScope(
      templateAccounts,
      scope.activation_scope,
      scope.selected_module_codes,
    );

    const catalogPreview = {
      total_accounts: scopedAccounts.length,
      core_accounts: scopedAccounts.filter((account) => account.catalog_account.is_core).length,
      regulatory_accounts: scopedAccounts.filter((account) => account.catalog_account.is_regulatory).length,
      optional_accounts: scopedAccounts.filter((account) => account.catalog_account.is_optional).length,
      module_dependent_accounts: scopedAccounts.filter((account) => Boolean(account.module_dependency)).length,
      sample_accounts: scopedAccounts.slice(0, 12).map((account) => ({
        code: account.catalog_account.code,
        name: account.catalog_account.name,
        account_type: this.inferCatalogAccountType(account.catalog_account),
        jurisdiction: account.catalog_account.jurisdiction,
        module_dependency: account.module_dependency,
        is_core: account.catalog_account.is_core,
        is_regulatory: account.catalog_account.is_regulatory,
        is_optional: account.catalog_account.is_optional,
      })),
    };

    return {
      profile,
      recommendation: {
        template_code: templateCode,
        template_name: template?.name || templateCode,
        template_description: template?.description || rationale,
        rationale,
        modules: Array.from(modules.values()),
        activation_scope: scope.activation_scope,
        selected_module_codes: scope.selected_module_codes,
        regulatory_packs: regulatoryPacks,
        warnings,
        catalog_preview: catalogPreview,
      },
    };
  }

  async previewAccountingTemplateActivation(companyId: string, data?: Record<string, any> | null) {
    const recommendation = await this.previewAccountingTemplateRecommendation(companyId, data);
    const context = await this.buildTemplateRecommendationContext(companyId, data);
    const scope = this.resolveActivationScope(data);
    const collisionResolutions = this.resolveCollisionResolutions(data);
    const collisionResolutionMap = new Map(
      collisionResolutions.map((item) => [item.code, item.resolution]),
    );
    const collisionResolutionByCode = new Map(
      collisionResolutions.map((item) => [item.code, item]),
    );
    const scopedAccounts = this.filterTemplateAccountsByScope(
      context.templateAccounts,
      scope.activation_scope,
      scope.selected_module_codes,
    );

    const existingAccounts = await this.prisma.gLAccount.findMany({
      where: { company_id: companyId },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        is_active: true,
      },
      orderBy: { code: 'asc' },
    });

    const trackedLegacyAccountIds = Array.from(
      new Set(
        collisionResolutions
          .map((item) => item.existing_id)
          .filter((value): value is string => Boolean(value)),
      ),
    );
    const trackedLegacyAccounts = trackedLegacyAccountIds.length
      ? await this.prisma.gLAccount.findMany({
          where: {
            company_id: companyId,
            id: { in: trackedLegacyAccountIds },
          },
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            is_active: true,
          },
        })
      : [];
    const legacyRequests = trackedLegacyAccountIds.length
      ? await this.prisma.gLAccountChangeRequest.findMany({
          where: {
            company_id: companyId,
            account_id: { in: trackedLegacyAccountIds },
          },
          select: {
            account_id: true,
            request_type: true,
            status: true,
            title: true,
            created_at: true,
            reviewed_at: true,
            implemented_at: true,
          },
          orderBy: [{ implemented_at: 'desc' }, { reviewed_at: 'desc' }, { created_at: 'desc' }],
        })
      : [];

    const existingByCode = new Map(existingAccounts.map((account) => [account.code.toUpperCase(), account]));
    const trackedLegacyById = new Map(trackedLegacyAccounts.map((account) => [account.id, account]));
    const latestLegacyRequestByAccountId = new Map<string, (typeof legacyRequests)[number]>();
    for (const request of legacyRequests) {
      if (!request.account_id || latestLegacyRequestByAccountId.has(request.account_id)) {
        continue;
      }
      latestLegacyRequestByAccountId.set(request.account_id, request);
    }
    const rawCollisions = scopedAccounts
      .filter((account) => existingByCode.has(account.catalog_account.code.toUpperCase()))
      .map((account) => {
        const existing = existingByCode.get(account.catalog_account.code.toUpperCase());
        const normalizedCode = account.catalog_account.code.toUpperCase();
        const trackedResolution = collisionResolutionByCode.get(normalizedCode);
        const trackedLegacy = trackedResolution?.existing_id
          ? trackedLegacyById.get(trackedResolution.existing_id) || null
          : null;
        const latestLegacyRequest =
          trackedResolution?.existing_id
            ? latestLegacyRequestByAccountId.get(trackedResolution.existing_id) || null
            : null;
        const remediation = this.resolveLegacyRemediationStatus({
          templateCode: account.catalog_account.code,
          existingCollision: existing,
          trackedAccount: trackedLegacy,
          latestRequest: latestLegacyRequest,
        });
        return {
          code: account.catalog_account.code,
          template_name: account.catalog_account.name,
          template_account_type: this.inferCatalogAccountType(account.catalog_account),
          existing_name: existing?.name || null,
          existing_type: existing?.type || null,
          existing_id: trackedResolution?.existing_id || existing?.id || null,
          existing_active: existing?.is_active ?? null,
          resolution: collisionResolutionMap.get(normalizedCode) || null,
          remediation_status: remediation.status,
          remediation_note: remediation.note,
          latest_change_request: latestLegacyRequest
            ? {
                request_type: latestLegacyRequest.request_type,
                status: latestLegacyRequest.status,
                title: latestLegacyRequest.title,
              }
            : null,
        };
      });

    const resolvedCollisions = rawCollisions.filter(
      (collision) => collision.resolution === 'KEEP_EXISTING_SKIP_TEMPLATE',
    );
    const mergedCollisions = rawCollisions.filter(
      (collision) => collision.resolution === 'MERGE_INTO_EXISTING_PRESERVE_DATA',
    );
    const pendingTemplateAdoptions = rawCollisions.filter(
      (collision) => collision.resolution === 'ADOPT_TEMPLATE_REMEDIATE_LEGACY',
    );
    const unresolvedCollisions = rawCollisions.filter((collision) => !collision.resolution);
    const autoClearedAdoptions = collisionResolutions
      .filter((item) => item.resolution === 'ADOPT_TEMPLATE_REMEDIATE_LEGACY')
      .filter((item) => !existingByCode.has(item.code.toUpperCase()))
      .map((item) => {
        const trackedLegacy = item.existing_id ? trackedLegacyById.get(item.existing_id) || null : null;
        const latestLegacyRequest = item.existing_id
          ? latestLegacyRequestByAccountId.get(item.existing_id) || null
          : null;
        const matchingTemplate = scopedAccounts.find(
          (account) => account.catalog_account.code.toUpperCase() === item.code.toUpperCase(),
        );
        const remediation = this.resolveLegacyRemediationStatus({
          templateCode: item.code,
          existingCollision: null,
          trackedAccount: trackedLegacy,
          latestRequest: latestLegacyRequest,
        });

        return {
          code: item.code,
          template_name: matchingTemplate?.catalog_account.name || item.code,
          template_account_type: matchingTemplate ? this.inferCatalogAccountType(matchingTemplate.catalog_account) : null,
          existing_name: trackedLegacy?.name || null,
          existing_type: trackedLegacy?.type || null,
          existing_id: item.existing_id || null,
          existing_active: trackedLegacy?.is_active ?? null,
          resolution: item.resolution,
          remediation_status: remediation.status,
          remediation_note:
            remediation.status === 'recoded'
              ? remediation.note
              : 'Legacy adoption is now clear because the original collision no longer occupies this code.',
          latest_change_request: latestLegacyRequest
            ? {
                request_type: latestLegacyRequest.request_type,
                status: latestLegacyRequest.status,
                title: latestLegacyRequest.title,
              }
            : null,
        };
      });

    const toCreate = scopedAccounts
      .filter((account) => {
        const normalizedCode = account.catalog_account.code.toUpperCase();
        if (!existingByCode.has(normalizedCode)) {
          return true;
        }

        return false;
      })
      .map((account) => ({
        code: account.catalog_account.code,
        name: account.catalog_account.name,
        account_type: this.inferCatalogAccountType(account.catalog_account),
        jurisdiction: account.catalog_account.jurisdiction,
        module_dependency: account.module_dependency,
        is_core: account.catalog_account.is_core,
        is_regulatory: account.catalog_account.is_regulatory,
        is_optional: account.catalog_account.is_optional,
      }));

    const governanceWarnings = [
      ...recommendation.recommendation.warnings,
      ...(unresolvedCollisions.length > 0
        ? [
            `${unresolvedCollisions.length} template account code collision${
              unresolvedCollisions.length === 1 ? '' : 's'
            } detected against the current company chart.`,
          ]
        : []),
      ...(resolvedCollisions.length > 0
        ? [
            `${resolvedCollisions.length} legacy collision${
              resolvedCollisions.length === 1 ? '' : 's'
            } marked to keep the existing operational account and skip the queued template duplicate.`,
          ]
        : []),
      ...resolvedCollisions
        .filter((collision) => collision.existing_active === false)
        .map(
          (collision) =>
            `${collision.code} is being kept as a legacy account, but the existing operational account is inactive and should be reviewed before go-live.`,
        ),
      ...(mergedCollisions.length > 0
        ? [
            `${mergedCollisions.length} collision${
              mergedCollisions.length === 1 ? '' : 's'
            } marked to merge into the existing operational account while preserving legacy data and skipping the queued duplicate.`,
          ]
        : []),
      ...(pendingTemplateAdoptions.length > 0
        ? [
            `${pendingTemplateAdoptions.length} collision${
              pendingTemplateAdoptions.length === 1 ? '' : 's'
            } marked for template adoption still require legacy-account remediation before activation can continue.`,
          ]
        : []),
      ...(autoClearedAdoptions.length > 0
        ? [
            `${autoClearedAdoptions.length} pending template adoption${
              autoClearedAdoptions.length === 1 ? '' : 's'
            } cleared automatically because the legacy collision no longer occupies that code.`,
          ]
        : []),
      ...(context.profile.primary_jurisdiction === 'ZW' && !context.profile.functional_currency_justification
        ? ['Zimbabwe activation still needs functional currency justification before chart load.']
        : []),
    ];

    return {
      profile: recommendation.profile,
      recommendation: recommendation.recommendation,
      dry_run: {
        template_code: recommendation.recommendation.template_code,
        template_name: recommendation.recommendation.template_name,
        activation_scope: scope.activation_scope,
        selected_module_codes: scope.selected_module_codes,
        existing_company_accounts: existingAccounts.length,
        template_accounts_considered: scopedAccounts.length,
        accounts_to_create: toCreate.length,
        collisions: unresolvedCollisions.length + pendingTemplateAdoptions.length,
        resolved_collisions: resolvedCollisions.length + mergedCollisions.length,
        skipped_existing_accounts: resolvedCollisions.length + mergedCollisions.length,
        merged_collisions: mergedCollisions.length,
        pending_template_adoptions: pendingTemplateAdoptions.length,
        auto_cleared_adoptions: autoClearedAdoptions.length,
        governance_warnings: governanceWarnings,
        to_create_sample: toCreate.slice(0, 12),
        collisions_sample: unresolvedCollisions.slice(0, 12),
        resolved_collisions_sample: resolvedCollisions.slice(0, 12),
        merged_collisions_sample: mergedCollisions.slice(0, 12),
        pending_template_adoptions_sample: pendingTemplateAdoptions.slice(0, 12),
        auto_cleared_adoptions_sample: autoClearedAdoptions.slice(0, 12),
      },
    };
  }

  async activateAccountingTemplate(
    companyId: string,
    actorRoles?: string[] | null,
    actorUserId?: string | null,
    data?: Record<string, any> | null,
  ) {
    this.assertAccountingProfileAdminAccess(actorRoles);

    const preview = await this.previewAccountingTemplateActivation(companyId, data);
    if (preview.dry_run.collisions > 0) {
      throw new BadRequestException(
        'Template activation is blocked because account code collisions already exist in the company chart.',
      );
    }

    if (preview.dry_run.accounts_to_create === 0) {
      return {
        activated: false,
        message: 'No new accounts were created because the current company chart already covers this template.',
        created_count: 0,
      };
    }

    const context = await this.buildTemplateRecommendationContext(companyId, data);
    const scope = this.resolveActivationScope(data);
    const collisionResolutions = this.resolveCollisionResolutions(data);
    const collisionResolutionMap = new Map(
      collisionResolutions.map((item) => [item.code, item.resolution]),
    );
    const scopedAccounts = this.filterTemplateAccountsByScope(
      context.templateAccounts,
      scope.activation_scope,
      scope.selected_module_codes,
    );

    return this.prisma.$transaction(async (tx) => {
      const existingAccounts = await tx.gLAccount.findMany({
        where: { company_id: companyId },
        select: { id: true, code: true, level: true, full_path: true },
      });

      const accountIndex = new Map(
        existingAccounts.map((account) => [
          account.code.toUpperCase(),
          {
            id: account.id,
            level: account.level ?? 1,
            full_path: account.full_path ?? account.code,
          },
        ]),
      );

      const createdAccounts: Array<{ id: string; code: string; name: string; account_type: string }> = [];

      for (const templateAccount of scopedAccounts) {
        const code = templateAccount.catalog_account.code.toUpperCase();
        if (
          collisionResolutionMap.get(code) === 'KEEP_EXISTING_SKIP_TEMPLATE' ||
          collisionResolutionMap.get(code) === 'MERGE_INTO_EXISTING_PRESERVE_DATA'
        ) {
          continue;
        }
        if (accountIndex.has(code)) {
          continue;
        }

        const accountType = this.inferCatalogAccountType(templateAccount.catalog_account);
        const parentCode = this.getActivationParentCode(templateAccount.catalog_account.code);
        const parent = parentCode ? accountIndex.get(parentCode.toUpperCase()) : null;
        const level = parent ? parent.level + 1 : 1;
        const fullPath = parent ? `${parent.full_path} > ${templateAccount.catalog_account.code}` : templateAccount.catalog_account.code;

        const created = await tx.gLAccount.create({
          data: {
            company_id: companyId,
            code: templateAccount.catalog_account.code,
            name: templateAccount.catalog_account.name,
            description: templateAccount.catalog_account.description || templateAccount.inclusion_reason,
            type: accountType,
            category: accountType.charAt(0).toUpperCase() + accountType.slice(1),
            subtype: templateAccount.module_dependency || null,
            parent_id: parent?.id || null,
            is_header: templateAccount.catalog_account.code.endsWith('00'),
            is_contra: false,
            is_active: true,
            normal_balance: ['asset', 'expense'].includes(accountType) ? 'DR' : 'CR',
            sensitivity_tier: 'T3',
            fs_placement: this.getDefaultFsPlacementForAccountType(accountType),
            budget_enabled: false,
            tax_treatment: templateAccount.catalog_account.is_regulatory ? 'template_regulatory_default' : null,
            level,
            full_path: fullPath,
            created_by: actorUserId || null,
            modified_by: actorUserId || null,
          },
          select: {
            id: true,
            code: true,
            name: true,
            level: true,
            full_path: true,
          },
        });

        accountIndex.set(created.code.toUpperCase(), {
          id: created.id,
          level: created.level ?? 1,
          full_path: created.full_path ?? created.code,
        });
        createdAccounts.push({
          id: created.id,
          code: created.code,
          name: created.name,
          account_type: accountType,
        });

        await tx.gLAccountAuditTrail.create({
          data: {
            company_id: companyId,
            account_id: created.id,
            actor_user_id: actorUserId || null,
            action: 'template_activation',
            reason: `Activated from ${preview.recommendation.template_code}`,
            change_summary: `Account ${created.code} created during template activation.`,
            after_snapshot: {
              code: created.code,
              name: created.name,
              type: accountType,
              source_template: preview.recommendation.template_code,
            },
          },
        });
      }

      await tx.companyAccountingProfileAudit.create({
        data: {
          company_id: companyId,
          actor_user_id: actorUserId || null,
          action: 'template_activation',
          change_summary: `Activated ${preview.recommendation.template_code} (${scope.activation_scope}) and created ${createdAccounts.length} chart account${createdAccounts.length === 1 ? '' : 's'}.`,
          next_snapshot: {
            template_code: preview.recommendation.template_code,
            activation_scope: scope.activation_scope,
            selected_module_codes: scope.selected_module_codes,
            collision_resolutions: collisionResolutions,
            created_count: createdAccounts.length,
            created_codes: createdAccounts.map((account) => account.code),
          },
        },
      });

      return {
        activated: true,
        template_code: preview.recommendation.template_code,
        activation_scope: scope.activation_scope,
        created_count: createdAccounts.length,
        created_accounts: createdAccounts.slice(0, 20),
      };
    });
  }

  async listAccountingProfileAuditHistory(companyId: string) {
    await this.findOne(companyId);

    return this.prisma.companyAccountingProfileAudit.findMany({
      where: { company_id: companyId },
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
  }

  async updateSetupProgress(companyId: string, data: any) {
    return this.prisma.$transaction(async (tx) => {
      const existingSetup = await tx.companySetup.findUnique({
        where: { company_id: companyId },
      });

      const existingConfig =
        existingSetup?.steps_config && typeof existingSetup.steps_config === 'object'
          ? (existingSetup.steps_config as Record<string, unknown>)
          : {};
      const nextConfig =
        data.config && typeof data.config === 'object'
          ? { ...existingConfig, ...data.config }
          : existingConfig;

      const selectedDepartments = Array.isArray(nextConfig.selectedDepartments)
        ? nextConfig.selectedDepartments.filter((value): value is string => typeof value === 'string')
        : [];

      if (selectedDepartments.length > 0) {
        const existingDepartments = await tx.department.findMany({
          where: { company_id: companyId, status: 'active' },
          select: { template_key: true },
        });
        const existingKeys = new Set(
          existingDepartments
            .map((department) => department.template_key)
            .filter((key): key is string => Boolean(key)),
        );

        for (const key of selectedDepartments) {
          const template = standardDepartments.find((item) => item.template_key === key);
          if (!template || existingKeys.has(template.template_key)) {
            continue;
          }

          await tx.department.create({
            data: {
              company_id: companyId,
              template_key: template.template_key,
              name: template.name,
              description: template.description,
              icon: template.icon,
              color: template.color,
            },
          });
          existingKeys.add(template.template_key);
        }
      }

      const completedSteps = Array.isArray(existingSetup?.completed_steps)
        ? [...existingSetup.completed_steps]
        : [];
      if (!completedSteps.includes(data.step)) {
        completedSteps.push(data.step);
      }

      return tx.companySetup.upsert({
        where: { company_id: companyId },
        update: {
          current_step: data.step,
          steps_config: nextConfig,
          completed_steps: completedSteps.sort((a, b) => a - b),
          is_complete: data.isComplete ?? existingSetup?.is_complete ?? false,
        },
        create: {
          company_id: companyId,
          current_step: data.step,
          steps_config: nextConfig,
          completed_steps: [data.step],
          is_complete: data.isComplete ?? false,
        },
      });
    });
  }

  private buildAccountingProfileChangeSummary(
    previousProfile: Record<string, any> | null | undefined,
    nextProfile: Record<string, any>,
  ) {
    const labels: Record<string, string> = {
      primary_jurisdiction: 'Primary jurisdiction',
      operating_jurisdictions: 'Operating jurisdictions',
      reporting_framework: 'Reporting framework',
      functional_currency: 'Functional currency',
      presentation_currency: 'Presentation currency',
      functional_currency_justification: 'Functional currency justification',
      zw_ias29_applicable: 'IAS 29 applicability',
      zw_prior_ias29_application: 'Prior IAS 29 application',
      cross_border_operations: 'Cross-border operations',
      consolidates_subsidiaries: 'Consolidation posture',
      vat_registered: 'VAT registration',
      pfma_entity: 'PFMA / public entity flag',
      sdl_exempt: 'SDL exemption',
      annual_payroll_estimate: 'Annual payroll estimate',
    };

    const changedFields = Object.keys(nextProfile).filter((key) => {
      const previousValue = previousProfile?.[key] ?? null;
      const nextValue = nextProfile[key] ?? null;
      return JSON.stringify(previousValue) !== JSON.stringify(nextValue);
    });

    if (!changedFields.length) {
      return 'Accounting profile was resubmitted with no effective field changes.';
    }

    return `Updated ${changedFields.map((field) => labels[field] || field).join(', ')}.`;
  }

  async updateCompany(id: string, data: any, actorRoles?: string[] | null, actorUserId?: string | null) {
    const existingCompany = await this.findOne(id);

    if (Object.prototype.hasOwnProperty.call(data, 'accounting_profile')) {
      this.assertAccountingProfileAdminAccess(actorRoles);
    }

    const accountingProfilePayload = this.buildAccountingProfilePayload(
      data.accounting_profile as Record<string, any> | null | undefined,
    );

    return this.prisma.$transaction(async (tx) => {
      const updatedCompany = await tx.company.update({
        where: { id },
        data: {
          tagline: data.tagline,
          industry: data.industry,
          description: data.description,
          brand_colors: data.brand_colors,
          accounting_profile: accountingProfilePayload
            ? {
                upsert: {
                  update: accountingProfilePayload,
                  create: accountingProfilePayload,
                },
              }
            : undefined,
        },
        include: {
          accounting_profile: true,
          setup: true,
        },
      });

      if (accountingProfilePayload) {
        await tx.companyAccountingProfileAudit.create({
          data: {
            company_id: id,
            profile_id: updatedCompany.accounting_profile?.id || existingCompany.accounting_profile?.id || null,
            actor_user_id: actorUserId || null,
            action: existingCompany.accounting_profile ? 'updated' : 'created',
            change_summary: this.buildAccountingProfileChangeSummary(
              existingCompany.accounting_profile as unknown as Record<string, any> | null | undefined,
              accountingProfilePayload,
            ),
            previous_snapshot: existingCompany.accounting_profile ?? Prisma.JsonNull,
            next_snapshot: updatedCompany.accounting_profile ?? Prisma.JsonNull,
          },
        });
      }

      return updatedCompany;
    });
  }
}
