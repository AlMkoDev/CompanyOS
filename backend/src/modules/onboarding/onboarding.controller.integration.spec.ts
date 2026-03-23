import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

describe('OnboardingController integration', () => {
  let app: INestApplication;
  let guardSpy: jest.SpyInstance;
  let onboardingService: {
    createPlan: jest.Mock;
    getPlanDetail: jest.Mock;
    updateTaskStatus: jest.Mock;
    createOffboardingPlan: jest.Mock;
    getOffboardingDetail: jest.Mock;
    submitExitInterview: jest.Mock;
    updateDeprovisioningStatus: jest.Mock;
  };

  beforeEach(async () => {
    onboardingService = {
      createPlan: jest.fn(),
      getPlanDetail: jest.fn(),
      updateTaskStatus: jest.fn(),
      createOffboardingPlan: jest.fn(),
      getOffboardingDetail: jest.fn(),
      submitExitInterview: jest.fn(),
      updateDeprovisioningStatus: jest.fn(),
    };

    guardSpy = jest
      .spyOn(JwtAuthGuard.prototype, 'canActivate')
      .mockImplementation((context) => {
        const req = context.switchToHttp().getRequest();
        req.user = { companyId: 'company-1', userId: 'user-1' };
        return true;
      });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OnboardingController],
      providers: [
        {
          provide: OnboardingService,
          useValue: onboardingService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    guardSpy.mockRestore();
  });

  it('creates an onboarding plan through company-scoped context', async () => {
    onboardingService.createPlan.mockResolvedValue({ id: 'plan-1', employee_id: 'employee-1' });

    const response = await request(app.getHttpServer())
      .post('/onboarding/plans')
      .send({ employeeId: 'employee-1', startDate: '2026-03-23' })
      .expect(201);

    expect(onboardingService.createPlan).toHaveBeenCalledWith(
      'company-1',
      'employee-1',
      new Date('2026-03-23'),
    );
    expect(response.body).toEqual({ id: 'plan-1', employee_id: 'employee-1' });
  });

  it('updates task status through company-scoped context', async () => {
    onboardingService.updateTaskStatus.mockResolvedValue({ id: 'task-1', status: 'done' });

    const response = await request(app.getHttpServer())
      .patch('/onboarding/tasks/task-1')
      .send({ status: 'done' })
      .expect(200);

    expect(onboardingService.updateTaskStatus).toHaveBeenCalledWith('company-1', 'task-1', 'done');
    expect(response.body).toEqual({ id: 'task-1', status: 'done' });
  });

  it('submits exit interviews with company and actor context', async () => {
    onboardingService.submitExitInterview.mockResolvedValue({ id: 'interview-1' });

    const response = await request(app.getHttpServer())
      .post('/onboarding/offboarding/employee-1/interview')
      .send({ answers: { reason: 'Growth' }, nps_score: 9 })
      .expect(201);

    expect(onboardingService.submitExitInterview).toHaveBeenCalledWith(
      'company-1',
      'user-1',
      'employee-1',
      { answers: { reason: 'Growth' }, nps_score: 9 },
    );
    expect(response.body).toEqual({ id: 'interview-1' });
  });
});
