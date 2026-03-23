import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { POStatus } from '@prisma/client';
import { DocumentStorageService } from '../../common/services/storage.service';
import { PrismaService } from '../../database/prisma.service';
import { POPDFGeneratorService } from './po-pdf-generator.service';
import { PODocumentService } from './po-document.service';

describe('PODocumentService', () => {
  let service: PODocumentService;
  let prisma: {
    opsPurchaseOrder: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let storageService: {
    uploadFile: jest.Mock;
    getPresignedUrl: jest.Mock;
    deleteFile: jest.Mock;
    extractKeyFromUrl: jest.Mock;
    isCompanyOwnedUrl: jest.Mock;
  };
  let pdfGenerator: {
    generatePOPDF: jest.Mock;
    generatePOAcknowledgment: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      opsPurchaseOrder: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    storageService = {
      uploadFile: jest.fn(),
      getPresignedUrl: jest.fn(),
      deleteFile: jest.fn(),
      extractKeyFromUrl: jest.fn(),
      isCompanyOwnedUrl: jest.fn(),
    };
    pdfGenerator = {
      generatePOPDF: jest.fn(),
      generatePOAcknowledgment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PODocumentService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: DocumentStorageService,
          useValue: storageService,
        },
        {
          provide: POPDFGeneratorService,
          useValue: pdfGenerator,
        },
      ],
    }).compile();

    service = module.get<PODocumentService>(PODocumentService);
  });

  it('returns a presigned download URL only for company-owned managed files', async () => {
    prisma.opsPurchaseOrder.findFirst.mockResolvedValue({
      pdf_url: 'https://storage.example.com/bucket/company-1/po.pdf',
      po_number: 'PO-1001',
      status: POStatus.APPROVED,
    });
    storageService.isCompanyOwnedUrl.mockReturnValue(true);
    storageService.extractKeyFromUrl.mockReturnValue('company-1/po.pdf');
    storageService.getPresignedUrl.mockResolvedValue('https://signed.example.com/po.pdf');

    const result = await service.getPODocument('company-1', 'po-1');

    expect(storageService.getPresignedUrl).toHaveBeenCalledWith('company-1/po.pdf');
    expect(result).toEqual({
      po_number: 'PO-1001',
      status: POStatus.APPROVED,
      pdf_url: 'https://storage.example.com/bucket/company-1/po.pdf',
      download_url: 'https://signed.example.com/po.pdf',
    });
  });

  it('does not generate a presigned URL for external or foreign-company files', async () => {
    prisma.opsPurchaseOrder.findFirst.mockResolvedValue({
      pdf_url: 'https://external.example.com/po.pdf',
      po_number: 'PO-1001',
      status: POStatus.APPROVED,
    });
    storageService.isCompanyOwnedUrl.mockReturnValue(false);

    const result = await service.getPODocument('company-1', 'po-1');

    expect(storageService.getPresignedUrl).not.toHaveBeenCalled();
    expect(result).toEqual({
      po_number: 'PO-1001',
      status: POStatus.APPROVED,
      pdf_url: 'https://external.example.com/po.pdf',
    });
  });

  it('deletes storage objects only for company-owned managed files', async () => {
    prisma.opsPurchaseOrder.findFirst.mockResolvedValue({
      pdf_url: 'https://storage.example.com/bucket/company-1/po.pdf',
    });
    prisma.opsPurchaseOrder.update.mockResolvedValue({ id: 'po-1' });
    storageService.isCompanyOwnedUrl.mockReturnValue(true);
    storageService.extractKeyFromUrl.mockReturnValue('company-1/po.pdf');

    await service.deletePODocument('company-1', 'po-1');

    expect(storageService.deleteFile).toHaveBeenCalledWith('company-1/po.pdf');
    expect(prisma.opsPurchaseOrder.update).toHaveBeenCalledWith({
      where: { id: 'po-1' },
      data: { pdf_url: null },
    });
  });

  it('clears PO metadata without deleting storage for external or foreign-company files', async () => {
    prisma.opsPurchaseOrder.findFirst.mockResolvedValue({
      pdf_url: 'https://external.example.com/po.pdf',
    });
    prisma.opsPurchaseOrder.update.mockResolvedValue({ id: 'po-1' });
    storageService.isCompanyOwnedUrl.mockReturnValue(false);

    await service.deletePODocument('company-1', 'po-1');

    expect(storageService.deleteFile).not.toHaveBeenCalled();
    expect(prisma.opsPurchaseOrder.update).toHaveBeenCalledWith({
      where: { id: 'po-1' },
      data: { pdf_url: null },
    });
  });

  it('rejects missing PO documents', async () => {
    prisma.opsPurchaseOrder.findFirst.mockResolvedValue(null);

    await expect(service.deletePODocument('company-1', 'po-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects non-pdf uploads before writing to storage', async () => {
    prisma.opsPurchaseOrder.findFirst.mockResolvedValue({
      id: 'po-1',
      po_number: 'PO-1001',
    });

    await expect(
      service.uploadPODocument(
        'company-1',
        'po-1',
        Buffer.from('plain-text'),
        'notes.txt',
        'text/plain',
        'user-1',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(storageService.uploadFile).not.toHaveBeenCalled();
  });
});
