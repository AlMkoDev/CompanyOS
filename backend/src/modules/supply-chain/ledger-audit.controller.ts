import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LedgerAuditService } from './services/ledger-audit.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { SupplyChainRolesGuard } from './guards/supply-chain-roles.guard';
import { RequireSupplyChainPermissions } from './guards/supply-chain-roles.guard';
import { SupplyChainPermission } from './guards/supply-chain-roles.guard';
import { FeatureFlagGuard, RequireFeatureFlags } from '../../common/guards/feature-flag.guard';
import { FeatureFlag } from '../../common/services/feature-flag.service';

@ApiTags('ledger-audit')
@ApiBearerAuth('JWT-auth')
@Controller('supply-chain/ledger-audit')
@UseGuards(JwtAuthGuard, FeatureFlagGuard, SupplyChainRolesGuard)
@RequireFeatureFlags(FeatureFlag.ENABLE_SUPPLY_CHAIN)
export class LedgerAuditController {
  constructor(private readonly ledgerAuditService: LedgerAuditService) {}

  @Get('integrity-check')
  @ApiOperation({ summary: 'Validate ledger integrity and stock level consistency' })
  @ApiQuery({ name: 'product_id', required: false, description: 'Filter by product ID' })
  @ApiQuery({ name: 'location_id', required: false, description: 'Filter by location ID' })
  @ApiResponse({ status: 200, description: 'Ledger integrity report' })
  @RequireSupplyChainPermissions(SupplyChainPermission.AUDIT_LEDGER)
  async validateIntegrity(
    @Req() req: any,
    @Query('product_id') product_id?: string,
    @Query('location_id') location_id?: string,
  ) {
    return this.ledgerAuditService.validateLedgerIntegrity(
      req.user.companyId,
      product_id,
      location_id,
    );
  }

  @Get('audit-trail')
  @ApiOperation({ summary: 'Get ledger audit trail with filters' })
  @ApiQuery({ name: 'product_id', required: false, description: 'Filter by product ID' })
  @ApiQuery({ name: 'location_id', required: false, description: 'Filter by location ID' })
  @ApiQuery({ name: 'user_id', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'action', required: false, description: 'Filter by action type' })
  @ApiQuery({ name: 'start_date', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'end_date', required: false, description: 'End date (ISO string)' })
  @ApiResponse({ status: 200, description: 'Audit trail entries' })
  @RequireSupplyChainPermissions(SupplyChainPermission.AUDIT_LEDGER)
  async getAuditTrail(
    @Req() req: any,
    @Query('product_id') product_id?: string,
    @Query('location_id') location_id?: string,
    @Query('user_id') user_id?: string,
    @Query('action') action?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
  ) {
    const filters: any = {};
    if (product_id) filters.product_id = product_id;
    if (location_id) filters.location_id = location_id;
    if (user_id) filters.user_id = user_id;
    if (action) filters.action = action;
    if (start_date) filters.start_date = new Date(start_date);
    if (end_date) filters.end_date = new Date(end_date);

    return this.ledgerAuditService.getLedgerAuditTrail(req.user.companyId, filters);
  }

  @Get('anomalies')
  @ApiOperation({ summary: 'Detect potential anomalies in ledger entries' })
  @ApiResponse({ status: 200, description: 'Anomaly detection report' })
  @RequireSupplyChainPermissions(SupplyChainPermission.AUDIT_LEDGER)
  async detectAnomalies(@Req() req: any) {
    return this.ledgerAuditService.detectAnomalies(req.user.companyId);
  }
}