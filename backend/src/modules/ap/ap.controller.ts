import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApService } from './ap.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import {
  CreateAPGoodsReceiptDto,
  CreateAPInvoiceDto,
  CreatePurchaseOrderDto,
  CreateVendorDto,
  GeneratePaymentRunDto,
} from './dto/ap.dto';

@Controller('ap')
@UseGuards(JwtAuthGuard)
export class ApController {
  constructor(private readonly apService: ApService) {}

  @Post('vendors')
  async createVendor(@Req() req: any, @Body() data: CreateVendorDto) {
    return this.apService.createVendor(req.user.companyId, data);
  }

  @Get('vendors')
  async getVendors(@Req() req: any) {
    return this.apService.getVendors(req.user.companyId);
  }

  @Post('purchase-orders')
  async createPurchaseOrder(@Req() req: any, @Body() data: CreatePurchaseOrderDto) {
    return this.apService.createPurchaseOrder(req.user.companyId, data);
  }

  @Post('purchase-orders/:id/approve')
  async approvePurchaseOrder(@Req() req: any, @Param('id') id: string) {
    return this.apService.approvePurchaseOrder(
      req.user.companyId,
      id,
      req.user.userId,
    );
  }

  @Post('invoices')
  async createInvoice(@Req() req: any, @Body() data: CreateAPInvoiceDto) {
    return this.apService.createInvoice(req.user.companyId, data);
  }

  @Post('goods-receipts')
  async createGoodsReceipt(@Req() req: any, @Body() data: CreateAPGoodsReceiptDto) {
    return this.apService.createGoodsReceipt(req.user.companyId, data);
  }

  @Post('invoices/:id/match')
  async runThreeWayMatch(@Req() req: any, @Param('id') id: string) {
    return this.apService.runThreeWayMatch(req.user.companyId, id);
  }

  @Post('invoices/:id/approve')
  async approveInvoice(@Req() req: any, @Param('id') id: string) {
    return this.apService.approveInvoice(req.user.companyId, id, req.user.userId);
  }

  @Post('payment-runs')
  async generatePaymentRun(@Req() req: any, @Body() body: GeneratePaymentRunDto) {
    return this.apService.generatePaymentRun(req.user.companyId, body.invoiceIds);
  }

  @Get('dashboard')
  async getAPDashboard(@Req() req: any) {
    return this.apService.getAPDashboard(req.user.companyId);
  }
}
