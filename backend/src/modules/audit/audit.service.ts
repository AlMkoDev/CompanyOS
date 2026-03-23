import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    companyId: string;
    userId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.activityLog.create({
      data: {
        company_id: data.companyId,
        user_id: data.userId,
        action: data.action,
        resource_type: data.resourceType,
        resource_id: data.resourceId,
        details: data.details,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
      },
    });
  }

  async findAll(companyId: string, filter?: any) {
    return this.prisma.activityLog.findMany({
      where: { company_id: companyId, ...filter },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
  }
}
