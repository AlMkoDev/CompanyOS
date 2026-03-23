import { Test, TestingModule } from '@nestjs/testing';
import { DmsService } from './dms.service';
import { PrismaService } from '../../database/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DocumentStorageService } from '../../common/services/storage.service';

describe('DmsService', () => {
  let service: DmsService;
  let prisma: {
    folder: {
      findFirst: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
    };
    document: {
      findFirst: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findUnique: jest.Mock;
    };
    documentVersion: {
      create: jest.Mock;
      deleteMany: jest.Mock;
    };
    legalHold: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let storageService: {
    extractKeyFromUrl: jest.Mock;
    isCompanyOwnedUrl: jest.Mock;
    deleteFile: jest.Mock;
    getPresignedUrl: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      folder: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
      document: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
      },
      documentVersion: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      legalHold: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    storageService = {
      extractKeyFromUrl: jest.fn(),
      isCompanyOwnedUrl: jest.fn(),
      deleteFile: jest.fn(),
      getPresignedUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DmsService,
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

    service = module.get<DmsService>(DmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects document detail access outside the caller company', async () => {
    prisma.document.findFirst.mockResolvedValue(null);

    await expect(service.getDocumentDetail('company-1', 'doc-1')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.document.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'doc-1',
        company_id: 'company-1',
      },
      include: {
        folder: true,
        versions: { orderBy: { version_no: 'desc' } },
        legal_holds: { orderBy: { created_at: 'desc' } },
        retention_policy: true,
      },
    });
  });

  it('rejects adding a version to a document outside the caller company', async () => {
    prisma.document.findFirst.mockResolvedValue(null);

    await expect(
      service.addVersion('company-1', 'doc-1', 'https://file', 'user-1', 'updated'),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns a presigned download URL for company-managed document files', async () => {
    prisma.document.findFirst.mockResolvedValue({
      id: 'doc-1',
      company_id: 'company-1',
      file_url: 'https://storage.example.com/bucket/company-1/current.pdf',
      folder: null,
      versions: [
        {
          id: 'version-1',
          version_no: 1,
          file_url: 'https://storage.example.com/bucket/company-1/current.pdf',
          created_at: new Date('2026-03-23T00:00:00.000Z'),
        },
      ],
      legal_holds: [],
      retention_policy: null,
    });
    storageService.isCompanyOwnedUrl.mockReturnValue(true);
    storageService.extractKeyFromUrl.mockReturnValue('company-1/current.pdf');
    storageService.getPresignedUrl.mockResolvedValue('https://signed.example.com/current.pdf');

    const result = await service.getDocumentDetail('company-1', 'doc-1');

    expect(storageService.getPresignedUrl).toHaveBeenCalledWith('company-1/current.pdf');
    expect(result.download_url).toBe('https://signed.example.com/current.pdf');
    expect(result.versions[0].download_url).toBe('https://signed.example.com/current.pdf');
  });

  it('rejects upload when a managed file URL points outside the caller company storage path', async () => {
    prisma.folder.findFirst.mockResolvedValue({ id: 'folder-1', company_id: 'company-1' });
    storageService.extractKeyFromUrl.mockReturnValue('company-2/policy.pdf');
    storageService.isCompanyOwnedUrl.mockReturnValue(false);

    await expect(
      service.uploadDocument('company-1', 'user-1', {
        folder_id: 'folder-1',
        classification: 'internal',
        name: 'policy.pdf',
        file_url: 'https://storage.example.com/bucket/company-2/policy.pdf',
        file_type: 'application/pdf',
        size_bytes: 1024,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates the document file_url when adding a new version', async () => {
    prisma.document.findFirst.mockResolvedValue({
      id: 'doc-1',
      company_id: 'company-1',
      version: 2,
    });
    storageService.extractKeyFromUrl.mockReturnValue(null);
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        document: {
          update: prisma.document.update,
        },
        documentVersion: {
          create: prisma.documentVersion.create,
        },
      }),
    );
    prisma.documentVersion.create.mockResolvedValue({ id: 'version-3' });

    await service.addVersion(
      'company-1',
      'doc-1',
      'https://files/doc-v3.pdf',
      'user-1',
      'updated',
    );

    expect(prisma.document.update).toHaveBeenCalledWith({
      where: { id: 'doc-1' },
      data: {
        version: 3,
        file_url: 'https://files/doc-v3.pdf',
      },
    });
  });

  it('rejects upload into a folder outside the caller company', async () => {
    prisma.folder.findFirst.mockResolvedValue(null);

    await expect(
      service.uploadDocument('company-1', 'user-1', {
        folder_id: 'folder-1',
        classification: 'internal',
        name: 'policy.pdf',
        file_url: 'https://files/policy.pdf',
        file_type: 'application/pdf',
        size_bytes: 1024,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects deleting a document outside the caller company', async () => {
    prisma.document.findFirst.mockResolvedValue(null);

    await expect(service.deleteDocument('company-1', 'doc-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deletes managed storage files when deleting a document', async () => {
    prisma.document.findFirst.mockResolvedValue({
      id: 'doc-1',
      company_id: 'company-1',
      file_url: 'https://storage.example.com/bucket/company-1/current.pdf',
      versions: [
        { file_url: 'https://storage.example.com/bucket/company-1/current.pdf' },
        { file_url: 'https://storage.example.com/bucket/company-1/old.pdf' },
        { file_url: 'https://external.example.com/file.pdf' },
      ],
    });
    prisma.legalHold.findFirst.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        documentVersion: {
          deleteMany: prisma.documentVersion.deleteMany,
        },
        legalHold: {
          deleteMany: prisma.legalHold.deleteMany,
        },
        document: {
          delete: prisma.document.delete,
        },
      }),
    );
    prisma.document.delete.mockResolvedValue({ id: 'doc-1' });
    storageService.isCompanyOwnedUrl.mockImplementation(
      (url: string, companyId: string) =>
        url.includes(`/${companyId}/`) && !url.includes('external.example.com'),
    );
    storageService.extractKeyFromUrl.mockImplementation((url: string) => {
      if (url.includes('current.pdf')) return 'company-1/current.pdf';
      if (url.includes('old.pdf')) return 'company-1/old.pdf';
      return null;
    });

    await service.deleteDocument('company-1', 'doc-1');

    expect(storageService.deleteFile).toHaveBeenCalledTimes(2);
    expect(storageService.deleteFile).toHaveBeenCalledWith('company-1/current.pdf');
    expect(storageService.deleteFile).toHaveBeenCalledWith('company-1/old.pdf');
  });
});
