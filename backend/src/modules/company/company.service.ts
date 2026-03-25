import { Injectable, NotFoundException } from '@nestjs/common';
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

    return this.prisma.company.update({
      where: { id },
      data: {
        tagline: data.tagline,
        industry: data.industry,
        description: data.description,
        brand_colors: data.brand_colors,
      },
    });
  }
}
