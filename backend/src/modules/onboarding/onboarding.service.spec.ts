import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingService } from './onboarding.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('OnboardingService', () => {
  let service: OnboardingService;
  const prisma: any = {
    employee: {
      findFirst: jest.fn(),
    },
    onboardingPlan: {
      findFirst: jest.fn(),
    },
    onboardingTask: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    offboardingPlan: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    exitInterview: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects onboarding plan lookup for another company employee', async () => {
    prisma.onboardingPlan.findFirst.mockResolvedValue(null);

    await expect(service.getPlanDetail('company-1', 'employee-1')).rejects.toThrow(NotFoundException);
  });

  it('rejects task status updates for another company task', async () => {
    prisma.onboardingTask.findFirst.mockResolvedValue(null);

    await expect(service.updateTaskStatus('company-1', 'task-1', 'done')).rejects.toThrow(NotFoundException);
  });
});
