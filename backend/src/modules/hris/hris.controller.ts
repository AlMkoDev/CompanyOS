import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { HrisService } from './hris.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import {
  CreateEmployeeDto,
  CreatePositionDto,
  UpdateEmployeeDto,
  UploadEmployeeDocumentDto,
} from './dto/hris.dto';

@Controller('hris')
@UseGuards(JwtAuthGuard)
export class HrisController {
  constructor(private readonly hrisService: HrisService) {}

  // ─── EMPLOYEES ───────────────────────────────────────────────────────────────

  @Post('employees')
  createEmployee(@Req() req: any, @Body() data: CreateEmployeeDto) {
    return this.hrisService.createEmployee(req.user.companyId, data);
  }

  @Get('employees')
  getEmployees(@Req() req: any, @Query() query: any) {
    return this.hrisService.getEmployees(req.user.companyId, query);
  }

  @Get('employees/:id')
  getEmployee(@Req() req: any, @Param('id') id: string) {
    return this.hrisService.getEmployeeById(req.user.companyId, id);
  }

  @Patch('employees/:id')
  updateEmployee(@Req() req: any, @Param('id') id: string, @Body() data: UpdateEmployeeDto) {
    return this.hrisService.updateEmployee(req.user.companyId, id, data);
  }

  // ─── POSITIONS ───────────────────────────────────────────────────────────────

  @Get('positions')
  getPositions(@Req() req: any) {
    return this.hrisService.getPositions(req.user.companyId);
  }

  @Post('positions')
  createPosition(@Req() req: any, @Body() data: CreatePositionDto) {
    return this.hrisService.createPosition(req.user.companyId, data);
  }

  // ─── ORG CHART ───────────────────────────────────────────────────────────────

  @Get('org-chart')
  getOrgChart(@Req() req: any) {
    return this.hrisService.getOrgChart(req.user.companyId);
  }

  // ─── DOCUMENTS ───────────────────────────────────────────────────────────────

  @Post('employees/:id/documents')
  uploadDocument(@Req() req: any, @Param('id') id: string, @Body() data: UploadEmployeeDocumentDto) {
    return this.hrisService.uploadDocument(req.user.companyId, id, data);
  }

  // ─── REPORTS ─────────────────────────────────────────────────────────────────

  @Get('reports/headcount')
  getHeadcountReport(@Req() req: any) {
    return this.hrisService.getHeadcountReport(req.user.companyId);
  }
}
