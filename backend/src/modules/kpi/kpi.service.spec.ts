import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { KpiService } from './kpi.service';

describe('KpiService', () => {
  let service: KpiService;
  const prisma = {
    kPI: {
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KpiService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<KpiService>(KpiService);
  });

  it('rejects cross-company KPI lookup', async () => {
    prisma.kPI.findFirst.mockResolvedValue(null);

    await expect(service.findOne('company-1', 'kpi-1')).rejects.toThrow(NotFoundException);
  });

  it('checks company ownership before update', async () => {
    prisma.kPI.findFirst.mockResolvedValue({ id: 'kpi-1' });
    prisma.kPI.update.mockResolvedValue({ id: 'kpi-1', name: 'Updated' });

    await service.update('company-1', 'kpi-1', { name: 'Updated' });

    expect(prisma.kPI.findFirst).toHaveBeenCalledWith({
      where: { id: 'kpi-1', company_id: 'company-1' },
      include: { department: true },
    });
    expect(prisma.kPI.update).toHaveBeenCalledWith({
      where: { id: 'kpi-1' },
      data: { name: 'Updated' },
    });
  });
});
