import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { SupplyChainRolesGuard } from './guards/supply-chain-roles.guard';
import { SupplierPerformanceService } from './supplier-performance.service';

@ApiTags('Supplier Performance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SupplyChainRolesGuard)
@Controller('supply-chain/supplier-performance')
export class SupplierPerformanceController {
  constructor(private readonly performanceService: SupplierPerformanceService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get supplier performance dashboard summary' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved' })
  async getPerformanceDashboard(@Request() req: any) {
    const companyId = req.user.companyId;
    return this.performanceService.getPerformanceDashboard(companyId);
  }

  @Get('scorecards')
  @ApiOperation({ summary: 'Get all supplier scorecards' })
  @ApiResponse({ status: 200, description: 'Supplier scorecards retrieved' })
  async getAllScorecards(@Request() req: any) {
    const companyId = req.user.companyId;
    return this.performanceService.getAllSupplierScorecards(companyId);
  }

  @Get('scorecards/:supplierId')
  @ApiOperation({ summary: 'Get supplier scorecard by ID' })
  @ApiResponse({ status: 200, description: 'Supplier scorecard retrieved' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async getSupplierScorecard(
    @Request() req: any,
    @Param('supplierId') supplierId: string,
  ) {
    const companyId = req.user.companyId;
    return this.performanceService.getSupplierScorecard(companyId, supplierId);
  }

  @Get('metrics/:supplierId')
  @ApiOperation({ summary: 'Get detailed supplier performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved' })
  async getSupplierMetrics(
    @Request() req: any,
    @Param('supplierId') supplierId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const companyId = req.user.companyId;
    
    const period = {
      from: from ? new Date(from) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      to: to ? new Date(to) : new Date(),
    };
    
    return this.performanceService.calculateSupplierPerformance(
      companyId,
      supplierId,
      period,
    );
  }

  @Get('risk/:riskLevel')
  @ApiOperation({ summary: 'Get suppliers by risk level' })
  @ApiResponse({ status: 200, description: 'Suppliers by risk level retrieved' })
  async getSuppliersByRiskLevel(
    @Request() req: any,
    @Param('riskLevel') riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  ) {
    const companyId = req.user.companyId;
    return this.performanceService.getSuppliersByRiskLevel(companyId, riskLevel);
  }

  @Post('alerts/send')
  @ApiOperation({ summary: 'Send performance alerts for critical suppliers' })
  @ApiResponse({ status: 200, description: 'Alerts sent successfully' })
  async sendPerformanceAlerts(@Request() req: any) {
    const companyId = req.user.companyId;
    await this.performanceService.sendPerformanceAlerts(companyId);
    return { message: 'Performance alerts sent successfully' };
  }
}
