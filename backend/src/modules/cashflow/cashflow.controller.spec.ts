import { Test, TestingModule } from '@nestjs/testing';
import { CashFlowController } from './cashflow.controller';
import { CashFlowService } from './cashflow.service';

describe('CashFlowController', () => {
  let controller: CashFlowController;
  const cashFlowService = {
    addCashItem: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CashFlowController],
      providers: [
        {
          provide: CashFlowService,
          useValue: cashFlowService,
        },
      ],
    }).compile();

    controller = module.get<CashFlowController>(CashFlowController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes company context to addCashItem', async () => {
    const req = { user: { companyId: 'company-1' } };
    const body = { category: 'Manual', amount: 1000, scenario: 'base' };

    await controller.addCashItem(req, 'week-1', body as any);

    expect(cashFlowService.addCashItem).toHaveBeenCalledWith('company-1', 'week-1', body);
  });
});
