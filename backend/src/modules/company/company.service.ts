import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const company = await this.prisma.company.findFirst({
      where: { id },
      include: { 
        setup: true,
        gap_statuses: true,
        departments: {
          include: {
            gap_statuses: true,
            kpis: true
          }
        }
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async updateSetupProgress(companyId: string, data: any) {
    return this.prisma.companySetup.update({
      where: { company_id: companyId },
      data: {
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
