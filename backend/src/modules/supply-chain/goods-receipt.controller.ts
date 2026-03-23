import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SupplyChainRolesGuard } from './guards/supply-chain-roles.guard';
import { GoodsReceiptService, CreateGoodsReceiptDto } from './goods-receipt.service';
import { ResolveGoodsReceiptDto } from './dto/goods-receipt.dto';

@ApiTags('Goods Receipt')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SupplyChainRolesGuard)
@Controller('supply-chain/goods-receipt')
export class GoodsReceiptController {
  constructor(private readonly goodsReceiptService: GoodsReceiptService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new goods receipt' })
  @ApiResponse({ status: 201, description: 'Goods receipt created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @HttpCode(HttpStatus.CREATED)
  async createGoodsReceipt(
    @Request() req: any,
    @Body() createGRDto: CreateGoodsReceiptDto,
  ) {
    const companyId = req.user.company_id;
    const userId = req.user.sub;
    
    return this.goodsReceiptService.createGoodsReceipt(companyId, userId, createGRDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get goods receipt details' })
  @ApiResponse({ status: 200, description: 'Goods receipt details retrieved' })
  @ApiResponse({ status: 404, description: 'Goods receipt not found' })
  async getGoodsReceipt(
    @Request() req: any,
    @Param('id') grId: string,
  ) {
    const companyId = req.user.company_id;
    return this.goodsReceiptService.getGoodsReceipt(companyId, grId);
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Complete goods receipt and update inventory' })
  @ApiResponse({ status: 200, description: 'Goods receipt completed successfully' })
  @ApiResponse({ status: 400, description: 'Cannot complete goods receipt' })
  async completeGoodsReceipt(
    @Request() req: any,
    @Param('id') grId: string,
  ) {
    const companyId = req.user.company_id;
    const userId = req.user.sub;
    
    return this.goodsReceiptService.completeGoodsReceipt(companyId, grId, userId);
  }

  @Put(':id/resolve-discrepancy')
  @ApiOperation({ summary: 'Resolve goods receipt discrepancy' })
  @ApiResponse({ status: 200, description: 'Discrepancy resolved successfully' })
  @ApiResponse({ status: 400, description: 'Cannot resolve discrepancy' })
  async resolveDiscrepancy(
    @Request() req: any,
    @Param('id') grId: string,
    @Body() resolution: ResolveGoodsReceiptDto,
  ) {
    const companyId = req.user.company_id;
    const userId = req.user.sub;
    
    return this.goodsReceiptService.resolveDiscrepancy(companyId, grId, userId, resolution);
  }

  @Get('po/:poId')
  @ApiOperation({ summary: 'Get goods receipts for a purchase order' })
  @ApiResponse({ status: 200, description: 'Goods receipts retrieved' })
  async getGoodsReceiptsForPO(
    @Request() req: any,
    @Param('poId') poId: string,
  ) {
    const companyId = req.user.company_id;
    return this.goodsReceiptService.getGoodsReceiptsForPO(companyId, poId);
  }

  @Get('pending/discrepancies')
  @ApiOperation({ summary: 'Get pending goods receipts with discrepancies' })
  @ApiResponse({ status: 200, description: 'Pending goods receipts retrieved' })
  async getPendingGoodsReceipts(@Request() req: any) {
    const companyId = req.user.company_id;
    return this.goodsReceiptService.getPendingGoodsReceipts(companyId);
  }

  @Get('stats/discrepancies')
  @ApiOperation({ summary: 'Get discrepancy statistics for dashboard' })
  @ApiResponse({ status: 200, description: 'Discrepancy statistics retrieved' })
  async getDiscrepancyStats(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const companyId = req.user.company_id;
    
    const dateRange = from && to ? {
      from: new Date(from),
      to: new Date(to),
    } : undefined;
    
    return this.goodsReceiptService.getDiscrepancyStats(companyId, dateRange);
  }
}
