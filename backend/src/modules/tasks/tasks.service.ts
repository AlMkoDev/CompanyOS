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

  private isPrismaKnownRequestError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code?: unknown }).code === 'string'
    );
  }

  private isSchemaDriftError(error: unknown) {
    const prismaError = error as { code?: string };
    return (
      this.isPrismaKnownRequestError(error) &&
      (prismaError.code === 'P2021' || prismaError.code === 'P2022')
    );
  }

  private isMissingTaskTaskCodeColumn(error: unknown) {
    const prismaError = error as { code?: string; meta?: { column?: unknown } };
    return (
      this.isPrismaKnownRequestError(error) &&
      prismaError.code === 'P2022' &&
      typeof prismaError.meta?.column === 'string' &&
      prismaError.meta.column === 'Task.task_code'
    );
  }

  private async resolveTaskAssigneeId(companyId: string, assigneeId?: string) {
    if (!assigneeId) {
      return null;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: assigneeId },
      select: { id: true, company_id: true },
    });

    if (!user || user.company_id !== companyId) {
      return null;
    }

    return user.id;
  }

  private async createTaskWithLegacySchema(
    companyId: string,
    userId: string,
    data: CreateTaskDto,
    assigneeId: string | null,
  ) {
    const dueDate = data.due_date ? new Date(data.due_date) : null;
    const attachments = JSON.stringify(this.normalizeTaskMetadata(data));

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
        "id",
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
        gen_random_uuid(),
        ${companyId}::uuid,
        ${data.department_id}::uuid,
        ${data.title},
        ${data.description ?? null},
        ${data.status ?? 'open'},
        ${data.priority ?? 'medium'},
        ${userId}::uuid,
        ${assigneeId ?? null}::uuid,
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

  private async appendTaskCommentWithLegacySchema(
    companyId: string,
    id: string,
    comment: string,
  ) {
    const rows = await this.prisma.$queryRaw<Array<{ id: string; attachments: unknown }>>`
      UPDATE "Task"
      SET
        "attachments" = COALESCE("attachments", '[]'::jsonb) || ${JSON.stringify([
          `comment:${comment}`,
        ])}::jsonb,
        "updated_at" = NOW()
      WHERE "id" = ${id}::uuid
        AND "company_id" = ${companyId}::uuid
      RETURNING
        id,
        attachments;
    `;

    const task = rows[0];
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private async updateTaskStatusWithLegacySchema(companyId: string, id: string, status: string) {
    const rows = await this.prisma.$queryRaw<Array<{ id: string; status: string }>>`
      UPDATE "Task"
      SET
        "status" = ${status},
        "updated_at" = NOW()
      WHERE "id" = ${id}::uuid
        AND "company_id" = ${companyId}::uuid
      RETURNING
        id,
        status;
    `;

    const task = rows[0];
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private normalizeTaskMetadata(data: CreateTaskDto) {
    const attachments = Array.isArray(data.attachments) ? data.attachments.filter((item) => typeof item === 'string' && item.trim()) : [];
    const dependencies = Array.isArray(data.dependencies)
      ? data.dependencies
          .filter((item) => typeof item === 'string' && item.trim())
          .map((item) => `dependency:${item.trim()}`)
      : [];
    const comment = data.comment?.trim() ? [`comment:${data.comment.trim()}`] : [];

    return [...attachments, ...dependencies, ...comment];
  }

  private async loadTaskWithRelations(id: string) {
    return this.prisma.task.findUnique({
      where: { id },
      include: { assignee: true, creator: true },
    });
  }

  private async loadTaskWithRelationsFallback<T extends { id: string }>(task: T) {
    try {
      const enriched = await this.loadTaskWithRelations(task.id);
      return enriched || task;
    } catch (error) {
      return task;
    }
  }

  private async getCompanyTask(companyId: string, id: string) {
    try {
      const task = await this.prisma.task.findFirst({
        where: { id, company_id: companyId },
      });
      if (!task) throw new NotFoundException('Task not found');
      return task;
    } catch (error) {
      if (!this.isSchemaDriftError(error)) {
        throw error;
      }

      return this.getCompanyTaskWithLegacySchema(companyId, id);
    }
  }

  private async getCompanyTaskWithLegacySchema(companyId: string, id: string) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        company_id: string;
        attachments: unknown;
      }>
    >`
      SELECT
        "id",
        "company_id",
        "attachments"
      FROM "Task"
      WHERE "id" = ${id}::uuid
        AND "company_id" = ${companyId}::uuid
      LIMIT 1;
    `;

    const task = rows[0];
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async create(companyId: string, userId: string, data: CreateTaskDto) {
    let task;
    const attachments = this.normalizeTaskMetadata(data);
    const assigneeId = await this.resolveTaskAssigneeId(companyId, data.assignee_id);

    try {
      task = await this.prisma.task.create({
        data: {
          title: data.title,
          description: data.description,
          department_id: data.department_id,
          assignee_id: assigneeId ?? undefined,
          attachments: attachments.length ? attachments : undefined,
          status: data.status ?? 'open',
          company_id: companyId,
          creator_id: userId,
          due_date: data.due_date ? new Date(data.due_date) : undefined,
          priority: data.priority ?? 'medium',
        },
      });
    } catch (error) {
      if (!this.isMissingTaskTaskCodeColumn(error)) {
        throw error;
      }

      task = await this.createTaskWithLegacySchema(companyId, userId, data, assigneeId);
    }

    await this.audit.log({
      companyId,
      userId,
      action: 'CREATED_TASK',
      resourceType: 'TASK',
      resourceId: task.id,
      details: { title: task.title },
    });

    return this.loadTaskWithRelationsFallback(task);
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

    let task;

    try {
      task = await this.prisma.task.update({
        where: { id },
        data: { status },
      });
    } catch (error) {
      task = await this.updateTaskStatusWithLegacySchema(companyId, id, status);
    }

    await this.audit.log({
      companyId,
      userId,
      action: `UPDATED_TASK_STATUS_${status.toUpperCase()}`,
      resourceType: 'TASK',
      resourceId: task.id,
    });

    return this.loadTaskWithRelationsFallback(task);
  }

  async addComment(companyId: string, userId: string, id: string, comment: string) {
    const cleanedComment = comment.trim();
    if (!cleanedComment) {
      throw new Error('Comment cannot be empty.');
    }

    const currentTask = await this.getCompanyTask(companyId, id);
    const currentAttachments = Array.isArray(currentTask.attachments) ? currentTask.attachments : [];

    let task;

    try {
      task = await this.prisma.task.update({
        where: { id },
        data: {
          attachments: [...currentAttachments, `comment:${cleanedComment}`],
        },
      });
    } catch (error) {
      task = await this.appendTaskCommentWithLegacySchema(companyId, id, cleanedComment);
    }

    await this.audit.log({
      companyId,
      userId,
      action: 'ADDED_TASK_COMMENT',
      resourceType: 'TASK',
      resourceId: task.id,
    });

    return this.loadTaskWithRelationsFallback(task);
  }
}
