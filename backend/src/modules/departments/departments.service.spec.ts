import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentsService } from './departments.service';

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  const prisma = {
    department: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
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
});
