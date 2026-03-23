import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateKpiDto, UpdateKpiDto } from './dto/kpi.dto';

@Injectable()
export class KpiService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyKpi(companyId: string, id: string) {
    const kpi = await this.prisma.kPI.findFirst({
      where: { id, company_id: companyId },
      include: { department: true },
    });
    if (!kpi) throw new NotFoundException('KPI not found');
    return kpi;
  }

  async findAll(companyId: string, departmentId?: string) {
    return this.prisma.kPI.findMany({
      where: {
        company_id: companyId,
        ...(departmentId && { department_id: departmentId }),
      },
      include: {
        department: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(companyId: string, id: string) {
    return this.getCompanyKpi(companyId, id);
  }

  async create(data: CreateKpiDto & { company_id: string }) {
    return this.prisma.kPI.create({
      data: {
        company_id: data.company_id,
        department_id: data.department_id,
        name: data.name,
        description: data.description,
        formula: data.formula,
        data_source: data.data_source,
        owner_role: data.owner_role,
        frequency: data.frequency || 'monthly',
        unit: data.unit,
        target: data.target,
        current_value: data.current_value,
        status: data.status || 'on-track',
      },
    });
  }

  async update(companyId: string, id: string, data: UpdateKpiDto) {
    await this.getCompanyKpi(companyId, id);

    return this.prisma.kPI.update({
      where: { id },
      data,
    });
  }

  async remove(companyId: string, id: string) {
    await this.getCompanyKpi(companyId, id);

    return this.prisma.kPI.delete({
      where: { id },
    });
  }
}
