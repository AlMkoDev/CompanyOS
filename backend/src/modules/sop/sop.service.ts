import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSopDto, UpdateSopDto } from './dto/sop.dto';

@Injectable()
export class SopService {
  constructor(private prisma: PrismaService) {}

  private async getCompanySop(companyId: string, id: string) {
    const sop = await this.prisma.sOP.findFirst({
      where: { id, company_id: companyId },
      include: { department: true },
    });
    if (!sop) throw new NotFoundException('SOP not found');
    return sop;
  }

  async findAll(companyId: string, departmentId?: string) {
    return this.prisma.sOP.findMany({
      where: {
        company_id: companyId,
        ...(departmentId && { department_id: departmentId }),
      },
      include: {
        department: true,
      },
      orderBy: { title: 'asc' },
    });
  }

  async findOne(companyId: string, id: string) {
    return this.getCompanySop(companyId, id);
  }

  async create(data: CreateSopDto & { company_id: string }) {
    return this.prisma.sOP.create({
      data: {
        company_id: data.company_id,
        department_id: data.department_id,
        title: data.title,
        purpose: data.purpose,
        scope: data.scope,
        trigger: data.trigger,
        raci: data.raci,
        procedure: data.procedure,
        approval_matrix: data.approval_matrix,
        output_standard: data.output_standard,
        systems_used: data.systems_used,
        exceptions: data.exceptions,
        related_documents: data.related_documents,
        status: data.status || 'draft',
        version: data.version || 1,
      },
    });
  }

  async update(companyId: string, id: string, data: UpdateSopDto) {
    await this.getCompanySop(companyId, id);

    return this.prisma.sOP.update({
      where: { id },
      data,
    });
  }

  async remove(companyId: string, id: string) {
    await this.getCompanySop(companyId, id);

    return this.prisma.sOP.delete({
      where: { id },
    });
  }
}
