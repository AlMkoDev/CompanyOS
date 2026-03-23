import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SubmitExitInterviewDto } from './dto/onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyEmployee(companyId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, company_id: companyId },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  private async getCompanyOnboardingPlan(companyId: string, employeeId: string) {
    const plan = await this.prisma.onboardingPlan.findFirst({
      where: {
        employee_id: employeeId,
        employee: {
          company_id: companyId,
        },
      },
      include: {
        employee: { include: { department: true, position: true } },
        tasks: true,
        milestones: true,
      },
    });
    if (!plan) throw new NotFoundException('Onboarding plan not found');
    return plan;
  }

  private async getCompanyOffboardingPlan(companyId: string, employeeId: string) {
    const plan = await this.prisma.offboardingPlan.findFirst({
      where: {
        employee_id: employeeId,
        employee: {
          company_id: companyId,
        },
      },
      include: {
        employee: { include: { department: true, position: true } },
      },
    });
    if (!plan) throw new NotFoundException('Offboarding plan not found');
    return plan;
  }

  private async getCompanyOnboardingTask(companyId: string, taskId: string) {
    const task = await this.prisma.onboardingTask.findFirst({
      where: {
        id: taskId,
        plan: {
          employee: {
            company_id: companyId,
          },
        },
      },
    });
    if (!task) throw new NotFoundException('Onboarding task not found');
    return task;
  }

  // ─── ONBOARDING ─────────────────────────────────────────────────────────────

  async createPlan(companyId: string, employeeId: string, startDate: Date) {
    await this.getCompanyEmployee(companyId, employeeId);

    const plan = await this.prisma.onboardingPlan.create({
      data: {
        employee_id: employeeId,
        start_date: startDate,
        status: 'started',
      },
    });

    // Auto-create default tasks
    const defaultTasks = [
      { title: 'IT Setup: Email & Hardware', category: 'IT', assignee_dept: 'IT' },
      { title: 'HR Induction: Policies & Benefits', category: 'HR', assignee_dept: 'HR' },
      { title: 'Finance: Bank & Tax Details', category: 'Finance', assignee_dept: 'Finance' },
      { title: 'Security: Access Cards & Badge', category: 'Security', assignee_dept: 'Operations' },
    ];

    await this.prisma.onboardingTask.createMany({
      data: defaultTasks.map(t => ({ ...t, plan_id: plan.id })),
    });

    // Create 30/60/90 day milestones
    const milestones = [30, 60, 90].map(days => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + days);
      return {
        plan_id: plan.id,
        type: `${days}day`,
        due_date: date,
      };
    });

    await this.prisma.milestone.createMany({ data: milestones });

    return plan;
  }

  async getActivePlans(companyId: string) {
    return {
      onboarding: await this.prisma.onboardingPlan.findMany({
        where: { employee: { company_id: companyId } },
        include: { 
          employee: { select: { first_name: true, last_name: true, department: true } },
          tasks: true 
        }
      }),
      offboarding: await this.prisma.offboardingPlan.findMany({
        where: { employee: { company_id: companyId } },
        include: { 
          employee: { select: { first_name: true, last_name: true, department: true } }
        }
      })
    };
  }

  async getPlanDetail(companyId: string, employeeId: string) {
    return this.getCompanyOnboardingPlan(companyId, employeeId);
  }

  async updateTaskStatus(companyId: string, taskId: string, status: string) {
    await this.getCompanyOnboardingTask(companyId, taskId);

    return this.prisma.onboardingTask.update({
      where: { id: taskId },
      data: { status },
    });
  }

  // ─── OFFBOARDING ────────────────────────────────────────────────────────────

  async createOffboardingPlan(companyId: string, employeeId: string, lastDay: Date) {
    await this.getCompanyEmployee(companyId, employeeId);

    return this.prisma.offboardingPlan.create({
      data: {
        employee_id: employeeId,
        last_day: lastDay,
      },
    });
  }

  async getOffboardingDetail(companyId: string, employeeId: string) {
    return this.getCompanyOffboardingPlan(companyId, employeeId);
  }

  async submitExitInterview(
    companyId: string,
    conductedBy: string,
    employeeId: string,
    data: SubmitExitInterviewDto,
  ) {
    await this.getCompanyEmployee(companyId, employeeId);

    return this.prisma.exitInterview.create({
      data: {
        employee_id: employeeId,
        conducted_by: conductedBy,
        interview_date: new Date(),
        answers: data.answers,
        nps_score: data.nps_score,
      },
    });
  }

  async updateDeprovisioningStatus(companyId: string, employeeId: string, status: boolean) {
    await this.getCompanyOffboardingPlan(companyId, employeeId);

    return this.prisma.offboardingPlan.update({
      where: { employee_id: employeeId },
      data: { it_deprovisioned_at: status ? new Date() : null },
    });
  }
}
