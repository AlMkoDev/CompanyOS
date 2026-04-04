import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateAccountDto,
  CreateAccountChangeRequestDto,
  CreateJournalEntryDto,
  ImportBankStatementDto,
  ReviewAccountRemediationDto,
  ReviewAccountChangeRequestDto,
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

  private readonly t1DirectEditRoles = new Set(['super_admin', 'system_admin', 'system_administrator']);
  private readonly t2DirectEditRoles = new Set([
    'super_admin',
    'system_admin',
    'system_administrator',
    'finance_manager',
    'controller',
    'chief_financial_officer',
    'cfo',
  ]);
  private readonly reportCertificationRoles = new Set([
    'super_admin',
    'system_admin',
    'system_administrator',
    'finance_manager',
    'controller',
    'chief_financial_officer',
    'cfo',
  ]);

  private normalizeCode(code: string) {
    return code.trim().toUpperCase();
  }

  private normalizeRoleName(role?: string | null) {
    if (!role) return null;
    return role.trim().toLowerCase().replace(/\s+/g, '_');
  }

  private getNormalizedRoles(roles?: string[] | null) {
    return Array.from(
      new Set((roles || []).map((role) => this.normalizeRoleName(role)).filter((role): role is string => Boolean(role))),
    );
  }

  private assertDirectSensitiveAccountAccess(sensitivityTier: string | null | undefined, actorRoles?: string[] | null) {
    if (!sensitivityTier) {
      return;
    }

    const roles = this.getNormalizedRoles(actorRoles);

    if (sensitivityTier === 'T1' && !roles.some((role) => this.t1DirectEditRoles.has(role))) {
      throw new ForbiddenException('T1 accounts require system-administrator approval for direct maintenance. Raise a governed change request instead.');
    }

    if (sensitivityTier === 'T2' && !roles.some((role) => this.t2DirectEditRoles.has(role))) {
      throw new ForbiddenException('T2 accounts require finance leadership or system-administrator access for direct maintenance. Raise a governed change request instead.');
    }
  }

  private isProtectedSensitivityTier(sensitivityTier: string | null | undefined) {
    return sensitivityTier === 'T1' || sensitivityTier === 'T2';
  }

  private assertCreateAllowedForWorkflow(data: CreateAccountDto) {
    if (this.isProtectedSensitivityTier(data.sensitivity_tier || 'T3')) {
      throw new BadRequestException(
        'Protected T1/T2 accounts must be raised through a governed create request before they can enter the chart.',
      );
    }
  }

  private isProtectedStructuralChange(current: any, data: UpdateAccountDto) {
    const fieldsToCompare: Array<keyof UpdateAccountDto> = [
      'code',
      'type',
      'parent_id',
      'sensitivity_tier',
      'account_owner_id',
      'is_header',
      'is_contra',
      'is_active',
    ];

    return fieldsToCompare.some((field) => {
      if (!(field in data)) {
        return false;
      }

      const incoming = data[field];
      if (field === 'parent_id' || field === 'account_owner_id') {
        const normalizedIncoming = incoming === '' ? null : incoming;
        return normalizedIncoming !== (current[field] ?? null);
      }

      return incoming !== current[field];
    });
  }

  private assertUpdateAllowedForWorkflow(current: any, data: UpdateAccountDto) {
    if (!this.isProtectedSensitivityTier(current.sensitivity_tier ?? 'T3')) {
      return;
    }

    if (this.isProtectedStructuralChange(current, data)) {
      throw new BadRequestException(
        'Protected T1/T2 account structural changes must be raised through a governed change request.',
      );
    }
  }

  private getRequestSensitivityTier(request: {
    account?: { sensitivity_tier?: string | null } | null;
    requested_payload?: Record<string, any> | null;
    current_snapshot?: Record<string, any> | null;
  }) {
    const requestedTier = request.requested_payload?.sensitivity_tier;
    if (typeof requestedTier === 'string' && requestedTier.trim()) {
      return requestedTier.trim().toUpperCase();
    }

    const accountTier = request.account?.sensitivity_tier;
    if (typeof accountTier === 'string' && accountTier.trim()) {
      return accountTier.trim().toUpperCase();
    }

    const snapshotTier = request.current_snapshot?.sensitivity_tier;
    if (typeof snapshotTier === 'string' && snapshotTier.trim()) {
      return snapshotTier.trim().toUpperCase();
    }

    return 'T3';
  }

  private assertCanReviewChangeRequest(
    request: {
      request_type: string;
      account?: { sensitivity_tier?: string | null } | null;
      requested_payload?: Record<string, any> | null;
      current_snapshot?: Record<string, any> | null;
    },
    actorRoles?: string[] | null,
  ) {
    const sensitivityTier = this.getRequestSensitivityTier(request);
    const roles = this.getNormalizedRoles(actorRoles);

    if (sensitivityTier === 'T1' && !roles.some((role) => this.t1DirectEditRoles.has(role))) {
      throw new ForbiddenException(
        'T1 account change requests must be reviewed by a system administrator.',
      );
    }

    if (sensitivityTier === 'T2' && !roles.some((role) => this.t2DirectEditRoles.has(role))) {
      throw new ForbiddenException(
        'T2 account change requests must be reviewed by finance leadership or a system administrator.',
      );
    }
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

  private validateFsPlacementAlignment(type: string, fsPlacement?: string | null) {
    if (!fsPlacement) {
      return;
    }

    const placement = fsPlacement.trim();
    const allowedByType: Record<string, string[]> = {
      asset: ['Current Assets', 'Non-current Assets'],
      liability: ['Current Liabilities', 'Non-current Liabilities'],
      equity: ['Equity'],
      revenue: ['Revenue', 'Other Income'],
      expense: ['Cost of Sales', 'Operating Expenses', 'Other Expense', 'Tax'],
    };

    const allowedPlacements = allowedByType[type] ?? [];
    if (!allowedPlacements.includes(placement)) {
      throw new BadRequestException(
        `${placement} is not a valid financial statement placement for ${type} accounts`,
      );
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

  private buildAccountSnapshot(account: any) {
    if (!account) return null;

    return {
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      category: account.category ?? null,
      subtype: account.subtype ?? null,
      parent_id: account.parent_id ?? null,
      is_header: Boolean(account.is_header),
      is_contra: Boolean(account.is_contra),
      is_active: Boolean(account.is_active),
      normal_balance: account.normal_balance ?? null,
      sensitivity_tier: account.sensitivity_tier ?? null,
      fs_placement: account.fs_placement ?? null,
      account_owner_id: account.account_owner_id ?? null,
      budget_enabled: Boolean(account.budget_enabled),
      tax_treatment: account.tax_treatment ?? null,
      level: account.level ?? null,
      full_path: account.full_path ?? null,
      dormant_since: account.dormant_since ?? null,
      sunset_candidate: Boolean(account.sunset_candidate),
      modified_by: account.modified_by ?? null,
    };
  }

  private summarizeAccountChanges(beforeSnapshot: Record<string, any> | null, afterSnapshot: Record<string, any> | null) {
    if (!beforeSnapshot && afterSnapshot) {
      return `Account ${afterSnapshot.code} created`;
    }

    if (!beforeSnapshot || !afterSnapshot) {
      return null;
    }

    const changedFields = Object.keys(afterSnapshot).filter(
      (key) => JSON.stringify(beforeSnapshot[key]) !== JSON.stringify(afterSnapshot[key]),
    );

    if (!changedFields.length) {
      return 'No material account fields changed';
    }

    return `Updated ${changedFields.slice(0, 5).join(', ')}`;
  }

  private getAccountIssueTypes(account: {
    is_header?: boolean | null;
    is_active?: boolean | null;
    account_owner_id?: string | null;
    sensitivity_tier?: string | null;
    fs_placement?: string | null;
    type?: string | null;
    dormant_since?: Date | string | null;
    sunset_candidate?: boolean | null;
  }) {
    const issueTypes: string[] = [];
    const isPostingAccount = !account.is_header;
    const sensitivityTier = account.sensitivity_tier ?? 'T3';
    const fsPlacement = account.fs_placement?.trim();
    const allowedByType: Record<string, string[]> = {
      asset: ['Current Assets', 'Non-current Assets'],
      liability: ['Current Liabilities', 'Non-current Liabilities'],
      equity: ['Equity'],
      revenue: ['Revenue', 'Other Income'],
      expense: ['Cost of Sales', 'Operating Expenses', 'Other Expense', 'Tax'],
    };

    if (isPostingAccount && ['T1', 'T2'].includes(sensitivityTier) && !account.account_owner_id) {
      issueTypes.push('restricted-owner');
    }

    if (isPostingAccount && !account.account_owner_id) {
      issueTypes.push('owner');
    }

    if (isPostingAccount && !fsPlacement) {
      issueTypes.push('unmapped');
    } else if (isPostingAccount && fsPlacement && !(allowedByType[account.type || ''] || []).includes(fsPlacement)) {
      issueTypes.push('invalid-mapping');
    }

    const dormantDate = account.dormant_since ? new Date(account.dormant_since) : null;
    const dormantDays =
      dormantDate && !Number.isNaN(dormantDate.getTime())
        ? Math.max(0, Math.floor((Date.now() - dormantDate.getTime()) / (1000 * 60 * 60 * 24)))
        : null;

    if (
      account.is_active === false ||
      account.sunset_candidate ||
      dormantDays !== null
    ) {
      issueTypes.push('lifecycle');
    }

    return Array.from(new Set(issueTypes));
  }

  private async syncAccountRemediationStates(companyId: string) {
    const accounts = await this.prisma.gLAccount.findMany({
      where: { company_id: companyId },
      select: {
        id: true,
        is_header: true,
        is_active: true,
        account_owner_id: true,
        sensitivity_tier: true,
        fs_placement: true,
        type: true,
        dormant_since: true,
        sunset_candidate: true,
      },
    });

    const liveIssueKeys = new Set<string>();
    const now = new Date();

    for (const account of accounts) {
      const issueTypes = this.getAccountIssueTypes(account);
      for (const issueType of issueTypes) {
        liveIssueKeys.add(`${account.id}:${issueType}`);
        await this.prisma.gLAccountRemediationState.upsert({
          where: {
            company_id_account_id_issue_type: {
              company_id: companyId,
              account_id: account.id,
              issue_type: issueType,
            },
          },
          update: {
            status: 'open',
            last_seen_at: now,
            cleared_at: null,
            cleared_by: null,
            cleared_reason: null,
          },
          create: {
            company_id: companyId,
            account_id: account.id,
            issue_type: issueType,
            status: 'open',
            first_seen_at: now,
            last_seen_at: now,
          },
        });
      }
    }

    const existingStates = await this.prisma.gLAccountRemediationState.findMany({
      where: {
        company_id: companyId,
        status: { in: ['open', 'reviewed'] },
      },
      select: { id: true, account_id: true, issue_type: true, status: true },
    });

    for (const state of existingStates) {
      const stateKey = `${state.account_id}:${state.issue_type}`;
      if (!liveIssueKeys.has(stateKey)) {
        await this.prisma.gLAccountRemediationState.update({
          where: { id: state.id },
          data: {
            status: 'cleared',
            cleared_at: now,
            cleared_reason: 'Issue no longer present in live COA posture.',
          },
        });
      }
    }
  }

  private async recordAccountAudit(params: {
    companyId: string;
    accountId: string;
    actorUserId?: string | null;
    action: string;
    reason?: string | null;
    changeSummary?: string | null;
    beforeSnapshot?: Record<string, any> | null;
    afterSnapshot?: Record<string, any> | null;
    changeRequestId?: string | null;
  }) {
    return this.prisma.gLAccountAuditTrail.create({
      data: {
        company_id: params.companyId,
        account_id: params.accountId,
        actor_user_id: params.actorUserId || null,
        change_request_id: params.changeRequestId || null,
        action: params.action,
        reason: params.reason || null,
        change_summary: params.changeSummary || null,
        before_snapshot: params.beforeSnapshot || undefined,
        after_snapshot: params.afterSnapshot || undefined,
      },
    });
  }

  private async assertAccountCanDeactivate(companyId: string, accountId: string) {
    const activeChildren = await this.prisma.gLAccount.count({
      where: {
        company_id: companyId,
        parent_id: accountId,
        is_active: true,
      },
    });

    if (activeChildren > 0) {
      throw new BadRequestException('Accounts with active child accounts cannot be deactivated');
    }
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

  private getRecommendedCadenceForAccount(account: {
    sensitivity_tier?: string | null;
    type: string;
    fs_placement?: string | null;
  }) {
    if (account.sensitivity_tier === 'T1') return 'Daily';
    if (account.type === 'asset' && account.fs_placement === 'Current Assets') return 'Weekly';
    if (account.type === 'liability' && account.fs_placement === 'Current Liabilities') return 'Weekly';
    if (account.type === 'revenue' || account.type === 'expense') return 'Monthly';
    return 'Quarterly';
  }

  private async getReportingCertificationPosture(companyId: string) {
    const accounts = await this.prisma.gLAccount.findMany({
      where: { company_id: companyId },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        is_header: true,
        fs_placement: true,
        sensitivity_tier: true,
        account_owner_id: true,
      },
    });

    const postingAccounts = accounts.filter((account) => !account.is_header);
    const mappedAccounts = postingAccounts.filter((account) => this.isValidFsPlacementForType(account.type, account.fs_placement));
    const unmappedAccounts = postingAccounts.filter((account) => !account.fs_placement);
    const invalidAccounts = postingAccounts.filter(
      (account) => account.fs_placement && !this.isValidFsPlacementForType(account.type, account.fs_placement),
    );
    const missingOwnerAccounts = postingAccounts.filter((account) => !account.account_owner_id);
    const restrictedNoOwnerAccounts = postingAccounts.filter(
      (account) => (account.sensitivity_tier === 'T1' || account.sensitivity_tier === 'T2') && !account.account_owner_id,
    );
    const dailyCadenceAccounts = postingAccounts.filter(
      (account) => this.getRecommendedCadenceForAccount(account) === 'Daily',
    );

    const coveragePercent = postingAccounts.length ? Math.round((mappedAccounts.length / postingAccounts.length) * 100) : 0;
    const messages: string[] = [];

    if (invalidAccounts.length > 0) {
      messages.push(`${invalidAccounts.length} posting accounts have invalid statement placement.`);
    }
    if (unmappedAccounts.length > 0) {
      messages.push(`${unmappedAccounts.length} posting accounts are still unmapped.`);
    }
    if (restrictedNoOwnerAccounts.length > 0) {
      messages.push(`${restrictedNoOwnerAccounts.length} restricted accounts still have no owner assigned.`);
    }
    if (missingOwnerAccounts.length > 0 && restrictedNoOwnerAccounts.length === 0) {
      messages.push(`${missingOwnerAccounts.length} posting accounts still need owner accountability.`);
    }
    if (dailyCadenceAccounts.length > 0) {
      messages.push(`${dailyCadenceAccounts.length} accounts sit on daily cadence and should be reviewed during report signoff.`);
    }

    const materialBlockers = invalidAccounts.length + unmappedAccounts.length + restrictedNoOwnerAccounts.length;

    return {
      postingCount: postingAccounts.length,
      mappedCount: mappedAccounts.length,
      unmappedCount: unmappedAccounts.length,
      invalidCount: invalidAccounts.length,
      missingOwnerCount: missingOwnerAccounts.length,
      restrictedNoOwnerCount: restrictedNoOwnerAccounts.length,
      dailyCadenceCount: dailyCadenceAccounts.length,
      coveragePercent,
      materialBlockers,
      canCertify: materialBlockers === 0,
      messages,
    };
  }

  private isValidFsPlacementForType(type: string, fsPlacement?: string | null) {
    if (!fsPlacement) return false;
    const placement = fsPlacement.trim();
    const allowedByType: Record<string, string[]> = {
      asset: ['Current Assets', 'Non-current Assets'],
      liability: ['Current Liabilities', 'Non-current Liabilities'],
      equity: ['Equity'],
      revenue: ['Revenue', 'Other Income'],
      expense: ['Cost of Sales', 'Operating Expenses', 'Other Expense', 'Tax'],
    };
    return (allowedByType[type] ?? []).includes(placement);
  }

  private assertCanCertifyReports(actorRoles?: string[] | null) {
    const roles = this.getNormalizedRoles(actorRoles);
    if (!roles.some((role) => this.reportCertificationRoles.has(role))) {
      throw new ForbiddenException('Only finance leadership or system administrators can certify reporting.');
    }
  }

  private requiresDualSignoff(year: number, month: number, reportType: string) {
    return reportType === 'bs' || month === 12;
  }

  private getSignoffRequirementLabel(required: number) {
    return required > 1 ? 'Dual signoff required' : 'Single signoff';
  }

  private getRequiredPeriodReportTypes(year: number, month: number) {
    const coreTypes = ['pnl', 'bs'];
    if (month === 12) {
      return [...coreTypes, 'tb'];
    }
    return coreTypes;
  }

  private getPeriodDateRange(year: number, month: number) {
    return {
      start: new Date(year, month - 1, 1),
      end: new Date(year, month, 1),
    };
  }

  private async getLatestReportSourceChanges(companyId: string, year: number, month: number) {
    const { start, end } = this.getPeriodDateRange(year, month);

    const [latestAccountChange, latestJournalChange] = await Promise.all([
      this.prisma.gLAccount.findFirst({
        where: { company_id: companyId },
        orderBy: { updated_at: 'desc' },
        select: {
          id: true,
          code: true,
          name: true,
          updated_at: true,
        },
      }),
      this.prisma.journalEntry.findFirst({
        where: {
          company_id: companyId,
          status: { in: ['posted', 'reversed'] },
          entry_date: {
            gte: start,
            lt: end,
          },
        },
        orderBy: { updated_at: 'desc' },
        select: {
          id: true,
          reference: true,
          description: true,
          updated_at: true,
        },
      }),
    ]);

    return {
      latestAccountChange,
      latestJournalChange,
    };
  }

  private async attachEffectiveCertificationState(companyId: string, year: number, month: number, certification: any) {
    const baseStatus =
      certification.status === 'revoked'
        ? 'revoked'
        : certification.status === 'pending_secondary_signoff'
          ? 'pending_secondary_signoff'
        : certification.status === 'certified'
          ? 'certified'
          : 'uncertified';

    if (baseStatus !== 'certified' || !certification.certified_at) {
      return {
        ...certification,
        effective_status: baseStatus,
        stale_reasons: [],
        last_source_change_at: null,
        signoff_progress: {
          required: certification.signoff_required ?? 1,
          completed: certification.secondary_certified_at ? 2 : certification.certified_at ? 1 : 0,
          label: this.getSignoffRequirementLabel(certification.signoff_required ?? 1),
        },
        source_changes: {
          latest_account_change_at: null,
          latest_journal_change_at: null,
        },
      };
    }

    const { latestAccountChange, latestJournalChange } = await this.getLatestReportSourceChanges(companyId, year, month);
    const certifiedAt = new Date(certification.certified_at);
    const staleReasons: string[] = [];
    const sourceTimestamps: Date[] = [];

    if (latestAccountChange?.updated_at && latestAccountChange.updated_at > certifiedAt) {
      staleReasons.push(
        `COA changed after signoff: ${latestAccountChange.code} ${latestAccountChange.name} was updated on ${latestAccountChange.updated_at.toLocaleString('en-ZA')}.`,
      );
      sourceTimestamps.push(latestAccountChange.updated_at);
    }

    if (latestJournalChange?.updated_at && latestJournalChange.updated_at > certifiedAt) {
      staleReasons.push(
        `Posted journal activity changed after signoff: ${latestJournalChange.reference || latestJournalChange.description || latestJournalChange.id} was updated on ${latestJournalChange.updated_at.toLocaleString('en-ZA')}.`,
      );
      sourceTimestamps.push(latestJournalChange.updated_at);
    }

    const lastSourceChangeAt = sourceTimestamps.length
      ? new Date(Math.max(...sourceTimestamps.map((value) => value.getTime())))
      : null;

    const effectiveCertification = {
      ...certification,
      effective_status: staleReasons.length ? 'stale' : 'certified',
      stale_reasons: staleReasons,
      last_source_change_at: lastSourceChangeAt,
      signoff_progress: {
        required: certification.signoff_required ?? 1,
        completed: certification.secondary_certified_at ? 2 : certification.certified_at ? 1 : 0,
        label: this.getSignoffRequirementLabel(certification.signoff_required ?? 1),
      },
      source_changes: {
        latest_account_change_at: latestAccountChange?.updated_at ?? null,
        latest_journal_change_at: latestJournalChange?.updated_at ?? null,
      },
    };

    if (staleReasons.length && lastSourceChangeAt) {
      const latestStaleAudit = certification.audits?.find((audit: any) => audit.action === 'stale_detected');
      const staleAlreadyRecorded =
        latestStaleAudit && new Date(latestStaleAudit.created_at).getTime() >= lastSourceChangeAt.getTime();

      if (!staleAlreadyRecorded) {
        const staleAudit = await this.recordReportCertificationAudit({
          companyId,
          certificationId: certification.id,
          actorUserId: null,
          action: 'stale_detected',
          notes: staleReasons.join(' '),
          postureSnapshot: {
            stale_reasons: staleReasons,
            last_source_change_at: lastSourceChangeAt,
          },
        });

        effectiveCertification.audits = [
          {
            ...staleAudit,
            actor: null,
          },
          ...(effectiveCertification.audits || []),
        ];
      }
    }

    return effectiveCertification;
  }

  private async getPeriodReportingCertificationSummary(companyId: string, year: number, month: number) {
    const requiredReportTypes = this.getRequiredPeriodReportTypes(year, month);
    const period = await this.getCompanyAccountingPeriod(companyId, year, month);

    const certifications = period
      ? await this.prisma.reportCertification.findMany({
          where: {
            company_id: companyId,
            period_id: period.id,
            report_type: { in: requiredReportTypes },
          },
          include: {
            certifier: {
              select: { id: true, first_name: true, last_name: true, email: true },
            },
            secondary_certifier: {
              select: { id: true, first_name: true, last_name: true, email: true },
            },
            audits: {
              orderBy: { created_at: 'desc' },
              take: 10,
              include: {
                actor: {
                  select: { id: true, first_name: true, last_name: true, email: true },
                },
              },
            },
          },
        })
      : [];

    const effectiveByType = new Map<string, any>();
    for (const certification of certifications) {
      const effective = await this.attachEffectiveCertificationState(companyId, year, month, certification);
      effectiveByType.set(certification.report_type, effective);
    }

    const requiredPacks = requiredReportTypes.map((reportType) => {
      const certification = effectiveByType.get(reportType) ?? null;
      const signoffRequired = this.requiresDualSignoff(year, month, reportType) ? 2 : 1;
      const effectiveStatus = certification?.effective_status || certification?.status || 'uncertified';
      const completed = certification?.signoff_progress?.completed ?? 0;

      return {
        report_type: reportType,
        required_signoffs: signoffRequired,
        completed_signoffs: completed,
        status: effectiveStatus,
        certification,
        blocking:
          effectiveStatus !== 'certified' ||
          completed < signoffRequired,
      };
    });

    const blockingPacks = requiredPacks.filter((pack) => pack.blocking);

    return {
      period: period || { year, month, status: 'open' },
      required_count: requiredPacks.length,
      certified_count: requiredPacks.filter((pack) => pack.status === 'certified' && !pack.blocking).length,
      blocking_count: blockingPacks.length,
      can_close_reporting: blockingPacks.length === 0,
      packs: requiredPacks,
      messages:
        blockingPacks.length === 0
          ? ['Required report certifications are complete for this period.']
          : blockingPacks.map((pack) => {
              if (pack.status === 'pending_secondary_signoff') {
                return `${pack.report_type.toUpperCase()} requires secondary signoff before period close.`;
              }
              if (pack.status === 'stale') {
                return `${pack.report_type.toUpperCase()} certification is stale and must be refreshed before period close.`;
              }
              return `${pack.report_type.toUpperCase()} is not fully certified for this period.`;
            }),
    };
  }

  private async recordReportCertificationAudit(params: {
    companyId: string;
    certificationId: string;
    actorUserId?: string | null;
    action: string;
    notes?: string | null;
    postureSnapshot?: Record<string, any> | null;
  }) {
    return this.prisma.reportCertificationAudit.create({
      data: {
        company_id: params.companyId,
        certification_id: params.certificationId,
        actor_user_id: params.actorUserId || null,
        action: params.action,
        notes: params.notes || null,
        posture_snapshot: params.postureSnapshot || undefined,
      },
    });
  }

  // --- Chart of Accounts ---

  async createAccount(companyId: string, actorUserId: string | null, data: CreateAccountDto, actorRoles?: string[] | null) {
    this.assertCreateAllowedForWorkflow(data);
    const code = this.validateAccountCodeFormat(data.code);
    const baseCode = this.extractBaseCode(code);
    const type = data.type.trim().toLowerCase();
    this.validateTypeRange(type, baseCode);
    this.validateFsPlacementAlignment(type, data.fs_placement);
    this.validateReservedCodeRules(baseCode, data.is_header, data.is_contra);
    this.assertDirectSensitiveAccountAccess(data.sensitivity_tier || 'T3', actorRoles);
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

    const created = await this.prisma.gLAccount.create({
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

    await this.recordAccountAudit({
      companyId,
      accountId: created.id,
      actorUserId,
      action: 'account_created',
      changeSummary: this.summarizeAccountChanges(null, this.buildAccountSnapshot(created)),
      afterSnapshot: this.buildAccountSnapshot(created),
    });

    return created;
  }

  private async getCompanyAccount(companyId: string, accountId: string) {
    const account = await this.prisma.gLAccount.findFirst({
      where: { id: accountId, company_id: companyId },
    });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async getAccounts(companyId: string) {
    await this.syncAccountRemediationStates(companyId);
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

  async getAccountRemediationStates(companyId: string) {
    await this.syncAccountRemediationStates(companyId);

    return this.prisma.gLAccountRemediationState.findMany({
      where: { company_id: companyId },
      orderBy: [{ status: 'asc' }, { updated_at: 'desc' }],
      include: {
        account: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            is_header: true,
            is_active: true,
            fs_placement: true,
            sensitivity_tier: true,
            account_owner_id: true,
            dormant_since: true,
            sunset_candidate: true,
          },
        },
        reviewer: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        clearer: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
      take: 250,
    });
  }

  async reviewAccountRemediationState(
    companyId: string,
    actorUserId: string | null,
    remediationStateId: string,
    data: ReviewAccountRemediationDto,
  ) {
    const state = await this.prisma.gLAccountRemediationState.findFirst({
      where: { id: remediationStateId, company_id: companyId },
      include: {
        account: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (!state) {
      throw new NotFoundException('Remediation state not found');
    }

    const updated = await this.prisma.gLAccountRemediationState.update({
      where: { id: state.id },
      data:
        data.decision === 'reviewed'
          ? {
              status: 'reviewed',
              reviewed_at: new Date(),
              reviewed_by: actorUserId || null,
              review_notes: data.notes || null,
            }
          : {
              status: 'open',
              review_notes: data.notes || null,
            },
      include: {
        account: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            is_header: true,
            is_active: true,
            fs_placement: true,
            sensitivity_tier: true,
            account_owner_id: true,
            dormant_since: true,
            sunset_candidate: true,
          },
        },
        reviewer: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        clearer: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
    });

    await this.recordAccountAudit({
      companyId,
      accountId: state.account_id,
      actorUserId,
      action: data.decision === 'reviewed' ? 'remediation_reviewed' : 'remediation_reopened',
      reason: data.notes || null,
      changeSummary: `${state.issue_type} remediation marked ${data.decision}`,
      beforeSnapshot: this.buildAccountSnapshot(state.account),
      afterSnapshot: this.buildAccountSnapshot(state.account),
    });

    return updated;
  }

  async getAccountAuditTrail(companyId: string, accountId?: string) {
    return this.prisma.gLAccountAuditTrail.findMany({
      where: {
        company_id: companyId,
        account_id: accountId || undefined,
      },
      orderBy: { created_at: 'desc' },
      take: accountId ? 25 : 100,
      include: {
        actor: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        account: {
          select: { id: true, code: true, name: true },
        },
        change_request: {
          select: { id: true, request_type: true, status: true, title: true },
        },
      },
    });
  }

  async getAccountChangeRequests(companyId: string) {
    return this.prisma.gLAccountChangeRequest.findMany({
      where: { company_id: companyId },
      orderBy: [{ status: 'asc' }, { created_at: 'desc' }],
      include: {
        account: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            is_active: true,
            sunset_candidate: true,
            sensitivity_tier: true,
          },
        },
        requester: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        reviewer: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
      take: 50,
    });
  }

  async createAccountChangeRequest(
    companyId: string,
    actorUserId: string | null,
    data: CreateAccountChangeRequestDto,
  ) {
    let account = null;
    if (data.account_id) {
      account = await this.getCompanyAccount(companyId, data.account_id);
    }

    if (data.request_type !== 'create' && !account) {
      throw new BadRequestException('An existing account must be selected for this request type');
    }

    const created = await this.prisma.gLAccountChangeRequest.create({
      data: {
        company_id: companyId,
        account_id: account?.id || null,
        request_type: data.request_type,
        title: data.title,
        rationale: data.rationale || null,
        requested_payload: data.proposed_changes || undefined,
        current_snapshot: this.buildAccountSnapshot(account),
        requested_by: actorUserId || null,
      },
      include: {
        account: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            is_active: true,
            sunset_candidate: true,
            sensitivity_tier: true,
          },
        },
        requester: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        reviewer: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
    });

    if (account) {
      await this.recordAccountAudit({
        companyId,
        accountId: account.id,
        actorUserId,
        action: 'change_request_created',
        reason: data.rationale || null,
        changeSummary: `${data.request_type} request submitted`,
        beforeSnapshot: this.buildAccountSnapshot(account),
        afterSnapshot: this.buildAccountSnapshot(account),
        changeRequestId: created.id,
      });
    }

    return created;
  }

  async updateAccount(companyId: string, actorUserId: string | null, accountId: string, data: UpdateAccountDto, actorRoles?: string[] | null) {
    const current = await this.getCompanyAccount(companyId, accountId);
    this.assertUpdateAllowedForWorkflow(current, data);
    const nextCode = data.code ? this.validateAccountCodeFormat(data.code) : current.code;
    const nextBaseCode = this.extractBaseCode(nextCode);
    const nextType = (data.type ?? current.type).trim().toLowerCase();
    const nextFsPlacement = data.fs_placement ?? current.fs_placement ?? null;
    const nextIsHeader = typeof data.is_header === 'boolean' ? data.is_header : current.is_header;
    const nextIsContra = typeof data.is_contra === 'boolean' ? data.is_contra : current.is_contra;
    const nextParentId = data.parent_id === '' ? null : data.parent_id ?? current.parent_id;
    const nextSensitivityTier = data.sensitivity_tier ?? current.sensitivity_tier ?? 'T3';

    if (nextParentId === accountId) {
      throw new BadRequestException('An account cannot be its own parent');
    }

    this.validateTypeRange(nextType, nextBaseCode);
    this.validateFsPlacementAlignment(nextType, nextFsPlacement);
    this.validateReservedCodeRules(nextBaseCode, nextIsHeader, nextIsContra);
    this.assertDirectSensitiveAccountAccess(nextSensitivityTier, actorRoles);
    await this.assertUniqueCode(companyId, nextCode, accountId);
    const parent = await this.getValidatedParent(companyId, nextParentId);
    await this.assertNoCircularParent(companyId, accountId, parent?.id || null);
    await this.assertAccountOwner(companyId, data.account_owner_id ?? current.account_owner_id ?? null);

    if (current.is_active && data.is_active === false) {
      await this.assertAccountCanDeactivate(companyId, accountId);
    }

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
        dormant_since:
          typeof data.is_active === 'boolean'
            ? data.is_active
              ? null
              : current.dormant_since ?? new Date()
            : undefined,
        sunset_candidate:
          typeof data.is_active === 'boolean' && data.is_active
            ? false
            : undefined,
        modified_by: actorUserId || null,
      },
      include: {
        owner: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
    });

    await this.updateDescendantPaths(companyId, updated.id, updated.full_path || updated.code);
    await this.recordAccountAudit({
      companyId,
      accountId: updated.id,
      actorUserId,
      action: 'account_updated',
      changeSummary: this.summarizeAccountChanges(
        this.buildAccountSnapshot(current),
        this.buildAccountSnapshot(updated),
      ),
      beforeSnapshot: this.buildAccountSnapshot(current),
      afterSnapshot: this.buildAccountSnapshot(updated),
    });
    return updated;
  }

  async reviewAccountChangeRequest(
    companyId: string,
    actorUserId: string | null,
    actorRoles: string[] | null | undefined,
    requestId: string,
    data: ReviewAccountChangeRequestDto,
  ) {
    const request = await this.prisma.gLAccountChangeRequest.findFirst({
      where: { id: requestId, company_id: companyId },
      include: {
      account: true,
        requester: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        reviewer: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Account change request not found');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException('Only pending change requests can be reviewed');
    }

    if (request.requested_by && actorUserId && request.requested_by === actorUserId) {
      throw new BadRequestException('Requesters may not review their own account change requests');
    }

    this.assertCanReviewChangeRequest(request, actorRoles);

    let implementedAt: Date | null = null;
    let nextStatus = data.decision;
    let updatedAccount = request.account;

    if (data.decision === 'approved' && request.account) {
      if (request.request_type === 'deactivate') {
        await this.assertAccountCanDeactivate(companyId, request.account.id);
        updatedAccount = await this.prisma.gLAccount.update({
          where: { id: request.account.id },
          data: {
            is_active: false,
            dormant_since: request.account.dormant_since ?? new Date(),
            modified_by: actorUserId || null,
          },
        });
        nextStatus = 'implemented';
        implementedAt = new Date();
      } else if (request.request_type === 'reactivate') {
        updatedAccount = await this.prisma.gLAccount.update({
          where: { id: request.account.id },
          data: {
            is_active: true,
            dormant_since: null,
            sunset_candidate: false,
            modified_by: actorUserId || null,
          },
        });
        nextStatus = 'implemented';
        implementedAt = new Date();
      } else if (request.request_type === 'sunset') {
        updatedAccount = await this.prisma.gLAccount.update({
          where: { id: request.account.id },
          data: {
            sunset_candidate: true,
            modified_by: actorUserId || null,
          },
        });
        nextStatus = 'implemented';
        implementedAt = new Date();
      } else if (request.request_type === 'restore') {
        updatedAccount = await this.prisma.gLAccount.update({
          where: { id: request.account.id },
          data: {
            sunset_candidate: false,
            modified_by: actorUserId || null,
          },
        });
        nextStatus = 'implemented';
        implementedAt = new Date();
      }
    }

    const reviewed = await this.prisma.gLAccountChangeRequest.update({
      where: { id: request.id },
      data: {
        status: nextStatus,
        reviewed_by: actorUserId || null,
        reviewed_at: new Date(),
        review_notes: data.review_notes || null,
        implemented_at: implementedAt,
      },
      include: {
        account: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            is_active: true,
            sunset_candidate: true,
            sensitivity_tier: true,
          },
        },
        requester: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        reviewer: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
    });

    if (request.account) {
      await this.recordAccountAudit({
        companyId,
        accountId: request.account.id,
        actorUserId,
        action:
          nextStatus === 'implemented'
            ? 'change_request_implemented'
            : data.decision === 'approved'
              ? 'change_request_approved'
              : 'change_request_rejected',
        reason: data.review_notes || request.rationale || null,
        changeSummary: `${request.request_type} request ${nextStatus}`,
        beforeSnapshot: this.buildAccountSnapshot(request.account),
        afterSnapshot: this.buildAccountSnapshot(updatedAccount),
        changeRequestId: request.id,
      });
    }

    return reviewed;
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

    const [draftEntries, postedEntries, reversedEntries, bankStatements, reportingCertification] = await Promise.all([
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
      this.getPeriodReportingCertificationSummary(companyId, year, month),
    ]);

    const blockers = [
      ...(draftEntries > 0 ? ['Draft journal entries remain open for this period.'] : []),
      ...(reportingCertification.can_close_reporting ? [] : reportingCertification.messages),
    ];

    return {
      period: period || { year, month, status: 'open' },
      draftEntries,
      postedEntries,
      reversedEntries,
      bankStatements,
      can_close: draftEntries === 0 && reportingCertification.can_close_reporting,
      blockers,
      reporting_certification: reportingCertification,
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

  async getReportCertification(companyId: string, year: number, month: number, reportType: string) {
    const period = await this.getCompanyAccountingPeriod(companyId, year, month);
    const posture = await this.getReportingCertificationPosture(companyId);

    const certification = period
      ? await this.prisma.reportCertification.findFirst({
          where: {
            company_id: companyId,
            period_id: period.id,
            report_type: reportType,
          },
          include: {
            certifier: {
              select: { id: true, first_name: true, last_name: true, email: true },
            },
            secondary_certifier: {
              select: { id: true, first_name: true, last_name: true, email: true },
            },
            audits: {
              orderBy: { created_at: 'desc' },
              take: 10,
              include: {
                actor: {
                  select: { id: true, first_name: true, last_name: true, email: true },
                },
              },
            },
          },
        })
      : null;

    const effectiveCertification = certification
      ? await this.attachEffectiveCertificationState(companyId, year, month, certification)
      : null;

    return {
      period: period || { year, month, status: 'open' },
      report_type: reportType,
      posture,
      certification: effectiveCertification,
    };
  }

  async certifyReport(
    companyId: string,
    userId: string,
    actorRoles: string[] | null | undefined,
    year: number,
    month: number,
    reportType: string,
    notes?: string,
  ) {
    this.assertCanCertifyReports(actorRoles);
    const posture = await this.getReportingCertificationPosture(companyId);
    if (!posture.canCertify) {
      throw new BadRequestException('Reporting cannot be certified while material COA blockers remain.');
    }

    const period = await this.ensureAccountingPeriod(companyId, new Date(year, month - 1, 1));
    const dualSignoffRequired = this.requiresDualSignoff(year, month, reportType);
    const existingCertification = await this.prisma.reportCertification.findFirst({
      where: {
        company_id: companyId,
        period_id: period.id,
        report_type: reportType,
      },
    });

    if (
      dualSignoffRequired &&
      existingCertification?.status === 'pending_secondary_signoff' &&
      existingCertification.certified_by === userId
    ) {
      throw new BadRequestException('A second qualified reviewer must complete the secondary signoff for this report pack.');
    }

    const isSecondarySignoff =
      dualSignoffRequired &&
      existingCertification?.status === 'pending_secondary_signoff' &&
      existingCertification.certified_by &&
      existingCertification.certified_by !== userId;

    const nextStatus = dualSignoffRequired
      ? isSecondarySignoff
        ? 'certified'
        : 'pending_secondary_signoff'
      : 'certified';

    const certification = await this.prisma.reportCertification.upsert({
      where: {
        company_id_period_id_report_type: {
          company_id: companyId,
          period_id: period.id,
          report_type: reportType,
        },
      },
      update: {
        status: nextStatus,
        certified_by: isSecondarySignoff ? existingCertification?.certified_by ?? userId : userId,
        certified_at: isSecondarySignoff ? existingCertification?.certified_at ?? new Date() : new Date(),
        secondary_certified_by: isSecondarySignoff ? userId : null,
        secondary_certified_at: isSecondarySignoff ? new Date() : null,
        signoff_required: dualSignoffRequired ? 2 : 1,
        revoked_at: null,
        notes: notes || null,
        coverage_percent: posture.coveragePercent,
        blocker_count: posture.materialBlockers,
        owner_gap_count: posture.missingOwnerCount,
        restricted_gap_count: posture.restrictedNoOwnerCount,
        posture_snapshot: posture,
      },
      create: {
        company_id: companyId,
        period_id: period.id,
        report_type: reportType,
        status: nextStatus,
        certified_by: userId,
        certified_at: new Date(),
        secondary_certified_by: null,
        secondary_certified_at: null,
        signoff_required: dualSignoffRequired ? 2 : 1,
        notes: notes || null,
        coverage_percent: posture.coveragePercent,
        blocker_count: posture.materialBlockers,
        owner_gap_count: posture.missingOwnerCount,
        restricted_gap_count: posture.restrictedNoOwnerCount,
        posture_snapshot: posture,
      },
      include: {
        certifier: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        secondary_certifier: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
    });

    await this.recordReportCertificationAudit({
      companyId,
      certificationId: certification.id,
      actorUserId: userId,
      action: dualSignoffRequired ? (isSecondarySignoff ? 'secondary_certified' : 'primary_certified') : 'certified',
      notes:
        notes ||
        (dualSignoffRequired
          ? isSecondarySignoff
            ? 'Secondary signoff completed for dual-approval report pack.'
            : 'Primary signoff recorded; awaiting secondary reviewer.'
          : null),
      postureSnapshot: posture,
    });

    return this.getReportCertification(companyId, year, month, reportType);
  }

  async revokeReportCertification(
    companyId: string,
    userId: string,
    actorRoles: string[] | null | undefined,
    year: number,
    month: number,
    reportType: string,
    notes?: string,
  ) {
    this.assertCanCertifyReports(actorRoles);
    const period = await this.getCompanyAccountingPeriod(companyId, year, month);
    if (!period) {
      throw new NotFoundException('No accounting period exists for this report certification.');
    }

    const certification = await this.prisma.reportCertification.findFirst({
      where: {
        company_id: companyId,
        period_id: period.id,
        report_type: reportType,
      },
    });

    if (!certification) {
      throw new NotFoundException('No report certification exists for this period and report type.');
    }

    const posture = await this.getReportingCertificationPosture(companyId);
    const revoked = await this.prisma.reportCertification.update({
      where: { id: certification.id },
      data: {
        status: 'revoked',
        revoked_at: new Date(),
        secondary_certified_by: null,
        secondary_certified_at: null,
        notes: notes || certification.notes || null,
        coverage_percent: posture.coveragePercent,
        blocker_count: posture.materialBlockers,
        owner_gap_count: posture.missingOwnerCount,
        restricted_gap_count: posture.restrictedNoOwnerCount,
        posture_snapshot: posture,
      },
    });

    await this.recordReportCertificationAudit({
      companyId,
      certificationId: revoked.id,
      actorUserId: userId,
      action: 'revoked',
      notes: notes || null,
      postureSnapshot: posture,
    });

    return this.getReportCertification(companyId, year, month, reportType);
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
    if (!readiness.reporting_certification?.can_close_reporting) {
      throw new BadRequestException('Required report certifications must be complete before closing the period');
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
