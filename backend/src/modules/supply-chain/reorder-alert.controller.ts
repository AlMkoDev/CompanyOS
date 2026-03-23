import { Controller, Get, Post, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReorderAlertService, ReorderAlert } from './reorder-alert.service';
import { SupplyChainRolesGuard } from './guards/supply-chain-roles.guard';
import { User } from '../common/decorators/user.decorator';

@ApiTags('Supply Chain - Reorder Alerts')
@ApiBearerAuth()
@Controller('supply-chain/reorder-alerts')
@UseGuards(SupplyChainRolesGuard)
export class ReorderAlertController {
  constructor(private readonly reorderAlertService: ReorderAlertService) {}

  @Get()
  @ApiOperation({ summary: 'Get all reorder alerts for company' })
  @ApiResponse({ status: 200, description: 'List of reorder alerts' })
  async getReorderAlerts(
    @User('company_id') companyId: string,
    @Query('urgency') urgency?: string,
  ): Promise<ReorderAlert[]> {
    const alerts = await this.reorderAlertService.getReorderAlertsForCompany(companyId);
    
    if (urgency) {
      return alerts.filter(alert => alert.urgencyLevel === urgency.toUpperCase());
    }
    
    return alerts;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get reorder alert statistics for dashboard' })
  @ApiResponse({ status: 200, description: 'Reorder alert statistics' })
  async getReorderAlertStats(@User('company_id') companyId: string) {
    return this.reorderAlertService.getReorderAlertStats(companyId);
  }

  @Post(':alertId/acknowledge')
  @ApiOperation({ summary: 'Acknowledge a reorder alert' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged successfully' })
  async acknowledgeAlert(
    @Param('alertId') alertId: string,
    @User('id') userId: string,
  ) {
    return this.reorderAlertService.acknowledgeAlert(alertId, userId);
  }

  @Post('check')
  @ApiOperation({ summary: 'Manually trigger reorder alert check' })
  @ApiResponse({ status: 200, description: 'Reorder alert check completed' })
  async manualReorderCheck(@User('company_id') companyId: string) {
    const alerts = await this.reorderAlertService.generateReorderAlerts(companyId);
    return {
      message: 'Reorder alert check completed',
      alertsFound: alerts.length,
      alerts: alerts.slice(0, 10), // Return top 10 alerts
    };
  }
}