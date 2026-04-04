"use client";

import React from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  FileText, 
  Upload,
  PieChart,
  History,
  BookOpen,
  Lock,
  Building2,
  Users,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface TrialBalanceRow {
  code: string;
  name: string;
  debit: number;
  credit: number;
}

interface ApDashboardData {
  totalOutstanding?: number;
  vendorCount?: number;
  recentPOs?: unknown[];
}

interface ArDashboardData {
  totalAr?: number;
  customerCount?: number;
}

interface AccountingPeriod {
  id: string;
  year: number;
  month: number;
  status: string;
}

interface ReportCertificationPack {
  report_type: string;
  status: string;
  blocking?: boolean;
  signoff_progress: {
    completed: number;
    required: number;
  };
}

interface CloseReadinessData {
  can_close: boolean;
  draft_journals: number;
  posted_journals: number;
  reversed_journals: number;
  bank_statement_count: number;
  blockers?: string[];
  reporting_certification?: {
    required_count: number;
    certified_count: number;
    blocking_count: number;
    can_close_reporting: boolean;
    messages: string[];
    packs: ReportCertificationPack[];
  };
}

interface BankStatementSummary {
  id: string;
  statement_date: string;
}

type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

interface GLAccount {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  fs_placement?: string | null;
  is_header?: boolean;
  sensitivity_tier?: string | null;
  account_owner_id?: string | null;
}

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

interface ReportLinkProps {
  icon: React.ReactNode;
  label: string;
  href: string;
}

export default function AccountingDashboardPage() {
  const { isAuthenticated } = useAuthStore();
  const [tb, setTb] = React.useState<TrialBalanceRow[]>([]);
  const [ap, setAp] = React.useState<ApDashboardData | null>(null);
  const [ar, setAr] = React.useState<ArDashboardData | null>(null);
  const [periods, setPeriods] = React.useState<AccountingPeriod[]>([]);
  const [statements, setStatements] = React.useState<BankStatementSummary[]>([]);
  const [accounts, setAccounts] = React.useState<GLAccount[]>([]);
  const [closeReadiness, setCloseReadiness] = React.useState<CloseReadinessData | null>(null);
  const [currentPeriod, setCurrentPeriod] = React.useState<AccountingPeriod | null>(null);
  const totalDebit = tb.reduce((sum, row) => sum + Number(row.debit || 0), 0);
  const totalCredit = tb.reduce((sum, row) => sum + Number(row.credit || 0), 0);
  const netDifference = Math.abs(totalDebit - totalCredit);
  const isBalanced = netDifference < 0.01;

  const reportingReadiness = React.useMemo(() => {
    const postingAccounts = accounts.filter((account) => !account.is_header);
    const mappedCount = postingAccounts.filter((account) => hasValidFsPlacement(account)).length;
    const unmappedCount = postingAccounts.filter((account) => !account.fs_placement).length;
    const invalidCount = postingAccounts.filter((account) => account.fs_placement && !hasValidFsPlacement(account)).length;
    const coveragePercent = postingAccounts.length ? Math.round((mappedCount / postingAccounts.length) * 100) : 0;
    const blockers = unmappedCount + invalidCount;

    return {
      postingCount: postingAccounts.length,
      mappedCount,
      unmappedCount,
      invalidCount,
      coveragePercent,
      blockers,
      statusLabel:
        blockers === 0
          ? 'Ready'
          : invalidCount > 0
            ? `${blockers} blockers`
            : `${blockers} gaps`,
    };
  }, [accounts]);

  const ownershipReadiness = React.useMemo(() => {
    const postingAccounts = accounts.filter((account) => !account.is_header);
    const noOwnerCount = postingAccounts.filter((account) => !account.account_owner_id).length;
    const restrictedNoOwnerCount = postingAccounts.filter((account) =>
      !account.account_owner_id && ['T1', 'T2'].includes((account.sensitivity_tier || '').toUpperCase()),
    ).length;

    return {
      noOwnerCount,
      restrictedNoOwnerCount,
    };
  }, [accounts]);

  const latestOpenPeriod = React.useMemo(() => {
    const openPeriods = periods.filter((period) => period.status !== 'closed');
    if (!openPeriods.length) return null;
    return [...openPeriods].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    })[0];
  }, [periods]);

  const signoffPosture = React.useMemo(() => {
    if (!latestOpenPeriod) {
      return {
        label: 'No open period',
        tone: 'text-slate-500',
        chipClass: 'bg-slate-100 text-slate-500',
        detail: 'No active close cycle',
        blockerText: 'No reporting signoff required',
      };
    }

    const reporting = closeReadiness?.reporting_certification;
    if (!reporting) {
      return {
        label: 'Loading',
        tone: 'text-slate-500',
        chipClass: 'bg-slate-100 text-slate-500',
        detail: formatPeriodLabel(latestOpenPeriod.year, latestOpenPeriod.month),
        blockerText: 'Checking reporting posture',
      };
    }

    if (reporting.blocking_count > 0 || !closeReadiness?.can_close) {
      return {
        label: 'Blocked',
        tone: 'text-rose-600',
        chipClass: 'bg-rose-50 text-rose-600',
        detail: formatPeriodLabel(latestOpenPeriod.year, latestOpenPeriod.month),
        blockerText:
          reporting.messages[0] ||
          `${reporting.blocking_count} report pack${reporting.blocking_count === 1 ? '' : 's'} still need attention`,
      };
    }

    return {
      label: 'Ready',
      tone: 'text-emerald-600',
      chipClass: 'bg-emerald-50 text-emerald-600',
      detail: formatPeriodLabel(latestOpenPeriod.year, latestOpenPeriod.month),
      blockerText: 'Required report packs are certified',
    };
  }, [closeReadiness, latestOpenPeriod]);

  const dashboardBlockers = React.useMemo(() => {
    const blockers: Array<{
      key: string;
      title: string;
      detail: string;
      tone: string;
    }> = [];

    if (!closeReadiness || !latestOpenPeriod) return blockers;

    if (closeReadiness.draft_journals > 0) {
      blockers.push({
        key: 'journals',
        title: 'Journal readiness',
        detail: `${closeReadiness.draft_journals} draft journal${closeReadiness.draft_journals === 1 ? '' : 's'} remain open for ${formatPeriodLabel(latestOpenPeriod.year, latestOpenPeriod.month)}.`,
        tone: 'bg-rose-50 text-rose-700 border-rose-100',
      });
    }

    if ((closeReadiness.reporting_certification?.blocking_count ?? 0) > 0) {
      const packs = closeReadiness.reporting_certification?.packs ?? [];
      const staleCount = packs.filter((pack) => pack.status === 'stale').length;
      const pendingSecondCount = packs.filter((pack) => pack.status === 'pending_secondary_signoff').length;
      const uncertifiedCount = packs.filter((pack) => pack.status === 'uncertified').length;

      blockers.push({
        key: 'signoff',
        title: 'Report signoff',
        detail:
          staleCount > 0
            ? `${staleCount} report pack${staleCount === 1 ? '' : 's'} ha${staleCount === 1 ? 's' : 've'} stale certification.`
            : pendingSecondCount > 0
              ? `${pendingSecondCount} report pack${pendingSecondCount === 1 ? '' : 's'} still need secondary signoff.`
              : `${uncertifiedCount || closeReadiness.reporting_certification?.blocking_count} report pack${(uncertifiedCount || closeReadiness.reporting_certification?.blocking_count) === 1 ? '' : 's'} are not yet certified.`,
        tone: 'bg-amber-50 text-amber-700 border-amber-100',
      });
    }

    if (ownershipReadiness.restrictedNoOwnerCount > 0) {
      blockers.push({
        key: 'restricted-owner',
        title: 'Restricted-account ownership',
        detail: `${ownershipReadiness.restrictedNoOwnerCount} restricted account${ownershipReadiness.restrictedNoOwnerCount === 1 ? '' : 's'} still have no owner assigned.`,
        tone: 'bg-rose-50 text-rose-700 border-rose-100',
      });
    } else if (ownershipReadiness.noOwnerCount > 0) {
      blockers.push({
        key: 'owner',
        title: 'Owner accountability',
        detail: `${ownershipReadiness.noOwnerCount} posting account${ownershipReadiness.noOwnerCount === 1 ? '' : 's'} still need owner assignment.`,
        tone: 'bg-sky-50 text-sky-700 border-sky-100',
      });
    }

    return blockers;
  }, [closeReadiness, latestOpenPeriod, ownershipReadiness]);

  React.useEffect(() => {
    const fetchAccountingData = async () => {
      try {
        const [tbRes, apRes, arRes, periodsRes, statementsRes, accountsRes] = await Promise.all([
          apiFetch('/accounting/trial-balance'),
          apiFetch('/ap/dashboard'),
          apiFetch('/ar/dashboard'),
          apiFetch('/accounting/periods'),
          apiFetch('/accounting/bank-statements'),
          apiFetch('/accounting/accounts'),
        ]);

        if (tbRes.ok) {
          const tbData = await tbRes.json();
          setTb(Array.isArray(tbData) ? tbData : []);
        }
        if (apRes.ok) setAp(await apRes.json());
        if (arRes.ok) setAr(await arRes.json());
        if (periodsRes.ok) {
          const periodData = await periodsRes.json();
          setPeriods(Array.isArray(periodData) ? periodData : []);
        }
        if (statementsRes.ok) {
          const statementData = await statementsRes.json();
          setStatements(Array.isArray(statementData) ? statementData : []);
        }
        if (accountsRes.ok) {
          const accountsData = await accountsRes.json();
          setAccounts(Array.isArray(accountsData) ? accountsData : []);
        }
      } catch (err) {
        console.error('Failed to fetch accounting data:', err);
      }
    };

    if (isAuthenticated) fetchAccountingData();
  }, [isAuthenticated]);

  React.useEffect(() => {
    const fetchCloseReadiness = async () => {
      if (!isAuthenticated || !latestOpenPeriod) {
        setCloseReadiness(null);
        setCurrentPeriod(latestOpenPeriod);
        return;
      }

      setCurrentPeriod(latestOpenPeriod);

      try {
        const response = await apiFetch(
          `/accounting/periods/close-readiness?year=${latestOpenPeriod.year}&month=${latestOpenPeriod.month}`,
        );

        if (response.ok) {
          setCloseReadiness(await response.json());
        }
      } catch (err) {
        console.error('Failed to fetch close readiness:', err);
      }
    };

    fetchCloseReadiness();
  }, [isAuthenticated, latestOpenPeriod]);

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading text-brand-navy">Accounting Workspace</h1>
          <p className="text-slate-500">Track live ledger totals, journals, and close status.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/accounting/bank-reconciliation" className="btn-secondary flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-slate-50 transition-all text-sm font-bold">
            <Upload size={16} />
            Bank Reconciliation
          </Link>
          <Link href="/accounting/journal" className="btn-primary bg-brand-navy text-white flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-brand-navy/90 transition-all shadow-lg text-sm font-bold">
            <Plus size={16} />
            New Journal
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-8 gap-6">
        <StatCard 
          label="Ledger Accounts"
          value={`${tb.length}`}
          change="Chart of accounts"
          isPositive={true} 
          icon={<BookOpen className="text-emerald-600" />} 
        />
        <StatCard 
          label="AP Outstanding"
          value={`R ${(ap?.totalOutstanding || 0).toLocaleString()}`}
          change={`${ap?.vendorCount ?? 0} vendors`}
          isPositive={true} 
          icon={<Building2 className="text-rose-600" />} 
        />
        <StatCard 
          label="AR Outstanding"
          value={`R ${(ar?.totalAr || 0).toLocaleString()}`}
          change={`${ar?.customerCount ?? 0} customers`}
          isPositive={true} 
          icon={<Users className="text-brand-navy" />} 
        />
        <StatCard 
          label="Open Periods"
          value={`${periods.filter((period) => period.status !== 'closed').length}`}
          change="Period close"
          isPositive={true}
          icon={<Lock className="text-brand-gold" />} 
        />
        <StatCard 
          label="Bank Statements"
          value={`${statements.length}`}
          change="Imported files"
          isPositive={true}
          icon={<RefreshCw className="text-brand-gold" />} 
        />
        <StatCard 
          label="Trial Difference"
          value={`R ${netDifference.toLocaleString()}`}
          change={isBalanced ? 'Balanced' : 'Needs review'}
          isPositive={isBalanced}
          icon={<PieChart className="text-brand-gold" />} 
        />
        <StatCard 
          label="Financial Reports"
          value={`${reportingReadiness.coveragePercent}%`}
          change={reportingReadiness.statusLabel}
          isPositive={reportingReadiness.blockers === 0}
          icon={<FileText className="text-brand-gold" />} 
        />
        <StatCard
          label="Period Signoff"
          value={closeReadiness?.reporting_certification ? `${closeReadiness.reporting_certification.certified_count}/${closeReadiness.reporting_certification.required_count}` : '--'}
          change={signoffPosture.label}
          isPositive={signoffPosture.label === 'Ready'}
          icon={<Lock className="text-brand-gold" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Link href="/accounting/chart-of-accounts" className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm hover:shadow-xl transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-2xl bg-slate-50"><BookOpen className="text-brand-gold" /></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Setup</span>
          </div>
          <h3 className="text-xl font-heading text-brand-navy mb-2">Chart of Accounts</h3>
          <p className="text-sm text-slate-500">Create and organize ledger accounts used by journals and reports.</p>
        </Link>

        <Link href="/accounting/journal" className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm hover:shadow-xl transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-2xl bg-slate-50"><FileText className="text-brand-gold" /></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Posting</span>
          </div>
          <h3 className="text-xl font-heading text-brand-navy mb-2">Journal Entries</h3>
          <p className="text-sm text-slate-500">Record and post balanced transactions to the general ledger.</p>
        </Link>

        <Link href="/accounting/bank-reconciliation" className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm hover:shadow-xl transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-2xl bg-slate-50"><RefreshCw className="text-brand-gold" /></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Reconciliation</span>
          </div>
          <h3 className="text-xl font-heading text-brand-navy mb-2">Bank Reconciliation</h3>
          <p className="text-sm text-slate-500">Import statements and review uploaded lines against cash activity.</p>
        </Link>

        <Link href="/accounting/close" className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm hover:shadow-xl transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-2xl bg-slate-50"><Lock className="text-brand-gold" /></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Controls</span>
          </div>
          <h3 className="text-xl font-heading text-brand-navy mb-2">Period Close</h3>
          <p className="text-sm text-slate-500">Lock a month once journals and sub-ledgers are ready.</p>
        </Link>

        <Link href="/accounting/reports" className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm hover:shadow-xl transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-2xl bg-slate-50"><FileText className="text-brand-gold" /></div>
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${
              reportingReadiness.blockers === 0
                ? 'bg-emerald-50 text-emerald-600'
                : reportingReadiness.invalidCount > 0
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-amber-50 text-amber-600'
            }`}>
              {reportingReadiness.statusLabel}
            </span>
          </div>
          <h3 className="text-xl font-heading text-brand-navy mb-2">Financial Reports</h3>
          <p className="text-sm text-slate-500">Review the P&amp;L, Balance Sheet, and Trial Balance with live COA mapping posture.</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <DashboardMiniMetric label="Mapped" value={`${reportingReadiness.mappedCount}`} />
            <DashboardMiniMetric label="Unmapped" value={`${reportingReadiness.unmappedCount}`} />
            <DashboardMiniMetric label="Invalid" value={`${reportingReadiness.invalidCount}`} />
          </div>
        </Link>

        <Link href={signoffPosture.label === 'Blocked' ? '/accounting/close' : '/accounting/reports'} className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm hover:shadow-xl transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-2xl bg-slate-50"><Lock className="text-brand-gold" /></div>
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${signoffPosture.chipClass}`}>
              {signoffPosture.label}
            </span>
          </div>
          <h3 className="text-xl font-heading text-brand-navy mb-2">Reporting Signoff</h3>
          <p className="text-sm text-slate-500">
            Track whether the latest open period can support certifiable reporting and formal close.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <DashboardMiniMetric
              label="Period"
              value={currentPeriod ? `${currentPeriod.month}/${currentPeriod.year}` : '--'}
            />
            <DashboardMiniMetric
              label="Blocking Packs"
              value={`${closeReadiness?.reporting_certification?.blocking_count ?? 0}`}
            />
            <DashboardMiniMetric
              label="No Owner"
              value={`${ownershipReadiness.noOwnerCount}`}
            />
            <DashboardMiniMetric
              label="Restricted"
              value={`${ownershipReadiness.restrictedNoOwnerCount}`}
            />
          </div>
          <div className={`mt-4 text-sm font-medium ${signoffPosture.tone}`}>
            {signoffPosture.blockerText}
          </div>
        </Link>

        <Link href="/ap" className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm hover:shadow-xl transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-2xl bg-slate-50"><Building2 className="text-brand-gold" /></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">AP</span>
          </div>
          <h3 className="text-xl font-heading text-brand-navy mb-2">Accounts Payable</h3>
          <p className="text-sm text-slate-500">Manage vendors, vendor bills, approvals, and payment runs.</p>
        </Link>

        <Link href="/ar" className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm hover:shadow-xl transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-2xl bg-slate-50"><Users className="text-brand-gold" /></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">AR</span>
          </div>
          <h3 className="text-xl font-heading text-brand-navy mb-2">Accounts Receivable</h3>
          <p className="text-sm text-slate-500">Manage customers, sales invoices, collections, aging, and receipts.</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6">
        <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Latest period governance</div>
              <h3 className="mt-2 text-xl font-heading text-brand-navy">Close blockers by control type</h3>
              <p className="mt-2 text-sm text-slate-500">
                {currentPeriod
                  ? `${formatPeriodLabel(currentPeriod.year, currentPeriod.month)} is currently ${signoffPosture.label === 'Blocked' ? 'blocked' : 'progressing'} through close discipline.`
                  : 'No active close cycle is available right now.'}
              </p>
            </div>
            <span className={`shrink-0 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${signoffPosture.chipClass}`}>
              {signoffPosture.label}
            </span>
          </div>

          <div className="mt-6 grid gap-3">
            {dashboardBlockers.length > 0 ? dashboardBlockers.map((blocker) => (
              <div key={blocker.key} className={`rounded-2xl border px-4 py-4 ${blocker.tone}`}>
                <div className="text-[10px] font-black uppercase tracking-[0.16em]">{blocker.title}</div>
                <div className="mt-2 text-sm font-medium">{blocker.detail}</div>
              </div>
            )) : (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-emerald-700">
                <div className="text-[10px] font-black uppercase tracking-[0.16em]">Ready for signoff</div>
                <div className="mt-2 text-sm font-medium">
                  The latest open period currently has no named close blockers across journals, reporting certification, or ownership posture.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Required report packs</div>
          <h3 className="mt-2 text-xl font-heading text-brand-navy">Certification snapshot</h3>
          <div className="mt-4 space-y-3">
            {(closeReadiness?.reporting_certification?.packs ?? []).length > 0 ? (
              closeReadiness?.reporting_certification?.packs.map((pack) => (
                <div key={pack.report_type} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-brand-navy">{getReportLabel(pack.report_type)}</div>
                      <div className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{pack.report_type.toUpperCase()}</div>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.16em] px-2 py-1 rounded-full ${getPackStatusClass(pack.status)}`}>
                      {formatPackStatus(pack.status)}
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-slate-600">
                    {pack.signoff_progress.completed} of {pack.signoff_progress.required} signoffs complete
                  </div>
                  <Link
                    href={getDashboardReportHref(pack.report_type, currentPeriod)}
                    className="mt-4 inline-flex items-center text-xs font-bold uppercase tracking-[0.16em] text-brand-gold hover:underline"
                  >
                    Open report workspace →
                  </Link>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                Report-pack certification detail will appear here once an open period is available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          label="Total Debit"
          value={`R ${totalDebit.toLocaleString()}`}
          change="Trial balance"
          isPositive={true} 
          icon={<ArrowUpRight className="text-blue-600" />} 
        />
        <StatCard 
          label="Total Credit"
          value={`R ${totalCredit.toLocaleString()}`}
          change="Trial balance"
          isPositive={false} 
          icon={<ArrowDownLeft className="text-rose-600" />} 
        />
        <StatCard 
          label="Trial Difference"
          value={`R ${netDifference.toLocaleString()}`}
          change={isBalanced ? 'Balanced' : 'Needs review'}
          isPositive={isBalanced}
          icon={<PieChart className="text-brand-gold" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trial Balance Snippet */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-heading text-brand-navy">Trial Balance Summary</h3>
            <Link href="/accounting/reports" className="text-xs font-bold text-brand-gold uppercase tracking-widest hover:underline">Full Report →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="py-3 px-2">Account</th>
                  <th className="py-3 px-2 text-right">Debit</th>
                  <th className="py-3 px-2 text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tb.length > 0 ? tb.slice(0, 8).map((row, i) => (
                  <tr key={i} className="text-sm hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-2 font-medium text-slate-700">{row.code} - {row.name}</td>
                    <td className="py-4 px-2 text-right text-slate-600">{row.debit > 0 ? `R ${row.debit.toLocaleString()}` : '-'}</td>
                    <td className="py-4 px-2 text-right text-slate-600">{row.credit > 0 ? `R ${row.credit.toLocaleString()}` : '-'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-slate-400 italic">No posted transactions yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Links & History */}
        <div className="space-y-6">
          <div className="bg-brand-navy rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <h3 className="text-lg font-heading mb-6 relative z-10">Quick Reports</h3>
            <div className="space-y-4 relative z-10">
              <ReportLink icon={<FileText size={18} />} label="Profit & Loss" href="/accounting/reports?type=pnl" />
              <ReportLink icon={<PieChart size={18} />} label="Balance Sheet" href="/accounting/reports?type=bs" />
              <ReportLink icon={<History size={18} />} label="Audit Ledger" href="/accounting/reports?type=audit" />
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h3 className="text-lg font-heading mb-6 text-brand-navy">Month-End Close</h3>
            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-500 mb-4">
                {currentPeriod
                  ? `${formatPeriodLabel(currentPeriod.year, currentPeriod.month)} is the latest open period. ${signoffPosture.blockerText}.`
                  : 'No open period is currently available for close review.'}
              </p>
              <Link
                href="/accounting/close"
                className="block w-full py-3 bg-brand-navy text-white rounded-xl text-xs font-bold hover:bg-brand-navy/90 transition-all shadow-md text-center"
              >
                {signoffPosture.label === 'Blocked' ? 'Resolve Close Blockers' : 'Review Period Close'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, change, isPositive, icon }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {change}
        </span>
      </div>
      <h4 className="text-slate-500 text-sm font-medium mb-1">{label}</h4>
      <p className="text-2xl font-bold text-brand-navy font-heading">{value}</p>
    </div>
  );
}

function ReportLink({ icon, label, href }: ReportLinkProps) {
  return (
    <Link href={href} className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
      <span className="text-brand-gold">{icon}</span>
      <span className="text-sm font-bold">{label}</span>
      <ArrowUpRight size={14} className="ml-auto opacity-50" />
    </Link>
  );
}

function DashboardMiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-3">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-heading text-brand-navy">{value}</div>
    </div>
  );
}

function formatPeriodLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString('en-ZA', {
    month: 'long',
    year: 'numeric',
  });
}

function formatPackStatus(status: string) {
  switch (status) {
    case 'pending_secondary_signoff':
      return 'Awaiting second signoff';
    case 'stale':
      return 'Stale';
    case 'certified':
      return 'Certified';
    default:
      return 'Uncertified';
  }
}

function getPackStatusClass(status: string) {
  switch (status) {
    case 'certified':
      return 'bg-emerald-50 text-emerald-600';
    case 'pending_secondary_signoff':
      return 'bg-amber-50 text-amber-600';
    case 'stale':
      return 'bg-rose-50 text-rose-600';
    default:
      return 'bg-slate-100 text-slate-500';
  }
}

function getReportLabel(reportType: string) {
  switch (reportType) {
    case 'pnl':
      return 'Profit & Loss';
    case 'bs':
      return 'Balance Sheet';
    case 'tb':
      return 'Trial Balance';
    default:
      return reportType.toUpperCase();
  }
}

function getDashboardReportHref(reportType: string, period: AccountingPeriod | null) {
  if (!period) return '/accounting/reports';

  const year = period.year;
  const month = period.month;
  const periodEnd = new Date(year, month, 0);
  const toDate = periodEnd.toISOString().slice(0, 10);

  if (reportType === 'pnl') {
    const fromDate = new Date(year, month - 1, 1).toISOString().slice(0, 10);
    return `/accounting/reports?type=pnl&fromDate=${fromDate}&toDate=${toDate}`;
  }

  if (reportType === 'bs') {
    return `/accounting/reports?type=bs&toDate=${toDate}`;
  }

  if (reportType === 'tb') {
    return `/accounting/reports?type=tb&toDate=${toDate}`;
  }

  return '/accounting/reports';
}

const FS_ALLOWED_BY_TYPE: Record<AccountType, string[]> = {
  asset: ['Current Assets', 'Non-current Assets'],
  liability: ['Current Liabilities', 'Non-current Liabilities'],
  equity: ['Equity'],
  revenue: ['Revenue', 'Other Income'],
  expense: ['Cost of Sales', 'Operating Expenses', 'Other Expense', 'Tax'],
};

function hasValidFsPlacement(account: GLAccount) {
  if (!account.fs_placement) return false;
  return FS_ALLOWED_BY_TYPE[account.type]?.includes(account.fs_placement) ?? false;
}
