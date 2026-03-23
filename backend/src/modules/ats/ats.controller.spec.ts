import { Test, TestingModule } from '@nestjs/testing';
import { AtsController } from './ats.controller';
import { AtsService } from './ats.service';

describe('AtsController', () => {
  let controller: AtsController;
  let service: {
    getPipeline: jest.Mock;
    createRequisition: jest.Mock;
    getRequisitions: jest.Mock;
    getRequisitionDetail: jest.Mock;
    createCandidate: jest.Mock;
    getCandidateDetail: jest.Mock;
    createApplication: jest.Mock;
    updateStage: jest.Mock;
    scheduleInterview: jest.Mock;
    submitScorecard: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getPipeline: jest.fn(),
      createRequisition: jest.fn(),
      getRequisitions: jest.fn(),
      getRequisitionDetail: jest.fn(),
      createCandidate: jest.fn(),
      getCandidateDetail: jest.fn(),
      createApplication: jest.fn(),
      updateStage: jest.fn(),
      scheduleInterview: jest.fn(),
      submitScorecard: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AtsController],
      providers: [
        {
          provide: AtsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<AtsController>(AtsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes company context through ATS detail and mutation routes', async () => {
    const req = { user: { companyId: 'company-1', userId: 'user-1' } };

    await controller.getRequisitionDetail(req, 'req-1');
    await controller.getCandidateDetail(req, 'cand-1');
    await controller.createApplication(req, { requisition_id: 'req-1', candidate_id: 'cand-1' });
    await controller.updateStage(req, 'app-1', { stage: 'interview1' });
    await controller.scheduleInterview(req, {
      applicationId: 'app-1',
      data: { notes: 'screen' },
    });
    await controller.submitScorecard(req, 'int-1', { summary: 'strong fit' });

    expect(service.getRequisitionDetail).toHaveBeenCalledWith('company-1', 'req-1');
    expect(service.getCandidateDetail).toHaveBeenCalledWith('company-1', 'cand-1');
    expect(service.createApplication).toHaveBeenCalledWith('company-1', {
      requisition_id: 'req-1',
      candidate_id: 'cand-1',
    });
    expect(service.updateStage).toHaveBeenCalledWith('company-1', 'app-1', 'interview1');
    expect(service.scheduleInterview).toHaveBeenCalledWith('company-1', 'app-1', {
      notes: 'screen',
    });
    expect(service.submitScorecard).toHaveBeenCalledWith('company-1', 'int-1', 'user-1', {
      summary: 'strong fit',
    });
  });
});
