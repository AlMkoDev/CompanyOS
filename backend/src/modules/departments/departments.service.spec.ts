import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentsService } from './departments.service';

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  const prisma: any = {
    department: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    kPI: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);
  });

  it('rejects cross-company department lookup', async () => {
    prisma.department.findFirst.mockResolvedValue(null);

    await expect(service.findOne('dept-1', 'company-1')).rejects.toThrow(NotFoundException);
  });

  it('scopes config updates by company when id is a uuid', async () => {
    prisma.department.findFirst.mockResolvedValue({ id: 'dept-1-uuid' });
    prisma.department.update.mockResolvedValue({ id: 'dept-1-uuid' });

    await service.updateConfig('dept-1-uuid', 'company-1', { name: 'Finance' });

    expect(prisma.department.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'dept-1-uuid',
        company_id: 'company-1',
      },
    });
  });

  it('applies department templates idempotently through a transaction', async () => {
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        department: {
          findFirst: jest
            .fn()
            .mockResolvedValueOnce({ id: 'dept-fin', template_key: 'fin' })
            .mockResolvedValueOnce(null),
          update: prisma.department.update,
          create: prisma.department.create,
        },
        kPI: {
          deleteMany: prisma.kPI.deleteMany,
          createMany: prisma.kPI.createMany,
        },
      }),
    );
    prisma.department.findMany.mockResolvedValue([
      { id: 'dept-fin', template_key: 'fin', name: 'Finance', status: 'active', _count: { members: 0, tasks: 0 } },
      { id: 'dept-hr', template_key: 'hr', name: 'Human Resources', status: 'active', _count: { members: 0, tasks: 0 } },
    ]);
    prisma.department.update.mockResolvedValue({ id: 'dept-fin' });
    prisma.department.create.mockResolvedValue({ id: 'dept-hr' });

    const result = await service.applyTemplates('company-1', {
      departments: [
        { template_key: 'fin', config: { name: 'Finance', mandate: 'Own finance' } },
        {
          template_key: 'human_resources',
          config: {
            name: 'Human Resources',
            mandate: 'Own people ops',
            kpis: [{ name: 'Time to fill', target: '35', unit: 'days' }],
            workflows: ['Open requisition', 'Screen candidates'],
          },
        },
      ],
    });

    expect(prisma.department.update).toHaveBeenCalledWith({
      where: { id: 'dept-fin' },
      data: expect.objectContaining({
        company_id: 'company-1',
        template_key: 'fin',
        name: 'Finance',
        mandate: 'Own finance',
      }),
    });
    expect(prisma.department.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        company_id: 'company-1',
        template_key: 'human_resources',
        name: 'Human Resources',
        mandate: 'Own people ops',
        activities: [
          {
            component: 'Core Workflow Definitions',
            owner: 'Department Lead',
            summary: 'Sequenced workflow definitions configured for this department.',
            sections: ['Open requisition', 'Screen candidates'],
          },
        ],
      }),
    });
    expect(prisma.kPI.deleteMany).toHaveBeenCalled();
    expect(prisma.kPI.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          company_id: 'company-1',
          department_id: 'dept-hr',
          name: 'Time to fill',
          unit: 'days',
        }),
      ],
    });
    expect(result).toHaveLength(2);
  });
});
