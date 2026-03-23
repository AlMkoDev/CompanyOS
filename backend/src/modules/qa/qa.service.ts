import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateAuditFindingDto,
  CreateChecklistDto,
  CreateCorrectiveActionDto,
  CreateNcrDto,
  RootCauseAnalysisDto,
  UpdateAuditFindingDto,
  UpdateChecklistDto,
  UpdateCorrectiveActionDto,
  UpdateNcrDto,
} from './dto/qa.dto';

@Injectable()
export class QaService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyNcr(companyId: string, id: string) {
    const ncr = await this.prisma.nCR.findFirst({
      where: { id, company_id: companyId },
    });
    if (!ncr) throw new NotFoundException('NCR not found');
    return ncr;
  }

  private async getCompanyCar(companyId: string, carId: string) {
    const car = await this.prisma.correctiveAction.findFirst({
      where: {
        id: carId,
        ncr: {
          company_id: companyId,
        },
      },
    });
    if (!car) throw new NotFoundException('Corrective Action not found');
    return car;
  }

  private async getCompanyChecklist(companyId: string, id: string) {
    const checklist = await this.prisma.auditChecklist.findFirst({
      where: { id, company_id: companyId },
    });
    if (!checklist) throw new NotFoundException('Checklist not found');
    return checklist;
  }

  private async getCompanyAuditFinding(companyId: string, id: string) {
    const auditFinding = await this.prisma.auditFinding.findFirst({
      where: { id, company_id: companyId },
    });
    if (!auditFinding) throw new NotFoundException('Audit finding not found');
    return auditFinding;
  }

  // === NCR Management ===

  async createNCR(companyId: string, userId: string, data: CreateNcrDto) {
    const ncrCount = await this.prisma.nCR.count({
      where: { company_id: companyId },
    });

    const ncrNo = `NCR-${String(ncrCount + 1).padStart(4, '0')}`;

    return this.prisma.nCR.create({
      data: {
        ...data,
        company_id: companyId,
        raised_by: userId,
        ncr_no: ncrNo,
        status: 'identified',
      },
      include: {
        rca: true,
        corrective_actions: true,
      },
    });
  }

  async getNCRs(companyId: string, filters?: { status?: string; severity?: string }) {
    const where: any = { company_id: companyId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.severity) {
      where.severity = filters.severity;
    }

    return this.prisma.nCR.findMany({
      where,
      include: {
        rca: true,
        corrective_actions: {
          include: {
            ncr: true,
          },
        },
      },
      orderBy: { raised_at: 'desc' },
    });
  }

  async getNCRDetail(companyId: string, id: string) {
    const ncr = await this.prisma.nCR.findFirst({
      where: { id, company_id: companyId },
      include: {
        rca: true,
        corrective_actions: {
          include: {
            audit_finding: true,
          },
        },
      },
    });

    if (!ncr) throw new NotFoundException('NCR not found');
    return ncr;
  }

  async updateNCR(companyId: string, id: string, data: UpdateNcrDto) {
    await this.getCompanyNcr(companyId, id);

    return this.prisma.nCR.update({
      where: { id },
      data,
    });
  }

  async deleteNCR(companyId: string, id: string) {
    await this.getCompanyNcr(companyId, id);

    return this.prisma.nCR.delete({
      where: { id },
    });
  }

  // === RCA (Root Cause Analysis) ===

  async createOrUpdateRCA(companyId: string, ncrId: string, conductedBy: string, data: RootCauseAnalysisDto) {
    await this.getCompanyNcr(companyId, ncrId);

    return this.prisma.rootCauseAnalysis.upsert({
      where: { ncr_id: ncrId },
      update: {
        five_whys: data.five_whys,
        final_root_cause: data.final_root_cause,
        conducted_by: conductedBy,
      },
      create: {
        ncr_id: ncrId,
        five_whys: data.five_whys,
        final_root_cause: data.final_root_cause,
        conducted_by: conductedBy,
      },
      include: {
        ncr: true,
      },
    });
  }

  async getRCA(companyId: string, ncrId: string) {
    await this.getCompanyNcr(companyId, ncrId);

    return this.prisma.rootCauseAnalysis.findFirst({
      where: {
        ncr_id: ncrId,
        ncr: {
          company_id: companyId,
        },
      },
      include: {
        ncr: true,
      },
    });
  }

  // === Corrective Actions (CAR) ===

  async createCAR(companyId: string, ncrId: string, data: CreateCorrectiveActionDto) {
    await this.getCompanyNcr(companyId, ncrId);

    return this.prisma.$transaction(async (tx) => {
      const car = await tx.correctiveAction.create({
        data: {
          ...data,
          ncr_id: ncrId,
        },
      });

      await tx.nCR.update({
        where: { id: ncrId },
        data: { status: 'CAR_open' },
      });

      return car;
    });
  }

  async updateCAR(companyId: string, carId: string, data: UpdateCorrectiveActionDto) {
    const car = await this.getCompanyCar(companyId, carId);

    // Auto-set verified_at when status changes to 'closed'
    if (data.status === 'closed' && !car.verified_at) {
      data.verified_at = new Date();

      // Update parent NCR status if all CARs are closed
      const updatedCar = await this.prisma.correctiveAction.update({
        where: { id: carId },
        data,
      });

      await this.updateParentNCRStatus(car.ncr_id);

      return updatedCar;
    }

    return this.prisma.correctiveAction.update({
      where: { id: carId },
      data,
    });
  }

  async deleteCAR(companyId: string, carId: string) {
    await this.getCompanyCar(companyId, carId);

    return this.prisma.correctiveAction.delete({
      where: { id: carId },
    });
  }

  private async updateParentNCRStatus(ncrId: string | null) {
    if (!ncrId) return;

    const openCars = await this.prisma.correctiveAction.count({
      where: { ncr_id: ncrId, status: { not: 'closed' } },
    });

    if (openCars === 0) {
      await this.prisma.nCR.update({
        where: { id: ncrId },
        data: { status: 'closed' },
      });
    }
  }

  async getCARSByNCR(companyId: string, ncrId: string) {
    await this.getCompanyNcr(companyId, ncrId);

    return this.prisma.correctiveAction.findMany({
      where: { ncr_id: ncrId },
      orderBy: { due_date: 'asc' },
    });
  }

  // === Audit Checklists ===

  async createChecklist(companyId: string, data: CreateChecklistDto) {
    return this.prisma.auditChecklist.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });
  }

  async getChecklists(companyId: string, category?: string) {
    const where: any = { company_id: companyId };
    if (category) {
      where.category = category;
    }

    return this.prisma.auditChecklist.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async getChecklistDetail(companyId: string, id: string) {
    return this.getCompanyChecklist(companyId, id);
  }

  async updateChecklist(companyId: string, id: string, data: UpdateChecklistDto) {
    await this.getCompanyChecklist(companyId, id);

    return this.prisma.auditChecklist.update({
      where: { id },
      data,
    });
  }

  async deleteChecklist(companyId: string, id: string) {
    await this.getCompanyChecklist(companyId, id);

    return this.prisma.auditChecklist.delete({
      where: { id },
    });
  }

  // === Audit Findings ===

  async createAuditFinding(companyId: string, data: CreateAuditFindingDto) {
    return this.prisma.auditFinding.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });
  }

  async getAuditFindings(companyId: string, filters?: { severity?: string; status?: string }) {
    const where: any = { company_id: companyId };

    if (filters?.severity) {
      where.severity = filters.severity;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    return this.prisma.auditFinding.findMany({
      where,
      include: {
        corrective_actions: true,
      },
      orderBy: { id: 'desc' }, // Use id as fallback since created_at doesn't exist
    });
  }

  async updateAuditFinding(companyId: string, id: string, data: UpdateAuditFindingDto) {
    await this.getCompanyAuditFinding(companyId, id);

    return this.prisma.auditFinding.update({
      where: { id },
      data,
    });
  }

  async deleteAuditFinding(companyId: string, id: string) {
    await this.getCompanyAuditFinding(companyId, id);

    return this.prisma.auditFinding.delete({
      where: { id },
    });
  }

  // === Analytics & Dashboard ===

  async getQaDashboard(companyId: string) {
    const [ncrs, auditFindings] = await Promise.all([
      this.prisma.nCR.findMany({
        where: { company_id: companyId },
        include: {
          corrective_actions: true,
        },
      }),
      this.prisma.auditFinding.findMany({
        where: { company_id: companyId },
        include: {
          corrective_actions: true,
        },
      }),
    ]);

    const now = new Date();

    // NCR Statistics
    const totalNCRs = ncrs.length;
    const openNCRs = ncrs.filter((n: any) => n.status !== 'closed').length;
    const closedNCRs = ncrs.filter((n: any) => n.status === 'closed').length;
    const closureRate = totalNCRs > 0 ? Math.round((closedNCRs / totalNCRs) * 100) : 0;

    const ncresBySeverity = {
      critical: ncrs.filter((n: any) => n.severity === 'critical').length,
      high: ncrs.filter((n: any) => n.severity === 'high').length,
      medium: ncrs.filter((n: any) => n.severity === 'medium').length,
      low: ncrs.filter((n: any) => n.severity === 'low').length,
    };

    const ncresByStatus = {
      identified: ncrs.filter((n: any) => n.status === 'identified').length,
      rca: ncrs.filter((n: any) => n.status === 'RCA').length,
      carOpen: ncrs.filter((n: any) => n.status === 'CAR_open').length,
      closed: ncrs.filter((n: any) => n.status === 'closed').length,
    };

    // Overdue CARs
    const overdueCars = ncrs.flatMap((n: any) =>
      n.corrective_actions.filter((car: any) => {
        if (car.status === 'closed') return false;
        if (!car.due_date) return false;
        return new Date(car.due_date) < now;
      }),
    ).length;

    // Audit Findings Statistics
    const totalFindings = auditFindings.length;
    const openFindings = auditFindings.filter((f: any) => f.status !== 'closed').length;
    const findingsBySeverity = {
      major: auditFindings.filter((f: any) => f.severity === 'major').length,
      minor: auditFindings.filter((f: any) => f.severity === 'minor').length,
      observation: auditFindings.filter((f: any) => f.severity === 'observation').length,
    };

    // Calculate average closure time (for closed NCRs)
    const closedNCRList = ncrs.filter((n: any) => n.status === 'closed');
    let averageClosureTime = 0;
    if (closedNCRList.length > 0) {
      // This is simplified - in production you'd track created_at and closed_at
      averageClosureTime = 7; // Default placeholder
    }

    return {
      ncres: {
        total: totalNCRs,
        open: openNCRs,
        closed: closedNCRs,
        closureRate,
        bySeverity: ncresBySeverity,
        byStatus: ncresByStatus,
        overdueCars,
        averageClosureTime,
      },
      audits: {
        totalFindings,
        openFindings,
        bySeverity: findingsBySeverity,
      },
    };
  }

  async getNcrClosureReport(companyId: string) {
    const ncres = await this.prisma.nCR.findMany({
      where: { company_id: companyId },
      include: {
        corrective_actions: true,
      },
    });

    const report = {
      summary: {
        total: ncres.length,
        closed: 0,
        open: 0,
        averageDaysToClose: 0,
      },
      trends: [] as any[],
    };

    const closedNCRs = ncres.filter((n: any) => n.status === 'closed');
    report.summary.closed = closedNCRs.length;
    report.summary.open = ncres.length - closedNCRs.length;

    // Calculate average days to close (simplified)
    if (closedNCRs.length > 0) {
      report.summary.averageDaysToClose = 7; // Placeholder
    }

    // Group by month for trend analysis
    const monthlyTrends: Record<string, any> = {};
    ncres.forEach((ncr: any) => {
      const month = new Date(ncr.raised_at).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyTrends[month]) {
        monthlyTrends[month] = { raised: 0, closed: 0 };
      }
      monthlyTrends[month].raised++;
      if (ncr.status === 'closed') {
        monthlyTrends[month].closed++;
      }
    });

    report.trends = Object.entries(monthlyTrends).map(([month, data]: [string, any]) => ({
      month,
      raised: data.raised,
      closed: data.closed,
    }));

    return report;
  }
}
