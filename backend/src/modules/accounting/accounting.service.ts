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

  private normalizeCode(code: string) {
    return code.trim().toUpperCase();
  }

  private extractBaseCode(code: string) {
    return this.normalizeCode(code).split('-')[0];
  }

  private getDefaultNormalBalance(type: string) {
    return ['asset', 'expense'].includes(type) ? 'DR' : 'CR';
  }

  private validateAccountCodeFormat(code: string) {
    const normalizedCode = this.normalizeCode(code);
    if (!/^\d{4}(?:-[A-Z0-9]{1,10})?$/.test(normalizedCode)) {
      throw new BadRequestException('Account code must use 4 digits with an optional suffix such as 6111-OPS');
    }

    return normalizedCode;
  }

  private validateTypeRange(type: string, baseCode: string) {
    const numericCode = Number(baseCode);

    if (Number.isNaN(numericCode)) {
      throw new BadRequestException('Account code must begin with a 4-digit numeric base');
    }

    if (numericCode >= 1000 && numericCode <= 1999 && type !== 'asset') {
      throw new BadRequestException('Codes in the 1000 range must use the asset type');
    }

    if (numericCode >= 2000 && numericCode <= 2999 && type !== 'liability') {
      throw new BadRequestException('Codes in the 2000 range must use the liability type');
    }

    if (numericCode >= 3000 && numericCode <= 3999 && type !== 'equity') {
      throw new BadRequestException('Codes in the 3000 range must use the equity type');
    }

    if (numericCode >= 4000 && numericCode <= 4999 && type !== 'revenue') {
      throw new BadRequestException('Codes in the 4000 range must use the revenue type');
    }

    if (numericCode >= 5000 && numericCode <= 8999 && type !== 'expense') {
      throw new BadRequestException('Codes in the 5000-8999 range must use the expense type');
    }
  }

  private validateReservedCodeRules(baseCode: string, isHeader?: boolean, isContra?: boolean) {
    if (baseCode.endsWith('00') && !isHeader) {
      throw new BadRequestException('Codes ending in 00 are reserved for header accounts');
    }

    if (baseCode.endsWith('90') && !isContra) {
      throw new BadRequestException('Codes ending in 90 are reserved for contra accounts');
    }
  }

  private async assertUniqueCode(companyId: string, code: string, ignoreAccountId?: string) {
    const existing = await this.prisma.gLAccount.findFirst({
      where: {
        company_id: companyId,
        code,
        NOT: ignoreAccountId ? { id: ignoreAccountId } : undefined,
      },
    });

    if (existing) {
      throw new BadRequestException('An account with this code already exists in the chart');
    }
  }

  private async getValidatedParent(companyId: string, parentId?: string | null) {
    if (!parentId) {
      return null;
    }

    const parent = await this.prisma.gLAccount.findFirst({
      where: { id: parentId, company_id: companyId },
    });

    if (!parent) {
      throw new NotFoundException('Parent account not found');
    }

    if (parent.is_active === false) {
      throw new BadRequestException('Inactive accounts cannot be used as parents');
    }

    if (parent.is_header === false) {
      throw new BadRequestException('Only header accounts can be assigned as parents');
    }

    return parent;
  }

  private async assertNoCircularParent(companyId: string, accountId: string, parentId?: string | null) {
    if (!parentId) {
      return;
    }

    let currentParentId: string | null | undefined = parentId;
    let depth = 0;

    while (currentParentId) {
      if (currentParentId === accountId) {
        throw new BadRequestException('Circular account hierarchy detected');
      }

      const parent = await this.prisma.gLAccount.findFirst({
        where: { id: currentParentId, company_id: companyId },
        select: { parent_id: true },
      });

      currentParentId = parent?.parent_id;
      depth += 1;

      if (depth > 10) {
        throw new BadRequestException('Account hierarchy is too deep or invalid');
      }
    }
  }

  private buildHierarchyShape(parent: { level?: number | null; full_path?: string | null; code: string } | null, code: string) {
    const level = parent ? (parent.level || 1) + 1 : 1;
    if (level > 5) {
      throw new BadRequestException('Account hierarchy may not exceed five levels');
    }

    const fullPath = parent?.full_path ? `${parent.full_path} > ${code}` : code;
    return { level, fullPath };
  }

  private async assertAccountOwner(companyId: string, accountOwnerId?: string | null) {
    if (!accountOwnerId) {
      return null;
    }

    const owner = await this.prisma.employee.findFirst({
      where: { id: accountOwnerId, company_id: companyId },
      select: { id: true, first_name: true, last_name: true },
    });

    if (!owner) {
      throw new BadRequestException('Selected account owner does not belong to this company');
    }

    return owner;
  }

  private async updateDescendantPaths(companyId: string, accountId: string, parentPath: string) {
    const children = await this.prisma.gLAccount.findMany({
      where: { company_id: companyId, parent_id: accountId },
      select: { id: true, code: true },
    });

    for (const child of children) {
      const fullPath = `${parentPath} > ${child.code}`;
      await this.prisma.gLAccount.update({
        where: { id: child.id },
        data: { full_path: fullPath },
      });
      await this.updateDescendantPaths(companyId, child.id, fullPath);
    }
  }

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

  async createAccount(companyId: string, actorUserId: string | null, data: CreateAccountDto) {
    const code = this.validateAccountCodeFormat(data.code);
    const baseCode = this.extractBaseCode(code);
    const type = data.type.trim().toLowerCase();
    this.validateTypeRange(type, baseCode);
    this.validateReservedCodeRules(baseCode, data.is_header, data.is_contra);
    await this.assertUniqueCode(companyId, code);
    const parent = await this.getValidatedParent(companyId, data.parent_id || null);
    await this.assertAccountOwner(companyId, data.account_owner_id || null);

    if (!parent && !data.is_header) {
      throw new BadRequestException('Top-level accounts must be header accounts');
    }

    if (parent && parent.type !== type) {
      throw new BadRequestException('Child accounts must stay within the same major type as their parent');
    }

    const { level, fullPath } = this.buildHierarchyShape(parent, code);

    return this.prisma.gLAccount.create({
      data: {
        code,
        name: data.name,
        description: data.description || null,
        type,
        category: data.category || null,
        subtype: data.subtype || null,
        parent_id: parent?.id || null,
        is_header: Boolean(data.is_header),
        is_contra: Boolean(data.is_contra),
        normal_balance: data.normal_balance || this.getDefaultNormalBalance(type),
        sensitivity_tier: data.sensitivity_tier || 'T3',
        fs_placement: data.fs_placement || null,
        account_owner_id: data.account_owner_id || null,
        budget_enabled: Boolean(data.budget_enabled),
        tax_treatment: data.tax_treatment || null,
        level,
        full_path: fullPath,
        company_id: companyId,
        created_by: actorUserId || null,
        modified_by: actorUserId || null,
      },
      include: { owner: { select: { id: true, first_name: true, last_name: true, email: true } } },
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
      include: {
        owner: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });
  }

  async updateAccount(companyId: string, actorUserId: string | null, accountId: string, data: UpdateAccountDto) {
    const current = await this.getCompanyAccount(companyId, accountId);
    const nextCode = data.code ? this.validateAccountCodeFormat(data.code) : current.code;
    const nextBaseCode = this.extractBaseCode(nextCode);
    const nextType = (data.type ?? current.type).trim().toLowerCase();
    const nextIsHeader = typeof data.is_header === 'boolean' ? data.is_header : current.is_header;
    const nextIsContra = typeof data.is_contra === 'boolean' ? data.is_contra : current.is_contra;
    const nextParentId = data.parent_id === '' ? null : data.parent_id ?? current.parent_id;

    if (nextParentId === accountId) {
      throw new BadRequestException('An account cannot be its own parent');
    }

    this.validateTypeRange(nextType, nextBaseCode);
    this.validateReservedCodeRules(nextBaseCode, nextIsHeader, nextIsContra);
    await this.assertUniqueCode(companyId, nextCode, accountId);
    const parent = await this.getValidatedParent(companyId, nextParentId);
    await this.assertNoCircularParent(companyId, accountId, parent?.id || null);
    await this.assertAccountOwner(companyId, data.account_owner_id ?? current.account_owner_id ?? null);

    if (!parent && !nextIsHeader) {
      throw new BadRequestException('Top-level accounts must be header accounts');
    }

    if (parent && parent.type !== nextType) {
      throw new BadRequestException('Child accounts must stay within the same major type as their parent');
    }

    const { level, fullPath } = this.buildHierarchyShape(parent, nextCode);

    const updated = await this.prisma.gLAccount.update({
      where: { id: current.id },
      data: {
        code: nextCode,
        name: data.name ?? undefined,
        description: data.description ?? undefined,
        type: nextType,
        category: data.category ?? undefined,
        subtype: data.subtype ?? undefined,
        parent_id: nextParentId,
        is_header: typeof data.is_header === 'boolean' ? data.is_header : undefined,
        is_contra: typeof data.is_contra === 'boolean' ? data.is_contra : undefined,
        is_active: typeof data.is_active === 'boolean' ? data.is_active : undefined,
        normal_balance: data.normal_balance ?? undefined,
        sensitivity_tier: data.sensitivity_tier ?? undefined,
        fs_placement: data.fs_placement ?? undefined,
        account_owner_id:
          data.account_owner_id === '' ? null : data.account_owner_id ?? undefined,
        budget_enabled: typeof data.budget_enabled === 'boolean' ? data.budget_enabled : undefined,
        tax_treatment: data.tax_treatment ?? undefined,
        level,
        full_path: fullPath,
        modified_by: actorUserId || null,
      },
      include: {
        owner: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
    });

    await this.updateDescendantPaths(companyId, updated.id, updated.full_path || updated.code);
    return updated;
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

  async createJournalEntry(companyId: string, actorUserId: string | null, data: CreateJournalEntryDto) {
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

    const accountIds = [...new Set(lines.map((line) => line.account_id))];
    const accounts = await this.prisma.gLAccount.findMany({
      where: {
        company_id: companyId,
        id: { in: accountIds },
      },
      select: {
        id: true,
        code: true,
        name: true,
        is_active: true,
        is_header: true,
      },
    });

    if (accounts.length !== accountIds.length) {
      throw new BadRequestException('One or more journal accounts could not be found in this company chart');
    }

    const blockedAccount = accounts.find((account) => account.is_active === false || account.is_header);
    if (blockedAccount) {
      throw new BadRequestException(
        blockedAccount.is_header
          ? `Header account ${blockedAccount.code} cannot accept postings`
          : `Inactive account ${blockedAccount.code} cannot accept postings`,
      );
    }

    return this.prisma.journalEntry.create({
      data: {
        ...entryData,
        entry_date: entryDate,
        company_id: companyId,
        period_id: period.id,
        created_by: actorUserId || null,
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
