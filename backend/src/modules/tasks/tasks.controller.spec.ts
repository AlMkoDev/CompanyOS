import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

describe('TasksController', () => {
  let controller: TasksController;
  const tasksService = {
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: tasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  it('passes company context to updateStatus', async () => {
    await controller.updateStatus('company-1', 'user-1', 'task-1', { status: 'done' } as any);
    expect(tasksService.updateStatus).toHaveBeenCalledWith('company-1', 'user-1', 'task-1', 'done');
  });
});
