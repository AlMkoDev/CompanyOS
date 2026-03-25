import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { HrisService } from './hris.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CreateEmployeeDto,
  CreatePositionDto,
  UpdateEmployeeDto,
  UploadEmployeeDocumentDto,
} from './dto/hris.dto';

@Controller('hris')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HrisController {
  constructor(private readonly hrisService: HrisService) {}

  // ─── EMPLOYEES ───────────────────────────────────────────────────────────────

  @Post('employees')
  @Roles('Super Admin', 'Dept Admin', 'Chief Human Resources Officer', 'HR Director', 'Administration Manager')
  createEmployee(@Req() req: any, @Body() data: CreateEmployeeDto) {
    return this.hrisService.createEmployee(req.user.companyId, req.user.userId, data);
  }

  @Get('employees')
  @Roles('Super Admin', 'Dept Admin', 'Manager', 'Chief Human Resources Officer', 'HR Director', 'Administration Manager')
  getEmployees(@Req() req: any, @Query() query: any) {
    return this.hrisService.getEmployees(req.user.companyId, query);
  }

  @Get('employees/:id')
  @Roles('Super Admin', 'Dept Admin', 'Manager', 'Chief Human Resources Officer', 'HR Director', 'Administration Manager')
  getEmployee(@Req() req: any, @Param('id') id: string) {
    return this.hrisService.getEmployeeById(req.user.companyId, id);
  }

  @Patch('employees/:id')
  @Roles('Super Admin', 'Dept Admin', 'Chief Human Resources Officer', 'HR Director', 'Administration Manager')
  updateEmployee(@Req() req: any, @Param('id') id: string, @Body() data: UpdateEmployeeDto) {
    return this.hrisService.updateEmployee(req.user.companyId, req.user.userId, id, data);
  }

  // ─── POSITIONS ───────────────────────────────────────────────────────────────

  @Get('positions')
  @Roles('Super Admin', 'Dept Admin', 'Manager', 'Chief Human Resources Officer', 'HR Director', 'Administration Manager')
  getPositions(@Req() req: any) {
    return this.hrisService.getPositions(req.user.companyId);
  }

  @Post('positions')
  @Roles('Super Admin', 'Dept Admin', 'Chief Human Resources Officer', 'HR Director', 'Administration Manager')
  createPosition(@Req() req: any, @Body() data: CreatePositionDto) {
    return this.hrisService.createPosition(req.user.companyId, data);
  }

  // ─── ORG CHART ───────────────────────────────────────────────────────────────

  @Get('org-chart')
  @Roles('Super Admin', 'Dept Admin', 'Manager', 'Chief Human Resources Officer', 'HR Director', 'Administration Manager')
  getOrgChart(@Req() req: any) {
    return this.hrisService.getOrgChart(req.user.companyId);
  }

  // ─── DOCUMENTS ───────────────────────────────────────────────────────────────

  @Post('employees/:id/documents')
  @Roles('Super Admin', 'Dept Admin', 'Chief Human Resources Officer', 'HR Director', 'Administration Manager')
  uploadDocument(@Req() req: any, @Param('id') id: string, @Body() data: UploadEmployeeDocumentDto) {
    return this.hrisService.uploadDocument(req.user.companyId, id, data);
  }

  // ─── REPORTS ─────────────────────────────────────────────────────────────────

  @Get('reports/headcount')
  @Roles('Super Admin', 'Dept Admin', 'Manager', 'Chief Human Resources Officer', 'HR Director', 'Administration Manager')
  getHeadcountReport(@Req() req: any) {
    return this.hrisService.getHeadcountReport(req.user.companyId);
  }
}
