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
  CreateAccountChangeRequestDto,
  CreateJournalEntryDto,
  ImportBankStatementDto,
  ReconcileBankStatementLineDto,
  ReportCertificationDto,
  ReviewAccountRemediationDto,
  ReviewAccountChangeRequestDto,
  UpdateAccountDto,
} from './dto/accounting.dto';

@Controller('accounting')
@UseGuards(JwtAuthGuard)
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post('accounts')
  async createAccount(@Req() req: any, @Body() data: CreateAccountDto) {
    return this.accountingService.createAccount(req.user.companyId, req.user.userId, data, req.user.roles);
  }

  @Patch('accounts/:id')
  async updateAccount(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: UpdateAccountDto,
  ) {
    return this.accountingService.updateAccount(req.user.companyId, req.user.userId, id, data, req.user.roles);
  }

  @Get('accounts')
  async getAccounts(@Req() req: any) {
    return this.accountingService.getAccounts(req.user.companyId);
  }

  @Get('accounts/audit')
  async getAccountAuditTrail(@Req() req: any, @Query('accountId') accountId?: string) {
    return this.accountingService.getAccountAuditTrail(req.user.companyId, accountId);
  }

  @Get('accounts/remediation')
  async getAccountRemediationStates(@Req() req: any) {
    return this.accountingService.getAccountRemediationStates(req.user.companyId);
  }

  @Patch('accounts/remediation/:id/review')
  async reviewAccountRemediationState(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: ReviewAccountRemediationDto,
  ) {
    return this.accountingService.reviewAccountRemediationState(
      req.user.companyId,
      req.user.userId,
      id,
      data,
    );
  }

  @Get('account-change-requests')
  async getAccountChangeRequests(@Req() req: any) {
    return this.accountingService.getAccountChangeRequests(req.user.companyId);
  }

  @Post('account-change-requests')
  async createAccountChangeRequest(@Req() req: any, @Body() data: CreateAccountChangeRequestDto) {
    return this.accountingService.createAccountChangeRequest(req.user.companyId, req.user.userId, data);
  }

  @Patch('account-change-requests/:id/review')
  async reviewAccountChangeRequest(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: ReviewAccountChangeRequestDto,
  ) {
    return this.accountingService.reviewAccountChangeRequest(
      req.user.companyId,
      req.user.userId,
      req.user.roles,
      id,
      data,
    );
  }

  @Post('journal-entries')
  async createJournalEntry(@Req() req: any, @Body() data: CreateJournalEntryDto) {
    return this.accountingService.createJournalEntry(req.user.companyId, req.user.userId, data);
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
  async getTrialBalance(@Req() req: any, @Query('toDate') toDate?: string) {
    return this.accountingService.getTrialBalance(
      req.user.companyId,
      toDate ? new Date(toDate) : undefined,
    );
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

  @Get('reports/certification')
  async getReportCertification(
    @Req() req: any,
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('reportType') reportType: string,
  ) {
    return this.accountingService.getReportCertification(
      req.user.companyId,
      Number(year),
      Number(month),
      reportType,
    );
  }

  @Post('reports/certification')
  async certifyReport(
    @Req() req: any,
    @Body() body: ReportCertificationDto,
  ) {
    return this.accountingService.certifyReport(
      req.user.companyId,
      req.user.userId,
      req.user.roles,
      body.year,
      body.month,
      body.report_type,
      body.notes,
    );
  }

  @Post('reports/certification/revoke')
  async revokeReportCertification(
    @Req() req: any,
    @Body() body: ReportCertificationDto,
  ) {
    return this.accountingService.revokeReportCertification(
      req.user.companyId,
      req.user.userId,
      req.user.roles,
      body.year,
      body.month,
      body.report_type,
      body.notes,
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
  async getBankReconciliationSuggestions(@Req() req: any, @Param('id') id: string): Promise<any> {
    return this.accountingService.getReconciliationSuggestions(req.user.companyId, id);
  }

  @Post('bank-statements/:id/reconciliation/match')
  async matchBankStatementLine(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: ReconcileBankStatementLineDto,
  ): Promise<any> {
    return this.accountingService.matchBankStatementLine(
      req.user.companyId,
      id,
      body.line_id,
      body.journal_entry_id,
      req.user.userId,
    );
  }

  @Post('bank-statements/:id/reconciliation/match/:lineId/unmatch')
  async unmatchBankStatementLine(
    @Req() req: any,
    @Param('id') id: string,
    @Param('lineId') lineId: string,
  ): Promise<any> {
    return this.accountingService.unmatchBankStatementLine(req.user.companyId, id, lineId);
  }
}
