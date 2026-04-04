import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
  private readonly supportedFrameworksByJurisdiction: Record<string, string[]> = {
    ZA: ['IFRS_FULL', 'IFRS_SME', 'SA_GAAP_LEGACY'],
    ZW: ['ZW_IFRS_FULL', 'ZW_IFRS29'],
  };
  private readonly supportedCurrenciesByJurisdiction: Record<string, string[]> = {
    ZA: ['ZAR', 'USD', 'EUR', 'GBP'],
    ZW: ['ZIG', 'USD', 'ZAR', 'GBP'],
  };

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

  async updateCompany(id: string, data: any) {
    await this.findOne(id);

    const accountingProfilePayload = this.buildAccountingProfilePayload(
      data.accounting_profile as Record<string, any> | null | undefined,
    );

    return this.prisma.company.update({
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
  }
}
