import { Test, TestingModule } from '@nestjs/testing';
import { ItsmController } from './itsm.controller';
import { ItsmService } from './itsm.service';

describe('ItsmController', () => {
  let controller: ItsmController;
  let service: {
    createTicket: jest.Mock;
    getTickets: jest.Mock;
    getTicketById: jest.Mock;
    resolveTicket: jest.Mock;
    createChangeRequest: jest.Mock;
    getChangeRequests: jest.Mock;
    updateChangeStatus: jest.Mock;
    createAsset: jest.Mock;
    getAssets: jest.Mock;
    createKnowledgeArticle: jest.Mock;
    getKnowledgeArticles: jest.Mock;
    searchKnowledgeArticles: jest.Mock;
    getSlaCompliance: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      createTicket: jest.fn(),
      getTickets: jest.fn(),
      getTicketById: jest.fn(),
      resolveTicket: jest.fn(),
      createChangeRequest: jest.fn(),
      getChangeRequests: jest.fn(),
      updateChangeStatus: jest.fn(),
      createAsset: jest.fn(),
      getAssets: jest.fn(),
      createKnowledgeArticle: jest.fn(),
      getKnowledgeArticles: jest.fn(),
      searchKnowledgeArticles: jest.fn(),
      getSlaCompliance: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItsmController],
      providers: [
        {
          provide: ItsmService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<ItsmController>(ItsmController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes company context through ticket and change routes', async () => {
    const req = { user: { companyId: 'company-1' } };

    await controller.getTicketById(req, 'ticket-1');
    await controller.resolveTicket(req, 'ticket-1', { rca: 'fixed config' });
    await controller.updateChangeStatus(req, 'change-1', {
      status: 'implemented',
      cabNotes: 'approved',
    });
    await controller.searchKnowledgeArticles(req, 'vpn');

    expect(service.getTicketById).toHaveBeenCalledWith('company-1', 'ticket-1');
    expect(service.resolveTicket).toHaveBeenCalledWith('company-1', 'ticket-1', 'fixed config');
    expect(service.updateChangeStatus).toHaveBeenCalledWith(
      'company-1',
      'change-1',
      'implemented',
      'approved',
    );
    expect(service.searchKnowledgeArticles).toHaveBeenCalledWith('company-1', 'vpn');
  });
});
