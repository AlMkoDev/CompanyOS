import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { PrismaService } from '../../database/prisma.service';

describe('PerformanceController', () => {
  let controller: PerformanceController;
  const performanceService = {
    createCycle: jest.fn(),
    getCycles: jest.fn(),
    getCycleDetail: jest.fn(),
    startCycleReviews: jest.fn(),
    getEmployeeReview: jest.fn(),
    submitSelfAssessment: jest.fn(),
    submitManagerAssessment: jest.fn(),
    requestFeedback: jest.fn(),
    getPendingFeedback: jest.fn(),
    submitFeedback: jest.fn(),
    getCompletionStats: jest.fn(),
  };
  const prismaService = {
    employee: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PerformanceController],
      providers: [
        {
          provide: PerformanceService,
          useValue: performanceService,
        },
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    controller = module.get<PerformanceController>(PerformanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes company and employee context to protected review actions', async () => {
    const user = { companyId: 'company-1', employeeId: 'employee-1', email: 'employee@example.com', userId: 'user-1', roles: [] };

    await controller.getCycleDetail(user as any, 'cycle-1');
    await controller.submitSelfAssessment(user as any, 'review-1', { assessment: { score: 4 } });
    await controller.submitManagerAssessment(user as any, 'review-1', { assessment: { score: 5 }, rating: 'strong' });
    await controller.requestFeedback(user as any, 'review-1', { providerId: 'employee-2' });
    await controller.submitFeedback(user as any, 'request-1', { answers: { q1: 'yes' } });
    await controller.getStats(user as any, 'cycle-1');

    expect(performanceService.getCycleDetail).toHaveBeenCalledWith('company-1', 'cycle-1');
    expect(performanceService.submitSelfAssessment).toHaveBeenCalledWith('company-1', 'employee-1', 'review-1', { score: 4 });
    expect(performanceService.submitManagerAssessment).toHaveBeenCalledWith('company-1', 'employee-1', 'review-1', { score: 5 }, 'strong');
    expect(performanceService.requestFeedback).toHaveBeenCalledWith('company-1', 'employee-1', 'review-1', 'employee-2');
    expect(performanceService.submitFeedback).toHaveBeenCalledWith('company-1', 'employee-1', 'request-1', { q1: 'yes' });
    expect(performanceService.getCompletionStats).toHaveBeenCalledWith('company-1', 'cycle-1');
  });

  it('resolves the employee profile from canonical JWT fields when employeeId is absent', async () => {
    prismaService.employee.findFirst.mockResolvedValue({ id: 'employee-9' });
    const user = {
      companyId: 'company-1',
      email: 'manager@example.com',
      userId: 'user-1',
      roles: ['Manager'],
    };

    await controller.getMyReview(user as any, 'cycle-1');
    await controller.getPendingFeedback(user as any);

    expect(prismaService.employee.findFirst).toHaveBeenCalledWith({
      where: {
        company_id: 'company-1',
        email: 'manager@example.com',
      },
      select: { id: true },
    });
    expect(performanceService.getEmployeeReview).toHaveBeenCalledWith('employee-9', 'cycle-1');
    expect(performanceService.getPendingFeedback).toHaveBeenCalledWith('employee-9');
  });
});
