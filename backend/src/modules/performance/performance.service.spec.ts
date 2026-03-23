import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceService } from './performance.service';
import { PrismaService } from '../../database/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PerformanceService', () => {
  let service: PerformanceService;
  const prisma: any = {
    reviewCycle: {
      findFirst: jest.fn(),
    },
    review: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    feedbackRequest: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<PerformanceService>(PerformanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects cross-company cycle detail lookup', async () => {
    prisma.reviewCycle.findFirst.mockResolvedValue(null);

    await expect(service.getCycleDetail('company-1', 'cycle-1')).rejects.toThrow(NotFoundException);
  });

  it('rejects self assessment for a different employee', async () => {
    prisma.review.findFirst.mockResolvedValue({ id: 'review-1', employee_id: 'employee-2' });

    await expect(
      service.submitSelfAssessment('company-1', 'employee-1', 'review-1', { score: 4 }),
    ).rejects.toThrow(BadRequestException);
  });
});
