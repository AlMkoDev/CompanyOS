import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: {
    createProject: jest.Mock;
    getProjects: jest.Mock;
    getProjectDetail: jest.Mock;
    updateProject: jest.Mock;
    deleteProject: jest.Mock;
    getRagDashboard: jest.Mock;
    getOnTimeDeliveryReport: jest.Mock;
    createTask: jest.Mock;
    updateTask: jest.Mock;
    deleteTask: jest.Mock;
    getTasksByStatus: jest.Mock;
    createRaidItem: jest.Mock;
    updateRaidItem: jest.Mock;
    deleteRaidItem: jest.Mock;
    getRaidSummary: jest.Mock;
    createOrUpdateBudget: jest.Mock;
    getBudgetStatus: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      createProject: jest.fn(),
      getProjects: jest.fn(),
      getProjectDetail: jest.fn(),
      updateProject: jest.fn(),
      deleteProject: jest.fn(),
      getRagDashboard: jest.fn(),
      getOnTimeDeliveryReport: jest.fn(),
      createTask: jest.fn(),
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
      getTasksByStatus: jest.fn(),
      createRaidItem: jest.fn(),
      updateRaidItem: jest.fn(),
      deleteRaidItem: jest.fn(),
      getRaidSummary: jest.fn(),
      createOrUpdateBudget: jest.fn(),
      getBudgetStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes company context through nested project routes', async () => {
    const req = { user: { companyId: 'company-1' } };

    await controller.createTask(req, 'proj-1', { title: 'Task' });
    await controller.updateTask(req, 'task-1', { status: 'done' });
    await controller.deleteTask(req, 'task-1');
    await controller.getTasksByStatus(req, 'proj-1', 'done');
    await controller.createRaidItem(req, 'proj-1', { title: 'Risk', type: 'RISK' } as any);
    await controller.updateRaidItem(req, 'raid-1', { status: 'CLOSED' });
    await controller.deleteRaidItem(req, 'raid-1');
    await controller.getRaidSummary(req, 'proj-1');
    await controller.createOrUpdateBudget(req, 'proj-1', {
      total_allocated: 1000,
      actual_spent: 200,
    } as any);
    await controller.getBudgetStatus(req, 'proj-1');

    expect(service.createTask).toHaveBeenCalledWith('company-1', 'proj-1', { title: 'Task' });
    expect(service.updateTask).toHaveBeenCalledWith('company-1', 'task-1', { status: 'done' });
    expect(service.deleteTask).toHaveBeenCalledWith('company-1', 'task-1');
    expect(service.getTasksByStatus).toHaveBeenCalledWith('company-1', 'proj-1', 'done');
    expect(service.createRaidItem).toHaveBeenCalledWith('company-1', 'proj-1', {
      title: 'Risk',
      type: 'RISK',
    });
    expect(service.updateRaidItem).toHaveBeenCalledWith('company-1', 'raid-1', { status: 'CLOSED' });
    expect(service.deleteRaidItem).toHaveBeenCalledWith('company-1', 'raid-1');
    expect(service.getRaidSummary).toHaveBeenCalledWith('company-1', 'proj-1');
    expect(service.createOrUpdateBudget).toHaveBeenCalledWith('company-1', 'proj-1', {
      total_allocated: 1000,
      actual_spent: 200,
    });
    expect(service.getBudgetStatus).toHaveBeenCalledWith('company-1', 'proj-1');
  });
});
