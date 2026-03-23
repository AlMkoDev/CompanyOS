import { Test, TestingModule } from '@nestjs/testing';
import { OkrService } from './okr.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('OkrService', () => {
  let service: OkrService;
  const prisma: any = {
    oKRCycle: {
      findFirst: jest.fn(),
    },
    objective: {
      findFirst: jest.fn(),
    },
    keyResult: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OkrService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<OkrService>(OkrService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects cross-company cycle access for explorer', async () => {
    prisma.oKRCycle.findFirst.mockResolvedValue(null);

    await expect(service.getOkrTree('company-1', 'cycle-1')).rejects.toThrow(NotFoundException);
  });

  it('rejects cross-company key result check-ins', async () => {
    prisma.keyResult.findFirst.mockResolvedValue(null);

    await expect(
      service.submitCheckIn('company-1', 'kr-1', { value: 1, confidence: 5 } as any),
    ).rejects.toThrow(NotFoundException);
  });
});
