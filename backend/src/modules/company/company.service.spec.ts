import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { CompanyService } from './company.service';

describe('CompanyService', () => {
  let service: CompanyService;
  const prisma: any = {
    company: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    companySetup: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    department: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
  });

  it('rejects missing company lookups', async () => {
    prisma.company.findFirst.mockResolvedValue(null);

    await expect(service.findOne('company-1')).rejects.toThrow(NotFoundException);
  });

  it('checks existence before updateCompany', async () => {
    prisma.company.findFirst.mockResolvedValue({ id: 'company-1' });
    prisma.company.update.mockResolvedValue({ id: 'company-1' });

    await service.updateCompany('company-1', { tagline: 'Tag' });

    expect(prisma.company.findFirst).toHaveBeenCalledWith({
      where: { id: 'company-1' },
      include: {
        setup: true,
        gap_statuses: true,
        departments: {
          include: {
            gap_statuses: true,
            kpis: true,
          },
        },
      },
    });
    expect(prisma.company.update).toHaveBeenCalledWith({
      where: { id: 'company-1' },
      data: {
        tagline: 'Tag',
        industry: undefined,
        description: undefined,
        brand_colors: undefined,
      },
    });
  });

  it('merges setup config and creates missing selected departments once', async () => {
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        companySetup: {
          findUnique: jest.fn().mockResolvedValue({
            company_id: 'company-1',
            steps_config: { selectedDepartments: ['fin'], theme: 'classic' },
            completed_steps: [1, 2],
            is_complete: false,
          }),
          upsert: prisma.companySetup.upsert,
        },
        department: {
          findMany: jest.fn().mockResolvedValue([{ template_key: 'fin' }]),
          create: prisma.department.create,
        },
      }),
    );
    prisma.companySetup.upsert.mockResolvedValue({
      company_id: 'company-1',
      current_step: 3,
      completed_steps: [1, 2, 3],
      steps_config: { selectedDepartments: ['fin', 'hr'], theme: 'classic' },
      is_complete: false,
    });

    const result = await service.updateSetupProgress('company-1', {
      step: 3,
      config: { selectedDepartments: ['fin', 'hr'] },
      isComplete: false,
    });

    expect(prisma.department.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        company_id: 'company-1',
        template_key: 'hr',
        name: 'Human Resources',
      }),
    });
    expect(prisma.companySetup.upsert).toHaveBeenCalledWith({
      where: { company_id: 'company-1' },
      update: {
        current_step: 3,
        steps_config: { selectedDepartments: ['fin', 'hr'], theme: 'classic' },
        completed_steps: [1, 2, 3],
        is_complete: false,
      },
      create: {
        company_id: 'company-1',
        current_step: 3,
        steps_config: { selectedDepartments: ['fin', 'hr'], theme: 'classic' },
        completed_steps: [3],
        is_complete: false,
      },
    });
    expect(result.current_step).toBe(3);
  });
});
