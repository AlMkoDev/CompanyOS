import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import { DocumentStorageService } from '../../common/services/storage.service';
import {
  CreateComplianceDeadlineDto,
  FileComplianceDeadlineDto,
  UpdateComplianceDeadlineDto,
} from './dto/compliance.dto';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: DocumentStorageService,
  ) {}

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

  private async getCompanyDeadline(companyId: string, id: string) {
    const deadline = await this.prisma.complianceDeadline.findFirst({
      where: {
        id,
        company_id: companyId,
      },
    });

    if (!deadline) {
      throw new NotFoundException('Compliance deadline not found');
    }

    return deadline;
  }

  async createDeadline(data: Prisma.ComplianceDeadlineUncheckedCreateInput & CreateComplianceDeadlineDto) {
    return this.prisma.complianceDeadline.create({
      data,
    });
  }

  async getDeadlines(companyId: string) {
    return this.prisma.complianceDeadline.findMany({
      where: { company_id: companyId, is_active: true },
      include: {
        assignee: {
          select: { id: true, first_name: true, last_name: true }
        },
        _count: {
          select: { proofs: true }
        }
      },
      orderBy: { due_date: 'asc' },
    });
  }

  async getDeadlineById(companyId: string, id: string) {
    const deadline = await this.prisma.complianceDeadline.findFirst({
      where: {
        id,
        company_id: companyId,
      },
      include: {
        assignee: true,
        assignments: {
          include: { user: true }
        },
        proofs: {
          include: { uploader: true }
        },
        audit_logs: {
          include: { user: true },
          orderBy: { created_at: 'desc' }
        }
      },
    });

    if (!deadline) {
      throw new NotFoundException('Compliance deadline not found');
    }

    return {
      ...deadline,
      proofs: await Promise.all(
        deadline.proofs.map(async (proof) => ({
          ...proof,
          download_url: await this.buildManagedDownloadUrl(companyId, proof.file_url),
        })),
      ),
    };
  }

  async updateDeadline(
    companyId: string,
    id: string,
    data: Prisma.ComplianceDeadlineUncheckedUpdateInput & UpdateComplianceDeadlineDto,
  ) {
    await this.getCompanyDeadline(companyId, id);

    return this.prisma.complianceDeadline.update({
      where: { id },
      data,
    });
  }

  async fileDeadline(
    companyId: string,
    deadlineId: string, 
    file: any, 
    data: FileComplianceDeadlineDto & {
      userId: string;
      ipAddress?: string;
      fileName?: string;
      fileMimeType?: string;
      fileSize?: number;
    }
  ) {
    await this.getCompanyDeadline(companyId, deadlineId);

    return this.prisma.$transaction(async (tx) => {
      let proofUrl = '';
      let proofId = null;

      if (file) {
        const uploadResult = await this.storageService.uploadFile(
          file.buffer,
          data.fileName || file.originalname,
          data.fileMimeType || file.mimetype,
          companyId
        );
        proofUrl = uploadResult.url;

        const proof = await tx.complianceProof.create({
          data: {
            deadline_id: deadlineId,
            file_name: data.fileName || file.originalname,
            file_url: proofUrl,
            file_type: data.fileMimeType || file.mimetype,
            file_size: data.fileSize ?? file.size,
            uploaded_by: data.userId,
            ip_address: data.ipAddress,
          },
        });
        proofId = proof.id;
      }

      const updatedDeadline = await tx.complianceDeadline.update({
        where: { id: deadlineId },
        data: {
          status: 'filed',
          filing_date: new Date(data.filing_date),
          reference_no: data.reference_no,
          notes: data.notes,
          proof_url: proofUrl || undefined,
        },
      });

      await tx.complianceAuditLog.create({
        data: {
          deadline_id: deadlineId,
          user_id: data.userId,
          action: 'file',
          details: `Marked as filed on ${data.filing_date}. Reference: ${data.reference_no || 'N/A'}. ${proofId ? 'Proof uploaded.' : 'No proof attached.'}`,
          ip_address: data.ipAddress,
        },
      });

      return updatedDeadline;
    });
  }

  async getCalendarData(companyId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const deadlines = await this.prisma.complianceDeadline.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        due_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        assignee: {
          select: { id: true, first_name: true, last_name: true }
        }
      },
      orderBy: { due_date: 'asc' },
    });

    return { deadlines };
  }

  async getDashboard(companyId: string) {
    const total = await this.prisma.complianceDeadline.count({
      where: { company_id: companyId, is_active: true }
    });

    const byStatus = await this.prisma.complianceDeadline.groupBy({
      by: ['status'],
      where: { company_id: companyId, is_active: true },
      _count: true
    });

    const upcoming = await this.prisma.complianceDeadline.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        status: { in: ['pending', 'overdue'] },
        due_date: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
        }
      },
      orderBy: { due_date: 'asc' },
      take: 5
    });

    return {
      total,
      stats: byStatus.reduce((acc, curr) => ({ ...acc, [curr.status]: curr._count }), {}),
      upcoming
    };
  }
}
