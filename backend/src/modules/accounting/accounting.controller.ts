import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import {
  ClosePeriodDto,
  CreateAccountDto,
  CreateJournalEntryDto,
  ImportBankStatementDto,
  UpdateAccountDto,
} from './dto/accounting.dto';

@Controller('accounting')
@UseGuards(JwtAuthGuard)
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post('accounts')
  async createAccount(@Req() req: any, @Body() data: CreateAccountDto) {
    return this.accountingService.createAccount(req.user.companyId, data);
  }

  @Patch('accounts/:id')
  async updateAccount(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: UpdateAccountDto,
  ) {
    return this.accountingService.updateAccount(req.user.companyId, id, data);
  }

  @Get('accounts')
  async getAccounts(@Req() req: any) {
    return this.accountingService.getAccounts(req.user.companyId);
  }

  @Post('journal-entries')
  async createJournalEntry(@Req() req: any, @Body() data: CreateJournalEntryDto) {
    return this.accountingService.createJournalEntry(req.user.companyId, data);
  }

  @Get('journal-entries')
  async getJournalEntries(@Req() req: any) {
    return this.accountingService.getJournalEntries(req.user.companyId);
  }

  @Post('journal-entries/:id/post')
  async postJournalEntry(@Req() req: any, @Param('id') id: string) {
    return this.accountingService.postJournalEntry(req.user.companyId, id);
  }

  @Get('trial-balance')
  async getTrialBalance(@Req() req: any) {
    return this.accountingService.getTrialBalance(req.user.companyId);
  }

  @Get('periods')
  async getPeriods(@Req() req: any) {
    return this.accountingService.getPeriods(req.user.companyId);
  }

  @Get('periods/close-readiness')
  async getCloseReadiness(
    @Req() req: any,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.accountingService.getPeriodCloseReadiness(
      req.user.companyId,
      Number(year),
      Number(month),
    );
  }

  @Post('journal-entries/:id/reverse')
  async reverseJournalEntry(@Req() req: any, @Param('id') id: string) {
    return this.accountingService.reverseJournalEntry(req.user.companyId, id);
  }

  @Get('reports/pnl')
  async getPnL(
    @Req() req: any,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.accountingService.getPnL(
      req.user.companyId,
      new Date(fromDate),
      new Date(toDate),
    );
  }

  @Get('reports/balance-sheet')
  async getBalanceSheet(
    @Req() req: any,
    @Query('toDate') toDate?: string,
  ) {
    return this.accountingService.getBalanceSheet(
      req.user.companyId,
      toDate ? new Date(toDate) : new Date(),
    );
  }

  @Post('periods/close')
  async closePeriod(
    @Req() req: any,
    @Body() body: ClosePeriodDto,
  ) {
    return this.accountingService.closePeriod(
      req.user.companyId,
      body.year,
      body.month,
      req.user.userId,
    );
  }

  @Post('bank-statements/import')
  async importBankStatement(@Req() req: any, @Body() data: ImportBankStatementDto) {
    return this.accountingService.importBankStatement(req.user.companyId, data);
  }

  @Get('bank-statements')
  async getBankStatements(@Req() req: any) {
    return this.accountingService.getBankStatements(req.user.companyId);
  }

  @Get('bank-statements/:id')
  async getBankStatement(@Req() req: any, @Param('id') id: string) {
    return this.accountingService.getBankStatement(req.user.companyId, id);
  }

  @Get('bank-statements/:id/reconciliation')
  async getBankReconciliationSuggestions(@Req() req: any, @Param('id') id: string) {
    return this.accountingService.getReconciliationSuggestions(req.user.companyId, id);
  }
}
