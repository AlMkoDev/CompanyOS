import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateEmployeeDto,
  CreatePositionDto,
  UpdateEmployeeDto,
  UploadEmployeeDocumentDto,
} from './dto/hris.dto';

@Injectable()
export class HrisService {
  private readonly logger = new Logger(HrisService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private lifecycleTemplateKeyAliases: Record<string, string> = {
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

  private normalizeLifecycleDepartmentKey(value?: string | null) {
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

  private async resolveDepartmentIdByTemplateOrName(
    tx: Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
    companyId: string,
    departmentHint?: string | null,
  ) {
    if (!departmentHint) {
      return null;
    }

    const normalizedKey = this.normalizeLifecycleDepartmentKey(departmentHint);
    const department = await tx.department.findFirst({
      where: {
        company_id: companyId,
        OR: [
          { template_key: normalizedKey || undefined },
          { name: { equals: departmentHint, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });

    return department?.id || null;
  }

  private async createOnboardingArtifacts(
    tx: Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
    companyId: string,
    creatorUserId: string | undefined,
    employee: {
      id: string;
      hire_date: Date;
      first_name: string;
      last_name: string;
      department_id: string | null;
    },
  ) {
    const existingPlan = await tx.onboardingPlan.findUnique({
      where: { employee_id: employee.id },
    });

    if (existingPlan) {
      return existingPlan;
    }

    const plan = await tx.onboardingPlan.create({
      data: {
        employee_id: employee.id,
        start_date: employee.hire_date,
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
      const dueDate = new Date(employee.hire_date);
      dueDate.setDate(dueDate.getDate() + index + 1);

      const onboardingTask = await tx.onboardingTask.create({
        data: {
          plan_id: plan.id,
          title: lifecycleTask.title,
          category: lifecycleTask.category,
          assignee_dept: lifecycleTask.assignee_dept,
          due_date: dueDate,
        },
      });

      const departmentId =
        (await this.resolveDepartmentIdByTemplateOrName(tx, companyId, lifecycleTask.assignee_dept)) ||
        employee.department_id;

      if (!departmentId || !creatorUserId) {
        continue;
      }

      await tx.task.create({
        data: {
          company_id: companyId,
          department_id: departmentId,
          creator_id: creatorUserId,
          title: `${employee.first_name} ${employee.last_name}: ${lifecycleTask.title}`,
          description: `Onboarding workflow task for ${employee.first_name} ${employee.last_name}.`,
          task_code: `ONB-${plan.id.slice(0, 8)}-${String(index + 1).padStart(2, '0')}`,
          task_category: 'onboarding',
          status: 'open',
          priority: 'medium',
          due_date: dueDate,
          attachments: {
            lifecycle: 'onboarding',
            plan_id: plan.id,
            onboarding_task_id: onboardingTask.id,
            employee_id: employee.id,
          },
        },
      });
    }

    const milestones = [30, 60, 90].map((days) => {
      const date = new Date(employee.hire_date);
      date.setDate(date.getDate() + days);
      return {
        plan_id: plan.id,
        type: `${days}day`,
        due_date: date,
      };
    });

    await tx.milestone.createMany({ data: milestones });

    return plan;
  }

  private async createOffboardingArtifacts(
    tx: Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
    companyId: string,
    creatorUserId: string | undefined,
    employee: {
      id: string;
      first_name: string;
      last_name: string;
      termination_date: Date | null;
      department_id: string | null;
    },
  ) {
    const lastDay = employee.termination_date || new Date();
    const existingPlan = await tx.offboardingPlan.findUnique({
      where: { employee_id: employee.id },
    });

    const plan =
      existingPlan ||
      (await tx.offboardingPlan.create({
        data: {
          employee_id: employee.id,
          last_day: lastDay,
        },
      }));

    const lifecycleTasks = [
      { title: 'IT Deprovisioning and Access Removal', assignee_dept: 'IT', priority: 'high' },
      { title: 'Recover Company Assets and Badge', assignee_dept: 'Operations', priority: 'high' },
      { title: 'Finalize Payroll and Benefits Closure', assignee_dept: 'Finance', priority: 'high' },
      { title: 'Archive Personnel Documents and Records', assignee_dept: 'HR', priority: 'medium' },
    ];

    for (let index = 0; index < lifecycleTasks.length; index += 1) {
      const lifecycleTask = lifecycleTasks[index];
      const departmentId =
        (await this.resolveDepartmentIdByTemplateOrName(tx, companyId, lifecycleTask.assignee_dept)) ||
        employee.department_id;

      if (!departmentId || !creatorUserId) {
        continue;
      }

      const taskCode = `OFF-${plan.id.slice(0, 8)}-${String(index + 1).padStart(2, '0')}`;
      const existingTask = await tx.task.findFirst({
        where: {
          company_id: companyId,
          task_code: taskCode,
        },
        select: { id: true },
      });

      if (existingTask) {
        continue;
      }

      await tx.task.create({
        data: {
          company_id: companyId,
          department_id: departmentId,
          creator_id: creatorUserId,
          title: `${employee.first_name} ${employee.last_name}: ${lifecycleTask.title}`,
          description: `Offboarding workflow task for ${employee.first_name} ${employee.last_name}.`,
          task_code: taskCode,
          task_category: 'offboarding',
          status: 'open',
          priority: lifecycleTask.priority,
          due_date: lastDay,
          attachments: {
            lifecycle: 'offboarding',
            plan_id: plan.id,
            employee_id: employee.id,
          },
        },
      });
    }

    return plan;
  }

  private async getCompanyEmployee(companyId: string, id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: {
        id,
        company_id: companyId,
      },
      include: {
        onboarding: true,
        offboarding: true,
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee ${id} not found`);
    }

    return employee;
  }

  // ─── EMPLOYEES ───────────────────────────────────────────────────────────────

  async createEmployee(companyId: string, userId: string, data: CreateEmployeeDto) {
    const count = await this.prisma.employee.count({ where: { company_id: companyId } });
    const empNo = `EMP-${String(count + 1).padStart(4, '0')}`;
    
    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({
        data: {
          ...data,
          emp_no: empNo,
          company_id: companyId,
          hire_date: new Date(data.hire_date),
        },
        include: { department: true, position: true },
      });

      await tx.employmentHistory.create({
        data: {
          employee_id: employee.id,
          department_id: employee.department_id,
          position_id: employee.position_id,
          start_date: employee.hire_date,
          change_reason: 'Initial hire',
        },
      });

      await this.createOnboardingArtifacts(tx, companyId, userId, employee);

      await this.audit.log({
        companyId,
        userId,
        action: 'CREATED_EMPLOYEE',
        resourceType: 'EMPLOYEE',
        resourceId: employee.id,
        details: {
          emp_no: employee.emp_no,
          department_id: employee.department_id,
          position_id: employee.position_id,
        },
      });

      return employee;
    });
  }

  async getEmployees(companyId: string, filters?: any) {
    try {
      const where: any = { company_id: companyId };
      if (filters?.department_id) where.department_id = filters.department_id;
      if (filters?.status) where.status = filters.status;
      if (filters?.search) {
        where.OR = [
          { first_name: { contains: filters.search, mode: 'insensitive' } },
          { last_name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { emp_no: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
      return await this.prisma.employee.findMany({
        where,
        include: {
          department: true,
          position: true,
          manager: { select: { id: true, first_name: true, last_name: true } },
        },
        orderBy: { first_name: 'asc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to load employees for company ${companyId}`,
        error instanceof Error ? error.stack : JSON.stringify(error),
      );
      return [];
    }
  }

  async getEmployeeById(companyId: string, id: string) {
    const emp = await this.prisma.employee.findFirst({
      where: {
        id,
        company_id: companyId,
      },
      include: {
        department: true,
        position: true,
        manager: { select: { id: true, first_name: true, last_name: true, avatar_url: true } },
        reports: { select: { id: true, first_name: true, last_name: true, position: true, avatar_url: true } },
        employment_history: { include: { department: true, position: true }, orderBy: { start_date: 'desc' } },
        documents: { orderBy: { created_at: 'desc' } },
      },
    });
    if (!emp) throw new NotFoundException(`Employee ${id} not found`);
    return emp;
  }

  async updateEmployee(companyId: string, userId: string, id: string, data: UpdateEmployeeDto) {
    const currentEmployee = await this.getCompanyEmployee(companyId, id);

    return this.prisma.$transaction(async (tx) => {
      const nextStatus = data.status || currentEmployee.status;
      const nextDepartmentId = data.department_id === undefined ? currentEmployee.department_id : data.department_id;
      const nextPositionId = data.position_id === undefined ? currentEmployee.position_id : data.position_id;
      const nextHireDate = data.hire_date ? new Date(data.hire_date) : currentEmployee.hire_date;
      const terminationDate =
        nextStatus === 'terminated'
          ? currentEmployee.termination_date || new Date()
          : data.status && data.status !== 'terminated'
            ? null
            : currentEmployee.termination_date;

      const employee = await tx.employee.update({
        where: { id },
        data: {
          ...data,
          hire_date: data.hire_date ? new Date(data.hire_date) : undefined,
          status: nextStatus,
          termination_date: terminationDate,
          updated_at: new Date(),
        },
        include: { department: true, position: true },
      });

      const roleChanged =
        currentEmployee.department_id !== nextDepartmentId ||
        currentEmployee.position_id !== nextPositionId;

      if (roleChanged) {
        await tx.employmentHistory.updateMany({
          where: {
            employee_id: id,
            end_date: null,
          },
          data: {
            end_date: new Date(),
          },
        });

        await tx.employmentHistory.create({
          data: {
            employee_id: id,
            department_id: nextDepartmentId,
            position_id: nextPositionId,
            start_date: new Date(),
            change_reason: 'Role or department update',
          },
        });
      }

      if (data.hire_date && !currentEmployee.onboarding) {
        await this.createOnboardingArtifacts(tx, companyId, userId, {
          id: employee.id,
          hire_date: nextHireDate,
          first_name: employee.first_name,
          last_name: employee.last_name,
          department_id: employee.department_id,
        });
      }

      if (nextStatus === 'terminated') {
        await this.createOffboardingArtifacts(tx, companyId, userId, {
          id: employee.id,
          first_name: employee.first_name,
          last_name: employee.last_name,
          termination_date: terminationDate,
          department_id: employee.department_id,
        });
      }

      await this.audit.log({
        companyId,
        userId,
        action: 'UPDATED_EMPLOYEE',
        resourceType: 'EMPLOYEE',
        resourceId: employee.id,
        details: {
          status: employee.status,
          department_id: employee.department_id,
          position_id: employee.position_id,
        },
      });

      return employee;
    });
  }

  // ─── POSITIONS ───────────────────────────────────────────────────────────────

  async getPositions(companyId: string) {
    try {
      const positions = await this.prisma.position.findMany({
        where: { company_id: companyId },
        include: {
          department: true,
          employees: { select: { id: true, status: true } },
        },
        orderBy: { title: 'asc' },
      });
      return positions.map((p) => ({
        ...p,
        actual_headcount: p.employees.filter((e) => e.status === 'active').length,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to load positions for company ${companyId}`,
        error instanceof Error ? error.stack : JSON.stringify(error),
      );
      return [];
    }
  }

  async createPosition(companyId: string, data: CreatePositionDto) {
    return this.prisma.position.create({
      data: {
        ...data,
        company_id: companyId,
        level: data.level ? Number.parseInt(data.level, 10) || 4 : 4,
      },
      include: { department: true },
    });
  }

  // ─── ORG CHART ───────────────────────────────────────────────────────────────

  async getOrgChart(companyId: string) {
    try {
      const employees = await this.prisma.employee.findMany({
        where: { company_id: companyId, status: 'active' },
        include: {
          department: true,
          position: true,
        },
        orderBy: { first_name: 'asc' },
      });

      const buildTree = (managerId: string | null): any[] =>
        employees
          .filter((e) => e.manager_id === managerId)
          .map((e) => ({
            id: e.id,
            name: `${e.first_name} ${e.last_name}`,
            title: e.position?.title ?? 'No Position',
            department: e.department?.name ?? '',
            avatar: e.avatar_url,
            children: buildTree(e.id),
          }));

      return buildTree(null);
    } catch (error) {
      this.logger.error(
        `Failed to load org chart for company ${companyId}`,
        error instanceof Error ? error.stack : JSON.stringify(error),
      );
      return [];
    }
  }

  // ─── DOCUMENTS ───────────────────────────────────────────────────────────────

  async uploadDocument(companyId: string, employeeId: string, data: UploadEmployeeDocumentDto) {
    await this.getCompanyEmployee(companyId, employeeId);

    return this.prisma.employeeDocument.create({
      data: { ...data, employee_id: employeeId },
    });
  }

  // ─── REPORTS ─────────────────────────────────────────────────────────────────

  async getHeadcountReport(companyId: string) {
    const employees = await this.prisma.employee.findMany({
      where: { company_id: companyId },
      include: { department: true },
    });

    const byDept: Record<string, any> = {};
    let active = 0, probation = 0, terminated = 0;

    for (const emp of employees) {
      const deptName = emp.department?.name ?? 'Unassigned';
      if (!byDept[deptName]) byDept[deptName] = { total: 0, active: 0, probation: 0, terminated: 0 };
      byDept[deptName].total++;
      byDept[deptName][emp.status]++;
      if (emp.status === 'active') active++;
      else if (emp.status === 'probation') probation++;
      else terminated++;
    }

    return {
      total: employees.length,
      active,
      probation,
      terminated,
      by_department: Object.entries(byDept).map(([dept, counts]) => ({ dept, ...counts as any })),
    };
  }
}
