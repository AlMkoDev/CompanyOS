import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateAccountDto,
  CreateJournalEntryDto,
  ImportBankStatementDto,
  UpdateAccountDto,
} from './dto/accounting.dto';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  private getPeriodFromDate(date: Date) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    };
  }

  private async ensureAccountingPeriod(companyId: string, date: Date) {
    const { year, month } = this.getPeriodFromDate(date);

    return this.prisma.accountingPeriod.upsert({
      where: {
        company_id_year_month: {
          company_id: companyId,
          year,
          month,
        },
      },
      update: {},
      create: {
        company_id: companyId,
        year,
        month,
        status: 'open',
      },
    });
  }

  private async getCompanyJournalEntry(companyId: string, entryId: string) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id: entryId, company_id: companyId },
      include: { lines: true, period: true },
    });
    if (!entry) throw new NotFoundException('Journal entry not found');
    return entry;
  }

  // --- Chart of Accounts ---

  async createAccount(companyId: string, data: CreateAccountDto) {
    return this.prisma.gLAccount.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        parent_id: data.parent_id || null,
        company_id: companyId,
      },
    });
  }

  private async getCompanyAccount(companyId: string, accountId: string) {
    const account = await this.prisma.gLAccount.findFirst({
      where: { id: accountId, company_id: companyId },
    });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async getAccounts(companyId: string) {
    return this.prisma.gLAccount.findMany({
      where: { company_id: companyId },
      orderBy: { code: 'asc' },
    });
  }

  async updateAccount(companyId: string, accountId: string, data: UpdateAccountDto) {
    const current = await this.getCompanyAccount(companyId, accountId);

    if (data.parent_id && data.parent_id === accountId) {
      throw new BadRequestException('An account cannot be its own parent');
    }

    if (data.parent_id) {
      await this.getCompanyAccount(companyId, data.parent_id);
    }

    return this.prisma.gLAccount.update({
      where: { id: current.id },
      data: {
        code: data.code ?? undefined,
        name: data.name ?? undefined,
        type: data.type ?? undefined,
        parent_id: data.parent_id === '' ? null : data.parent_id ?? undefined,
        is_active: typeof data.is_active === 'boolean' ? data.is_active : undefined,
      },
    });
  }

  // --- Journal Entries ---

  async getJournalEntries(companyId: string) {
    return this.prisma.journalEntry.findMany({
      where: { company_id: companyId },
      orderBy: [
        { created_at: 'desc' },
        { updated_at: 'desc' },
      ],
      include: { period: true, lines: { include: { account: true } } },
      take: 25,
    });
  }

  async createJournalEntry(companyId: string, data: CreateJournalEntryDto) {
    const { lines, ...entryData } = data;
    const entryDate = entryData.entry_date ? new Date(entryData.entry_date) : new Date();
    const period = await this.ensureAccountingPeriod(companyId, entryDate);

    if (period.status === 'closed') {
      throw new BadRequestException('The selected accounting period is closed');
    }

    // Validate debits = credits
    const totalDebit = lines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum: number, line: any) => sum + (line.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new BadRequestException('Journal entry must be balanced (Debits must equal Credits)');
    }

    return this.prisma.journalEntry.create({
      data: {
        ...entryData,
        entry_date: entryDate,
        company_id: companyId,
        period_id: period.id,
        lines: {
          create: lines.map((line: any) => ({
            account_id: line.account_id,
            debit: line.debit || 0,
            credit: line.credit || 0,
            narration: line.narration,
          })),
        },
      },
      include: { lines: true },
    });
  }

  async postJournalEntry(companyId: string, entryId: string) {
    const entry = await this.getCompanyJournalEntry(companyId, entryId);
    if (entry.status === 'posted') throw new BadRequestException('Entry is already posted');
    if (entry.period?.status === 'closed') {
      throw new BadRequestException('The accounting period is closed');
    }

    return this.prisma.journalEntry.update({
      where: { id: entryId },
      data: { status: 'posted' },
    });
  }

  async reverseJournalEntry(companyId: string, entryId: string) {
    const original = await this.getCompanyJournalEntry(companyId, entryId);
    if (original.status !== 'posted') throw new BadRequestException('Only posted entries can be reversed');

    return this.prisma.$transaction(async (tx) => {
      // Create reversal entry
      const reversal = await tx.journalEntry.create({
        data: {
          company_id: companyId,
          entry_date: new Date(original.entry_date),
          description: `Reversal of entry: ${original.reference || original.id}`,
          reference: `REV-${original.reference || original.id}`,
          status: 'posted',
          period_id: original.period_id,
          lines: {
            create: original.lines.map((line) => ({
              account_id: line.account_id,
              debit: line.credit, // SWAP
              credit: line.debit, // SWAP
              narration: `Reversal: ${line.narration || ''}`,
            })),
          },
        },
      });

      // Mark original as reversed
      await tx.journalEntry.update({
        where: { id: entryId },
        data: { status: 'reversed' },
      });

      return reversal;
    });
  }

  // --- Reports ---

  async getTrialBalance(companyId: string, toDate?: Date) {
    const lines = await this.prisma.journalLine.findMany({
      where: {
        entry: {
          company_id: companyId,
          status: 'posted',
          entry_date: toDate ? { lte: toDate } : undefined,
        },
      },
      include: { account: true },
    });

    const balances: Record<string, { code: string; name: string; debit: number; credit: number }> = {};

    lines.forEach((line) => {
      if (!balances[line.account_id]) {
        balances[line.account_id] = {
          code: line.account.code,
          name: line.account.name,
          debit: 0,
          credit: 0,
        };
      }
      balances[line.account_id].debit += Number(line.debit);
      balances[line.account_id].credit += Number(line.credit);
    });

    return Object.values(balances);
  }

  async getPnL(companyId: string, fromDate: Date, toDate: Date) {
    const lines = await this.prisma.journalLine.findMany({
      where: {
        entry: {
          company_id: companyId,
          status: 'posted',
          entry_date: { gte: fromDate, lte: toDate },
        },
        account: {
          type: { in: ['revenue', 'expense'] },
        },
      },
      include: { account: true },
    });

    let totalRevenue = 0;
    let totalExpense = 0;

    lines.forEach((line) => {
      const amount = Number(line.credit) - Number(line.debit);
      if (line.account.type === 'revenue') {
        totalRevenue += amount;
      } else {
        totalExpense -= amount; // Expense is normally debit, so -amount (which is debit-credit)
      }
    });

    return {
      totalRevenue,
      totalExpense,
      netProfit: totalRevenue - totalExpense,
    };
  }

  async getBalanceSheet(companyId: string, toDate: Date) {
    const lines = await this.prisma.journalLine.findMany({
      where: {
        entry: {
          company_id: companyId,
          status: 'posted',
          entry_date: { lte: toDate },
        },
        account: {
          type: { in: ['asset', 'liability', 'equity'] },
        },
      },
      include: { account: true },
    });

    const balances: Record<string, { type: string; name: string; balance: number }> = {};

    lines.forEach((line) => {
      if (!balances[line.account_id]) {
        balances[line.account_id] = {
          type: line.account.type,
          name: line.account.name,
          balance: 0,
        };
      }
      
      const amount = Number(line.debit) - Number(line.credit);
      // For Assets: +Debit, -Credit
      // For Liabilities/Equity: -Debit, +Credit
      if (line.account.type === 'asset') {
        balances[line.account_id].balance += amount;
      } else {
        balances[line.account_id].balance -= amount;
      }
    });

    return Object.values(balances);
  }

  async getPeriods(companyId: string) {
    return this.prisma.accountingPeriod.findMany({
      where: { company_id: companyId },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    });
  }

  async closePeriod(companyId: string, year: number, month: number, userId: string) {
    return this.prisma.accountingPeriod.upsert({
      where: {
        company_id_year_month: {
          company_id: companyId,
          year,
          month,
        },
      },
      update: {
        status: 'closed',
        closed_at: new Date(),
        closed_by: userId,
      },
      create: {
        company_id: companyId,
        year,
        month,
        status: 'closed',
        closed_at: new Date(),
        closed_by: userId,
      },
    });
  }

  async getBankStatements(companyId: string) {
    return this.prisma.bankStatement.findMany({
      where: { company_id: companyId },
      orderBy: { statement_date: 'desc' },
      include: { lines: true },
    });
  }

  async getBankStatement(companyId: string, statementId: string) {
    const statement = await this.prisma.bankStatement.findFirst({
      where: { id: statementId, company_id: companyId },
      include: { lines: true },
    });

    if (!statement) throw new NotFoundException('Bank statement not found');
    return statement;
  }

  async getReconciliationSuggestions(companyId: string, statementId: string) {
    const statement = await this.prisma.bankStatement.findFirst({
      where: { id: statementId, company_id: companyId },
      include: { lines: true },
    });

    if (!statement) throw new NotFoundException('Bank statement not found');
    if (!statement.account_id) {
      return {
        statement,
        suggestions: [],
        reason: 'No reconciliation account is linked to this statement.',
      };
    }

    const journalEntries = await this.prisma.journalEntry.findMany({
      where: {
        company_id: companyId,
        status: 'posted',
        lines: {
          some: {
            account_id: statement.account_id,
          },
        },
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
      orderBy: [
        { entry_date: 'desc' },
        { updated_at: 'desc' },
      ],
      take: 50,
    });

    const suggestions = statement.lines.map((line) => {
      const lineAmount = Number(line.amount);
      const candidates = journalEntries
        .map((entry) => {
          const matchedLines = entry.lines.filter((journalLine) => journalLine.account_id === statement.account_id);
          const journalAmount = matchedLines.reduce(
            (sum, journalLine) => sum + (Number(journalLine.debit) - Number(journalLine.credit)),
            0,
          );
          const amountDelta = Math.abs(Math.abs(journalAmount) - Math.abs(lineAmount));
          const dateDelta = Math.abs(
            new Date(entry.entry_date).getTime() - new Date(line.date).getTime(),
          ) / (1000 * 60 * 60 * 24);
          const score = Math.max(0, 100 - amountDelta - Math.min(dateDelta * 3, 30));
          return {
            entry,
            matchedLines,
            journalAmount,
            amountDelta,
            dateDelta,
            score,
          };
        })
        .filter((candidate) => candidate.matchedLines.length > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      return {
        line,
        candidates,
      };
    });

    return {
      statement,
      suggestions,
    };
  }

  async importBankStatement(companyId: string, data: ImportBankStatementDto) {
    const { account_id, statement_date, opening_balance, closing_balance, lines } = data;

    return this.prisma.bankStatement.create({
      data: {
        company_id: companyId,
        account_id,
        statement_date: new Date(statement_date),
        opening_balance,
        closing_balance,
        lines: {
          create: lines.map((line: any) => ({
            date: new Date(line.date),
            description: line.description,
            amount: line.amount,
            balance: line.balance,
            reference: line.reference,
          })),
        },
      },
      include: { lines: true },
    });
  }
}
