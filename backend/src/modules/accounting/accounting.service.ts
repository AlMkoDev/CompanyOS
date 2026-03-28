import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateAccountDto,
  CreateJournalEntryDto,
  ImportBankStatementDto,
  UpdateAccountDto,
} from './dto/accounting.dto';

interface ReconciliationMatchRecord {
  id: string;
  company_id: string;
  statement_id: string;
  line_id: string;
  journal_entry_id: string;
  matched_by: string | null;
  matched_at: Date;
  updated_at: Date;
  line_description: string;
  line_amount: string | number;
  line_date: Date;
  line_balance: string | number;
  line_reference: string | null;
  journal_description: string | null;
  journal_reference: string | null;
  journal_date: Date;
  journal_status: string;
}

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

  private async getCompanyAccountingPeriod(companyId: string, year: number, month: number) {
    return this.prisma.accountingPeriod.findFirst({
      where: { company_id: companyId, year, month },
    });
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

  async getPeriodCloseReadiness(companyId: string, year: number, month: number) {
    const period = await this.getCompanyAccountingPeriod(companyId, year, month);
    const periodWhere = period
      ? { period_id: period.id }
      : {
          company_id: companyId,
          entry_date: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
        };

    const [draftEntries, postedEntries, reversedEntries, bankStatements] = await Promise.all([
      this.prisma.journalEntry.count({
        where: {
          company_id: companyId,
          status: 'draft',
          ...periodWhere,
        },
      }),
      this.prisma.journalEntry.count({
        where: {
          company_id: companyId,
          status: 'posted',
          ...periodWhere,
        },
      }),
      this.prisma.journalEntry.count({
        where: {
          company_id: companyId,
          status: 'reversed',
          ...periodWhere,
        },
      }),
      this.prisma.bankStatement.count({
        where: {
          company_id: companyId,
          statement_date: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
        },
      }),
    ]);

    return {
      period: period || { year, month, status: 'open' },
      draftEntries,
      postedEntries,
      reversedEntries,
      bankStatements,
      can_close: draftEntries === 0,
      blockers: draftEntries > 0 ? ['Draft journal entries remain open for this period.'] : [],
    };
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
    const readiness = await this.getPeriodCloseReadiness(companyId, year, month);
    if (readiness.period.status === 'closed') {
      throw new BadRequestException('The period is already closed');
    }
    if (readiness.draftEntries > 0) {
      throw new BadRequestException('Draft journal entries must be resolved before closing the period');
    }

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

  private async getBankStatementLine(companyId: string, statementId: string, lineId: string) {
    const statement = await this.getBankStatement(companyId, statementId);
    const line = statement.lines.find((statementLine) => statementLine.id === lineId);

    if (!line) {
      throw new NotFoundException('Bank statement line not found');
    }

    return { statement, line };
  }

  private async ensureReconciliationMatchTable() {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "BankReconciliationMatch" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL,
        "statement_id" uuid NOT NULL,
        "line_id" uuid NOT NULL UNIQUE,
        "journal_entry_id" uuid NOT NULL,
        "matched_by" uuid NULL,
        "matched_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "BankReconciliationMatch_company_id_fkey"
          FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE,
        CONSTRAINT "BankReconciliationMatch_statement_id_fkey"
          FOREIGN KEY ("statement_id") REFERENCES "BankStatement"("id") ON DELETE CASCADE,
        CONSTRAINT "BankReconciliationMatch_line_id_fkey"
          FOREIGN KEY ("line_id") REFERENCES "BankStatementLine"("id") ON DELETE CASCADE,
        CONSTRAINT "BankReconciliationMatch_journal_entry_id_fkey"
          FOREIGN KEY ("journal_entry_id") REFERENCES "JournalEntry"("id") ON DELETE CASCADE,
        CONSTRAINT "BankReconciliationMatch_matched_by_fkey"
          FOREIGN KEY ("matched_by") REFERENCES "User"("id") ON DELETE SET NULL
      );
    `);

    await this.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "BankReconciliationMatch_company_statement_idx"
      ON "BankReconciliationMatch" ("company_id", "statement_id");
    `);
  }

  private async getReconciliationMatchRows(companyId: string, statementId: string) {
    await this.ensureReconciliationMatchTable();
    return this.prisma.$queryRaw<ReconciliationMatchRecord[]>`
      SELECT
        m.id,
        m.company_id,
        m.statement_id,
        m.line_id,
        m.journal_entry_id,
        m.matched_by,
        m.matched_at,
        m.updated_at,
        l.description AS line_description,
        l.amount AS line_amount,
        l.date AS line_date,
        l.balance AS line_balance,
        l.reference AS line_reference,
        e.description AS journal_description,
        e.reference AS journal_reference,
        e.entry_date AS journal_date,
        e.status AS journal_status
      FROM "BankReconciliationMatch" m
      INNER JOIN "BankStatementLine" l ON l.id = m.line_id
      INNER JOIN "JournalEntry" e ON e.id = m.journal_entry_id
      WHERE m.company_id = ${companyId}
        AND m.statement_id = ${statementId}
      ORDER BY m.matched_at DESC
    `;
  }

  async matchBankStatementLine(
    companyId: string,
    statementId: string,
    lineId: string,
    journalEntryId: string,
    userId?: string,
  ) {
    await this.ensureReconciliationMatchTable();
    const { line } = await this.getBankStatementLine(companyId, statementId, lineId);
    const journalEntry = await this.getCompanyJournalEntry(companyId, journalEntryId);

    if (journalEntry.status !== 'posted') {
      throw new BadRequestException('Only posted journal entries can be matched');
    }

    await this.prisma.$executeRaw`
      INSERT INTO "BankReconciliationMatch" (
        "company_id",
        "statement_id",
        "line_id",
        "journal_entry_id",
        "matched_by",
        "matched_at",
        "updated_at"
      ) VALUES (
        ${companyId},
        ${statementId},
        ${line.id},
        ${journalEntry.id},
        ${userId || null},
        NOW(),
        NOW()
      )
      ON CONFLICT ("line_id")
      DO UPDATE SET
        "statement_id" = EXCLUDED."statement_id",
        "journal_entry_id" = EXCLUDED."journal_entry_id",
        "matched_by" = EXCLUDED."matched_by",
        "matched_at" = NOW(),
        "updated_at" = NOW()
    `;

    return this.getReconciliationSuggestions(companyId, statementId);
  }

  async unmatchBankStatementLine(companyId: string, statementId: string, lineId: string) {
    await this.ensureReconciliationMatchTable();
    const { line } = await this.getBankStatementLine(companyId, statementId, lineId);

    await this.prisma.$executeRaw`
      DELETE FROM "BankReconciliationMatch"
      WHERE "company_id" = ${companyId}
        AND "statement_id" = ${statementId}
        AND "line_id" = ${line.id}
    `;

    return this.getReconciliationSuggestions(companyId, statementId);
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
        matches: [],
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
    const matches = (await this.getReconciliationMatchRows(companyId, statementId)) || [];
    const matchMap = new Map(matches.map((match) => [match.line_id, match]));

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
        match: matchMap.get(line.id) || null,
        candidates,
      };
    });

    return {
      statement,
      suggestions,
      matches,
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
