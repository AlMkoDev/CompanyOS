import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTaskDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private isSchemaDriftError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2021' || error.code === 'P2022')
    );
  }

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
        status: data.status ?? 'open',
        company_id: companyId,
        creator_id: userId,
        due_date: data.due_date ? new Date(data.due_date) : undefined,
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
    try {
      return await this.prisma.task.findMany({
        where: {
          company_id: companyId,
          ...(departmentId && { department_id: departmentId }),
        },
        include: { assignee: true, creator: true },
        orderBy: { created_at: 'desc' },
      });
    } catch (error) {
      if (!this.isSchemaDriftError(error)) {
        throw error;
      }

      return this.prisma.task.findMany({
        where: {
          company_id: companyId,
          ...(departmentId && { department_id: departmentId }),
        },
        select: {
          id: true,
          title: true,
          department_id: true,
          status: true,
          priority: true,
        },
        orderBy: { created_at: 'desc' },
      });
    }
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
