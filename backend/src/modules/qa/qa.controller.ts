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
import { QaService } from './qa.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import {
  CreateAuditFindingDto,
  CreateChecklistDto,
  CreateCorrectiveActionDto,
  CreateNcrDto,
  RootCauseAnalysisDto,
  UpdateAuditFindingDto,
  UpdateChecklistDto,
  UpdateCorrectiveActionDto,
  UpdateNcrDto,
} from './dto/qa.dto';

@Controller('qa')
@UseGuards(JwtAuthGuard)
export class QaController {
  constructor(private readonly qaService: QaService) {}

  // === NCR Management ===

  @Post('ncrs')
  async createNCR(@Req() req: any, @Body() data: CreateNcrDto) {
    return this.qaService.createNCR(req.user.companyId, req.user.userId, data);
  }

  @Get('ncrs')
  async getNCRs(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
  ) {
    return this.qaService.getNCRs(req.user.companyId, { status, severity });
  }

  @Get('ncrs/:id')
  async getNCRDetail(@Req() req: any, @Param('id') id: string) {
    return this.qaService.getNCRDetail(req.user.companyId, id);
  }

  @Patch('ncrs/:id')
  async updateNCR(@Req() req: any, @Param('id') id: string, @Body() data: UpdateNcrDto) {
    return this.qaService.updateNCR(req.user.companyId, id, data);
  }

  @Delete('ncrs/:id')
  async deleteNCR(@Req() req: any, @Param('id') id: string) {
    return this.qaService.deleteNCR(req.user.companyId, id);
  }

  // === RCA (Root Cause Analysis) ===

  @Post('ncrs/:id/rca')
  async createOrUpdateRCA(@Req() req: any, @Param('id') id: string, @Body() data: RootCauseAnalysisDto) {
    return this.qaService.createOrUpdateRCA(req.user.companyId, id, req.user.userId, data);
  }

  @Get('ncrs/:id/rca')
  async getRCA(@Req() req: any, @Param('id') id: string) {
    return this.qaService.getRCA(req.user.companyId, id);
  }

  // === Corrective Actions (CAR) ===

  @Post('ncrs/:id/corrective-actions')
  async createCAR(@Req() req: any, @Param('id') id: string, @Body() data: CreateCorrectiveActionDto) {
    return this.qaService.createCAR(req.user.companyId, id, data);
  }

  @Patch('corrective-actions/:carId')
  async updateCAR(@Req() req: any, @Param('carId') carId: string, @Body() data: UpdateCorrectiveActionDto) {
    return this.qaService.updateCAR(req.user.companyId, carId, data);
  }

  @Delete('corrective-actions/:carId')
  async deleteCAR(@Req() req: any, @Param('carId') carId: string) {
    return this.qaService.deleteCAR(req.user.companyId, carId);
  }

  @Get('ncrs/:id/corrective-actions')
  async getCARSByNCR(@Req() req: any, @Param('id') id: string) {
    return this.qaService.getCARSByNCR(req.user.companyId, id);
  }

  // === Audit Checklists ===

  @Post('checklists')
  async createChecklist(@Req() req: any, @Body() data: CreateChecklistDto) {
    return this.qaService.createChecklist(req.user.companyId, data);
  }

  @Get('checklists')
  async getChecklists(@Req() req: any, @Query('category') category?: string) {
    return this.qaService.getChecklists(req.user.companyId, category);
  }

  @Get('checklists/:id')
  async getChecklistDetail(@Req() req: any, @Param('id') id: string) {
    return this.qaService.getChecklistDetail(req.user.companyId, id);
  }

  @Patch('checklists/:id')
  async updateChecklist(@Req() req: any, @Param('id') id: string, @Body() data: UpdateChecklistDto) {
    return this.qaService.updateChecklist(req.user.companyId, id, data);
  }

  @Delete('checklists/:id')
  async deleteChecklist(@Req() req: any, @Param('id') id: string) {
    return this.qaService.deleteChecklist(req.user.companyId, id);
  }

  // === Audit Findings ===

  @Post('audit-findings')
  async createAuditFinding(@Req() req: any, @Body() data: CreateAuditFindingDto) {
    return this.qaService.createAuditFinding(req.user.companyId, data);
  }

  @Get('audit-findings')
  async getAuditFindings(
    @Req() req: any,
    @Query('severity') severity?: string,
    @Query('status') status?: string,
  ) {
    return this.qaService.getAuditFindings(req.user.companyId, { severity, status });
  }

  @Patch('audit-findings/:id')
  async updateAuditFinding(@Req() req: any, @Param('id') id: string, @Body() data: UpdateAuditFindingDto) {
    return this.qaService.updateAuditFinding(req.user.companyId, id, data);
  }

  @Delete('audit-findings/:id')
  async deleteAuditFinding(@Req() req: any, @Param('id') id: string) {
    return this.qaService.deleteAuditFinding(req.user.companyId, id);
  }

  // === Dashboard & Analytics ===

  @Get('dashboard')
  async getQaDashboard(@Req() req: any) {
    return this.qaService.getQaDashboard(req.user.companyId);
  }

  @Get('reports/ncr-closure')
  async getNcrClosureReport(@Req() req: any) {
    return this.qaService.getNcrClosureReport(req.user.companyId);
  }
}
