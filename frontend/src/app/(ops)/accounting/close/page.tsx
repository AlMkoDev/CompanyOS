"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Lock, CalendarDays, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

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

interface RemediationState {
  id: string;
  issue_type: string;
  status: string;
  first_seen_at: string;
  reviewed_at?: string | null;
  cleared_at?: string | null;
  account?: {
    id: string;
    code: string;
    name: string;
  } | null;
}

interface AccountingPeriod {
  id: string;
  year: number;
  month: number;
  status: string;
  closed_at?: string | null;
  closed_by?: string | null;
}

interface CloseReadiness {
  period: AccountingPeriod;
  draftEntries: number;
  postedEntries: number;
  reversedEntries: number;
  bankStatements: number;
  can_close: boolean;
  blockers: string[];
  reporting_certification?: {
    required_count: number;
    certified_count: number;
    blocking_count: number;
    can_close_reporting: boolean;
    messages: string[];
    packs: Array<{
      report_type: string;
      required_signoffs: number;
      completed_signoffs: number;
      status: string;
      certification?: {
        certified_at?: string | null;
        secondary_certified_at?: string | null;
        certifier?: {
          id: string;
          first_name: string;
          last_name: string;
          email?: string | null;
        } | null;
        secondary_certifier?: {
          id: string;
          first_name: string;
          last_name: string;
          email?: string | null;
        } | null;
        audits?: Array<{
          id: string;
          action: string;
          notes?: string | null;
          created_at: string;
          actor?: {
            id: string;
            first_name: string;
            last_name: string;
            email?: string | null;
          } | null;
        }>;
      } | null;
    }>;
  };
}

interface ReportingCertificationPosture {
  postingCount: number;
  coveragePercent: number;
  blockers: number;
  unmappedCount: number;
  invalidCount: number;
  missingOwnerCount: number;
  restrictedNoOwnerCount: number;
  dailyCadenceCount: number;
  canCertify: boolean;
  messages: string[];
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

function getRecommendedCadence(account: GLAccount) {
  if (account.sensitivity_tier === 'T1') return 'Daily';
  if (account.type === 'asset' && account.fs_placement === 'Current Assets') return 'Weekly';
  if (account.type === 'liability' && account.fs_placement === 'Current Liabilities') return 'Weekly';
  if (account.type === 'revenue' || account.type === 'expense') return 'Monthly';
  return 'Quarterly';
}

function getReportLabel(reportType: string) {
  const map: Record<string, string> = {
    pnl: 'Profit & Loss',
    bs: 'Balance Sheet',
    tb: 'Trial Balance',
  };
  return map[reportType] || reportType.toUpperCase();
}

function getReportWorkspaceHref(pack: { report_type: string }, year: number, month: number) {
  const toDate = `${year}-${String(month).padStart(2, '0')}-28`;
  if (pack.report_type === 'pnl') {
    const fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
    return `/accounting/reports?type=pnl&fromDate=${fromDate}&toDate=${toDate}`;
  }
  if (pack.report_type === 'bs') {
    return `/accounting/reports?type=bs&toDate=${toDate}`;
  }
  return `/accounting/reports?type=tb&toDate=${toDate}`;
}

function getPackActionLabel(pack: { status: string }) {
  if (pack.status === 'stale') return 'Re-certify pack';
  if (pack.status === 'pending_secondary_signoff') return 'Complete signoff';
  if (pack.status === 'certified') return 'Open certified pack';
  return 'Open for certification';
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Unscheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function CloseWorkflowPage() {
  const { isAuthenticated } = useAuthStore();
  const [periods, setPeriods] = React.useState<AccountingPeriod[]>([]);
  const [readiness, setReadiness] = React.useState<CloseReadiness | null>(null);
  const [accounts, setAccounts] = React.useState<GLAccount[]>([]);
  const [remediationStates, setRemediationStates] = React.useState<RemediationState[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [confirmed, setConfirmed] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [form, setForm] = React.useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const loadPeriods = React.useCallback(async () => {
    try {
      const [periodRes, accountRes, remediationRes] = await Promise.all([
        apiFetch('/accounting/periods'),
        apiFetch('/accounting/accounts'),
        apiFetch('/accounting/accounts/remediation'),
      ]);
      if (periodRes.ok) {
        setPeriods(await periodRes.json());
      }
      if (accountRes.ok) {
        const accountData = await accountRes.json();
        setAccounts(Array.isArray(accountData) ? accountData : []);
      }
      if (remediationRes.ok) {
        const remediationData = await remediationRes.json();
        setRemediationStates(Array.isArray(remediationData) ? remediationData : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReadiness = React.useCallback(async (year: number, month: number) => {
    try {
      const res = await apiFetch(`/accounting/periods/close-readiness?year=${year}&month=${month}`);
      if (res.ok) {
        setReadiness(await res.json());
      }
    } catch (err) {
      console.error('Failed to load close readiness:', err);
      setReadiness(null);
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) loadPeriods();
  }, [isAuthenticated, loadPeriods]);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadReadiness(form.year, form.month);
    }
  }, [isAuthenticated, form.year, form.month, loadReadiness]);

  const reportingCertification = React.useMemo<ReportingCertificationPosture>(() => {
    const postingAccounts = accounts.filter((account) => !account.is_header);
    const mappedCount = postingAccounts.filter((account) => hasValidFsPlacement(account)).length;
    const unmappedCount = postingAccounts.filter((account) => !account.fs_placement).length;
    const invalidCount = postingAccounts.filter((account) => account.fs_placement && !hasValidFsPlacement(account)).length;
    const missingOwnerCount = postingAccounts.filter((account) => !account.account_owner_id).length;
    const restrictedNoOwnerCount = postingAccounts.filter(
      (account) => (account.sensitivity_tier === 'T1' || account.sensitivity_tier === 'T2') && !account.account_owner_id,
    ).length;
    const dailyCadenceCount = postingAccounts.filter((account) => getRecommendedCadence(account) === 'Daily').length;
    const coveragePercent = postingAccounts.length ? Math.round((mappedCount / postingAccounts.length) * 100) : 0;

    const messages: string[] = [];
    if (invalidCount > 0) messages.push(`${invalidCount} posting accounts have invalid financial-statement placement.`);
    if (unmappedCount > 0) messages.push(`${unmappedCount} posting accounts are still missing financial-statement placement.`);
    if (restrictedNoOwnerCount > 0) messages.push(`${restrictedNoOwnerCount} restricted accounts have no assigned owner.`);
    if (missingOwnerCount > 0 && restrictedNoOwnerCount === 0) messages.push(`${missingOwnerCount} posting accounts still need owner assignment.`);
    if (dailyCadenceCount > 0) messages.push(`${dailyCadenceCount} accounts are on a daily reconciliation cadence and should be reviewed before certifying reports.`);

    const blockers = invalidCount + unmappedCount;
    const canCertify = blockers === 0 && restrictedNoOwnerCount === 0;

    return {
      postingCount: postingAccounts.length,
      coveragePercent,
      blockers,
      unmappedCount,
      invalidCount,
      missingOwnerCount,
      restrictedNoOwnerCount,
      dailyCadenceCount,
      canCertify,
      messages,
    };
  }, [accounts]);

  const remediationPosture = React.useMemo(() => {
    const openStates = remediationStates.filter((state) => state.status === 'open' || state.status === 'reviewed');
    const acknowledged = openStates.filter((state) => state.status === 'reviewed');
    const now = Date.now();
    const longStandingCount = openStates.filter((state) => {
      const firstSeen = new Date(state.first_seen_at);
      return !Number.isNaN(firstSeen.getTime()) && now - firstSeen.getTime() > 1000 * 60 * 60 * 24 * 30;
    }).length;
    const newestCount = openStates.filter((state) => {
      const firstSeen = new Date(state.first_seen_at);
      return !Number.isNaN(firstSeen.getTime()) && now - firstSeen.getTime() <= 1000 * 60 * 60 * 24 * 7;
    }).length;
    return {
      openCount: openStates.length,
      acknowledgedCount: acknowledged.length,
      longStandingCount,
      newestCount,
      topIssue: openStates[0] || null,
    };
  }, [remediationStates]);

  const canClosePeriod = !!readiness?.can_close && confirmed && reportingCertification.canCertify;

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) {
      setMessage('Please confirm the close checklist before locking the period.');
      return;
    }
    if (!reportingCertification.canCertify) {
      setMessage('Reporting certification is blocked. Resolve COA mapping or ownership gaps before closing the period.');
      return;
    }
    if (!readiness?.can_close) {
      setMessage('Resolve draft journals before closing the period.');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      const res = await apiFetch('/accounting/periods/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setMessage('Period closed successfully.');
        setConfirmed(false);
        await loadPeriods();
        await loadReadiness(form.year, form.month);
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to close period.');
      }
    } catch {
      setMessage('Connection error while closing the period.');
    } finally {
      setSaving(false);
    }
  };

  const activePeriod = [...periods].sort((a, b) => (b.year - a.year) || (b.month - a.month))[0];

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8">
      <Link href="/accounting" className="flex items-center gap-2 text-slate-500 hover:text-brand-navy mb-2 transition-colors text-sm font-bold">
        <ChevronLeft size={16} />
        Back to Accounting
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8">
        <div className="bg-brand-navy text-white rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              <Lock size={12} />
              Close Workflow
            </div>
            <h1 className="text-3xl font-heading mb-3">Period Close</h1>
            <p className="text-white/70 leading-relaxed">
              Lock the month when journals, AP, AR, and bank activity are reconciled. Closed periods stay readable but no longer accept new posting.
            </p>
            <div className="mt-6 rounded-3xl bg-white/10 p-4 text-sm text-white/80 border border-white/10">
              {readiness
                ? reportingCertification.canCertify
                  ? readiness.can_close
                    ? 'Ready to close: journals are controlled and reporting structure is currently certifiable.'
                    : `${readiness.draftEntries} draft journal entries still need attention before closing.`
                  : 'Do not certify reporting yet: COA mapping or ownership gaps are still material for this period.'
                : 'Loading close readiness...'}
            </div>
          </div>
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-brand-gold/10 rounded-full blur-3xl"></div>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-heading text-brand-navy">Close the Current Period</h2>
              <p className="text-sm text-slate-500">Select the month you want to lock.</p>
            </div>
            <CalendarDays className="text-brand-gold" />
          </div>

          <form onSubmit={handleClose} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Year">
              <input
                type="number"
                min={2000}
                max={2100}
                value={form.year}
                onChange={(e) => setForm((prev) => ({ ...prev, year: Number(e.target.value) }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white"
              />
            </Field>
            <Field label="Month">
              <input
                type="number"
                min={1}
                max={12}
                value={form.month}
                onChange={(e) => setForm((prev) => ({ ...prev, month: Number(e.target.value) }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white"
              />
            </Field>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
              <Metric label="Draft journals" value={readiness?.draftEntries ?? 0} tone={readiness?.draftEntries ? 'rose' : 'emerald'} />
              <Metric label="Posted journals" value={readiness?.postedEntries ?? 0} tone="navy" />
              <Metric label="Reversed journals" value={readiness?.reversedEntries ?? 0} tone="slate" />
              <Metric label="Bank statements" value={readiness?.bankStatements ?? 0} tone="gold" />
            </div>

            <div className="md:col-span-2 rounded-3xl border border-slate-100 bg-slate-50/70 p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400">Reporting certification</div>
                  <h3 className="mt-2 text-lg font-heading text-brand-navy">Statement-readiness blockers</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Period close is now tied to reporting trustworthiness, owner accountability, and high-frequency reconciliation posture.
                  </p>
                </div>
                <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  reportingCertification.canCertify
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}>
                  {reportingCertification.canCertify ? 'Can certify reporting' : 'Cannot certify reporting'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
                <Metric label="Mapped %" value={reportingCertification.coveragePercent} tone={reportingCertification.blockers === 0 ? 'emerald' : 'gold'} />
                <Metric label="Unmapped" value={reportingCertification.unmappedCount} tone={reportingCertification.unmappedCount ? 'rose' : 'emerald'} />
                <Metric label="Invalid mapping" value={reportingCertification.invalidCount} tone={reportingCertification.invalidCount ? 'rose' : 'emerald'} />
                <Metric label="No owner" value={reportingCertification.missingOwnerCount} tone={reportingCertification.missingOwnerCount ? 'gold' : 'emerald'} />
                <Metric label="Daily cadence" value={reportingCertification.dailyCadenceCount} tone="navy" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                <Metric label="COA open" value={remediationPosture.openCount} tone={remediationPosture.openCount > 0 ? 'gold' : 'emerald'} />
                <Metric label="Acknowledged" value={remediationPosture.acknowledgedCount} tone={remediationPosture.acknowledgedCount > 0 ? 'navy' : 'emerald'} />
                <Metric label="New this week" value={remediationPosture.newestCount} tone={remediationPosture.newestCount > 0 ? 'gold' : 'emerald'} />
                <Metric label="30d+ open" value={remediationPosture.longStandingCount} tone={remediationPosture.longStandingCount > 0 ? 'rose' : 'emerald'} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                <Metric
                  label="Required packs"
                  value={readiness?.reporting_certification?.required_count ?? 0}
                  tone="navy"
                />
                <Metric
                  label="Certified packs"
                  value={readiness?.reporting_certification?.certified_count ?? 0}
                  tone={(readiness?.reporting_certification?.blocking_count ?? 0) === 0 ? 'emerald' : 'gold'}
                />
                <Metric
                  label="Blocking packs"
                  value={readiness?.reporting_certification?.blocking_count ?? 0}
                  tone={(readiness?.reporting_certification?.blocking_count ?? 0) > 0 ? 'rose' : 'emerald'}
                />
                <div className={`rounded-2xl border px-4 py-3 ${
                  readiness?.reporting_certification?.can_close_reporting
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : 'bg-rose-50 text-rose-600 border-rose-100'
                }`}>
                  <div className="text-[10px] uppercase tracking-widest opacity-80">Close posture</div>
                  <div className="text-xl font-bold">
                    {readiness?.reporting_certification?.can_close_reporting ? 'Ready' : 'Blocked'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
                <div className={`rounded-2xl border px-4 py-4 text-sm ${
                  reportingCertification.canCertify ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-rose-100 bg-rose-50 text-rose-700'
                }`}>
                  <div className="flex items-center gap-2 font-bold mb-2">
                    {reportingCertification.canCertify ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    {reportingCertification.canCertify ? 'Certification posture' : 'Certification blockers'}
                  </div>
                  {reportingCertification.messages.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {reportingCertification.messages.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <div>COA mapping, ownership, and reconciliation accountability are currently strong enough to support reporting signoff.</div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 text-sm text-slate-600">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Discipline link</div>
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold text-brand-navy">Reports:</span>{' '}
                      <Link href="/accounting/reports" className="text-brand-gold hover:underline">Financial Reports</Link>
                    </p>
                    <p>
                      <span className="font-semibold text-brand-navy">COA:</span>{' '}
                      <Link href="/accounting/chart-of-accounts" className="text-brand-gold hover:underline">Chart of Accounts</Link>
                    </p>
                    <p><span className="font-semibold text-brand-navy">Focus:</span> Close only when journal control and reporting structure are both clean.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 text-sm text-slate-600">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-400">COA backlog posture</div>
                    <div className="mt-2 text-lg font-heading text-brand-navy">Remediation discipline for close</div>
                  </div>
                  <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                    remediationPosture.longStandingCount > 0
                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : remediationPosture.acknowledgedCount > 0
                        ? 'border-sky-200 bg-sky-50 text-sky-700'
                        : remediationPosture.openCount > 0
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  }`}>
                    {remediationPosture.longStandingCount > 0
                      ? 'Aged COA blockers'
                      : remediationPosture.acknowledgedCount > 0
                        ? 'Acknowledged COA items'
                        : remediationPosture.openCount > 0
                          ? 'Open COA cleanup'
                          : 'Healthy COA posture'}
                  </div>
                </div>

                <div className="mt-3 text-sm">
                  {remediationPosture.topIssue?.account
                    ? `${remediationPosture.topIssue.account.code} · ${remediationPosture.topIssue.account.name} is the leading remediation item affecting COA hygiene for this close cycle.`
                    : 'No active COA remediation items are currently open.'}
                </div>

                {remediationPosture.topIssue ? (
                  <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-3 text-xs text-slate-500">
                    First seen {formatDateTime(remediationPosture.topIssue.first_seen_at)}
                    {remediationPosture.topIssue.reviewed_at ? ` · reviewed ${formatDateTime(remediationPosture.topIssue.reviewed_at)}` : ''}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/accounting/chart-of-accounts"
                    className="inline-flex items-center justify-center rounded-2xl bg-brand-navy px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-brand-navy/90"
                  >
                    Open COA backlog
                  </Link>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-500">
                    Use the COA backlog filters to separate new, acknowledged, and long-standing issues before final close signoff.
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-400">Period-level certification summary</div>
                    <div className="mt-2 text-lg font-heading text-brand-navy">Required report packs</div>
                  </div>
                  <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                    readiness?.reporting_certification?.can_close_reporting
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-rose-200 bg-rose-50 text-rose-700'
                  }`}>
                    {readiness?.reporting_certification?.can_close_reporting ? 'All required packs certified' : 'Close blocked by report signoff'}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                  <div className="space-y-3">
                    {readiness?.reporting_certification?.packs?.map((pack) => (
                      <div key={pack.report_type} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-brand-navy">{getReportLabel(pack.report_type)}</div>
                            <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                              {pack.report_type.toUpperCase()} pack
                            </div>
                          </div>
                          <div className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${
                            pack.status === 'certified'
                              ? 'bg-emerald-50 text-emerald-700'
                              : pack.status === 'pending_secondary_signoff'
                                ? 'bg-brand-gold/10 text-brand-gold'
                                : pack.status === 'stale'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-rose-50 text-rose-700'
                          }`}>
                            {pack.status.replaceAll('_', ' ')}
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          {pack.completed_signoffs} of {pack.required_signoffs} signoffs complete
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_auto]">
                          <div className="space-y-2">
                            <div className="rounded-2xl bg-white px-3 py-3 text-xs text-slate-600">
                              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Certified by</div>
                              <div className="mt-1 font-medium text-brand-navy">
                                {pack.certification?.certifier
                                  ? `${pack.certification.certifier.first_name} ${pack.certification.certifier.last_name}`
                                  : 'No primary signoff yet'}
                              </div>
                              {pack.certification?.certified_at ? (
                                <div className="mt-1 text-slate-500">
                                  {new Date(pack.certification.certified_at).toLocaleString('en-ZA')}
                                </div>
                              ) : null}
                            </div>
                            {pack.required_signoffs > 1 ? (
                              <div className="rounded-2xl bg-white px-3 py-3 text-xs text-slate-600">
                                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Secondary signoff</div>
                                <div className="mt-1 font-medium text-brand-navy">
                                  {pack.certification?.secondary_certifier
                                    ? `${pack.certification.secondary_certifier.first_name} ${pack.certification.secondary_certifier.last_name}`
                                    : 'Awaiting secondary reviewer'}
                                </div>
                                {pack.certification?.secondary_certified_at ? (
                                  <div className="mt-1 text-slate-500">
                                    {new Date(pack.certification.secondary_certified_at).toLocaleString('en-ZA')}
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>

                          <div className="flex flex-col gap-2">
                            <Link
                              href={getReportWorkspaceHref(pack, form.year, form.month)}
                              className="inline-flex items-center justify-center rounded-2xl bg-brand-navy px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-brand-navy/90"
                            >
                              {getPackActionLabel(pack)}
                            </Link>
                            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-500">
                              Open the exact report workspace for certification, recertification, or signoff completion.
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 rounded-2xl border border-slate-100 bg-white px-3 py-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Signoff timeline</div>
                          <div className="mt-3 space-y-2">
                            {pack.certification?.audits?.length ? (
                              pack.certification.audits.slice(0, 3).map((audit) => (
                                <div key={audit.id} className="rounded-2xl bg-slate-50 px-3 py-3 text-xs text-slate-600">
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="font-bold uppercase tracking-[0.12em] text-brand-navy">{audit.action.replaceAll('_', ' ')}</span>
                                    <span className="text-slate-400">{new Date(audit.created_at).toLocaleString('en-ZA')}</span>
                                  </div>
                                  <div className="mt-1">
                                    {audit.actor
                                      ? `${audit.actor.first_name} ${audit.actor.last_name}`
                                      : 'System workflow'}
                                  </div>
                                  {audit.notes ? <div className="mt-2 text-slate-500">{audit.notes}</div> : null}
                                </div>
                              ))
                            ) : (
                              <div className="rounded-2xl bg-slate-50 px-3 py-3 text-slate-500">
                                No signoff history recorded for this pack yet.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-slate-500">
                        No report certification data loaded for this period yet.
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                    <div className="text-sm font-semibold text-brand-navy">Close blockers from reporting</div>
                    <div className="mt-3 space-y-2">
                      {readiness?.reporting_certification?.messages?.length ? (
                        readiness.reporting_certification.messages.map((message, index) => (
                          <div key={index} className="rounded-2xl bg-white px-3 py-3">
                            {message}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl bg-white px-3 py-3 text-emerald-700">
                          Required report certifications are complete for this period.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 rounded-3xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <ShieldCheck size={14} />
                Close checklist
              </div>
              <label className="flex items-start gap-3 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-navy focus:ring-brand-gold"
                />
                <span>
                  I have reviewed the draft journals, posted activity, bank reconciliation status, and reporting-certification posture for this period.
                </span>
              </label>
              {readiness?.blockers?.length ? (
                <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-rose-600 text-sm">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <AlertTriangle size={16} />
                    Close blockers
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {readiness.blockers.map((blocker, index) => (
                      <li key={index}>{blocker}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-emerald-600 text-sm">
                  No blockers detected for this period.
                </div>
              )}
            </div>

            <div className="md:col-span-2 flex items-center justify-between gap-4 pt-2">
              <span className="text-sm text-slate-500">
                {message || (activePeriod ? `Latest tracked period: ${activePeriod.month}/${activePeriod.year} (${activePeriod.status})` : 'No periods tracked yet.')}
              </span>
              <button
                type="submit"
                disabled={saving || !canClosePeriod}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-navy text-white font-bold shadow-xl disabled:opacity-60"
              >
                <CheckCircle2 size={18} />
                {saving ? 'Closing...' : 'Close Period'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-heading text-brand-navy">Period Register</h2>
            <p className="text-sm text-slate-500">Open and closed periods by month.</p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{periods.length} periods</span>
        </div>

        {loading ? (
          <div className="text-sm italic text-slate-400">Loading periods...</div>
        ) : periods.length === 0 ? (
          <div className="text-sm italic text-slate-400">No periods have been tracked yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {periods.map((period) => (
              <div key={period.id} className="rounded-3xl border border-slate-100 bg-slate-50/60 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-brand-navy">{period.month}/{period.year}</h3>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full ${period.status === 'closed' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {period.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {period.status === 'closed' ? `Closed on ${period.closed_at ? new Date(period.closed_at).toLocaleDateString() : 'unknown date'}` : 'Open for posting'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-xs font-black uppercase tracking-widest text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'rose' | 'emerald' | 'navy' | 'slate' | 'gold';
}) {
  const toneClasses = {
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    navy: 'bg-slate-50 text-brand-navy border-slate-100',
    slate: 'bg-slate-50 text-slate-500 border-slate-100',
    gold: 'bg-amber-50 text-amber-700 border-amber-100',
  }[tone];

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClasses}`}>
      <div className="text-[10px] uppercase tracking-widest opacity-80">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
