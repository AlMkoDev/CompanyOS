import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateEmployeeDto,
  CreatePositionDto,
  UpdateEmployeeDto,
  UploadEmployeeDocumentDto,
} from './dto/hris.dto';

@Injectable()
export class HrisService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyEmployee(companyId: string, id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: {
        id,
        company_id: companyId,
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee ${id} not found`);
    }

    return employee;
  }

  // ─── EMPLOYEES ───────────────────────────────────────────────────────────────

  async createEmployee(companyId: string, data: CreateEmployeeDto) {
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

      // --- Auto-trigger Onboarding ---
      const plan = await tx.onboardingPlan.create({
        data: {
          employee_id: employee.id,
          start_date: employee.hire_date,
          status: 'started',
        },
      });

      // Default tasks
      const defaultTasks = [
        { title: 'IT Setup: Email & Hardware', category: 'IT', assignee_dept: 'IT' },
        { title: 'HR Induction: Policies & Benefits', category: 'HR', assignee_dept: 'HR' },
        { title: 'Finance: Bank & Tax Details', category: 'Finance', assignee_dept: 'Finance' },
        { title: 'Security: Access Cards & Badge', category: 'Security', assignee_dept: 'Operations' },
      ];

      await tx.onboardingTask.createMany({
        data: defaultTasks.map(t => ({ ...t, plan_id: plan.id })),
      });

      // 30/60/90 milestones
      const milestones = [30, 60, 90].map(days => {
        const date = new Date(employee.hire_date);
        date.setDate(date.getDate() + days);
        return {
          plan_id: plan.id,
          type: `${days}day`,
          due_date: date,
        };
      });

      await tx.milestone.createMany({ data: milestones });

      return employee;
    });
  }

  async getEmployees(companyId: string, filters?: any) {
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
    return this.prisma.employee.findMany({
      where,
      include: { department: true, position: true, manager: { select: { id: true, first_name: true, last_name: true } } },
      orderBy: { first_name: 'asc' },
    });
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

  async updateEmployee(companyId: string, id: string, data: UpdateEmployeeDto) {
    await this.getCompanyEmployee(companyId, id);

    return this.prisma.employee.update({
      where: { id },
      data: { ...data, updated_at: new Date() },
      include: { department: true, position: true },
    });
  }

  // ─── POSITIONS ───────────────────────────────────────────────────────────────

  async getPositions(companyId: string) {
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
  }

  async createPosition(companyId: string, data: CreatePositionDto) {
    return this.prisma.position.create({
      data: { ...data, company_id: companyId },
      include: { department: true },
    });
  }

  // ─── ORG CHART ───────────────────────────────────────────────────────────────

  async getOrgChart(companyId: string) {
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
