import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentStorageService } from '../../common/services/storage.service';
import { PrismaService } from '../../database/prisma.service';
import { ComplianceService } from './compliance.service';

describe('ComplianceService', () => {
  let service: ComplianceService;
  let prisma: {
    complianceDeadline: {
      findFirst: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      groupBy: jest.Mock;
    };
    complianceProof: {
      create: jest.Mock;
    };
    complianceAuditLog: {
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let storageService: {
    uploadFile: jest.Mock;
    isCompanyOwnedUrl: jest.Mock;
    extractKeyFromUrl: jest.Mock;
    getPresignedUrl: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      complianceDeadline: {
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      complianceProof: {
        create: jest.fn(),
      },
      complianceAuditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    storageService = {
      uploadFile: jest.fn(),
      isCompanyOwnedUrl: jest.fn(),
      extractKeyFromUrl: jest.fn(),
      getPresignedUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplianceService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: DocumentStorageService,
          useValue: storageService,
        },
      ],
    }).compile();

    service = module.get<ComplianceService>(ComplianceService);
  });

  it('rejects reading a deadline outside the caller company', async () => {
    prisma.complianceDeadline.findFirst.mockResolvedValue(null);

    await expect(service.getDeadlineById('company-1', 'deadline-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects updating a deadline outside the caller company', async () => {
    prisma.complianceDeadline.findFirst.mockResolvedValue(null);

    await expect(
      service.updateDeadline('company-1', 'deadline-1', { title: 'Updated' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects filing a deadline outside the caller company before uploading proof', async () => {
    prisma.complianceDeadline.findFirst.mockResolvedValue(null);

    await expect(
      service.fileDeadline(
        'company-1',
        'deadline-1',
        {
          buffer: Buffer.from('proof'),
          originalname: 'proof.pdf',
          mimetype: 'application/pdf',
          size: 128,
        },
        {
          filing_date: '2026-03-23',
          reference_no: 'REF-1',
          notes: 'Filed',
          userId: 'user-1',
          ipAddress: '127.0.0.1',
        },
      ),
    ).rejects.toThrow(NotFoundException);

    expect(storageService.uploadFile).not.toHaveBeenCalled();
  });

  it('returns presigned proof download URLs for managed files', async () => {
    prisma.complianceDeadline.findFirst.mockResolvedValue({
      id: 'deadline-1',
      proofs: [
        {
          id: 'proof-1',
          file_url: 'https://storage.example.com/bucket/company-1/proof.pdf',
        },
      ],
      assignee: null,
      assignments: [],
      audit_logs: [],
    });
    storageService.isCompanyOwnedUrl.mockReturnValue(true);
    storageService.extractKeyFromUrl.mockReturnValue('company-1/proof.pdf');
    storageService.getPresignedUrl.mockResolvedValue('https://signed.example.com/proof.pdf');

    const result = await service.getDeadlineById('company-1', 'deadline-1');

    expect(storageService.getPresignedUrl).toHaveBeenCalledWith('company-1/proof.pdf');
    expect(result.proofs[0].download_url).toBe('https://signed.example.com/proof.pdf');
  });
});
