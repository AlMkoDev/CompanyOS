import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;
  const prisma: any = {
    $queryRaw: jest.fn(),
    task: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const audit = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: AuditService,
          useValue: audit,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('rejects status updates for another company task', async () => {
    prisma.task.findFirst.mockResolvedValue(null);

    await expect(service.updateStatus('company-1', 'user-1', 'task-1', 'done')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('creates tasks with default open status and normalized due date', async () => {
    const dueDate = '2026-03-31T00:00:00.000Z';
    prisma.task.create.mockResolvedValue({
      id: 'task-1',
      title: 'Follow up',
      status: 'open',
      due_date: new Date(dueDate),
    });

    const result = await service.create('company-1', 'user-1', {
      title: 'Follow up',
      department_id: 'dept-1',
      due_date: dueDate,
      priority: 'medium',
    } as any);

    expect(prisma.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        company_id: 'company-1',
        creator_id: 'user-1',
        title: 'Follow up',
        status: 'open',
        due_date: new Date(dueDate),
      }),
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        userId: 'user-1',
        action: 'CREATED_TASK',
        resourceId: 'task-1',
      }),
    );
    expect(result.status).toBe('open');
  });

  it('persists task attachments when provided', async () => {
    prisma.task.create.mockResolvedValue({
      id: 'task-2',
      title: 'Upload policy',
      status: 'open',
      attachments: ['https://example.com/policy.pdf'],
    });

    await service.create('company-1', 'user-1', {
      title: 'Upload policy',
      department_id: 'dept-1',
      priority: 'medium',
      attachments: ['https://example.com/policy.pdf'],
    } as any);

    expect(prisma.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        company_id: 'company-1',
        creator_id: 'user-1',
        title: 'Upload policy',
        status: 'open',
        attachments: ['https://example.com/policy.pdf'],
      }),
    });
  });

  it('persists dependency and comment metadata in task attachments', async () => {
    prisma.task.create.mockResolvedValue({
      id: 'task-3',
      title: 'Review launch plan',
      status: 'open',
      attachments: ['https://example.com/brief.pdf', 'dependency:Legal review', 'comment:Initial note'],
    });

    await service.create('company-1', 'user-1', {
      title: 'Review launch plan',
      department_id: 'dept-1',
      priority: 'medium',
      attachments: ['https://example.com/brief.pdf'],
      dependencies: ['Legal review'],
      comment: 'Initial note',
    } as any);

    expect(prisma.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        attachments: ['https://example.com/brief.pdf', 'dependency:Legal review', 'comment:Initial note'],
      }),
    });
  });

  it('falls back to a legacy-safe insert when task_code is missing from the database', async () => {
    prisma.task.create.mockRejectedValue(
      Object.assign(new Error('missing task_code'), {
        code: 'P2022',
        meta: { column: 'Task.task_code' },
        name: 'PrismaClientKnownRequestError',
      }),
    );
    prisma.$queryRaw.mockResolvedValue([
      {
        id: 'task-legacy',
        title: 'Legacy task',
        description: 'Created through fallback',
        status: 'open',
        priority: 'medium',
        department_id: 'dept-1',
        created_at: new Date('2026-03-26T00:00:00.000Z'),
        due_date: null,
        attachments: null,
      },
    ]);

    const result = await service.create('company-1', 'user-1', {
      title: 'Legacy task',
      department_id: 'dept-1',
      priority: 'medium',
    } as any);

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result.id).toBe('task-legacy');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        userId: 'user-1',
        action: 'CREATED_TASK',
        resourceId: 'task-legacy',
      }),
    );
  });

  it('audits scoped task status updates', async () => {
    prisma.task.findFirst.mockResolvedValue({ id: 'task-1', company_id: 'company-1' });
    prisma.task.update.mockResolvedValue({ id: 'task-1', status: 'blocked' });

    const result = await service.updateStatus('company-1', 'user-9', 'task-1', 'blocked');

    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { status: 'blocked' },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        userId: 'user-9',
        action: 'UPDATED_TASK_STATUS_BLOCKED',
        resourceId: 'task-1',
      }),
    );
    expect(result.status).toBe('blocked');
  });

  it('falls back to a legacy-safe status update when task_code is missing from the database', async () => {
    prisma.task.findFirst.mockResolvedValue({ id: 'task-legacy', company_id: 'company-1' });
    prisma.task.update.mockRejectedValue(
      Object.assign(new Error('missing task_code'), {
        code: 'P2022',
        meta: { column: 'Task.task_code' },
        name: 'PrismaClientKnownRequestError',
      }),
    );
    prisma.$queryRaw.mockResolvedValue([
      {
        id: 'task-legacy',
        status: 'done',
      },
    ]);

    const result = await service.updateStatus('company-1', 'user-9', 'task-legacy', 'done');

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result.status).toBe('done');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        userId: 'user-9',
        action: 'UPDATED_TASK_STATUS_DONE',
        resourceId: 'task-legacy',
      }),
    );
  });

  it('appends comments to task attachments metadata', async () => {
    prisma.task.findFirst.mockResolvedValue({
      id: 'task-1',
      company_id: 'company-1',
      attachments: ['https://example.com/brief.pdf'],
    });
    prisma.task.update.mockResolvedValue({
      id: 'task-1',
      attachments: ['https://example.com/brief.pdf', 'comment:Followed up with legal'],
    });

    const result = await service.addComment('company-1', 'user-9', 'task-1', 'Followed up with legal');

    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: {
        attachments: ['https://example.com/brief.pdf', 'comment:Followed up with legal'],
      },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        userId: 'user-9',
        action: 'ADDED_TASK_COMMENT',
        resourceId: 'task-1',
      }),
    );
    expect(result.attachments).toEqual(['https://example.com/brief.pdf', 'comment:Followed up with legal']);
  });
});
