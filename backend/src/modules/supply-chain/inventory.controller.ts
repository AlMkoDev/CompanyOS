import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { LedgerAuditService } from './services/ledger-audit.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { LedgerImmutabilityGuard } from './guards/ledger-immutability.guard';
import { FeatureFlagGuard, RequireFeatureFlags } from '../../common/guards/feature-flag.guard';
import { FeatureFlag } from '../../common/services/feature-flag.service';
import {
  AdjustStockDto,
  CreateLedgerEntryDto,
  FulfillStockDto,
  ReceiveStockDto,
  TransferStockDto,
  UpdateReorderPointAltDto,
  UpdateReorderPointDto,
} from './dto/inventory.dto';

@ApiTags('inventory')
@ApiBearerAuth('JWT-auth')
@Controller('supply-chain/inventory')
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@RequireFeatureFlags(FeatureFlag.ENABLE_SUPPLY_CHAIN)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly ledgerAuditService: LedgerAuditService,
  ) {}

  // --- Stock Levels ---

  @Get('stock-levels')
  @ApiOperation({ summary: 'Get stock levels with optional filters' })
  @ApiQuery({ name: 'product_id', required: false, description: 'Filter by product ID' })
  @ApiQuery({ name: 'location_id', required: false, description: 'Filter by location ID' })
  @ApiQuery({ name: 'low_stock_only', required: false, description: 'Show only low stock items' })
  @ApiResponse({ status: 200, description: 'List of stock levels' })
  async getStockLevels(
    @Req() req: any,
    @Query('product_id') product_id?: string,
    @Query('location_id') location_id?: string,
    @Query('low_stock_only') low_stock_only?: string,
  ) {
    return this.inventoryService.getStockLevels(req.user.companyId, {
      product_id,
      location_id,
      low_stock_only: low_stock_only === 'true',
    });
  }

  @Get('stock-levels/alerts')
  @ApiOperation({ summary: 'Get low stock alerts' })
  @ApiResponse({ status: 200, description: 'List of low stock items' })
  async getLowStockAlerts(@Req() req: any) {
    return this.inventoryService.getLowStockAlerts(req.user.companyId);
  }

  @Post('stock-levels/recalculate')
  @ApiOperation({ summary: 'Recalculate all stock levels from ledger' })
  @ApiResponse({ status: 200, description: 'Stock levels recalculated' })
  async recalculateAllStockLevels(@Req() req: any) {
    return this.inventoryService.recalculateAllStockLevels(req.user.companyId);
  }

  // --- Stock History ---

  @Get('history/:productId')
  @ApiOperation({ summary: 'Get stock transaction history for a product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiQuery({ name: 'location_id', required: false, description: 'Filter by location ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of records' })
  @ApiResponse({ status: 200, description: 'Stock transaction history' })
  async getStockHistory(
    @Req() req: any,
    @Param('productId') productId: string,
    @Query('location_id') locationId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getStockHistory(
      req.user.companyId,
      productId,
      locationId,
      limit ? parseInt(limit) : 100,
    );
  }

  // --- Stock Movements ---

  @Post('movements/receive')
  @ApiOperation({ summary: 'Receive stock (goods receipt)' })
  @ApiResponse({ status: 201, description: 'Stock received successfully' })
  @ApiResponse({ status: 400, description: 'Invalid quantity or product/location not found' })
  async receiveStock(@Req() req: any, @Body() data: ReceiveStockDto) {
    return this.inventoryService.receiveStock(req.user.companyId, data, req.user.userId);
  }

  @Post('movements/adjust')
  @ApiOperation({ summary: 'Adjust stock levels (manual adjustment)' })
  @ApiResponse({ status: 201, description: 'Stock adjusted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid adjustment data' })
  async adjustStock(@Req() req: any, @Body() data: AdjustStockDto) {
    return this.inventoryService.adjustStock(req.user.companyId, data, req.user.userId);
  }

  @Post('adjust')
  @ApiOperation({ summary: 'Adjust stock levels (alias for movements/adjust)' })
  @ApiResponse({ status: 201, description: 'Stock adjusted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid adjustment data' })
  async adjustStockAlias(@Req() req: any, @Body() data: AdjustStockDto) {
    return this.inventoryService.adjustStock(req.user.companyId, data, req.user.userId);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer stock between locations (alias for movements/transfer)' })
  @ApiResponse({ status: 201, description: 'Stock transferred successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient stock or invalid locations' })
  async transferStockAlias(@Req() req: any, @Body() data: TransferStockDto) {
    return this.inventoryService.transferStock(req.user.companyId, data, req.user.userId);
  }

  @Post('movements/transfer')
  @ApiOperation({ summary: 'Transfer stock between locations' })
  @ApiResponse({ status: 201, description: 'Stock transferred successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient stock or invalid locations' })
  async transferStock(@Req() req: any, @Body() data: TransferStockDto) {
    return this.inventoryService.transferStock(req.user.companyId, data, req.user.userId);
  }

  @Post('movements/fulfill')
  @ApiOperation({ summary: 'Fulfill stock (order fulfillment)' })
  @ApiResponse({ status: 201, description: 'Stock fulfilled successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient stock for fulfillment' })
  async fulfillStock(@Req() req: any, @Body() data: FulfillStockDto) {
    return this.inventoryService.fulfillStock(req.user.companyId, data, req.user.userId);
  }

  // --- Reorder Management ---

  @Put('reorder-points/:productId/:locationId')
  @ApiOperation({ summary: 'Update reorder point and EOQ for a product at location' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiParam({ name: 'locationId', description: 'Location ID' })
  @ApiResponse({ status: 200, description: 'Reorder point updated successfully' })
  async updateReorderPoint(
    @Req() req: any,
    @Param('productId') productId: string,
    @Param('locationId') locationId: string,
    @Body() data: UpdateReorderPointDto,
  ) {
    return this.inventoryService.updateReorderPoint(
      req.user.companyId,
      productId,
      locationId,
      data.reorder_point,
      data.eoq,
    );
  }

  @Put('reorder-point')
  @ApiOperation({ summary: 'Update reorder point and EOQ (alternative endpoint)' })
  @ApiResponse({ status: 200, description: 'Reorder point updated successfully' })
  async updateReorderPointAlt(
    @Req() req: any,
    @Body() data: UpdateReorderPointAltDto,
  ) {
    return this.inventoryService.updateReorderPoint(
      req.user.companyId,
      data.product_id,
      data.location_id,
      data.reorder_point,
      data.eoq,
    );
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get inventory dashboard data' })
  @ApiResponse({ status: 200, description: 'Inventory dashboard metrics' })
  async getDashboardData(@Req() req: any) {
    const [stockLevels, lowStockAlerts] = await Promise.all([
      this.inventoryService.getStockLevels(req.user.companyId),
      this.inventoryService.getLowStockAlerts(req.user.companyId),
    ]);

    // Calculate metrics
    const totalProducts = new Set(stockLevels.map(sl => sl.product_id)).size;
    const totalValue = stockLevels.reduce((sum, sl) => {
      const preferredSupplier = sl.product?.suppliers?.find(s => s.is_preferred) || sl.product?.suppliers?.[0];
      const unitCost = preferredSupplier?.unit_cost || 0;
      return sum + (sl.quantity * unitCost);
    }, 0);

    const lowStockItems = lowStockAlerts.length;
    const outOfStockItems = stockLevels.filter(sl => sl.quantity === 0).length;

    // Calculate turnover rate (placeholder - would need historical data)
    const turnoverRate = 4.2; // Average quarterly turnover

    return {
      totalProducts,
      lowStockItems,
      outOfStockItems,
      totalValue,
      turnoverRate,
      recentMovements: [], // Would fetch recent ledger entries
    };
  }

  // --- Ledger Entries (Immutable) ---

  @Post('ledger')
  @UseGuards(LedgerImmutabilityGuard)
  @ApiOperation({ summary: 'Create stock ledger entry (advanced use) - IMMUTABLE' })
  @ApiResponse({ status: 201, description: 'Ledger entry created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid ledger entry data' })
  @ApiResponse({ status: 403, description: 'Ledger entries are immutable - modification forbidden' })
  async createLedgerEntry(@Req() req: any, @Body() data: CreateLedgerEntryDto) {
    // Log the ledger operation
    await this.ledgerAuditService.logLedgerOperation(
      req.user.companyId,
      'CREATE',
      undefined, // Will be set after creation
      req.user.userId,
      {
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        request_data: data,
      },
    );

    const result = await this.inventoryService.createLedgerEntry(req.user.companyId, {
      ...data,
      user_id: req.user.userId,
    });

    // Log the successful creation with the ledger entry ID
    await this.ledgerAuditService.logLedgerOperation(
      req.user.companyId,
      'CREATE',
      result.id,
      req.user.userId,
      {
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        request_data: data,
      },
    );

    return result;
  }

  @Get('ledger/:productId')
  @ApiOperation({ summary: 'Get ledger entries for a product (read-only)' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiQuery({ name: 'location_id', required: false, description: 'Filter by location ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of records' })
  @ApiResponse({ status: 200, description: 'Ledger entries' })
  async getLedgerEntries(
    @Req() req: any,
    @Param('productId') productId: string,
    @Query('location_id') locationId?: string,
    @Query('limit') limit?: string,
  ) {
    // Log the read operation
    await this.ledgerAuditService.logLedgerOperation(
      req.user.companyId,
      'READ',
      undefined,
      req.user.userId,
      {
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        request_data: { productId, locationId, limit },
      },
    );

    return this.inventoryService.getStockHistory(
      req.user.companyId,
      productId,
      locationId,
      limit ? parseInt(limit) : 100,
    );
  }
}
