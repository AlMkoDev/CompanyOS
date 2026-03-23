import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { SupplierService } from './supplier.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { SupplierStatus } from '@prisma/client';
import { FeatureFlagGuard, RequireFeatureFlags } from '../../common/guards/feature-flag.guard';
import { FeatureFlag } from '../../common/services/feature-flag.service';
import { FinancialMaskingInterceptor } from './interceptors/financial-masking.interceptor';
import { MaskFinancialData } from './decorators/mask-financial-data.decorator';
import { BankDetailProtectionGuard } from './guards/bank-detail-protection.guard';
import { BankDetailAuditInterceptor } from './interceptors/bank-detail-audit.interceptor';
import {
  AddSupplierRiskDto,
  CreateSupplierDto,
  SupplierReasonDto,
  UpdateSupplierDto,
  UpdateSupplierRiskDto,
  UpdateSupplierStatusDto,
} from './dto/supplier.dto';

@ApiTags('suppliers')
@ApiBearerAuth('JWT-auth')
@Controller('supply-chain/suppliers')
@UseGuards(JwtAuthGuard, FeatureFlagGuard, BankDetailProtectionGuard)
@UseInterceptors(FinancialMaskingInterceptor, BankDetailAuditInterceptor)
@RequireFeatureFlags(FeatureFlag.ENABLE_SUPPLY_CHAIN)
@UseGuards(JwtAuthGuard)
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiResponse({ status: 201, description: 'Supplier created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Supplier code already exists' })
  async createSupplier(@Req() req: any, @Body() data: CreateSupplierDto) {
    return this.supplierService.createSupplier(req.user.companyId, data);
  }

  @Get()
  @MaskFinancialData({ 
    enabled: true,
    fieldMappings: { 
      bank_details: 'bankDetails',
      payment_terms: 'paymentTerms'
    }
  })
  @ApiOperation({ summary: 'Get all suppliers with optional filters' })
  @ApiQuery({ name: 'status', required: false, enum: SupplierStatus, description: 'Filter by supplier status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in supplier code or name' })
  @ApiResponse({ status: 200, description: 'List of suppliers' })
  async getSuppliers(
    @Req() req: any,
    @Query('status') status?: SupplierStatus,
    @Query('search') search?: string,
  ) {
    return this.supplierService.getSuppliers(req.user.companyId, {
      status,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier by ID' })
  @ApiParam({ name: 'id', description: 'Supplier ID' })
  @ApiResponse({ status: 200, description: 'Supplier details' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async getSupplier(@Req() req: any, @Param('id') id: string) {
    return this.supplierService.getSupplier(req.user.companyId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update supplier' })
  @ApiParam({ name: 'id', description: 'Supplier ID' })
  @ApiResponse({ status: 200, description: 'Supplier updated successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async updateSupplier(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: UpdateSupplierDto,
  ) {
    return this.supplierService.updateSupplier(req.user.companyId, id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete supplier' })
  @ApiParam({ name: 'id', description: 'Supplier ID' })
  @ApiResponse({ status: 200, description: 'Supplier deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete supplier with active relationships' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async deleteSupplier(@Req() req: any, @Param('id') id: string) {
    return this.supplierService.deleteSupplier(req.user.companyId, id);
  }

  // --- Status Management ---

  @Put(':id/status')
  @ApiOperation({ summary: 'Update supplier status' })
  @ApiParam({ name: 'id', description: 'Supplier ID' })
  @ApiResponse({ status: 200, description: 'Supplier status updated' })
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: UpdateSupplierStatusDto,
  ) {
    return this.supplierService.updateStatus(req.user.companyId, id, data.status);
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspend supplier' })
  @ApiParam({ name: 'id', description: 'Supplier ID' })
  @ApiResponse({ status: 200, description: 'Supplier suspended' })
  async suspendSupplier(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data?: SupplierReasonDto,
  ) {
    return this.supplierService.suspendSupplier(req.user.companyId, id, data?.reason);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate supplier' })
  @ApiParam({ name: 'id', description: 'Supplier ID' })
  @ApiResponse({ status: 200, description: 'Supplier activated' })
  async activateSupplier(@Req() req: any, @Param('id') id: string) {
    return this.supplierService.activateSupplier(req.user.companyId, id);
  }

  @Post(':id/blacklist')
  @ApiOperation({ summary: 'Blacklist supplier' })
  @ApiParam({ name: 'id', description: 'Supplier ID' })
  @ApiResponse({ status: 200, description: 'Supplier blacklisted' })
  async blacklistSupplier(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data?: SupplierReasonDto,
  ) {
    return this.supplierService.blacklistSupplier(req.user.companyId, id, data?.reason);
  }

  // --- Risk Management ---

  @Post(':id/risks')
  @ApiOperation({ summary: 'Add risk assessment to supplier' })
  @ApiParam({ name: 'id', description: 'Supplier ID' })
  @ApiResponse({ status: 201, description: 'Risk assessment added' })
  async addRisk(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: AddSupplierRiskDto,
  ) {
    return this.supplierService.addRisk(req.user.companyId, id, data);
  }

  @Put('risks/:riskId')
  @ApiOperation({ summary: 'Update risk assessment' })
  @ApiParam({ name: 'riskId', description: 'Risk ID' })
  @ApiResponse({ status: 200, description: 'Risk assessment updated' })
  async updateRisk(
    @Req() req: any,
    @Param('riskId') riskId: string,
    @Body() data: UpdateSupplierRiskDto,
  ) {
    return this.supplierService.updateRisk(req.user.companyId, riskId, data);
  }

  @Delete('risks/:riskId')
  @ApiOperation({ summary: 'Delete risk assessment' })
  @ApiParam({ name: 'riskId', description: 'Risk ID' })
  @ApiResponse({ status: 200, description: 'Risk assessment deleted' })
  async deleteRisk(@Req() req: any, @Param('riskId') riskId: string) {
    return this.supplierService.deleteRisk(req.user.companyId, riskId);
  }

  // --- Performance & Analytics ---

  @Get(':id/performance')
  @ApiOperation({ summary: 'Get supplier performance metrics' })
  @ApiParam({ name: 'id', description: 'Supplier ID' })
  @ApiResponse({ status: 200, description: 'Supplier performance metrics' })
  async getPerformanceMetrics(@Req() req: any, @Param('id') id: string) {
    return this.supplierService.getPerformanceMetrics(req.user.companyId, id);
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Get products supplied by this supplier' })
  @ApiParam({ name: 'id', description: 'Supplier ID' })
  @ApiResponse({ status: 200, description: 'List of products supplied' })
  async getSupplierProducts(@Req() req: any, @Param('id') id: string) {
    return this.supplierService.getSupplierProducts(req.user.companyId, id);
  }
}
