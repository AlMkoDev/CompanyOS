import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';

describe('ComplianceController', () => {
  let controller: ComplianceController;
  let service: {
    getDashboard: jest.Mock;
    getCalendarData: jest.Mock;
    getDeadlines: jest.Mock;
    getDeadlineById: jest.Mock;
    createDeadline: jest.Mock;
    updateDeadline: jest.Mock;
    fileDeadline: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getDashboard: jest.fn(),
      getCalendarData: jest.fn(),
      getDeadlines: jest.fn(),
      getDeadlineById: jest.fn(),
      createDeadline: jest.fn(),
      updateDeadline: jest.fn(),
      fileDeadline: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComplianceController],
      providers: [
        {
          provide: ComplianceService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<ComplianceController>(ComplianceController);
  });

  it('passes company context to deadline reads and updates', async () => {
    const req = { user: { companyId: 'company-1' } };

    await controller.getDeadline(req, 'deadline-1');
    await controller.updateDeadline(req, 'deadline-1', { title: 'Updated' });

    expect(service.getDeadlineById).toHaveBeenCalledWith('company-1', 'deadline-1');
    expect(service.updateDeadline).toHaveBeenCalledWith('company-1', 'deadline-1', {
      title: 'Updated',
    });
  });

  it('passes company context through the filing route', async () => {
    const req = { user: { companyId: 'company-1', userId: 'user-1' }, ip: '127.0.0.1' };
    const file = {
      buffer: Buffer.from('proof'),
      originalname: 'proof.pdf',
      mimetype: 'application/pdf',
      size: 128,
    };

    await controller.fileDeadline('deadline-1', file, req, {
      filing_date: '2026-03-23',
      reference_no: 'REF-1',
      notes: 'Filed',
    } as any);

    expect(service.fileDeadline).toHaveBeenCalledWith('company-1', 'deadline-1', file, {
      filing_date: '2026-03-23',
      reference_no: 'REF-1',
      notes: 'Filed',
      userId: 'user-1',
      ipAddress: '127.0.0.1',
      fileName: 'proof.pdf',
      fileMimeType: 'application/pdf',
      fileSize: 128,
    });
  });

  it('rejects unsupported proof uploads before calling the service', async () => {
    const req = { user: { companyId: 'company-1', userId: 'user-1' }, ip: '127.0.0.1' };

    await expect(
      controller.fileDeadline(
        'deadline-1',
        {
          buffer: Buffer.from('bad'),
          originalname: 'proof.exe',
          mimetype: 'application/x-msdownload',
          size: 3,
        },
        req,
        {
          filing_date: '2026-03-23',
        } as any,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(service.fileDeadline).not.toHaveBeenCalled();
  });
});
