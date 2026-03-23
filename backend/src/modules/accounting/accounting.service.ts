import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import {
  CreateAccountDto,
  CreateJournalEntryDto,
  ImportBankStatementDto,
} from './dto/accounting.dto';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyJournalEntry(companyId: string, entryId: string) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id: entryId, company_id: companyId },
      include: { lines: true },
    });
    if (!entry) throw new NotFoundException('Journal entry not found');
    return entry;
  }

  // --- Chart of Accounts ---

  async createAccount(companyId: string, data: CreateAccountDto) {
    return this.prisma.gLAccount.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });
  }

  async getAccounts(companyId: string) {
    return this.prisma.gLAccount.findMany({
      where: { company_id: companyId },
      orderBy: { code: 'asc' },
    });
  }

  // --- Journal Entries ---

  async createJournalEntry(companyId: string, data: CreateJournalEntryDto) {
    const { lines, ...entryData } = data;

    // Validate debits = credits
    const totalDebit = lines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum: number, line: any) => sum + (line.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new BadRequestException('Journal entry must be balanced (Debits must equal Credits)');
    }

    return this.prisma.journalEntry.create({
      data: {
        ...entryData,
        company_id: companyId,
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
          entry_date: new Date(),
          description: `Reversal of entry: ${original.reference || original.id}`,
          reference: `REV-${original.reference || original.id}`,
          status: 'posted',
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

  async closePeriod(companyId: string, year: number, month: number, userId: string) {
    return this.prisma.accountingPeriod.update({
      where: {
        company_id_year_month: {
          company_id: companyId,
          year,
          month,
        },
      },
      data: {
        status: 'closed',
        closed_at: new Date(),
        closed_by: userId,
      },
    });
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
