import { Test, TestingModule } from '@nestjs/testing';
import { DmsController } from './dms.controller';
import { DmsService } from './dms.service';

describe('DmsController', () => {
  let controller: DmsController;
  let service: {
    createFolder: jest.Mock;
    getExplorer: jest.Mock;
    uploadDocument: jest.Mock;
    getDocumentDetail: jest.Mock;
    addVersion: jest.Mock;
    toggleLegalHold: jest.Mock;
    deleteDocument: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      createFolder: jest.fn(),
      getExplorer: jest.fn(),
      uploadDocument: jest.fn(),
      getDocumentDetail: jest.fn(),
      addVersion: jest.fn(),
      toggleLegalHold: jest.fn(),
      deleteDocument: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DmsController],
      providers: [
        {
          provide: DmsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<DmsController>(DmsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes company context to document detail access', async () => {
    const req = { user: { companyId: 'company-1' } };

    await controller.getDocumentDetail(req, 'doc-1');

    expect(service.getDocumentDetail).toHaveBeenCalledWith('company-1', 'doc-1');
  });

  it('passes company context to add version', async () => {
    const req = { user: { companyId: 'company-1', userId: 'user-1' } };

    await controller.addVersion(req, 'doc-1', {
      fileUrl: 'https://files/doc-v2.pdf',
      changeLog: 'minor update',
    });

    expect(service.addVersion).toHaveBeenCalledWith(
      'company-1',
      'doc-1',
      'https://files/doc-v2.pdf',
      'user-1',
      'minor update',
    );
  });

  it('passes company context to legal hold toggling and deletion', async () => {
    const req = { user: { companyId: 'company-1', userId: 'user-1' } };

    await controller.toggleLegalHold(req, 'doc-1', { reason: 'investigation' });
    await controller.deleteDocument(req, 'doc-1');

    expect(service.toggleLegalHold).toHaveBeenCalledWith(
      'company-1',
      'doc-1',
      'user-1',
      'investigation',
    );
    expect(service.deleteDocument).toHaveBeenCalledWith('company-1', 'doc-1');
  });
});
