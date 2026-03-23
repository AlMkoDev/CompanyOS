import { BadRequestException } from '@nestjs/common';
import { PODocumentController } from './po-document.controller';

describe('PODocumentController', () => {
  let controller: PODocumentController;
  let service: {
    uploadPODocument: jest.Mock;
  };

  beforeEach(() => {
    service = {
      uploadPODocument: jest.fn(),
    };

    controller = new PODocumentController(service as any);
  });

  it('passes sanitized upload metadata to the PO document service', async () => {
    const req = { user: { companyId: 'company-1', userId: 'user-1' } };
    const file = {
      buffer: Buffer.from('pdf'),
      originalname: '..\\supplier\\PO Final.PDF',
      mimetype: 'application/pdf',
      size: 3,
    };

    await controller.uploadPODocument(req, 'po-1', file);

    expect(service.uploadPODocument).toHaveBeenCalledWith(
      'company-1',
      'po-1',
      file.buffer,
      'PO Final.PDF',
      'application/pdf',
      'user-1',
    );
  });

  it('rejects unsupported uploaded file types before calling the service', async () => {
    const req = { user: { companyId: 'company-1', userId: 'user-1' } };

    await expect(
      controller.uploadPODocument(req, 'po-1', {
        buffer: Buffer.from('not-pdf'),
        originalname: 'po.txt',
        mimetype: 'text/plain',
        size: 7,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(service.uploadPODocument).not.toHaveBeenCalled();
  });
});
