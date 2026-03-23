import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTaskDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private async getCompanyTask(companyId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, company_id: companyId },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async create(companyId: string, userId: string, data: CreateTaskDto) {
    const task = await this.prisma.task.create({
      data: {
        ...data,
        company_id: companyId,
        creator_id: userId,
      },
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'CREATED_TASK',
      resourceType: 'TASK',
      resourceId: task.id,
      details: { title: task.title },
    });

    return task;
  }

  async findAll(companyId: string, departmentId?: string) {
    return this.prisma.task.findMany({
      where: {
        company_id: companyId,
        ...(departmentId && { department_id: departmentId }),
      },
      include: { assignee: true, creator: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async updateStatus(
    companyId: string,
    userId: string,
    id: string,
    status: string,
  ) {
    await this.getCompanyTask(companyId, id);

    const task = await this.prisma.task.update({
      where: { id },
      data: { status },
    });

    await this.audit.log({
      companyId,
      userId,
      action: `UPDATED_TASK_STATUS_${status.toUpperCase()}`,
      resourceType: 'TASK',
      resourceId: task.id,
    });

    return task;
  }
}
