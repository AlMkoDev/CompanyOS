import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';

describe('PerformanceController', () => {
  let controller: PerformanceController;
  const performanceService = {
    getCycleDetail: jest.fn(),
    submitSelfAssessment: jest.fn(),
    submitManagerAssessment: jest.fn(),
    requestFeedback: jest.fn(),
    submitFeedback: jest.fn(),
    getCompletionStats: jest.fn(),
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
      ],
    }).compile();

    controller = module.get<PerformanceController>(PerformanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes company and employee context to protected review actions', async () => {
    const req = { user: { company_id: 'company-1', employee_id: 'employee-1' } };

    await controller.getCycleDetail(req, 'cycle-1');
    await controller.submitSelfAssessment(req, 'review-1', { assessment: { score: 4 } });
    await controller.submitManagerAssessment(req, 'review-1', { assessment: { score: 5 }, rating: 'strong' });
    await controller.requestFeedback(req, 'review-1', { providerId: 'employee-2' });
    await controller.submitFeedback(req, 'request-1', { answers: { q1: 'yes' } });
    await controller.getStats(req, 'cycle-1');

    expect(performanceService.getCycleDetail).toHaveBeenCalledWith('company-1', 'cycle-1');
    expect(performanceService.submitSelfAssessment).toHaveBeenCalledWith('company-1', 'employee-1', 'review-1', { score: 4 });
    expect(performanceService.submitManagerAssessment).toHaveBeenCalledWith('company-1', 'employee-1', 'review-1', { score: 5 }, 'strong');
    expect(performanceService.requestFeedback).toHaveBeenCalledWith('company-1', 'employee-1', 'review-1', 'employee-2');
    expect(performanceService.submitFeedback).toHaveBeenCalledWith('company-1', 'employee-1', 'request-1', { q1: 'yes' });
    expect(performanceService.getCompletionStats).toHaveBeenCalledWith('company-1', 'cycle-1');
  });
});
