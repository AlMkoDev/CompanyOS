import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ArService } from './ar.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import {
  CollectionActionDto,
  CreateARInvoiceDto,
  CreateCollectionCaseDto,
  CreateCustomerDto,
  RecordPaymentDto,
} from './dto/ar.dto';

@Controller('ar')
@UseGuards(JwtAuthGuard)
export class ArController {
  constructor(private readonly arService: ArService) {}

  @Post('customers')
  async createCustomer(@Req() req: any, @Body() data: CreateCustomerDto) {
    return this.arService.createCustomer(req.user.companyId, data);
  }

  @Get('customers')
  async getCustomers(@Req() req: any) {
    return this.arService.getCustomers(req.user.companyId);
  }

  @Post('invoices')
  async createInvoice(@Req() req: any, @Body() data: CreateARInvoiceDto) {
    return this.arService.createInvoice(req.user.companyId, data);
  }

  @Get('invoices')
  async getInvoices(@Req() req: any) {
    return this.arService.getInvoices(req.user.companyId);
  }

  @Get('invoices/:id/receipts')
  async getInvoiceReceipts(@Req() req: any, @Param('id') id: string) {
    return this.arService.getInvoiceReceipts(req.user.companyId, id);
  }

  @Post('payments')
  async recordPayment(@Req() req: any, @Body() data: RecordPaymentDto) {
    return this.arService.recordPayment(req.user.companyId, data, req.user.userId);
  }

  @Get('dashboard')
  async getARDashboard(@Req() req: any) {
    return this.arService.getARDashboard(req.user.companyId);
  }

  @Get('aging')
  async getAgingReport(@Req() req: any) {
    return this.arService.getAgingReport(req.user.companyId);
  }

  @Get('collections')
  async getCollectionQueue(@Req() req: any) {
    return this.arService.getCollectionQueue(req.user.companyId);
  }

  @Post('collections')
  async createCollectionCase(@Req() req: any, @Body() body: CreateCollectionCaseDto) {
    return this.arService.createCollectionCase(req.user.companyId, body.invoiceId, body.notes, req.user.userId);
  }

  @Post('collections/:id/actions')
  async addCollectionAction(@Req() req: any, @Param('id') id: string, @Body() body: CollectionActionDto) {
    return this.arService.addCollectionAction(req.user.companyId, id, req.user.userId, body);
  }

  @Post('collections/:id/escalate')
  async escalateCollectionCase(@Req() req: any, @Param('id') id: string, @Body() body: { notes?: string }) {
    return this.arService.escalateCollectionCase(req.user.companyId, id, req.user.userId, body?.notes);
  }

  @Post('collections/:id/resolve')
  async resolveCollectionCase(@Req() req: any, @Param('id') id: string, @Body() body: { notes?: string }) {
    return this.arService.resolveCollectionCase(req.user.companyId, id, req.user.userId, body?.notes);
  }

  @Post('invoices/:id/send')
  async sendInvoice(@Req() req: any, @Param('id') id: string) {
    return this.arService.sendInvoice(req.user.companyId, id);
  }
}
