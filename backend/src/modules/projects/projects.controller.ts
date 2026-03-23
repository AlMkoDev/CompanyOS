import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import {
  CreateProjectDto,
  CreateProjectTaskDto,
  CreateRaidItemDto,
  ProjectBudgetDto,
  UpdateProjectDto,
  UpdateProjectTaskDto,
  UpdateRaidItemDto,
} from './dto/projects.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // === Project CRUD ===

  @Post()
  async createProject(@Req() req: any, @Body() data: CreateProjectDto) {
    return this.projectsService.createProject(req.user.companyId, data);
  }

  @Get()
  async getProjects(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('rag_status') ragStatus?: string,
  ) {
    return this.projectsService.getProjects(req.user.companyId, { status, rag_status: ragStatus });
  }

  @Get(':id')
  async getProjectDetail(@Req() req: any, @Param('id') id: string) {
    return this.projectsService.getProjectDetail(req.user.companyId, id);
  }

  @Patch(':id')
  async updateProject(@Req() req: any, @Param('id') id: string, @Body() data: UpdateProjectDto) {
    return this.projectsService.updateProject(req.user.companyId, id, data);
  }

  @Delete(':id')
  async deleteProject(@Req() req: any, @Param('id') id: string) {
    return this.projectsService.deleteProject(req.user.companyId, id);
  }

  // === Dashboard & Analytics ===

  @Get('dashboard/rag')
  async getRagDashboard(@Req() req: any) {
    return this.projectsService.getRagDashboard(req.user.companyId);
  }

  @Get('reports/on-time-delivery')
  async getOnTimeDeliveryReport(@Req() req: any) {
    return this.projectsService.getOnTimeDeliveryReport(req.user.companyId);
  }

  // === Task Management ===

  @Post(':id/tasks')
  async createTask(@Req() req: any, @Param('id') id: string, @Body() data: CreateProjectTaskDto) {
    return this.projectsService.createTask(req.user.companyId, id, data);
  }

  @Patch('tasks/:taskId')
  async updateTask(@Req() req: any, @Param('taskId') taskId: string, @Body() data: UpdateProjectTaskDto) {
    return this.projectsService.updateTask(req.user.companyId, taskId, data);
  }

  @Delete('tasks/:taskId')
  async deleteTask(@Req() req: any, @Param('taskId') taskId: string) {
    return this.projectsService.deleteTask(req.user.companyId, taskId);
  }

  @Get(':id/tasks/by-status/:status')
  async getTasksByStatus(
    @Req() req: any,
    @Param('id') projectId: string,
    @Param('status') status: string,
  ) {
    return this.projectsService.getTasksByStatus(req.user.companyId, projectId, status);
  }

  // === RAID Log Management ===

  @Post(':id/raid')
  async createRaidItem(@Req() req: any, @Param('id') id: string, @Body() data: CreateRaidItemDto) {
    return this.projectsService.createRaidItem(req.user.companyId, id, data);
  }

  @Patch('raid/:raidId')
  async updateRaidItem(@Req() req: any, @Param('raidId') raidId: string, @Body() data: UpdateRaidItemDto) {
    return this.projectsService.updateRaidItem(req.user.companyId, raidId, data);
  }

  @Delete('raid/:raidId')
  async deleteRaidItem(@Req() req: any, @Param('raidId') raidId: string) {
    return this.projectsService.deleteRaidItem(req.user.companyId, raidId);
  }

  @Get(':id/raid/summary')
  async getRaidSummary(@Req() req: any, @Param('id') projectId: string) {
    return this.projectsService.getRaidSummary(req.user.companyId, projectId);
  }

  // === Budget Management ===

  @Post(':id/budget')
  async createOrUpdateBudget(@Req() req: any, @Param('id') projectId: string, @Body() data: ProjectBudgetDto) {
    return this.projectsService.createOrUpdateBudget(req.user.companyId, projectId, data);
  }

  @Get(':id/budget')
  async getBudgetStatus(@Req() req: any, @Param('id') projectId: string) {
    return this.projectsService.getBudgetStatus(req.user.companyId, projectId);
  }

  // === Resource Management ===

  // @Post(':id/resources/:resourceId')
  // async assignResourceToProject(
  //   @Param('id') projectId: string,
  //   @Param('resourceId') resourceId: string,
  // ) {
  //   return this.projectsService.assignResourceToProject(projectId, resourceId);
  // }

  // @Delete(':id/resources/:resourceId')
  // async removeResourceFromProject(
  //   @Param('id') projectId: string,
  //   @Param('resourceId') resourceId: string,
  // ) {
  //   return this.projectsService.removeResourceFromProject(projectId, resourceId);
  // }

  // @Get(':id/resources')
  // async getProjectResources(@Param('id') projectId: string) {
  //   return this.projectsService.getProjectResources(projectId);
  // }

  // @Post('resources')
  // async createResource(@Req() req: any, @Body() data: any) {
  //   return this.projectsService.createResource(req.user.companyId, data);
  // }

  // @Get('resources')
  // async getResources(@Req() req: any) {
  //   return this.projectsService.getResources(req.user.companyId);
  // }

  // @Patch('resources/:resourceId')
  // async updateResource(@Param('resourceId') resourceId: string, @Body() data: any) {
  //   return this.projectsService.updateResource(resourceId, data);
  // }

  // @Delete('resources/:resourceId')
  // async deleteResource(@Param('resourceId') resourceId: string) {
  //   return this.projectsService.deleteResource(resourceId);
  // }
}
