import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { HrisService } from './hris.service';

describe('HrisService', () => {
  let service: HrisService;
  let prisma: any;
  let tx: any;

  const audit = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    tx = {
      employee: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      employmentHistory: {
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      onboardingPlan: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      onboardingTask: {
        create: jest.fn(),
      },
      milestone: {
        createMany: jest.fn(),
      },
      department: {
        findFirst: jest.fn(),
      },
      task: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      offboardingPlan: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    prisma = {
      employee: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      employeeDocument: {
        create: jest.fn(),
      },
      onboardingPlan: {
        create: jest.fn(),
      },
      onboardingTask: {
        createMany: jest.fn(),
      },
      milestone: {
        createMany: jest.fn(),
      },
      position: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn(async (callback) => callback(tx)),
    };

    audit.log.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HrisService,
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

    service = module.get<HrisService>(HrisService);
  });

  it('rejects employee detail access outside the caller company', async () => {
    prisma.employee.findFirst.mockResolvedValue(null);

    await expect(service.getEmployeeById('company-1', 'emp-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects employee updates outside the caller company', async () => {
    prisma.employee.findFirst.mockResolvedValue(null);

    await expect(
      service.updateEmployee('company-1', 'user-1', 'emp-1', { first_name: 'Alex' } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects employee document uploads outside the caller company', async () => {
    prisma.employee.findFirst.mockResolvedValue(null);

    await expect(
      service.uploadDocument('company-1', 'emp-1', {
        file_name: 'contract.pdf',
        file_url: 'https://files/contract.pdf',
        document_type: 'contract',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.employeeDocument.create).not.toHaveBeenCalled();
  });

  it('creates onboarding artifacts and main tasks when creating an employee', async () => {
    prisma.employee.count.mockResolvedValue(0);
    tx.employee.create.mockResolvedValue({
      id: 'emp-1',
      emp_no: 'EMP-0001',
      first_name: 'Alex',
      last_name: 'Moyo',
      department_id: 'dept-home',
      position_id: 'pos-1',
      hire_date: new Date('2026-04-01T00:00:00.000Z'),
    });
    tx.onboardingPlan.findUnique.mockResolvedValue(null);
    tx.onboardingPlan.create.mockResolvedValue({ id: 'plan-12345678' });
    tx.onboardingTask.create
      .mockResolvedValueOnce({ id: 'ob-task-1' })
      .mockResolvedValueOnce({ id: 'ob-task-2' })
      .mockResolvedValueOnce({ id: 'ob-task-3' })
      .mockResolvedValueOnce({ id: 'ob-task-4' });
    tx.department.findFirst.mockResolvedValue({ id: 'dept-lifecycle' });
    tx.task.create.mockResolvedValue({ id: 'main-task-1' });

    const result = await service.createEmployee('company-1', 'user-1', {
      first_name: 'Alex',
      last_name: 'Moyo',
      email: 'alex@example.com',
      department_id: 'dept-home',
      position_id: 'pos-1',
      hire_date: '2026-04-01',
      status: 'active',
    } as any);

    expect(tx.employee.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        emp_no: 'EMP-0001',
        company_id: 'company-1',
        hire_date: new Date('2026-04-01'),
      }),
      include: { department: true, position: true },
    });
    expect(tx.employmentHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        employee_id: 'emp-1',
        change_reason: 'Initial hire',
      }),
    });
    expect(tx.onboardingTask.create).toHaveBeenCalledTimes(4);
    expect(tx.task.create).toHaveBeenCalledTimes(4);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        userId: 'user-1',
        action: 'CREATED_EMPLOYEE',
        resourceId: 'emp-1',
      }),
    );
    expect(result.emp_no).toBe('EMP-0001');
  });

  it('creates employment history and offboarding artifacts when terminating an employee', async () => {
    prisma.employee.findFirst.mockResolvedValue({
      id: 'emp-1',
      company_id: 'company-1',
      first_name: 'Alex',
      last_name: 'Moyo',
      department_id: 'dept-old',
      position_id: 'pos-old',
      status: 'active',
      hire_date: new Date('2026-04-01T00:00:00.000Z'),
      termination_date: null,
      onboarding: { id: 'plan-existing' },
      offboarding: null,
    });
    tx.employee.update.mockResolvedValue({
      id: 'emp-1',
      first_name: 'Alex',
      last_name: 'Moyo',
      department_id: 'dept-new',
      position_id: 'pos-new',
      status: 'terminated',
      termination_date: new Date('2026-04-10T00:00:00.000Z'),
    });
    tx.offboardingPlan.findUnique.mockResolvedValue(null);
    tx.offboardingPlan.create.mockResolvedValue({ id: 'off-12345678' });
    tx.department.findFirst.mockResolvedValue({ id: 'dept-lifecycle' });
    tx.task.findFirst.mockResolvedValue(null);
    tx.task.create.mockResolvedValue({ id: 'main-task-1' });

    const result = await service.updateEmployee('company-1', 'user-7', 'emp-1', {
      status: 'terminated',
      department_id: 'dept-new',
      position_id: 'pos-new',
    } as any);

    expect(tx.employmentHistory.updateMany).toHaveBeenCalled();
    expect(tx.employmentHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        employee_id: 'emp-1',
        department_id: 'dept-new',
        position_id: 'pos-new',
        change_reason: 'Role or department update',
      }),
    });
    expect(tx.offboardingPlan.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        employee_id: 'emp-1',
      }),
    });
    expect(tx.task.create).toHaveBeenCalledTimes(4);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        userId: 'user-7',
        action: 'UPDATED_EMPLOYEE',
        resourceId: 'emp-1',
      }),
    );
    expect(result.status).toBe('terminated');
  });
});
