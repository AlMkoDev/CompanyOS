import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateReviewCycleDto } from './dto/performance.dto';

@Injectable()
export class PerformanceService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyCycle(companyId: string, cycleId: string) {
    const cycle = await this.prisma.reviewCycle.findFirst({
      where: { id: cycleId, company_id: companyId },
    });
    if (!cycle) throw new NotFoundException('Cycle not found');
    return cycle;
  }

  private async getCompanyReview(companyId: string, reviewId: string) {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, company_id: companyId },
    });
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }

  private async getCompanyFeedbackRequest(companyId: string, requestId: string) {
    const feedbackRequest = await this.prisma.feedbackRequest.findFirst({
      where: {
        id: requestId,
        review: {
          company_id: companyId,
        },
      },
    });
    if (!feedbackRequest) throw new NotFoundException('Feedback request not found');
    return feedbackRequest;
  }

  async createCycle(companyId: string, data: CreateReviewCycleDto) {
    return this.prisma.reviewCycle.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });
  }

  async getCycles(companyId: string) {
    return this.prisma.reviewCycle.findMany({
      where: { company_id: companyId },
      include: {
        _count: {
          select: { reviews: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getCycleDetail(companyId: string, id: string) {
    const cycle = await this.prisma.reviewCycle.findFirst({
      where: { id, company_id: companyId },
      include: {
        reviews: {
          include: {
            employee: true,
            manager: true,
          },
        },
      },
    });
    if (!cycle) throw new NotFoundException('Cycle not found');
    return cycle;
  }

  async startCycleReviews(cycleId: string, companyId: string) {
    await this.getCompanyCycle(companyId, cycleId);

    // Get all active employees in the company
    const employees = await this.prisma.employee.findMany({
      where: { 
        company_id: companyId,
        status: 'active'
      },
      select: { id: true, manager_id: true }
    });

    // Create reviews for each employee who has a manager
    const reviewData = employees
      .filter((emp: any) => emp.manager_id)
      .map((emp: any) => ({
        cycle_id: cycleId,
        company_id: companyId,
        employee_id: emp.id,
        manager_id: emp.manager_id as string,
        status: 'draft'
      }));

    if (reviewData.length > 0) {
      await this.prisma.review.createMany({
        data: reviewData
      });
    }

    return this.prisma.reviewCycle.update({
      where: { id: cycleId },
      data: { status: 'self_assessment' }
    });
  }

  async getEmployeeReview(employeeId: string, cycleId: string) {
    return this.prisma.review.findFirst({
      where: { employee_id: employeeId, cycle_id: cycleId },
      include: {
        cycle: true,
        manager: true,
        feedback: {
          include: { provider: true }
        },
        goals: true
      }
    });
  }

  async submitSelfAssessment(companyId: string, employeeId: string, reviewId: string, assessment: any) {
    const review = await this.getCompanyReview(companyId, reviewId);
    if (review.employee_id !== employeeId) {
      throw new BadRequestException('Review not assigned to employee');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        self_assessment: assessment,
        status: 'self_assessment_done'
      }
    });
  }

  async submitManagerAssessment(
    companyId: string,
    managerId: string,
    reviewId: string,
    assessment: any,
    rating: string,
  ) {
    const review = await this.getCompanyReview(companyId, reviewId);
    if (review.manager_id !== managerId) {
      throw new BadRequestException('Review not assigned to manager');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        manager_assessment: assessment,
        final_rating: rating,
        status: 'manager_review_done'
      }
    });
  }

  async requestFeedback(companyId: string, managerId: string, reviewId: string, providerId: string) {
    const review = await this.getCompanyReview(companyId, reviewId);
    if (review.manager_id !== managerId) {
      throw new BadRequestException('Only the assigned manager can request feedback');
    }

    return this.prisma.feedbackRequest.create({
      data: {
        review_id: reviewId,
        provider_id: providerId,
        status: 'pending' // Note: Ensure status is in schema or use default
      }
    });
  }

  async getPendingFeedback(employeeId: string) {
    return this.prisma.feedbackRequest.findMany({
      where: { 
        provider_id: employeeId,
        submitted_at: null
      },
      include: {
        review: {
          include: {
            employee: true,
            cycle: true
          }
        }
      }
    });
  }

  async submitFeedback(companyId: string, employeeId: string, requestId: string, answers: any) {
    const feedbackRequest = await this.getCompanyFeedbackRequest(companyId, requestId);
    if (feedbackRequest.provider_id !== employeeId) {
      throw new BadRequestException('Feedback request not assigned to employee');
    }

    return this.prisma.feedbackRequest.update({
      where: { id: requestId },
      data: {
        answers,
        submitted_at: new Date()
      }
    });
  }

  async getCompletionStats(companyId: string, cycleId: string) {
    await this.getCompanyCycle(companyId, cycleId);

    const reviews = await this.prisma.review.findMany({
      where: { cycle_id: cycleId, company_id: companyId },
      select: { status: true }
    });

    const total = reviews.length;
    const completed = reviews.filter((r: any) => r.status === 'signed_off').length;
    const inProgress = reviews.filter((r: any) => r.status !== 'signed_off' && r.status !== 'draft').length;

    return {
      total,
      completed,
      inProgress,
      completionRate: total > 0 ? (completed / total) * 100 : 0
    };
  }
}
