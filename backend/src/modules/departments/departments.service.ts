import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentConfigDto } from './dto/department.dto';

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
