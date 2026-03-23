import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../../modules/auth/jwt.strategy';
import { CreatePayrollRunDto } from './dto/payroll.dto';

@Controller('payroll')
@UseGuards(JwtAuthGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('jurisdictions')
  async getJurisdictions() {
    return this.payrollService.getJurisdictions();
  }

  @Post('runs')
  async createRun(@Req() req: any, @Body() body: CreatePayrollRunDto) {
    return this.payrollService.createRun(
      req.user.companyId,
      body.month,
      body.year,
      body.jurisdiction
    );
  }

  @Post('runs/:id/calculate')
  async calculateRun(@Req() req: any, @Param('id') id: string) {
    return this.payrollService.calculateRun(req.user.companyId, id);
  }

  @Get('runs')
  async getRuns(@Req() req: any) {
    return this.payrollService.getRuns(req.user.companyId);
  }

  @Get('runs/:id/payslips')
  async getPayslips(@Req() req: any, @Param('id') id: string) {
    return this.payrollService.getPayslips(req.user.companyId, id);
  }

  @Post('runs/:id/approve')
  async approveRun(@Req() req: any, @Param('id') id: string) {
    return this.payrollService.approveRun(
      req.user.companyId,
      id,
      req.user.userId,
    );
  }

  @Post('runs/:id/export-bank-file')
  async exportBankFile(@Req() req: any, @Param('id') id: string) {
    return this.payrollService.exportBankFile(req.user.companyId, id);
  }
}
