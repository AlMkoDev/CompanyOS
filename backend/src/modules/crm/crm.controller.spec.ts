import { Test, TestingModule } from '@nestjs/testing';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';

describe('CrmController', () => {
  let controller: CrmController;
  let service: {
    createAccount: jest.Mock;
    getAccounts: jest.Mock;
    createContact: jest.Mock;
    createDeal: jest.Mock;
    getDeal: jest.Mock;
    updateDealStage: jest.Mock;
    getPipeline: jest.Mock;
    getActivities: jest.Mock;
    createActivity: jest.Mock;
    getForecast: jest.Mock;
    getDataQuality: jest.Mock;
    createHealthScore: jest.Mock;
    getAccountHealthHistory: jest.Mock;
    createRenewalOpportunity: jest.Mock;
    getUpcomingRenewals: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      createAccount: jest.fn(),
      getAccounts: jest.fn(),
      createContact: jest.fn(),
      createDeal: jest.fn(),
      getDeal: jest.fn(),
      updateDealStage: jest.fn(),
      getPipeline: jest.fn(),
      getActivities: jest.fn(),
      createActivity: jest.fn(),
      getForecast: jest.fn(),
      getDataQuality: jest.fn(),
      createHealthScore: jest.fn(),
      getAccountHealthHistory: jest.fn(),
      createRenewalOpportunity: jest.fn(),
      getUpcomingRenewals: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CrmController],
      providers: [
        {
          provide: CrmService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<CrmController>(CrmController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes company context through CRM deal and account-specific routes', async () => {
    const req = { user: { companyId: 'company-1' } };

    await controller.getDeal(req, 'deal-1');
    await controller.updateDealStage(req, 'deal-1', { stage: 'proposal', probability: 70 });
    await controller.getActivities(req, 'deal-1', 'contact-1');
    await controller.createHealthScore(req, 'account-1', { score: 85 } as any);
    await controller.getAccountHealthHistory(req, 'account-1');
    await controller.createRenewalOpportunity(req, 'account-1', {
      title: 'Renewal',
      renewal_date: '2026-12-01',
    } as any);

    expect(service.getDeal).toHaveBeenCalledWith('company-1', 'deal-1');
    expect(service.updateDealStage).toHaveBeenCalledWith('company-1', 'deal-1', 'proposal', 70);
    expect(service.getActivities).toHaveBeenCalledWith('company-1', 'deal-1', 'contact-1');
    expect(service.createHealthScore).toHaveBeenCalledWith('company-1', 'account-1', { score: 85 });
    expect(service.getAccountHealthHistory).toHaveBeenCalledWith('company-1', 'account-1');
    expect(service.createRenewalOpportunity).toHaveBeenCalledWith('company-1', 'account-1', {
      title: 'Renewal',
      renewal_date: '2026-12-01',
    });
  });
});
