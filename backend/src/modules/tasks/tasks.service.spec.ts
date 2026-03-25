import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;
  const prisma: any = {
    task: {
      create: jest.fn(),
      findFirst: jest.fn(),
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
});
