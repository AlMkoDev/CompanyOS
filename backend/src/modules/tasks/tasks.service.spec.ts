import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;
  const prisma: any = {
    task: {
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
});
