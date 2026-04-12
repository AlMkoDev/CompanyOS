import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt.strategy';
import { SupplyChainRolesGuard, RequireSupplyChainPermissions, SupplyChainPermission } from '../guards/supply-chain-roles.guard';
import { SupplyChainAuditService } from '../services/supply-chain-audit.service';

@ApiTags('Supply Chain Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SupplyChainRolesGuard)
@Controller('supply-chain/audit')
export class SupplyChainAuditController {
  constructor(private readonly auditService: SupplyChainAuditService) {}

  @Get('report')
  @RequireSupplyChainPermissions(SupplyChainPermission.AUDIT_LEDGER)
  @ApiOperation({ summary: 'Generate comprehensive audit report' })
  @ApiResponse({ status: 200, description: 'Audit report generated' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO string)' })
  @ApiQuery({ name: 'type', required: false, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'] })
  async generateAuditReport(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('type') type?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM',
  ) {
    const companyId = req.user.companyId;
    
    // Default to last 30 days if no dates provided
    const defaultFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const defaultTo = new Date();
    
    const period = {
      from: from ? new Date(from) : defaultFrom,
      to: to ? new Date(to) : defaultTo,
    };
    
    return this.auditService.generateAuditReport(companyId, period, type || 'CUSTOM');
  }

  @Get('trail/:resourceType/:resourceId')
  @RequireSupplyChainPermissions(SupplyChainPermission.AUDIT_LEDGER)
  @ApiOperation({ summary: 'Get audit trail for specific resource' })
  @ApiResponse({ status: 200, description: 'Audit trail retrieved' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of entries' })
  async getResourceAuditTrail(
    @Request() req: any,
    @Param('resourceType') resourceType: string,
    @Param('resourceId') resourceId: string,
    @Query('limit') limit?: string,
  ) {
    const companyId = req.user.companyId;
    const maxEntries = limit ? parseInt(limit, 10) : 100;
    
    return this.auditService.getResourceAuditTrail(
      companyId,
      resourceType,
      resourceId,
      maxEntries,
    );
  }

  @Get('security-alerts')
  @RequireSupplyChainPermissions(SupplyChainPermission.AUDIT_LEDGER)
  @ApiOperation({ summary: 'Get current security alerts and suspicious patterns' })
  @ApiResponse({ status: 200, description: 'Security alerts retrieved' })
  async getSecurityAlerts(@Request() req: any) {
    const companyId = req.user.companyId;
    return this.auditService.detectSuspiciousPatterns(companyId);
  }

  @Get('dashboard')
  @RequireSupplyChainPermissions(SupplyChainPermission.AUDIT_LEDGER)
  @ApiOperation({ summary: 'Get audit dashboard summary' })
  @ApiResponse({ status: 200, description: 'Audit dashboard data retrieved' })
  async getAuditDashboard(@Request() req: any) {
    const companyId = req.user.companyId;
    
    // Get last 7 days for dashboard
    const period = {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      to: new Date(),
    };
    
    const [report, alerts] = await Promise.all([
      this.auditService.generateAuditReport(companyId, period, 'WEEKLY'),
      this.auditService.detectSuspiciousPatterns(companyId),
    ]);
    
    return {
      period,
      summary: report.summary,
      security_alerts: alerts.filter(alert => !alert.resolved),
      compliance_status: report.compliance_metrics,
      top_operations: Object.entries(report.operations_by_type)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
      recommendations: report.recommendations.slice(0, 3), // Top 3 recommendations
    };
  }
}
