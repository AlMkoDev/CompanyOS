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
      department: tx.department,
      task: tx.task,
      employeeDocument: {
        create: jest.fn(),
      },
      onboardingPlan: tx.onboardingPlan,
      onboardingTask: tx.onboardingTask,
      milestone: tx.milestone,
      offboardingPlan: tx.offboardingPlan,
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

  it('masks sensitive employee data for non-HR viewer roles', async () => {
    prisma.employee.findFirst.mockResolvedValue({
      id: 'emp-1',
      company_id: 'company-1',
      first_name: 'Ava',
      last_name: 'Ndlovu',
      email: 'ava.ndlovu@example.com',
      phone: '+27 82 456 7890',
      national_id: '9508150234087',
      salary_grade: 'R420,000 ZAR per annum',
      status: 'probation',
      avatar_url: 'https://files/avatar.png',
      profile_data: {
        personal_information: {
          south_african_id_number: '9508150234087',
        },
        compensation: {
          basic_salary: 'R420,000 ZAR per annum',
          account_number: '6212345678901234',
        },
        tax_and_statutory: {
          tax_number: '9876543210',
          paye_reference: '1234567890',
          uif_number: '1234567890123',
          sdl_reference: '9876543210',
        },
        benefits_and_statutory_contributions: {
          medical_aid_number: 'DH123456789',
          policy_number: 'OM987654321',
        },
        emergency_contact: {
          primary_contact: {
            id_number: '6504125089087',
            phone: '+27 82 123 4567',
            email: 'thabo@example.com',
          },
        },
      },
    });

    const result = await service.getEmployeeById('company-1', 'emp-1', ['Manager']);

    expect(result.national_id).toMatch(/•+/);
    expect(result.phone).toMatch(/•+/);
    expect(result.salary_grade).toBe('Restricted');
    expect(result.profile_data.personal_information.south_african_id_number).toMatch(/•+/);
    expect(result.profile_data.compensation.basic_salary).toBe('Restricted');
    expect(result.profile_data.tax_and_statutory.tax_number).toMatch(/•+/);
    expect(result.profile_data.benefits_and_statutory_contributions.medical_aid_number).toMatch(/•+/);
    expect(result.profile_data.emergency_contact.primary_contact.email).toBe('Restricted');
  });

  it('preserves sensitive employee data for full-access HR viewer roles', async () => {
    prisma.employee.findFirst.mockResolvedValue({
      id: 'emp-1',
      company_id: 'company-1',
      first_name: 'Ava',
      last_name: 'Ndlovu',
      email: 'ava.ndlovu@example.com',
      phone: '+27 82 456 7890',
      national_id: '9508150234087',
      salary_grade: 'R420,000 ZAR per annum',
      status: 'probation',
      avatar_url: 'https://files/avatar.png',
      profile_data: {
        personal_information: {
          south_african_id_number: '9508150234087',
        },
      },
    });

    const result = await service.getEmployeeById('company-1', 'emp-1', ['HR Director']);

    expect(result.national_id).toBe('9508150234087');
    expect(result.profile_data.personal_information.south_african_id_number).toBe('9508150234087');
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
