import { Test, TestingModule } from '@nestjs/testing';
import { ClmController } from './clm.controller';
import { ClmService } from './clm.service';

describe('ClmController', () => {
  let controller: ClmController;
  const clmService = {
    getTemplate: jest.fn(),
    getContract: jest.fn(),
    submitForApproval: jest.fn(),
    decideApproval: jest.fn(),
    signContract: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClmController],
      providers: [
        {
          provide: ClmService,
          useValue: clmService,
        },
      ],
    }).compile();

    controller = module.get<ClmController>(ClmController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes company context to protected CLM routes', async () => {
    const req = { user: { companyId: 'company-1', userId: 'user-1' } };
    await controller.getTemplate(req, 'template-1');
    await controller.getContract(req, 'contract-1');
    await controller.submitForApproval(req, 'contract-1', { approverIds: ['user-2'] });
    await controller.decideApproval(req, 'approval-1', { decision: 'approved', comment: 'ok' });
    await controller.signContract(req, 'contract-1', { name: 'Sig', email: 'sig@example.com', ip: '1.1.1.1', userAgent: 'jest' });

    expect(clmService.getTemplate).toHaveBeenCalledWith('company-1', 'template-1');
    expect(clmService.getContract).toHaveBeenCalledWith('company-1', 'contract-1');
    expect(clmService.submitForApproval).toHaveBeenCalledWith('company-1', 'user-1', 'contract-1', ['user-2']);
    expect(clmService.decideApproval).toHaveBeenCalledWith('company-1', 'user-1', 'approval-1', 'approved', 'ok');
    expect(clmService.signContract).toHaveBeenCalledWith('company-1', 'user-1', 'contract-1', { name: 'Sig', email: 'sig@example.com', ip: '1.1.1.1', userAgent: 'jest' });
  });
});
