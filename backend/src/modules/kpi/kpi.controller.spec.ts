import { Test, TestingModule } from '@nestjs/testing';
import { KpiController } from './kpi.controller';
import { KpiService } from './kpi.service';

describe('KpiController', () => {
  let controller: KpiController;
  const kpiService = {
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [KpiController],
      providers: [
        {
          provide: KpiService,
          useValue: kpiService,
        },
      ],
    }).compile();

    controller = module.get<KpiController>(KpiController);
  });

  it('passes company context to findOne', async () => {
    await controller.findOne('company-1', 'kpi-1');
    expect(kpiService.findOne).toHaveBeenCalledWith('company-1', 'kpi-1');
  });

  it('passes company context to update', async () => {
    const data = { name: 'Revenue' };
    await controller.update('company-1', 'kpi-1', data);
    expect(kpiService.update).toHaveBeenCalledWith('company-1', 'kpi-1', data);
  });

  it('passes company context to remove', async () => {
    await controller.remove('company-1', 'kpi-1');
    expect(kpiService.remove).toHaveBeenCalledWith('company-1', 'kpi-1');
  });
});
