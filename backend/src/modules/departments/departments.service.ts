import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  ApplyDepartmentTemplatesDto,
  CreateDepartmentDto,
  UpdateDepartmentConfigDto,
} from './dto/department.dto';

const standardDepartmentCatalog = [
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

const WORKFLOW_ACTIVITY_COMPONENT = 'Core Workflow Definitions';
const WORKFLOW_ACTIVITY_OWNER = 'Department Lead';
const WORKFLOW_ACTIVITY_SUMMARY =
  'Sequenced workflow definitions configured for this department.';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  private normalizeTemplateKey(templateKey?: string | null) {
    if (!templateKey) return null;
    if (templateKey === 'administration') return 'adm';
    if (templateKey === 'sales') return 'sls';
    return templateKey;
  }

  private buildDepartmentPayload(
    companyId: string,
    idOrTemplateKey: string,
    data: UpdateDepartmentConfigDto,
  ) {
    const templateKey = this.normalizeTemplateKey(
      data.template_key || (idOrTemplateKey.includes('-') ? null : idOrTemplateKey),
    );

    return {
      templateKey,
      kpis: Array.isArray(data.kpis) ? data.kpis : [],
      payload: {
        mandate: data.mandate,
        core_responsibilities: data.core_responsibilities,
        deliverables: data.deliverables,
        roles: data.roles,
        operational_routines: data.operational_routines,
        data_pack: data.data_pack,
        activities: this.mergeWorkflowActivities(data.activities, data.workflows),
        communication_lines: data.communication_lines,
        budget_allocation: data.budget ? parseFloat(data.budget) : null,
        description: data.description,
        icon: data.icon,
        color: data.color,
        name: data.name,
        template_key: templateKey,
        company_id: companyId,
      },
    };
  }

  private mergeWorkflowActivities(
    activities: UpdateDepartmentConfigDto['activities'],
    workflows: string[] | undefined,
  ) {
    const baseActivities = Array.isArray(activities)
      ? activities.filter(
          (item) => item?.component !== WORKFLOW_ACTIVITY_COMPONENT,
        )
      : [];
    const workflowSteps = Array.isArray(workflows)
      ? workflows
          .map((workflow) => (typeof workflow === 'string' ? workflow.trim() : ''))
          .filter(Boolean)
      : [];

    if (workflowSteps.length === 0) {
      return baseActivities;
    }

    return [
      ...baseActivities,
      {
        component: WORKFLOW_ACTIVITY_COMPONENT,
        owner: WORKFLOW_ACTIVITY_OWNER,
        summary: WORKFLOW_ACTIVITY_SUMMARY,
        sections: workflowSteps,
      },
    ];
  }

  private mapKpiCreatePayload(
    companyId: string,
    departmentId: string,
    kpis: NonNullable<UpdateDepartmentConfigDto['kpis']>,
  ) {
    return kpis
      .filter((item) => item?.name?.trim())
      .map((item, index) => ({
        company_id: companyId,
        department_id: departmentId,
        name: item.name!.trim(),
        unit: item.unit?.trim() || 'count',
        target: item.target && item.target.trim() !== '' ? new Prisma.Decimal(item.target.trim()) : null,
        status: 'on-track',
        frequency: 'monthly',
        kpi_code: `${departmentId}-${String(index + 1).padStart(2, '0')}`,
      }));
  }

  private async syncDepartmentKpis(
    tx: Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
    companyId: string,
    departmentId: string,
    kpis: NonNullable<UpdateDepartmentConfigDto['kpis']>,
  ) {
    await tx.kPI.deleteMany({
      where: {
        company_id: companyId,
        department_id: departmentId,
      },
    });

    const kpiPayload = this.mapKpiCreatePayload(companyId, departmentId, kpis);
    if (kpiPayload.length === 0) {
      return;
    }

    await tx.kPI.createMany({
      data: kpiPayload,
    });
  }

  private async findDepartmentForUpdate(idOrTemplateKey: string, companyId: string, templateKey?: string | null) {
    if (idOrTemplateKey.includes('-')) {
      return this.prisma.department.findFirst({
        where: {
          id: idOrTemplateKey,
          company_id: companyId,
        },
      });
    }

    if (!templateKey) {
      return null;
    }

    return this.prisma.department.findFirst({
      where: {
        company_id: companyId,
        template_key: templateKey,
        status: 'active',
      },
    });
  }

  private isSchemaDriftError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2021' || error.code === 'P2022')
    );
  }

  async create(companyId: string, data: CreateDepartmentDto) {
    return this.prisma.department.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.department.findMany({
      where: { company_id: companyId, status: 'active' },
      include: { _count: { select: { members: true, tasks: true } } },
    });
  }

  async findOne(id: string, companyId: string) {
    let dept = null;

    try {
      dept = await this.prisma.department.findFirst({
        where: { id, company_id: companyId },
        include: { kpis: true },
      });
    } catch (error) {
      if (!this.isSchemaDriftError(error)) {
        throw error;
      }

      dept = await this.prisma.department.findFirst({
        where: { id, company_id: companyId },
      });

      if (dept) {
        dept = {
          ...dept,
          kpis: [],
        };
      }
    }

    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async findByTemplateKey(companyId: string, templateKey: string) {
    return this.prisma.department.findFirst({
      where: {
        company_id: companyId,
        template_key: templateKey,
        status: 'active',
      },
      include: {
        kpis: true,
      },
    });
  }

  async bootstrapStandard(companyId: string) {
    const existingDepartments = await this.prisma.department.findMany({
      where: {
        company_id: companyId,
        status: 'active',
      },
      select: {
        id: true,
        template_key: true,
      },
    });

    const existingTemplateKeys = new Set(
      existingDepartments
        .map((department) => {
          if (department.template_key === 'administration') return 'adm';
          if (department.template_key === 'sales') return 'sls';
          return department.template_key;
        })
        .filter((templateKey): templateKey is string => Boolean(templateKey)),
    );

    for (const template of standardDepartmentCatalog) {
      if (existingTemplateKeys.has(template.template_key)) {
        continue;
      }

      await this.prisma.department.create({
        data: {
          company_id: companyId,
          template_key: template.template_key,
          name: template.name,
          description: template.description,
          icon: template.icon,
          color: template.color,
        },
      });
    }

    return this.findAll(companyId);
  }

  async applyTemplates(companyId: string, data: ApplyDepartmentTemplatesDto) {
    await this.prisma.$transaction(async (tx) => {
      for (const department of data.departments) {
        const { templateKey, payload, kpis } = this.buildDepartmentPayload(companyId, department.template_key, {
          ...department.config,
          template_key: department.template_key,
        });

        const existingDepartment = await tx.department.findFirst({
          where: {
            company_id: companyId,
            template_key: templateKey,
          },
        });

        if (existingDepartment) {
          const updatedDepartment = await tx.department.update({
            where: { id: existingDepartment.id },
            data: payload,
          });
          await this.syncDepartmentKpis(tx, companyId, updatedDepartment.id, kpis);
          continue;
        }

        const createdDepartment = await tx.department.create({
          data: {
            ...payload,
            name: payload.name || 'New Department',
          },
        });
        await this.syncDepartmentKpis(tx, companyId, createdDepartment.id, kpis);
      }
    });

    return this.findAll(companyId);
  }

  async updateConfig(id: string, companyId: string, data: UpdateDepartmentConfigDto) {
    const { templateKey, payload, kpis } = this.buildDepartmentPayload(companyId, id, data);
    const dept = await this.findDepartmentForUpdate(id, companyId, templateKey);

    return this.prisma.$transaction(async (tx) => {
      const savedDepartment = dept
        ? await tx.department.update({
            where: { id: dept.id },
            data: payload,
          })
        : await tx.department.create({
            data: {
              ...payload,
              name: payload.name || 'New Department',
            },
          });

      await this.syncDepartmentKpis(tx, companyId, savedDepartment.id, kpis);

      return tx.department.findFirst({
        where: {
          id: savedDepartment.id,
          company_id: companyId,
        },
        include: {
          kpis: true,
        },
      });
    });
  }
}
