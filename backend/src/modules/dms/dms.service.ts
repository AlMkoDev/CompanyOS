import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DocumentStorageService } from '../../common/services/storage.service';
import {
  CreateFolderDto,
  UploadDocumentDto,
} from './dto/dms.dto';

@Injectable()
export class DmsService {
  constructor(
    private prisma: PrismaService,
    private storageService: DocumentStorageService,
  ) {}

  private async assertFolderAccess(companyId: string, folderId?: string | null) {
    if (!folderId) {
      return;
    }

    const folder = await this.prisma.folder.findFirst({
      where: {
        id: folderId,
        company_id: companyId,
      },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }
  }

  private async getCompanyDocument(companyId: string, docId: string) {
    const doc = await this.prisma.document.findFirst({
      where: {
        id: docId,
        company_id: companyId,
      },
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    return doc;
  }

  private assertCompanyManagedFileUrl(companyId: string, fileUrl: string) {
    const storageKey = this.storageService.extractKeyFromUrl(fileUrl);
    if (!storageKey) {
      return;
    }

    if (!this.storageService.isCompanyOwnedUrl(fileUrl, companyId)) {
      throw new BadRequestException(
        'Document file must belong to the same company storage path.',
      );
    }
  }

  private async buildManagedDownloadUrl(companyId: string, fileUrl?: string | null) {
    if (!fileUrl || !this.storageService.isCompanyOwnedUrl(fileUrl, companyId)) {
      return undefined;
    }

    const key = this.storageService.extractKeyFromUrl(fileUrl);
    if (!key) {
      return undefined;
    }

    return this.storageService.getPresignedUrl(key);
  }

  // --- Folders ---

  async createFolder(companyId: string, data: CreateFolderDto) {
    await this.assertFolderAccess(companyId, data.parent_id);

    return this.prisma.folder.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });
  }

  async getExplorer(companyId: string, folderId: string | null = null) {
    await this.assertFolderAccess(companyId, folderId);

    const folders = await this.prisma.folder.findMany({
      where: { 
        company_id: companyId,
        parent_id: folderId
      },
      include: {
        _count: {
          select: { documents: true, children: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const documents = await this.prisma.document.findMany({
      where: {
        company_id: companyId,
        folder_id: folderId
      },
      include: {
        versions: {
          orderBy: { version_no: 'desc' },
          take: 1
        },
        legal_holds: {
          where: { active: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return { folders, documents };
  }

  // --- Documents & Versions ---

  async uploadDocument(companyId: string, creatorId: string, data: UploadDocumentDto) {
    const { folder_id, classification, name, file_url, file_type, size_bytes } = data;
    await this.assertFolderAccess(companyId, folder_id);
    this.assertCompanyManagedFileUrl(companyId, file_url);

    return this.prisma.$transaction(async (tx) => {
      const document = await tx.document.create({
        data: {
          company_id: companyId,
          folder_id,
          classification,
          name,
          file_url,
          file_type,
          size_bytes,
          version: 1,
        },
      });

      await tx.documentVersion.create({
        data: {
          doc_id: document.id,
          version_no: 1,
          file_url,
          created_by: creatorId,
        },
      });

      return document;
    });
  }

  async addVersion(
    companyId: string,
    docId: string,
    fileUrl: string,
    creatorId: string,
    changeLog?: string,
  ) {
    const doc = await this.getCompanyDocument(companyId, docId);
    this.assertCompanyManagedFileUrl(companyId, fileUrl);

    const newVersionNo = doc.version + 1;

    return this.prisma.$transaction(async (tx) => {
      await tx.document.update({
        where: { id: docId },
        data: {
          version: newVersionNo,
          file_url: fileUrl,
        },
      });

      return tx.documentVersion.create({
        data: {
          doc_id: docId,
          version_no: newVersionNo,
          file_url: fileUrl,
          change_log: changeLog,
          created_by: creatorId,
        },
      });
    });
  }

  async getDocumentDetail(companyId: string, id: string) {
    const doc = await this.prisma.document.findFirst({
      where: {
        id,
        company_id: companyId,
      },
      include: {
        folder: true,
        versions: { orderBy: { version_no: 'desc' } },
        legal_holds: { orderBy: { created_at: 'desc' } },
        retention_policy: true,
      }
    });
    if (!doc) throw new NotFoundException('Document not found');

    const [downloadUrl, versions] = await Promise.all([
      this.buildManagedDownloadUrl(companyId, doc.file_url),
      Promise.all(
        doc.versions.map(async (version) => ({
          ...version,
          download_url: await this.buildManagedDownloadUrl(companyId, version.file_url),
        })),
      ),
    ]);

    return {
      ...doc,
      download_url: downloadUrl,
      versions,
    };
  }

  // --- Governance ---

  async toggleLegalHold(companyId: string, docId: string, userId: string, reason?: string) {
    await this.getCompanyDocument(companyId, docId);

    const existing = await this.prisma.legalHold.findFirst({
      where: { doc_id: docId, active: true }
    });

    if (existing) {
      return this.prisma.legalHold.update({
        where: { id: existing.id },
        data: { active: false }
      });
    } else {
      return this.prisma.legalHold.create({
        data: {
          doc_id: docId,
          reason: reason || 'Routine compliance hold',
          placed_by: userId,
          active: true
        }
      });
    }
  }

  async deleteDocument(companyId: string, id: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id,
        company_id: companyId,
      },
      include: {
        versions: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const hold = await this.prisma.legalHold.findFirst({
      where: { doc_id: id, active: true }
    });

    if (hold) {
      throw new Error('Deletion restricted: Active legal hold in place.');
    }

    const managedUrls = new Set(
      [document.file_url, ...document.versions.map((version) => version.file_url)].filter(
        (url): url is string => Boolean(url) && this.storageService.isCompanyOwnedUrl(url, companyId),
      ),
    );

    const deleted = await this.prisma.$transaction(async (tx) => {
      await tx.documentVersion.deleteMany({ where: { doc_id: id } });
      await tx.legalHold.deleteMany({ where: { doc_id: id } });
      return tx.document.delete({ where: { id } });
    });

    for (const url of managedUrls) {
      const key = this.storageService.extractKeyFromUrl(url);
      if (key) {
        await this.storageService.deleteFile(key);
      }
    }

    return deleted;
  }
}
