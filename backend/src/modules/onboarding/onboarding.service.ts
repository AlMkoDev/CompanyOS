import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SubmitExitInterviewDto } from './dto/onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private readonly lifecycleTemplateKeyAliases: Record<string, string> = {
    hr: 'hr',
    human_resources: 'hr',
    'human resources': 'hr',
    it: 'it',
    'it_systems': 'it',
    'it & systems': 'it',
    finance: 'fin',
    operations: 'ops',
    security: 'ops',
    administration: 'adm',
  };

  private normalizeDepartmentKey(value?: string | null) {
    if (!value) {
      return null;
    }

    const normalized = value.trim().toLowerCase().replace(/\s+/g, '_');
    return this.lifecycleTemplateKeyAliases[normalized] || normalized;
  }

  private mapLifecycleStatusToTaskStatus(status?: string | null) {
    if (!status) return 'open';
    if (status === 'completed') return 'done';
    if (status === 'blocked') return 'blocked';
    if (status === 'in_progress') return 'in-progress';
    return 'open';
  }

  private async resolveDepartmentId(companyId: string, departmentHint?: string | null) {
    if (!departmentHint) {
      return null;
    }

    const normalized = this.normalizeDepartmentKey(departmentHint);
    const department = await this.prisma.department.findFirst({
      where: {
        company_id: companyId,
        OR: [
          { template_key: normalized || undefined },
          { name: { equals: departmentHint, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });

    return department?.id || null;
  }

  private async getDefaultCreatorId(companyId: string) {
    const user = await this.prisma.user.findFirst({
      where: { company_id: companyId },
      orderBy: { created_at: 'asc' },
      select: { id: true },
    });

    return user?.id || null;
  }

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

  private async syncOnboardingTaskToMainTask(
    companyId: string,
    planId: string,
    onboardingTask: {
      id: string;
      title: string;
      status: string;
      due_date: Date | null;
      assignee_dept?: string | null;
    },
    employee: {
      id: string;
      first_name: string;
      last_name: string;
      department_id?: string | null;
    },
  ) {
    const taskCode = `ONB-${planId.slice(0, 8)}-${onboardingTask.id.slice(0, 8)}`;
    const departmentId =
      (await this.resolveDepartmentId(companyId, onboardingTask.assignee_dept)) ||
      employee.department_id ||
      null;

    if (!departmentId) {
      return null;
    }

    const payload = {
      department_id: departmentId,
      title: `${employee.first_name} ${employee.last_name}: ${onboardingTask.title}`,
      description: `Onboarding workflow task for ${employee.first_name} ${employee.last_name}.`,
      task_category: 'onboarding',
      status: this.mapLifecycleStatusToTaskStatus(onboardingTask.status),
      priority: 'medium',
      due_date: onboardingTask.due_date || undefined,
      attachments: {
        lifecycle: 'onboarding',
        plan_id: planId,
        onboarding_task_id: onboardingTask.id,
        employee_id: employee.id,
      },
    };

    const existingTask = await this.prisma.task.findFirst({
      where: {
        company_id: companyId,
        task_code: taskCode,
      },
      select: { id: true },
    });

    if (existingTask) {
      return this.prisma.task.update({
        where: { id: existingTask.id },
        data: payload,
      });
    }

    const creatorId = await this.getDefaultCreatorId(companyId);
    if (!creatorId) {
      return null;
    }

    return this.prisma.task.create({
      data: {
        company_id: companyId,
        creator_id: creatorId,
        task_code: taskCode,
        ...payload,
      },
    });
  }

  private async buildOffboardingRelatedTasks(companyId: string, planId: string) {
    return this.prisma.task.findMany({
      where: {
        company_id: companyId,
        task_category: 'offboarding',
        task_code: {
          startsWith: `OFF-${planId.slice(0, 8)}-`,
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });
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

    const defaultTasks = [
      { title: 'IT Setup: Email & Hardware', category: 'IT', assignee_dept: 'IT' },
      { title: 'HR Induction: Policies & Benefits', category: 'HR', assignee_dept: 'HR' },
      { title: 'Finance: Bank & Tax Details', category: 'Finance', assignee_dept: 'Finance' },
      { title: 'Security: Access Cards & Badge', category: 'Security', assignee_dept: 'Operations' },
    ];

    for (let index = 0; index < defaultTasks.length; index += 1) {
      const lifecycleTask = defaultTasks[index];
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + index + 1);

      await this.prisma.onboardingTask.create({
        data: {
          plan_id: plan.id,
          title: lifecycleTask.title,
          category: lifecycleTask.category,
          assignee_dept: lifecycleTask.assignee_dept,
          due_date: dueDate,
        },
      });
    }

    const milestones = [30, 60, 90].map((days) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + days);
      return {
        plan_id: plan.id,
        type: `${days}day`,
        due_date: date,
      };
    });

    await this.prisma.milestone.createMany({ data: milestones });

    const hydratedPlan = await this.getCompanyOnboardingPlan(companyId, employeeId);
    for (const task of hydratedPlan.tasks) {
      await this.syncOnboardingTaskToMainTask(companyId, hydratedPlan.id, task, hydratedPlan.employee);
    }

    await this.audit.log({
      companyId,
      action: 'CREATED_ONBOARDING_PLAN',
      resourceType: 'ONBOARDING_PLAN',
      resourceId: plan.id,
      details: { employee_id: employeeId },
    });

    return this.getPlanDetail(companyId, employeeId);
  }

  async getActivePlans(companyId: string) {
    const onboarding = await this.prisma.onboardingPlan.findMany({
      where: { employee: { company_id: companyId } },
      include: {
        employee: { select: { id: true, first_name: true, last_name: true, department: true } },
        tasks: true,
      },
    });

    const offboarding = await this.prisma.offboardingPlan.findMany({
      where: { employee: { company_id: companyId } },
      include: {
        employee: { select: { id: true, first_name: true, last_name: true, department: true } },
      },
    });

    const offboardingWithTasks = await Promise.all(
      offboarding.map(async (plan) => ({
        ...plan,
        tasks: await this.buildOffboardingRelatedTasks(companyId, plan.id),
      })),
    );

    return {
      onboarding,
      offboarding: offboardingWithTasks,
    };
  }

  async getPlanDetail(companyId: string, employeeId: string) {
    const plan = await this.getCompanyOnboardingPlan(companyId, employeeId);

    for (const task of plan.tasks) {
      await this.syncOnboardingTaskToMainTask(companyId, plan.id, task, plan.employee);
    }

    const relatedTasks = await this.prisma.task.findMany({
      where: {
        company_id: companyId,
        task_category: 'onboarding',
        attachments: {
          path: ['plan_id'],
          equals: plan.id,
        },
      },
      orderBy: { created_at: 'asc' },
    });

    return {
      ...plan,
      related_tasks: relatedTasks,
    };
  }

  async updateTaskStatus(companyId: string, taskId: string, status: string) {
    const onboardingTask = await this.getCompanyOnboardingTask(companyId, taskId);

    const updatedTask = await this.prisma.onboardingTask.update({
      where: { id: taskId },
      data: { status },
    });

    const plan = await this.prisma.onboardingPlan.findFirst({
      where: {
        id: onboardingTask.plan_id,
        employee: {
          company_id: companyId,
        },
      },
      include: {
        employee: true,
      },
    });

    if (plan) {
      await this.syncOnboardingTaskToMainTask(companyId, plan.id, updatedTask, plan.employee);
    }

    return updatedTask;
  }

  // ─── OFFBOARDING ────────────────────────────────────────────────────────────

  async createOffboardingPlan(companyId: string, employeeId: string, lastDay: Date) {
    const employee = await this.getCompanyEmployee(companyId, employeeId);

    const plan = await this.prisma.offboardingPlan.create({
      data: {
        employee_id: employeeId,
        last_day: lastDay,
      },
    });

    const lifecycleTasks = [
      { title: 'IT Deprovisioning and Access Removal', assignee_dept: 'IT', priority: 'high' },
      { title: 'Recover Company Assets and Badge', assignee_dept: 'Operations', priority: 'high' },
      { title: 'Finalize Payroll and Benefits Closure', assignee_dept: 'Finance', priority: 'high' },
      { title: 'Archive Personnel Documents and Records', assignee_dept: 'HR', priority: 'medium' },
    ];

    const creatorId = await this.getDefaultCreatorId(companyId);
    if (creatorId) {
      for (let index = 0; index < lifecycleTasks.length; index += 1) {
        const lifecycleTask = lifecycleTasks[index];
        const departmentId =
          (await this.resolveDepartmentId(companyId, lifecycleTask.assignee_dept)) ||
          employee.department_id ||
          null;

        if (!departmentId) {
          continue;
        }

        await this.prisma.task.create({
          data: {
            company_id: companyId,
            creator_id: creatorId,
            department_id: departmentId,
            title: `${employee.first_name} ${employee.last_name}: ${lifecycleTask.title}`,
            description: `Offboarding workflow task for ${employee.first_name} ${employee.last_name}.`,
            task_code: `OFF-${plan.id.slice(0, 8)}-${String(index + 1).padStart(2, '0')}`,
            task_category: 'offboarding',
            priority: lifecycleTask.priority,
            status: 'open',
            due_date: lastDay,
            attachments: {
              lifecycle: 'offboarding',
              plan_id: plan.id,
              employee_id: employee.id,
            },
          },
        });
      }
    }

    await this.audit.log({
      companyId,
      action: 'CREATED_OFFBOARDING_PLAN',
      resourceType: 'OFFBOARDING_PLAN',
      resourceId: plan.id,
      details: { employee_id: employeeId },
    });

    return this.getOffboardingDetail(companyId, employeeId);
  }

  async getOffboardingDetail(companyId: string, employeeId: string) {
    const plan = await this.getCompanyOffboardingPlan(companyId, employeeId);

    return {
      ...plan,
      related_tasks: await this.buildOffboardingRelatedTasks(companyId, plan.id),
    };
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
    const plan = await this.getCompanyOffboardingPlan(companyId, employeeId);

    const updatedPlan = await this.prisma.offboardingPlan.update({
      where: { employee_id: employeeId },
      data: { it_deprovisioned_at: status ? new Date() : null },
    });

    const relatedTasks = await this.buildOffboardingRelatedTasks(companyId, plan.id);
    const deprovisionTask = relatedTasks.find((task) =>
      task.title.toLowerCase().includes('deprovisioning'),
    );

    if (deprovisionTask) {
      await this.prisma.task.update({
        where: { id: deprovisionTask.id },
        data: {
          status: status ? 'done' : 'open',
        },
      });
    }

    return updatedPlan;
  }
}
