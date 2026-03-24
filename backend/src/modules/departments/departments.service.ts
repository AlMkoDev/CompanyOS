import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentConfigDto } from './dto/department.dto';

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

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

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

  async updateConfig(id: string, companyId: string, data: UpdateDepartmentConfigDto) {
    const templateKey = data.template_key || (id.includes('-') ? null : id);

    // Find existing department
    let dept = null;
    if (id.includes('-')) {
      dept = await this.prisma.department.findFirst({
        where: {
          id,
          company_id: companyId,
        },
      });
    } else if (templateKey) {
      dept = await this.prisma.department.findFirst({
        where: {
          company_id: companyId,
          template_key: templateKey,
          status: 'active',
        },
      });
    }

    const payload = {
      mandate: data.mandate,
      core_responsibilities: data.core_responsibilities,
      deliverables: data.deliverables,
      roles: data.roles,
      operational_routines: data.operational_routines,
      data_pack: data.data_pack,
      activities: data.activities,
      communication_lines: data.communication_lines,
      budget_allocation: data.budget ? parseFloat(data.budget) : null,
      description: data.description,
      icon: data.icon,
      color: data.color,
      name: data.name || (dept ? undefined : 'New Department'),
      template_key: templateKey,
      company_id: companyId,
    };

    if (dept) {
      return this.prisma.department.update({
        where: { id: dept.id },
        data: payload,
      });
    } else {
      return this.prisma.department.create({
        data: payload,
      });
    }
  }
}
