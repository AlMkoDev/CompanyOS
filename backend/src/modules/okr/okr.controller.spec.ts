import { Test, TestingModule } from '@nestjs/testing';
import { OkrController } from './okr.controller';
import { OkrService } from './okr.service';

describe('OkrController', () => {
  let controller: OkrController;
  const okrService = {
    createObjective: jest.fn(),
    getOkrTree: jest.fn(),
    createKeyResult: jest.fn(),
    submitCheckIn: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OkrController],
      providers: [
        {
          provide: OkrService,
          useValue: okrService,
        },
      ],
    }).compile();

    controller = module.get<OkrController>(OkrController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes company context through protected OKR routes', async () => {
    const req = { user: { companyId: 'company-1' } };
    const objective = { cycle_id: 'cycle-1', title: 'Grow revenue' };
    const keyResult = { objective_id: 'obj-1', title: 'New ARR' };
    const checkIn = { value: 42, confidence: 8, comment: 'good' };

    await controller.createObjective(req, objective as any);
    await controller.getExplorer(req, 'cycle-1');
    await controller.createKeyResult(req, keyResult as any);
    await controller.submitCheckIn(req, 'kr-1', checkIn as any);

    expect(okrService.createObjective).toHaveBeenCalledWith('company-1', objective);
    expect(okrService.getOkrTree).toHaveBeenCalledWith('company-1', 'cycle-1');
    expect(okrService.createKeyResult).toHaveBeenCalledWith('company-1', keyResult);
    expect(okrService.submitCheckIn).toHaveBeenCalledWith('company-1', 'kr-1', checkIn);
  });
});
