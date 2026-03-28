import {
  Controller,
  Get,
  Post,
  Put,
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
  CreateAPManualEntryDto,
  CreateAPRequisitionDto,
  CreatePurchaseOrderDto,
  CreateVendorDto,
  GeneratePaymentRunDto,
  ApproveAPRequisitionDto,
  LogAPExceptionDto,
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

  @Post('requisitions')
  async createRequisition(@Req() req: any, @Body() data: CreateAPRequisitionDto) {
    return this.apService.createRequisition(req.user.companyId, req.user.userId, data);
  }

  @Get('requisitions')
  async getRequisitions(@Req() req: any) {
    return this.apService.getRequisitions(req.user.companyId);
  }

  @Put('requisitions/:id/approve')
  async approveRequisition(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: ApproveAPRequisitionDto,
  ) {
    return this.apService.approveRequisition(req.user.companyId, id, req.user.userId, data);
  }

  @Post('manual-entries')
  async createManualEntry(@Req() req: any, @Body() data: CreateAPManualEntryDto) {
    return this.apService.createManualEntry(req.user.companyId, req.user.userId, data);
  }

  @Get('manual-entries')
  async getManualEntries(@Req() req: any) {
    return this.apService.getManualEntries(req.user.companyId);
  }

  @Put('manual-entries/:id/approve')
  async approveManualEntry(@Req() req: any, @Param('id') id: string) {
    return this.apService.approveManualEntry(req.user.companyId, id, req.user.userId, true);
  }

  @Get('audit-trail')
  async getAuditTrail(@Req() req: any) {
    return this.apService.getAPAuditTrail(req.user.companyId);
  }

  @Get('exceptions')
  async getExceptions(@Req() req: any) {
    return this.apService.getAPMatchExceptions(req.user.companyId);
  }

  @Post('vendor-bills')
  async createVendorBill(@Req() req: any, @Body() data: CreateAPInvoiceDto) {
    return this.apService.createInvoice(req.user.companyId, data);
  }

  @Post('vendor-bills/:id/match')
  async runVendorBillMatch(@Req() req: any, @Param('id') id: string) {
    return this.apService.runThreeWayMatch(req.user.companyId, id, req.user.userId);
  }

  @Post('vendor-bills/:id/approve')
  async approveVendorBill(@Req() req: any, @Param('id') id: string) {
    return this.apService.approveInvoice(req.user.companyId, id, req.user.userId);
  }

  @Post('vendor-bills/:id/exceptions')
  async logVendorBillException(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: LogAPExceptionDto,
  ) {
    return this.apService.logMatchException(req.user.companyId, id, data, req.user.userId);
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
    return this.apService.runThreeWayMatch(req.user.companyId, id, req.user.userId);
  }

  @Post('invoices/:id/approve')
  async approveInvoice(@Req() req: any, @Param('id') id: string) {
    return this.apService.approveInvoice(req.user.companyId, id, req.user.userId);
  }

  @Post('invoices/:id/exceptions')
  async logInvoiceException(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: LogAPExceptionDto,
  ) {
    return this.apService.logMatchException(req.user.companyId, id, data, req.user.userId);
  }

  @Post('payment-runs')
  async generatePaymentRun(@Req() req: any, @Body() body: GeneratePaymentRunDto) {
    return this.apService.generatePaymentRun(req.user.companyId, body.billIds || body.invoiceIds || []);
  }

  @Post('payment-runs/:id/approve')
  async approvePaymentRun(@Req() req: any, @Param('id') id: string) {
    return this.apService.approvePaymentRun(req.user.companyId, id, req.user.userId);
  }

  @Post('payment-runs/:id/complete')
  async completePaymentRun(@Req() req: any, @Param('id') id: string) {
    return this.apService.completePaymentRun(req.user.companyId, id);
  }

  @Get('dashboard')
  async getAPDashboard(@Req() req: any) {
    return this.apService.getAPDashboard(req.user.companyId);
  }
}
