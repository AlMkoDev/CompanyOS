import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { CompanyController } from './modules/company/company.controller';
import { CompanyService } from './modules/company/company.service';
import { DepartmentsController } from './modules/departments/departments.controller';
import { DepartmentsService } from './modules/departments/departments.service';
import { HrisController } from './modules/hris/hris.controller';
import { HrisService } from './modules/hris/hris.service';
import { OnboardingController } from './modules/onboarding/onboarding.controller';
import { OnboardingService } from './modules/onboarding/onboarding.service';
import { RolesGuard } from './common/guards/roles.guard';
import { JwtAuthGuard } from './modules/auth/jwt.strategy';
import { TasksController } from './modules/tasks/tasks.controller';
import { TasksService } from './modules/tasks/tasks.service';

describe('Release 1 smoke suite', () => {
  let app: INestApplication;
  let jwtGuardSpy: jest.SpyInstance;
  let rolesGuardSpy: jest.SpyInstance;

  const companyService = {
    findOne: jest.fn(),
    updateCompany: jest.fn(),
    updateSetupProgress: jest.fn(),
  };

  const departmentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByTemplateKey: jest.fn(),
    bootstrapStandard: jest.fn(),
    applyTemplates: jest.fn(),
    findOne: jest.fn(),
    updateConfig: jest.fn(),
  };

  const tasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    updateStatus: jest.fn(),
    addComment: jest.fn(),
  };

  const hrisService = {
    createEmployee: jest.fn(),
    getEmployees: jest.fn(),
    getEmployeeById: jest.fn(),
    updateEmployee: jest.fn(),
    getPositions: jest.fn(),
    createPosition: jest.fn(),
    getOrgChart: jest.fn(),
    uploadDocument: jest.fn(),
    getHeadcountReport: jest.fn(),
  };

  const onboardingService = {
    getActivePlans: jest.fn(),
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

    jwtGuardSpy = jest.spyOn(JwtAuthGuard.prototype, 'canActivate').mockImplementation((context) => {
      const req = context.switchToHttp().getRequest();
      req.user = {
        companyId: 'company-1',
        userId: 'user-1',
        roles: ['Super Admin'],
      };
      return true;
    });

    rolesGuardSpy = jest.spyOn(RolesGuard.prototype, 'canActivate').mockReturnValue(true);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        CompanyController,
        DepartmentsController,
        TasksController,
        HrisController,
        OnboardingController,
      ],
      providers: [
        { provide: CompanyService, useValue: companyService },
        { provide: DepartmentsService, useValue: departmentsService },
        { provide: TasksService, useValue: tasksService },
        { provide: HrisService, useValue: hrisService },
        { provide: OnboardingService, useValue: onboardingService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jwtGuardSpy.mockRestore();
    rolesGuardSpy.mockRestore();
  });

  it('smokes the company, departments, tasks, HRIS, and onboarding routes', async () => {
    companyService.findOne.mockResolvedValue({ id: 'company-1', name: 'CompanyOS' });
    companyService.updateSetupProgress.mockResolvedValue({ current_step: 5 });

    departmentsService.findAll.mockResolvedValue([{ id: 'dept-1', name: 'Operations' }]);
    departmentsService.bootstrapStandard.mockResolvedValue([{ id: 'dept-1', template_key: 'ops' }]);
    departmentsService.applyTemplates.mockResolvedValue([{ id: 'dept-1', template_key: 'ops' }]);

    tasksService.findAll.mockResolvedValue([{ id: 'task-1', title: 'Smoke task', status: 'open' }]);
    tasksService.create.mockResolvedValue({ id: 'task-1', title: 'Smoke task', status: 'open' });
    tasksService.updateStatus.mockResolvedValue({ id: 'task-1', status: 'done' });
    tasksService.addComment.mockResolvedValue({ id: 'task-1', comments: ['Looks good'] });

    hrisService.getEmployees.mockResolvedValue([{ id: 'emp-1', first_name: 'Ava' }]);
    hrisService.getEmployeeById.mockResolvedValue({ id: 'emp-1', first_name: 'Ava' });
    hrisService.updateEmployee.mockResolvedValue({ id: 'emp-1', first_name: 'Ava' });
    hrisService.getPositions.mockResolvedValue([{ id: 'pos-1', title: 'UX Designer' }]);
    hrisService.createEmployee.mockResolvedValue({ id: 'emp-1', first_name: 'Ava' });
    hrisService.createPosition.mockResolvedValue({ id: 'pos-1', title: 'UX Designer' });
    hrisService.getOrgChart.mockResolvedValue({ nodes: [] });
    hrisService.uploadDocument.mockResolvedValue({ id: 'doc-1' });
    hrisService.getHeadcountReport.mockResolvedValue({ total: 1 });

    onboardingService.getActivePlans.mockResolvedValue([{ id: 'plan-1' }]);
    onboardingService.createPlan.mockResolvedValue({ id: 'plan-1' });
    onboardingService.getPlanDetail.mockResolvedValue({ id: 'plan-1' });
    onboardingService.updateTaskStatus.mockResolvedValue({ id: 'onboard-task-1', status: 'done' });
    onboardingService.createOffboardingPlan.mockResolvedValue({ id: 'off-1' });
    onboardingService.getOffboardingDetail.mockResolvedValue({ id: 'off-1' });
    onboardingService.submitExitInterview.mockResolvedValue({ id: 'interview-1' });
    onboardingService.updateDeprovisioningStatus.mockResolvedValue({ id: 'off-1', status: 'done' });

    await request(app.getHttpServer()).get('/company').expect(200);
    await request(app.getHttpServer())
      .patch('/company/setup')
      .send({ step: 5, config: { selectedDepartments: ['ops'] }, isComplete: true })
      .expect(200);

    await request(app.getHttpServer()).get('/departments').expect(200);
    await request(app.getHttpServer()).post('/departments/bootstrap-standard').expect(201);
    await request(app.getHttpServer())
      .post('/departments/apply-templates')
      .send({ departments: [{ template_key: 'ops', config: { name: 'Operations' } }] })
      .expect(201);

    await request(app.getHttpServer()).get('/tasks').expect(200);
    await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'Smoke task', department_id: 'dept-1', priority: 'medium' })
      .expect(201);
    await request(app.getHttpServer())
      .patch('/tasks/task-1/status')
      .send({ status: 'done' })
      .expect(200);
    await request(app.getHttpServer())
      .post('/tasks/task-1/comments')
      .send({ comment: 'Looks good' })
      .expect(201);

    await request(app.getHttpServer()).get('/hris/employees').expect(200);
    await request(app.getHttpServer())
      .get('/hris/employees/emp-1')
      .expect(200);
    await request(app.getHttpServer())
      .post('/hris/employees')
      .send({ first_name: 'Ava', last_name: 'Ndlovu' })
      .expect(201);
    await request(app.getHttpServer()).get('/hris/positions').expect(200);
    await request(app.getHttpServer())
      .post('/hris/positions')
      .send({ title: 'UX Designer', department_id: 'dept-1' })
      .expect(201);
    await request(app.getHttpServer()).get('/hris/org-chart').expect(200);
    await request(app.getHttpServer()).get('/hris/reports/headcount').expect(200);

    await request(app.getHttpServer()).get('/onboarding/plans').expect(200);
    await request(app.getHttpServer())
      .post('/onboarding/plans')
      .send({ employeeId: 'emp-1', startDate: '2026-03-27' })
      .expect(201);
    await request(app.getHttpServer()).get('/onboarding/plans/emp-1').expect(200);
    await request(app.getHttpServer())
      .patch('/onboarding/tasks/onboard-task-1')
      .send({ status: 'done' })
      .expect(200);
    await request(app.getHttpServer())
      .post('/onboarding/offboarding')
      .send({ employeeId: 'emp-1', lastDay: '2026-04-01' })
      .expect(201);
    await request(app.getHttpServer()).get('/onboarding/offboarding/emp-1').expect(200);
    await request(app.getHttpServer())
      .post('/onboarding/offboarding/emp-1/interview')
      .send({ answers: { reason: 'Growth' }, nps_score: 9 })
      .expect(201);
    await request(app.getHttpServer())
      .patch('/onboarding/offboarding/emp-1/deprovision')
      .send({ status: 'done' })
      .expect(200);

    expect(companyService.findOne).toHaveBeenCalledWith('company-1');
    expect(departmentsService.findAll).toHaveBeenCalledWith('company-1');
    expect(tasksService.create).toHaveBeenCalledWith(
      'company-1',
      'user-1',
      expect.objectContaining({ title: 'Smoke task' }),
    );
    expect(hrisService.createEmployee).toHaveBeenCalledWith(
      'company-1',
      'user-1',
      expect.any(Object),
    );
    expect(onboardingService.createPlan).toHaveBeenCalledWith(
      'company-1',
      'emp-1',
      expect.any(Date),
    );
  });
});
