import { Test, TestingModule } from '@nestjs/testing';
import { QaController } from './qa.controller';
import { QaService } from './qa.service';

describe('QaController', () => {
  let controller: QaController;
  const qaService = {
    createOrUpdateRCA: jest.fn(),
    createCAR: jest.fn(),
    updateCAR: jest.fn(),
    deleteCAR: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QaController],
      providers: [
        {
          provide: QaService,
          useValue: qaService,
        },
      ],
    }).compile();

    controller = module.get<QaController>(QaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes company context to nested QA mutations', async () => {
    const req = { user: { companyId: 'company-1', userId: 'user-1' } };
    const rca = { final_root_cause: 'Root cause', five_whys: [] };
    const car = { action: 'Fix process' };

    await controller.createOrUpdateRCA(req, 'ncr-1', rca as any);
    await controller.createCAR(req, 'ncr-1', car as any);
    await controller.updateCAR(req, 'car-1', car as any);
    await controller.deleteCAR(req, 'car-1');

    expect(qaService.createOrUpdateRCA).toHaveBeenCalledWith('company-1', 'ncr-1', 'user-1', rca);
    expect(qaService.createCAR).toHaveBeenCalledWith('company-1', 'ncr-1', car);
    expect(qaService.updateCAR).toHaveBeenCalledWith('company-1', 'car-1', car);
    expect(qaService.deleteCAR).toHaveBeenCalledWith('company-1', 'car-1');
  });
});
