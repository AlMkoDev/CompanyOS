import { Controller, Get, Post, Put, Param, Body, UseGuards, UseInterceptors, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProcurementWorkflowService, CreatePRDto, ApprovePRDto, CreatePOFromPRDto } from './procurement-workflow.service';
import { SupplyChainRolesGuard } from './guards/supply-chain-roles.guard';
import { POModificationLockGuard } from './guards/po-modification-lock.guard';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { FeatureFlagGuard, RequireFeatureFlags } from '../../common/guards/feature-flag.guard';
import { FeatureFlag } from '../../common/services/feature-flag.service';
import { FinancialMaskingInterceptor } from './interceptors/financial-masking.interceptor';
import { MaskFinancialData } from './decorators/mask-financial-data.decorator';

@ApiTags('Supply Chain - Procurement Workflow')
@ApiBearerAuth('JWT-auth')
@Controller('supply-chain/procurement-workflow')
@UseGuards(JwtAuthGuard, FeatureFlagGuard, SupplyChainRolesGuard)
@UseInterceptors(FinancialMaskingInterceptor)
@RequireFeatureFlags(FeatureFlag.ENABLE_SUPPLY_CHAIN)
export class ProcurementWorkflowController {
  constructor(private readonly procurementService: ProcurementWorkflowService) {}

  @Post('requisitions')
  @ApiOperation({ summary: 'Create a new Purchase Requisition (PR)' })
  @ApiResponse({ status: 201, description: 'PR created successfully' })
  async createPurchaseRequisition(
    @Req() req: any,
    @Body() createPRDto: CreatePRDto,
  ) {
    return this.procurementService.createPurchaseRequisition(req.user.companyId, req.user.userId, createPRDto);
  }

  @Get('requisitions/:id')
  @MaskFinancialData({ 
    enabled: true,
    fieldMappings: { 
      estimated_cost: 'cost',
      total_estimated_cost: 'total',
      line_total: 'total'
    },
    arrayField: 'lines'
  })
  @ApiOperation({ summary: 'Get PR details and status' })
  @ApiResponse({ status: 200, description: 'PR details retrieved' })
  async getPRStatus(@Param('id') prId: string) {
    return this.procurementService.getPRStatus(prId);
  }

  @Put('requisitions/:id/approve')
  @ApiOperation({ summary: 'Approve or reject a Purchase Requisition' })
  @ApiResponse({ status: 200, description: 'PR approval processed' })
  async approvePurchaseRequisition(
    @Param('id') prId: string,
    @Req() req: any,
    @Body() approveDto: ApprovePRDto,
  ) {
    return this.procurementService.approvePurchaseRequisition(prId, req.user.userId, approveDto);
  }

  @Get('approval-queue')
  @MaskFinancialData({ 
    enabled: true,
    fieldMappings: { 
      estimated_cost: 'cost',
      total_estimated_cost: 'total',
      line_total: 'total'
    }
  })
  @ApiOperation({ summary: 'Get PR approval queue for current user' })
  @ApiResponse({ status: 200, description: 'Approval queue retrieved' })
  async getApprovalQueue(
    @Req() req: any,
    @Query('level') level: 'L1' | 'L2' = 'L1',
  ) {
    return this.procurementService.getApprovalQueue(req.user.companyId, req.user.userId, level);
  }

  @Post('purchase-orders')
  @ApiOperation({ summary: 'Create Purchase Order from approved PR' })
  @ApiResponse({ status: 201, description: 'PO created successfully' })
  async createPurchaseOrderFromPR(
    @Req() req: any,
    @Body() createPODto: CreatePOFromPRDto,
  ) {
    return this.procurementService.createPurchaseOrderFromPR(req.user.companyId, req.user.userId, createPODto);
  }

  @Get('requisitions')
  @ApiOperation({ summary: 'Get all PRs for company with filtering' })
  @ApiResponse({ status: 200, description: 'PRs retrieved' })
  async getPurchaseRequisitions(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('requester') requesterId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.procurementService.getPurchaseRequisitions(
      req.user.companyId, 
      { status, requesterId, limit: limit || 50, offset: offset || 0 }
    );
  }

  @Get('purchase-orders')
  @ApiOperation({ summary: 'Get all POs for company with filtering' })
  @ApiResponse({ status: 200, description: 'POs retrieved' })
  async getPurchaseOrders(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('supplier') supplierId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.procurementService.getPurchaseOrders(
      req.user.companyId,
      { status, supplierId, limit: limit || 50, offset: offset || 0 }
    );
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get procurement dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved' })
  async getProcurementDashboard(@Req() req: any) {
    return this.procurementService.getProcurementDashboard(req.user.companyId);
  }
}