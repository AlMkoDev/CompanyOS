import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: {
    project: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    projectTask: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    rAIDItem: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    projectBudget: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      project: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      projectTask: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      rAIDItem: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      projectBudget: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects nested task access outside the caller company', async () => {
    prisma.projectTask.findFirst.mockResolvedValue(null);

    await expect(service.updateTask('company-1', 'task-1', { status: 'done' })).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.deleteTask('company-1', 'task-1')).rejects.toThrow(NotFoundException);
  });

  it('rejects nested RAID access outside the caller company', async () => {
    prisma.rAIDItem.findFirst.mockResolvedValue(null);

    await expect(
      service.updateRaidItem('company-1', 'raid-1', { status: 'CLOSED' }),
    ).rejects.toThrow(NotFoundException);
    await expect(service.deleteRaidItem('company-1', 'raid-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects project-bound nested operations outside the caller company', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(service.createTask('company-1', 'proj-1', { title: 'Task' })).rejects.toThrow(
      NotFoundException,
    );
    await expect(
      service.getTasksByStatus('company-1', 'proj-1', 'done'),
    ).rejects.toThrow(NotFoundException);
    await expect(
      service.createRaidItem('company-1', 'proj-1', { title: 'Risk', type: 'RISK' } as any),
    ).rejects.toThrow(NotFoundException);
    await expect(service.getRaidSummary('company-1', 'proj-1')).rejects.toThrow(
      NotFoundException,
    );
    await expect(
      service.createOrUpdateBudget('company-1', 'proj-1', {
        total_allocated: 1000,
        actual_spent: 100,
      } as any),
    ).rejects.toThrow(NotFoundException);
    await expect(service.getBudgetStatus('company-1', 'proj-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
