import { Test, TestingModule } from '@nestjs/testing';
import { QaService } from './qa.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('QaService', () => {
  let service: QaService;
  const prisma: any = {
    nCR: {
      findFirst: jest.fn(),
    },
    correctiveAction: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    rootCauseAnalysis: {
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QaService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<QaService>(QaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects cross-company CAR updates', async () => {
    prisma.correctiveAction.findFirst.mockResolvedValue(null);

    await expect(service.updateCAR('company-1', 'car-1', {} as any)).rejects.toThrow(NotFoundException);
  });

  it('checks company ownership before creating RCA', async () => {
    prisma.nCR.findFirst.mockResolvedValue({ id: 'ncr-1' });
    prisma.rootCauseAnalysis.upsert.mockResolvedValue({ id: 'rca-1' });

    await service.createOrUpdateRCA('company-1', 'ncr-1', 'user-1', {
      final_root_cause: 'Cause',
      five_whys: [],
    } as any);

    expect(prisma.nCR.findFirst).toHaveBeenCalledWith({
      where: { id: 'ncr-1', company_id: 'company-1' },
    });
    expect(prisma.rootCauseAnalysis.upsert).toHaveBeenCalled();
  });
});
