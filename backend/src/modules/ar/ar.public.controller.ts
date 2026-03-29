import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ArService } from './ar.service';
import { CreatePortalDisputeIntakeDto } from './dto/ar.dto';

@Controller('ar/public')
export class ArPublicController {
  constructor(private readonly arService: ArService) {}

  @Get('invoices/:invoiceNo/context')
  async getInvoiceContext(@Param('invoiceNo') invoiceNo: string) {
    return this.arService.getPortalInvoiceContext(invoiceNo);
  }

  @Post('disputes/intake')
  async createDisputeIntake(@Body() body: CreatePortalDisputeIntakeDto) {
    return this.arService.createPortalDisputeIntake(body);
  }

  @Get('disputes/:caseNumber')
  async getDisputeStatus(@Param('caseNumber') caseNumber: string, @Query('invoiceNo') invoiceNo: string) {
    return this.arService.getPortalDisputeStatus(caseNumber, invoiceNo);
  }
}
