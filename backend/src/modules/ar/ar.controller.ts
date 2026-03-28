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
  ApproveDisputeResolutionDto,
  CollectionActionDto,
  CreateARInvoiceDto,
  CreateDisputeActivityDto,
  CreateDisputeDto,
  CreateDisputeResolutionDto,
  CreateCollectionCaseDto,
  CreateCustomerDto,
  MarkResolutionPostedDto,
  RecordPaymentDto,
  SendReminderDto,
  UpdateDisputeStatusDto,
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

  @Get('invoices/:id/dunning')
  async getInvoiceDunning(@Req() req: any, @Param('id') id: string) {
    return this.arService.getInvoiceDunning(req.user.companyId, id);
  }

  @Get('invoices/:id/disputes')
  async getInvoiceDisputes(@Req() req: any, @Param('id') id: string) {
    return this.arService.getInvoiceDisputes(req.user.companyId, id);
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

  @Get('disputes')
  async getDisputes(@Req() req: any) {
    return this.arService.getDisputes(req.user.companyId);
  }

  @Post('disputes')
  async createDispute(@Req() req: any, @Body() body: CreateDisputeDto) {
    return this.arService.createDispute(req.user.companyId, req.user.userId, body);
  }

  @Post('disputes/:id/activity')
  async addDisputeActivity(@Req() req: any, @Param('id') id: string, @Body() body: CreateDisputeActivityDto) {
    return this.arService.addDisputeActivity(req.user.companyId, id, req.user.userId, body);
  }

  @Post('disputes/:id/status')
  async updateDisputeStatus(@Req() req: any, @Param('id') id: string, @Body() body: UpdateDisputeStatusDto) {
    return this.arService.updateDisputeStatus(req.user.companyId, id, req.user.userId, body);
  }

  @Post('disputes/:id/resolutions')
  async createDisputeResolution(@Req() req: any, @Param('id') id: string, @Body() body: CreateDisputeResolutionDto) {
    return this.arService.createDisputeResolution(req.user.companyId, id, req.user.userId, body);
  }

  @Post('dispute-resolutions/:id/approve')
  async approveDisputeResolution(@Req() req: any, @Param('id') id: string, @Body() body: ApproveDisputeResolutionDto) {
    return this.arService.approveDisputeResolution(req.user.companyId, id, req.user.userId, body);
  }

  @Post('dispute-resolutions/:id/post')
  async markResolutionPosted(@Req() req: any, @Param('id') id: string, @Body() body: MarkResolutionPostedDto) {
    return this.arService.markResolutionPosted(req.user.companyId, id, req.user.userId, body);
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
    return this.arService.sendInvoice(req.user.companyId, id, req.user.userId);
  }

  @Post('invoices/:id/reminders')
  async sendReminder(@Req() req: any, @Param('id') id: string, @Body() body: SendReminderDto) {
    return this.arService.sendReminder(req.user.companyId, id, req.user.userId, body);
  }
}
