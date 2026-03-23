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
});
