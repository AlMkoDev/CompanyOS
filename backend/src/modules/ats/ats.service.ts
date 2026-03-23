import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateApplicationDto,
  CreateCandidateDto,
  CreateRequisitionDto,
  ScheduleInterviewDataDto,
  SubmitScorecardDto,
} from './dto/ats.dto';

@Injectable()
export class AtsService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyRequisition(companyId: string, id: string) {
    const requisition = await this.prisma.jobRequisition.findFirst({
      where: {
        id,
        company_id: companyId,
      },
    });

    if (!requisition) {
      throw new NotFoundException('Requisition not found');
    }

    return requisition;
  }

  private async getCompanyApplication(companyId: string, id: string) {
    const application = await this.prisma.application.findFirst({
      where: {
        id,
        requisition: {
          company_id: companyId,
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  private async getCompanyInterview(companyId: string, id: string) {
    const interview = await this.prisma.interview.findFirst({
      where: {
        id,
        application: {
          requisition: {
            company_id: companyId,
          },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    return interview;
  }

  // --- Job Requisitions ---

  async createRequisition(companyId: string, data: CreateRequisitionDto) {
    return this.prisma.jobRequisition.create({
      data: {
        ...data,
        company_id: companyId,
        status: 'pending',
      },
    });
  }

  async getRequisitions(companyId: string) {
    return this.prisma.jobRequisition.findMany({
      where: { company_id: companyId },
      include: {
        department: true,
        applications: {
          include: { candidate: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async getRequisitionDetail(companyId: string, id: string) {
    const requisition = await this.prisma.jobRequisition.findFirst({
      where: {
        id,
        company_id: companyId,
      },
      include: {
        department: true,
        company: true,
        applications: {
          include: {
            candidate: true,
            interviews: true
          }
        }
      }
    });

    if (!requisition) {
      throw new NotFoundException('Requisition not found');
    }

    return requisition;
  }

  // --- Candidates & Applications ---

  async createCandidate(data: CreateCandidateDto) {
    return this.prisma.candidate.create({
      data,
    });
  }

  async getCandidateDetail(companyId: string, id: string) {
    const candidate = await this.prisma.candidate.findFirst({
      where: {
        id,
        applications: {
          some: {
            requisition: {
              company_id: companyId,
            },
          },
        },
      },
      include: {
        applications: {
          where: {
            requisition: {
              company_id: companyId,
            },
          },
          include: {
            requisition: {
              include: { department: true }
            },
            interviews: {
              include: { scorecard: true }
            },
            offers: true
          }
        }
      }
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    return candidate;
  }

  async createApplication(companyId: string, data: CreateApplicationDto) {
    await this.getCompanyRequisition(companyId, data.requisition_id);

    return this.prisma.application.create({
      data,
    });
  }

  async getPipeline(companyId: string, requisitionId?: string) {
    const where: any = { requisition: { company_id: companyId } };
    if (requisitionId) {
      where.requisition_id = requisitionId;
    }

    const applications = await this.prisma.application.findMany({
      where,
      include: {
        candidate: true,
        requisition: {
          include: { department: true }
        }
      }
    });

    // Group by stage
    const stages = ['applied', 'screened', 'interview1', 'interview2', 'offer', 'hired', 'rejected'];
    const pipeline = stages.reduce((acc, stage) => {
      acc[stage] = applications.filter(a => a.stage === stage);
      return acc;
    }, {} as Record<string, any[]>);

    return pipeline;
  }

  async updateStage(companyId: string, applicationId: string, stage: string) {
    await this.getCompanyApplication(companyId, applicationId);

    return this.prisma.application.update({
      where: { id: applicationId },
      data: { stage },
    });
  }

  // --- Interviews & Scorecards ---

  async scheduleInterview(companyId: string, applicationId: string, data: ScheduleInterviewDataDto) {
    await this.getCompanyApplication(companyId, applicationId);

    return this.prisma.interview.create({
      data: {
        ...data,
        application_id: applicationId,
      },
    });
  }

  async submitScorecard(
    companyId: string,
    interviewId: string,
    userId: string,
    data: SubmitScorecardDto,
  ) {
    await this.getCompanyInterview(companyId, interviewId);

    return this.prisma.scorecard.create({
      data: {
        ...data,
        interview_id: interviewId,
        submitted_by: userId,
      },
    });
  }
}
