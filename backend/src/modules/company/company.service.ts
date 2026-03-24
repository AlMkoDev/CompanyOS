import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

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
    return this.prisma.companySetup.upsert({
      where: { company_id: companyId },
      update: {
        current_step: data.step,
        steps_config: data.config,
        is_complete: data.isComplete ?? false,
      },
      create: {
        company_id: companyId,
        current_step: data.step,
        steps_config: data.config,
        is_complete: data.isComplete ?? false,
      },
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
