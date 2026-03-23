import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export class CreateApprovalPolicyDto {
  product_category: string;
  auto_approve_limit: number;
  l1_threshold: number;
  l2_threshold: number;
}

@Injectable()
export class ApprovalPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.approvalPolicy.findMany({
      where: { company_id: companyId },
      orderBy: { product_category: 'asc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const policy = await this.prisma.approvalPolicy.findUnique({
      where: { id, company_id: companyId },
    });
    if (!policy) {
      throw new NotFoundException(`ApprovalPolicy with ID ${id} not found`);
    }
    return policy;
  }

  async create(companyId: string, data: CreateApprovalPolicyDto) {
    return this.prisma.approvalPolicy.create({
      data: {
        company_id: companyId,
        product_category: data.product_category,
        auto_approve_limit: data.auto_approve_limit,
        l1_threshold: data.l1_threshold,
        l2_threshold: data.l2_threshold,
      },
    });
  }

  async update(companyId: string, id: string, data: Partial<CreateApprovalPolicyDto>) {
    await this.findOne(companyId, id); // Ensure it exists
    return this.prisma.approvalPolicy.update({
      where: { id },
      data,
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.approvalPolicy.delete({
      where: { id },
    });
  }
}
