import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateKeyResultDto,
  CreateObjectiveDto,
  CreateOkrCycleDto,
  SubmitOkrCheckInDto,
} from './dto/okr.dto';

@Injectable()
export class OkrService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyCycle(companyId: string, cycleId: string) {
    const cycle = await this.prisma.oKRCycle.findFirst({
      where: { id: cycleId, company_id: companyId },
    });
    if (!cycle) throw new NotFoundException('OKR cycle not found');
    return cycle;
  }

  private async getCompanyObjective(companyId: string, objectiveId: string) {
    const objective = await this.prisma.objective.findFirst({
      where: {
        id: objectiveId,
        cycle: {
          company_id: companyId,
        },
      },
      include: { key_results: true },
    });
    if (!objective) throw new NotFoundException('Objective not found');
    return objective;
  }

  private async getCompanyKeyResult(companyId: string, krId: string) {
    const keyResult = await this.prisma.keyResult.findFirst({
      where: {
        id: krId,
        objective: {
          cycle: {
            company_id: companyId,
          },
        },
      },
    });
    if (!keyResult) throw new NotFoundException('Key Result not found');
    return keyResult;
  }

  // --- Cycle Management ---
  async createCycle(companyId: string, data: CreateOkrCycleDto) {
    return this.prisma.oKRCycle.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });
  }

  async getCycles(companyId: string) {
    return this.prisma.oKRCycle.findMany({
      where: { company_id: companyId },
      orderBy: { start_date: 'desc' },
    });
  }

  // --- Objective Management ---
  async createObjective(companyId: string, data: CreateObjectiveDto) {
    await this.getCompanyCycle(companyId, data.cycle_id);

    // Check for circular reference if parent_id is provided
    if (data.parent_id) {
      await this.getCompanyObjective(companyId, data.parent_id);
      await this.validateCascade(data.parent_id, data.id);
    }

    return this.prisma.objective.create({
      data: {
        cycle_id: data.cycle_id,
        department_id: data.department_id,
        owner_id: data.owner_id,
        parent_id: data.parent_id,
        title: data.title,
        description: data.description,
      },
    });
  }

  private async validateCascade(parentId: string, currentId?: string) {
    if (parentId === currentId) {
      throw new BadRequestException('Objective cannot be its own parent');
    }
    // Deep check for circularity could be added here if needed
  }

  async getOkrTree(companyId: string, cycleId: string) {
    await this.getCompanyCycle(companyId, cycleId);

    return this.prisma.objective.findMany({
      where: {
        cycle_id: cycleId,
        parent_id: null,
        cycle: {
          company_id: companyId,
        },
      },
      include: {
        owner: true,
        key_results: {
          include: {
            check_ins: {
              orderBy: { created_at: 'desc' },
              take: 1,
            },
          },
        },
        children: {
          include: {
            owner: true,
            key_results: true,
            children: true, // Supporting 3 levels for now
          },
        },
      },
    });
  }

  // --- Key Result Management ---
  async createKeyResult(companyId: string, data: CreateKeyResultDto) {
    await this.getCompanyObjective(companyId, data.objective_id);

    return this.prisma.keyResult.create({
      data: {
        objective_id: data.objective_id,
        title: data.title,
        unit: data.unit,
        initial_value: data.initial_value,
        target_value: data.target_value,
        current_value: data.initial_value,
        target_date: data.target_date,
      },
    });
  }

  // --- Check-Ins & Aggregation ---
  async submitCheckIn(companyId: string, krId: string, data: SubmitOkrCheckInDto) {
    const kr = await this.getCompanyKeyResult(companyId, krId);

    const checkIn = await this.prisma.checkIn.create({
      data: {
        kr_id: krId,
        value: data.value,
        confidence: data.confidence,
        comment: data.comment,
      },
    });

    // Update current value of KR
    await this.prisma.keyResult.update({
      where: { id: krId },
      data: { current_value: data.value },
    });

    // Recalculate parent objective progress
    await this.updateObjectiveProgress(kr.objective_id);

    return checkIn;
  }

  private async updateObjectiveProgress(objectiveId: string) {
    const objective = await this.prisma.objective.findUnique({
      where: {
        id: objectiveId,
      },
      include: { key_results: true },
    });

    if (!objective || objective.key_results.length === 0) return;

    // Calculate progress based on KR completion %
    const totalProgress = objective.key_results.reduce((acc: number, kr: any) => {
      const range = Number(kr.target_value) - Number(kr.initial_value);
      if (range === 0) return acc + 100;
      const current = Number(kr.current_value) - Number(kr.initial_value);
      const pct = Math.min(100, Math.max(0, (current / range) * 100));
      return acc + pct;
    }, 0);

    const averageProgress = Math.round(totalProgress / objective.key_results.length);

    await this.prisma.objective.update({
      where: { id: objectiveId },
      data: { progress: averageProgress },
    });

    // Cascade update to parent if exists
    if (objective.parent_id) {
      await this.updateParentProgress(objective.parent_id);
    }
  }

  private async updateParentProgress(parentId: string) {
    // Parent progress could be weighted or just average of children progress
    const parent = await this.prisma.objective.findUnique({
      where: { id: parentId },
      include: { children: true },
    });

    if (!parent || parent.children.length === 0) return;

    const totalProgress = parent.children.reduce((acc: number, obj: any) => acc + obj.progress, 0);
    const averageProgress = Math.round(totalProgress / parent.children.length);

    await this.prisma.objective.update({
      where: { id: parentId },
      data: { progress: averageProgress },
    });
  }

  async getExecutiveHealth(companyId: string) {
    const activeCycles = await this.prisma.oKRCycle.findMany({
      where: { company_id: companyId, status: 'active' },
      include: {
        objectives: {
          include: {
            key_results: {
              include: {
                check_ins: {
                  orderBy: { created_at: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    return activeCycles.map((cycle: any) => {
      const objectivesHealth = cycle.objectives.map((obj: any) => {
        const latestConfidences = obj.key_results
          .map((kr: any) => kr.check_ins[0]?.confidence || 5)
          .filter((c: any) => c !== undefined);
        
        const avgConfidence = latestConfidences.length > 0
          ? latestConfidences.reduce((a: number, b: number) => a + b, 0) / latestConfidences.length
          : 5;

        // Health Score = 70% Progress + 30% Confidence (normalized to 0-10)
        const healthScore = (obj.progress * 0.7) + (avgConfidence * 10 * 0.3);

        return {
          id: obj.id,
          title: obj.title,
          progress: obj.progress,
          confidence: avgConfidence,
          healthScore: Math.round(healthScore),
        };
      });

      return {
        id: cycle.id,
        name: cycle.name,
        objectives: objectivesHealth,
      };
    });
  }
}
