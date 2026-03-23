import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateProjectDto,
  CreateProjectTaskDto,
  CreateRaidItemDto,
  ProjectBudgetDto,
  UpdateProjectDto,
  UpdateProjectTaskDto,
  UpdateRaidItemDto,
} from './dto/projects.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyProject(companyId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        company_id: companyId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private async getCompanyTask(companyId: string, taskId: string) {
    const task = await this.prisma.projectTask.findFirst({
      where: {
        id: taskId,
        project: {
          company_id: companyId,
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private async getCompanyRaidItem(companyId: string, raidId: string) {
    const raidItem = await this.prisma.rAIDItem.findFirst({
      where: {
        id: raidId,
        project: {
          company_id: companyId,
        },
      },
    });

    if (!raidItem) {
      throw new NotFoundException('RAID item not found');
    }

    return raidItem;
  }

  // --- Project CRUD ---

  async createProject(companyId: string, data: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });
  }

  async getProjects(companyId: string, filters?: { status?: string; rag_status?: string }) {
    const where: any = { company_id: companyId };
    
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.rag_status) {
      where.rag_status = filters.rag_status;
    }

    return this.prisma.project.findMany({
      where,
      include: {
        tasks: true,
        raid_items: true,
        // @ts-ignore - budgets relation exists in schema
        budgets: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getProjectDetail(companyId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        company_id: companyId,
      },
      include: {
        tasks: {
          orderBy: { due_date: 'asc' },
        },
        raid_items: {
          orderBy: { severity: 'desc' },
        },
        // @ts-ignore - budgets relation exists in schema
        budgets: true,
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async updateProject(companyId: string, id: string, data: UpdateProjectDto) {
    await this.getCompanyProject(companyId, id);

    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async deleteProject(companyId: string, id: string) {
    await this.getCompanyProject(companyId, id);

    return this.prisma.project.delete({
      where: { id },
    });
  }

  // --- RAG Dashboard & Analytics ---

  async getRagDashboard(companyId: string) {
    const projects = await this.prisma.project.findMany({
      where: { company_id: companyId },
      include: {
        tasks: {
          where: { status: { not: 'DONE' } },
        },
        // @ts-ignore - budgets relation exists in schema
        budgets: true,
      },
    });

    const dashboard = {
      total: projects.length,
      byStatus: {
        planned: 0,
        active: 0,
        'on-hold': 0,
        completed: 0,
        cancelled: 0,
      },
      byRag: {
        R: 0, // Red - Critical issues
        A: 0, // Amber - At risk
        G: 0, // Green - On track
      },
      onTimeDelivery: {
        onTime: 0,
        atRisk: 0,
        delayed: 0,
        percentage: 0,
      },
      budgetHealth: {
        totalAllocated: 0,
        totalSpent: 0,
        variance: 0,
      },
    };

    const now = new Date();

    projects.forEach((project: any) => {
      // Status count
      if ((dashboard.byStatus as any)[project.status] !== undefined) {
        (dashboard.byStatus as any)[project.status]++;
      }

      // RAG count
      if ((dashboard.byRag as any)[project.rag_status] !== undefined) {
        (dashboard.byRag as any)[project.rag_status]++;
      }

      // On-time delivery calculation
      if (project.end_date) {
        const endDate = new Date(project.end_date);
        const isCompleted = project.status === 'completed';
        
        if (isCompleted && endDate <= now) {
          dashboard.onTimeDelivery.onTime++;
        } else if (!isCompleted && endDate < now) {
          dashboard.onTimeDelivery.delayed++;
        } else if (!isCompleted && endDate.toDateString() === now.toDateString()) {
          dashboard.onTimeDelivery.atRisk++;
        } else {
          dashboard.onTimeDelivery.onTime++;
        }
      }

      // Budget health
      if (project.budget_rec && project.budget_rec.length > 0) {
        const latestBudget = project.budget_rec[0];
        dashboard.budgetHealth.totalAllocated += Number(latestBudget.total_allocated || 0);
        dashboard.budgetHealth.totalSpent += Number(latestBudget.actual_spent || 0);
        dashboard.budgetHealth.variance += Number(latestBudget.variance || 0);
      }
    });

    // Calculate on-time delivery percentage
    const totalTracked = dashboard.onTimeDelivery.onTime + dashboard.onTimeDelivery.delayed;
    if (totalTracked > 0) {
      dashboard.onTimeDelivery.percentage = Math.round(
        (dashboard.onTimeDelivery.onTime / totalTracked) * 100,
      );
    }

    return dashboard;
  }

  async getOnTimeDeliveryReport(companyId: string) {
    const projects = await this.prisma.project.findMany({
      where: { 
        company_id: companyId,
        end_date: { not: null },
      },
      include: {
        tasks: {
          where: { 
            status: { not: 'DONE' },
            due_date: { not: null },
          },
        },
      },
    });

    const now = new Date();
    const report = {
      summary: {
        totalProjects: projects.length,
        onTime: 0,
        delayed: 0,
        atRisk: 0,
        averageDelay: 0,
      },
      projects: [] as any[],
    };

    let totalDelayDays = 0;

    projects.forEach((project: any) => {
      const endDate = new Date(project.end_date);
      const daysUntilDue = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      let status = 'on-time';
      if (project.status === 'completed' && endDate <= now) {
        status = 'on-time';
        report.summary.onTime++;
      } else if (endDate < now && project.status !== 'completed') {
        status = 'delayed';
        report.summary.delayed++;
        totalDelayDays += Math.abs(daysUntilDue);
      } else if (daysUntilDue <= 7 && project.status !== 'completed') {
        status = 'at-risk';
        report.summary.atRisk++;
      } else {
        report.summary.onTime++;
      }

      report.projects.push({
        id: project.id,
        name: project.name,
        endDate,
        daysUntilDue,
        status,
        completionRate: this.calculateTaskCompletionRate(project.tasks),
      });
    });

    if (report.summary.delayed > 0) {
      report.summary.averageDelay = Math.round(totalDelayDays / report.summary.delayed);
    }

    return report;
  }

  private calculateTaskCompletionRate(tasks: any[]): number {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'done').length;
    return Math.round((completed / tasks.length) * 100);
  }

  // --- Task Management ---

  async createTask(companyId: string, projectId: string, data: CreateProjectTaskDto) {
    await this.getCompanyProject(companyId, projectId);

    return this.prisma.projectTask.create({
      data: {
        ...data,
        project_id: projectId,
      },
    });
  }

  async updateTask(companyId: string, taskId: string, data: UpdateProjectTaskDto) {
    const task = await this.getCompanyTask(companyId, taskId);

    // Auto-set completed_at when status changes to 'done'
    if (data.status === 'done' && !task.completed_at) {
      data.completed_at = new Date();
    }

    return this.prisma.projectTask.update({
      where: { id: taskId },
      data,
    });
  }

  async deleteTask(companyId: string, taskId: string) {
    await this.getCompanyTask(companyId, taskId);

    return this.prisma.projectTask.delete({
      where: { id: taskId },
    });
  }

  async getTasksByStatus(companyId: string, projectId: string, status: string) {
    await this.getCompanyProject(companyId, projectId);

    return this.prisma.projectTask.findMany({
      where: {
        project_id: projectId,
        // @ts-ignore - status string is valid
        status,
      },
      orderBy: { priority: 'desc' },
    });
  }

  // --- RAID Log Management ---

  async createRaidItem(companyId: string, projectId: string, data: CreateRaidItemDto) {
    await this.getCompanyProject(companyId, projectId);

    return this.prisma.rAIDItem.create({
      data: {
        ...data,
        project_id: projectId,
      },
    });
  }

  async updateRaidItem(companyId: string, raidId: string, data: UpdateRaidItemDto) {
    const raidItem = await this.getCompanyRaidItem(companyId, raidId);

    // Auto-set closed_at when status changes to 'closed'
    if (data.status === 'closed' && !raidItem.closed_at) {
      data.closed_at = new Date();
    }

    return this.prisma.rAIDItem.update({
      where: { id: raidId },
      data,
    });
  }

  async deleteRaidItem(companyId: string, raidId: string) {
    await this.getCompanyRaidItem(companyId, raidId);

    return this.prisma.rAIDItem.delete({
      where: { id: raidId },
    });
  }

  async getRaidSummary(companyId: string, projectId: string) {
    await this.getCompanyProject(companyId, projectId);

    const raidItems = await this.prisma.rAIDItem.findMany({
      where: { project_id: projectId },
    });

    return {
      total: raidItems.length,
      byType: {
        risk: raidItems.filter(r => r.type === 'RISK').length,
        action: raidItems.filter(r => r.type === 'ACTION').length,
        issue: raidItems.filter(r => r.type === 'ISSUE').length,
        decision: raidItems.filter(r => r.type === 'DECISION').length,
      },
      bySeverity: {
        critical: raidItems.filter(r => r.severity === 'CRITICAL').length,
        high: raidItems.filter(r => r.severity === 'HIGH').length,
        medium: raidItems.filter(r => r.severity === 'MEDIUM').length,
        low: raidItems.filter(r => r.severity === 'LOW').length,
      },
      open: raidItems.filter(r => r.status === 'OPEN').length,
      closed: raidItems.filter(r => r.status === 'CLOSED').length,
    };
  }

  // --- Budget Management ---

  async createOrUpdateBudget(companyId: string, projectId: string, data: ProjectBudgetDto) {
    await this.getCompanyProject(companyId, projectId);

    const existing = await this.prisma.projectBudget.findFirst({
      where: { project_id: projectId },
    });

    const variance = data.total_allocated - data.actual_spent;

    if (existing) {
      return this.prisma.projectBudget.update({
        where: { id: existing.id },
        data: { 
          ...data, 
          variance,
        },
      });
    }

    return this.prisma.projectBudget.create({
      // @ts-ignore - variance_pct has default in schema
      data: {
        ...data,
        variance,
        project_id: projectId,
      },
    });
  }

  async getBudgetStatus(companyId: string, projectId: string) {
    await this.getCompanyProject(companyId, projectId);

    const budgets = await this.prisma.projectBudget.findMany({
      where: { project_id: projectId },
      orderBy: { last_updated: 'desc' },
    });

    if (budgets.length === 0) {
      return {
        total_allocated: 0,
        actual_spent: 0,
        variance: 0,
        utilization_rate: 0,
      };
    }

    const latest = budgets[0];
    const utilizationRate = Number(latest.total_allocated) > 0 
      ? Math.round((Number(latest.actual_spent) / Number(latest.total_allocated)) * 100)
      : 0;

    return {
      ...latest,
      utilization_rate: utilizationRate,
    };
  }

  // --- Resource Management ---

  // async assignResourceToProject(projectId: string, resourceId: string) {
  //   // Check if resource exists
  //   const resource = await this.prisma.resource.findUnique({
  //     where: { id: resourceId },
  //   });
  //   if (!resource) throw new NotFoundException('Resource not found');

  //   // Check if project exists
  //   const project = await this.prisma.project.findUnique({
  //     where: { id: projectId },
  //   });
  //   if (!project) throw new NotFoundException('Project not found');

  //   // Add resource to project (using update to add to relation)
  //   return this.prisma.project.update({
  //     where: { id: projectId },
  //     data: {
  //       resources: {
  //         connect: { id: resourceId },
  //       },
  //     },
  //     include: {
  //       resources: true,
  //     },
  //   });
  // }

  // async removeResourceFromProject(projectId: string, resourceId: string) {
  //   return this.prisma.project.update({
  //     where: { id: projectId },
  //     data: {
  //       resources: {
  //         disconnect: { id: resourceId },
  //       },
  //     },
  //   });
  // }

  // async getProjectResources(projectId: string) {
  //   const project = await this.prisma.project.findUnique({
  //     where: { id: projectId },
  //     include: { resources: true },
  //   });

  //   if (!project) throw new NotFoundException('Project not found');

  //   return project.resources;
  // }

  // // --- Resource CRUD ---

  // async createResource(companyId: string, data: any) {
  //   return this.prisma.resource.create({
  //     data: {
  //       ...data,
  //       company_id: companyId,
  //     },
  //   });
  // }

  // async getResources(companyId: string) {
  //   return this.prisma.resource.findMany({
  //     where: { company_id: companyId },
  //     include: {
  //       projects: {
  //         select: {
  //           id: true,
  //           name: true,
  //           status: true,
  //         },
  //       },
  //     },
  //   });
  // }

  // async updateResource(resourceId: string, data: any) {
  //   const resource = await this.prisma.resource.findUnique({
  //     where: { id: resourceId },
  //   });
  //   if (!resource) throw new NotFoundException('Resource not found');

  //   return this.prisma.resource.update({
  //     where: { id: resourceId },
  //     data,
  //   });
  // }

  // async deleteResource(resourceId: string) {
  //   const resource = await this.prisma.resource.findUnique({
  //     where: { id: resourceId },
  //   });
  //   if (!resource) throw new NotFoundException('Resource not found');

  //   return this.prisma.resource.delete({
  //     where: { id: resourceId },
  //   });
  // }
}
