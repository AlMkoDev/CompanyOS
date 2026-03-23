import { Test, TestingModule } from '@nestjs/testing';
import { HrisService } from './hris.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('HrisService', () => {
  let service: HrisService;
  let prisma: {
    employee: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
    };
    employeeDocument: {
      create: jest.Mock;
    };
    onboardingPlan: {
      create: jest.Mock;
    };
    onboardingTask: {
      createMany: jest.Mock;
    };
    milestone: {
      createMany: jest.Mock;
    };
    position: {
      findMany: jest.Mock;
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
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
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HrisService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<HrisService>(HrisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
      service.updateEmployee('company-1', 'emp-1', { first_name: 'Alex' }),
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
});
