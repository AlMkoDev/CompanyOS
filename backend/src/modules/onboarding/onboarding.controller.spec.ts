import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

describe('OnboardingController', () => {
  let controller: OnboardingController;
  const onboardingService = {
    createPlan: jest.fn(),
    getPlanDetail: jest.fn(),
    updateTaskStatus: jest.fn(),
    createOffboardingPlan: jest.fn(),
    getOffboardingDetail: jest.fn(),
    submitExitInterview: jest.fn(),
    updateDeprovisioningStatus: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnboardingController],
      providers: [
        {
          provide: OnboardingService,
          useValue: onboardingService,
        },
      ],
    }).compile();

    controller = module.get<OnboardingController>(OnboardingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes company context through onboarding routes', async () => {
    const req = { user: { companyId: 'company-1', userId: 'user-1' } };

    await controller.createPlan(req, { employeeId: 'employee-1', startDate: '2026-03-23' } as any);
    await controller.getPlanDetail(req, 'employee-1');
    await controller.updateTaskStatus(req, 'task-1', { status: 'done' } as any);
    await controller.createOffboarding(req, { employeeId: 'employee-1', lastDay: '2026-03-30' } as any);
    await controller.getOffboardingDetail(req, 'employee-1');
    await controller.submitExitInterview(req, 'employee-1', { answers: { why: 'test' }, nps_score: 8 } as any);
    await controller.updateDeprovisioning(req, 'employee-1', { status: true } as any);

    expect(onboardingService.createPlan).toHaveBeenCalledWith('company-1', 'employee-1', new Date('2026-03-23'));
    expect(onboardingService.getPlanDetail).toHaveBeenCalledWith('company-1', 'employee-1');
    expect(onboardingService.updateTaskStatus).toHaveBeenCalledWith('company-1', 'task-1', 'done');
    expect(onboardingService.createOffboardingPlan).toHaveBeenCalledWith('company-1', 'employee-1', new Date('2026-03-30'));
    expect(onboardingService.getOffboardingDetail).toHaveBeenCalledWith('company-1', 'employee-1');
    expect(onboardingService.submitExitInterview).toHaveBeenCalledWith('company-1', 'user-1', 'employee-1', { answers: { why: 'test' }, nps_score: 8 });
    expect(onboardingService.updateDeprovisioningStatus).toHaveBeenCalledWith('company-1', 'employee-1', true);
  });
});
