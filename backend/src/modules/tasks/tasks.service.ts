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

  private isMissingTaskTaskCodeColumn(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2022' &&
      typeof error.meta?.column === 'string' &&
      error.meta.column === 'Task.task_code'
    );
  }

  private async createTaskWithLegacySchema(companyId: string, userId: string, data: CreateTaskDto) {
    const dueDate = data.due_date ? new Date(data.due_date) : null;
    const attachments = data.attachments?.length ? JSON.stringify(data.attachments) : null;

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        title: string;
        description: string | null;
        status: string;
        priority: string;
        department_id: string;
        created_at: Date;
        due_date: Date | null;
        attachments: unknown;
      }>
    >`
      INSERT INTO "Task" (
        "company_id",
        "department_id",
        "title",
        "description",
        "status",
        "priority",
        "creator_id",
        "assignee_id",
        "due_date",
        "attachments",
        "created_at",
        "updated_at"
      )
      VALUES (
        ${companyId}::uuid,
        ${data.department_id}::uuid,
        ${data.title},
        ${data.description ?? null},
        ${data.status ?? 'open'},
        ${data.priority ?? 'medium'},
        ${userId}::uuid,
        ${data.assignee_id ?? null}::uuid,
        ${dueDate},
        ${attachments}::jsonb,
        NOW(),
        NOW()
      )
      RETURNING
        id,
        title,
        description,
        status,
        priority,
        department_id,
        created_at,
        due_date,
        attachments;
    `;

    const task = rows[0];
    if (!task) {
      throw new Error('Failed to create task.');
    }

    return task;
  }

  private async getCompanyTask(companyId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, company_id: companyId },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async create(companyId: string, userId: string, data: CreateTaskDto) {
    let task;

    try {
      task = await this.prisma.task.create({
        data: {
          ...data,
          status: data.status ?? 'open',
          company_id: companyId,
          creator_id: userId,
          due_date: data.due_date ? new Date(data.due_date) : undefined,
          attachments: data.attachments?.length ? data.attachments : undefined,
        },
      });
    } catch (error) {
      if (!this.isMissingTaskTaskCodeColumn(error)) {
        throw error;
      }

      task = await this.createTaskWithLegacySchema(companyId, userId, data);
    }

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
          due_date: true,
          attachments: true,
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
