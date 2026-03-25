import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OnboardingService } from './onboarding.service';

describe('OnboardingService', () => {
  let service: OnboardingService;

  const audit = {
    log: jest.fn(),
  };

  const prisma: any = {
    employee: {
      findFirst: jest.fn(),
    },
    department: {
      findFirst: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    onboardingPlan: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    onboardingTask: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    milestone: {
      createMany: jest.fn(),
    },
    task: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    offboardingPlan: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    exitInterview: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    audit.log.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
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

    service = module.get<OnboardingService>(OnboardingService);
  });

  it('rejects onboarding plan lookup for another company employee', async () => {
    prisma.onboardingPlan.findFirst.mockResolvedValue(null);

    await expect(service.getPlanDetail('company-1', 'employee-1')).rejects.toThrow(NotFoundException);
  });

  it('rejects task status updates for another company task', async () => {
    prisma.onboardingTask.findFirst.mockResolvedValue(null);

    await expect(service.updateTaskStatus('company-1', 'task-1', 'done')).rejects.toThrow(NotFoundException);
  });

  it('lists active onboarding and offboarding plans with related offboarding tasks', async () => {
    prisma.onboardingPlan.findMany.mockResolvedValue([
      { id: 'plan-1', employee: { id: 'emp-1', first_name: 'Alex', last_name: 'Moyo', department: null }, tasks: [] },
    ]);
    prisma.offboardingPlan.findMany.mockResolvedValue([
      { id: 'off-1', employee: { id: 'emp-2', first_name: 'Sam', last_name: 'Zulu', department: null } },
    ]);
    prisma.task.findMany.mockResolvedValue([{ id: 'task-off-1', task_category: 'offboarding' }]);

    const result = await service.getActivePlans('company-1');

    expect(prisma.task.findMany).toHaveBeenCalledWith({
      where: {
        company_id: 'company-1',
        task_category: 'offboarding',
        task_code: {
          startsWith: 'OFF-off-1-',
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });
    expect(result.onboarding).toHaveLength(1);
    expect(result.offboarding[0].tasks).toEqual([{ id: 'task-off-1', task_category: 'offboarding' }]);
  });

  it('syncs onboarding task status updates into the main task table', async () => {
    prisma.onboardingTask.findFirst.mockResolvedValue({
      id: 'ob-task-1',
      plan_id: 'plan-12345678',
      title: 'IT Setup',
      status: 'pending',
      due_date: new Date('2026-04-02T00:00:00.000Z'),
      assignee_dept: 'IT',
    });
    prisma.onboardingTask.update.mockResolvedValue({
      id: 'ob-task-1',
      plan_id: 'plan-12345678',
      title: 'IT Setup',
      status: 'completed',
      due_date: new Date('2026-04-02T00:00:00.000Z'),
      assignee_dept: 'IT',
    });
    prisma.onboardingPlan.findFirst.mockResolvedValue({
      id: 'plan-12345678',
      employee: {
        id: 'emp-1',
        first_name: 'Alex',
        last_name: 'Moyo',
        department_id: 'dept-home',
      },
    });
    prisma.department.findFirst.mockResolvedValue({ id: 'dept-it' });
    prisma.task.findFirst.mockResolvedValue({ id: 'main-task-1' });
    prisma.task.update.mockResolvedValue({ id: 'main-task-1', status: 'done' });

    const result = await service.updateTaskStatus('company-1', 'ob-task-1', 'completed');

    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: 'main-task-1' },
      data: expect.objectContaining({
        status: 'done',
        task_category: 'onboarding',
      }),
    });
    expect(result.status).toBe('completed');
  });

  it('updates deprovisioning status and mirrors it to the offboarding task', async () => {
    prisma.offboardingPlan.findFirst.mockResolvedValue({
      id: 'off-12345678',
      employee: { id: 'emp-1', first_name: 'Alex', last_name: 'Moyo', department: null, position: null },
    });
    prisma.offboardingPlan.update.mockResolvedValue({
      employee_id: 'emp-1',
      it_deprovisioned_at: new Date('2026-04-10T00:00:00.000Z'),
    });
    prisma.task.findMany.mockResolvedValue([
      { id: 'task-1', title: 'Alex Moyo: IT Deprovisioning and Access Removal' },
    ]);

    const result = await service.updateDeprovisioningStatus('company-1', 'emp-1', true);

    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: {
        status: 'done',
      },
    });
    expect(result.employee_id).toBe('emp-1');
  });
});
