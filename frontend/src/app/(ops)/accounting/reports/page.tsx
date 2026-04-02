"use client";

import React from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { 
  PieChart, 
  FileText, 
  Columns, 
  Download, 
  ChevronLeft,
  Calendar,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Suspense } from 'react';

type ReportType = 'pnl' | 'bs' | 'tb';

type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

interface GLAccount {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  fs_placement?: string | null;
  is_header?: boolean;
}

interface ProfitAndLossReport {
  totalRevenue?: number;
  totalExpense?: number;
  netProfit?: number;
}

interface TrialBalanceRow {
  code: string;
  name: string;
  debit: number;
  credit: number;
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

interface ReportHeaderProps {
  title: string;
  periodLabel: string;
  companyName: string;
}

interface PnLViewProps {
  data: ProfitAndLossReport;
  accounts: GLAccount[];
}

interface TrialBalanceViewProps {
  data: TrialBalanceRow[];
}

interface BalanceSheetRow {
  type: string;
  name: string;
  balance: number;
}

interface BalanceSheetViewProps {
  data: BalanceSheetRow[];
  accounts: GLAccount[];
}

interface FinancialRowProps {
  label: string;
  value?: number;
  indent?: boolean;
  note?: string;
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

function getPlacementAccountCount(accounts: GLAccount[], placements: string[]) {
  return accounts.filter(
    (account) => !account.is_header && !!account.fs_placement && placements.includes(account.fs_placement),
  ).length;
}

function ReportsContent() {
  const searchParams = useSearchParams();
  const initialType = (searchParams.get('type') as ReportType | null) || 'pnl';
  const currentYear = new Date().getFullYear();
  const defaultFromDate = `${currentYear}-01-01`;
  const defaultToDate = `${currentYear}-12-31`;
  
  const { isAuthenticated, user } = useAuthStore();
  const [reportType, setReportType] = React.useState(initialType);
  const [fromDate, setFromDate] = React.useState(() => normalizeDate(searchParams.get('fromDate')) || defaultFromDate);
  const [toDate, setToDate] = React.useState(() => normalizeDate(searchParams.get('toDate')) || defaultToDate);
  const [data, setData] = React.useState<ProfitAndLossReport | TrialBalanceRow[] | BalanceSheetRow[] | null>(null);
  const [accounts, setAccounts] = React.useState<GLAccount[]>([]);
  const [loading, setLoading] = React.useState(false);
  const companyName = user?.company?.name || 'Current Company';

  const periodLabel = React.useMemo(() => {
    if (reportType === 'pnl') {
      return `${formatDisplayDate(fromDate)} — ${formatDisplayDate(toDate)}`;
    }

    return `As of ${formatDisplayDate(toDate)}`;
  }, [fromDate, reportType, toDate]);

  const reportingReadiness = React.useMemo(() => {
    const postingAccounts = accounts.filter((account) => !account.is_header);
    const mapped = postingAccounts.filter((account) => hasValidFsPlacement(account));
    const unmapped = postingAccounts.filter((account) => !account.fs_placement);
    const invalid = postingAccounts.filter((account) => account.fs_placement && !hasValidFsPlacement(account));

    return {
      postingCount: postingAccounts.length,
      mappedCount: mapped.length,
      unmappedCount: unmapped.length,
      invalidCount: invalid.length,
      coveragePercent: postingAccounts.length ? Math.round((mapped.length / postingAccounts.length) * 100) : 0,
      blockers: invalid.length + unmapped.length,
      invalidAccounts: invalid.slice(0, 3),
      unmappedAccounts: unmapped.slice(0, 3),
    };
  }, [accounts]);

  const fetchReport = React.useCallback(async () => {
    setLoading(true);
    try {
      let path = '';
      if (reportType === 'pnl') {
        const params = new URLSearchParams({ fromDate, toDate });
        path = `/accounting/reports/pnl?${params.toString()}`;
      } else if (reportType === 'bs') {
        const params = new URLSearchParams({ toDate });
        path = `/accounting/reports/balance-sheet?${params.toString()}`;
      } else {
        const params = new URLSearchParams({ toDate });
        path = `/accounting/trial-balance?${params.toString()}`;
      }

      const [reportRes, accountsRes] = await Promise.all([
        apiFetch(path),
        apiFetch('/accounting/accounts'),
      ]);

      if (reportRes.ok) setData(await reportRes.json());
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        setAccounts(Array.isArray(accountsData) ? accountsData : []);
      }
    } catch (err) {
      console.error('Failed to fetch report:', err);
    } finally {
      setLoading(false);
    }
  }, [fromDate, reportType, toDate]);

  React.useEffect(() => {
    if (isAuthenticated) fetchReport();
  }, [fetchReport, isAuthenticated]);

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/accounting" className="p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-slate-500">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-heading text-brand-navy font-bold">Financial Reporting</h1>
            <p className="text-slate-500 text-sm">Real-time financial performance indicators.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-brand-navy text-white rounded-2xl font-bold text-sm shadow-xl hover:scale-105 transition-all">
          <Download size={18} />
          Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
          From
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-brand-navy outline-none transition-all focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
          To
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-brand-navy outline-none transition-all focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
          />
        </label>
        <button
          type="button"
          onClick={fetchReport}
          className="self-end flex items-center justify-center gap-2 rounded-2xl bg-brand-navy px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-brand-navy/90"
        >
          <RefreshCw size={16} />
          Refresh Report
        </button>
      </div>

      {/* Report Switcher */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl self-start">
        <TabButton 
          active={reportType === 'pnl'} 
          onClick={() => setReportType('pnl')} 
          icon={<FileText size={16} />} 
          label="Profit & Loss" 
        />
        <TabButton 
          active={reportType === 'bs'} 
          onClick={() => setReportType('bs')} 
          icon={<PieChart size={16} />} 
          label="Balance Sheet" 
        />
        <TabButton 
          active={reportType === 'tb'} 
          onClick={() => setReportType('tb')} 
          icon={<Columns size={16} />} 
          label="Trial Balance" 
        />
      </div>

      <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">COA readiness</div>
            <h2 className="mt-2 text-2xl font-heading text-brand-navy">Reporting readiness blockers</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              These cues come from the chart of accounts itself, so finance can tell whether statement output is structurally trustworthy before treating the report as final.
            </p>
          </div>
          <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
            reportingReadiness.invalidCount > 0
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : reportingReadiness.unmappedCount > 0
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}>
            {reportingReadiness.coveragePercent}% mapped · {reportingReadiness.blockers} blockers
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ReadinessMetric label="Posting accounts" value={String(reportingReadiness.postingCount)} />
          <ReadinessMetric label="Mapped" value={String(reportingReadiness.mappedCount)} />
          <ReadinessMetric label="Unmapped" value={String(reportingReadiness.unmappedCount)} />
          <ReadinessMetric label="Invalid mapping" value={String(reportingReadiness.invalidCount)} />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4">
            <div className="text-sm font-semibold text-brand-navy">Unmapped posting accounts</div>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              {reportingReadiness.unmappedAccounts.length === 0 ? (
                <div className="text-slate-500">No unmapped posting accounts are blocking report structure right now.</div>
              ) : (
                reportingReadiness.unmappedAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-3">
                    <span className="font-medium text-brand-navy">{account.code} · {account.name}</span>
                    <span className="text-xs uppercase tracking-[0.16em] text-amber-600">{account.type}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4">
            <div className="text-sm font-semibold text-brand-navy">Invalid statement placements</div>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              {reportingReadiness.invalidAccounts.length === 0 ? (
                <div className="text-slate-500">No invalid account placements are currently weakening report structure.</div>
              ) : (
                reportingReadiness.invalidAccounts.map((account) => (
                  <div key={account.id} className="rounded-2xl bg-white px-3 py-3">
                    <div className="font-medium text-brand-navy">{account.code} · {account.name}</div>
                    <div className="mt-1 text-xs text-rose-600">
                      {account.fs_placement} does not align with {account.type} accounts.
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl p-10 min-h-[600px]">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400 font-heading text-lg">
            Generating Report Intelligence...
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <ReportHeader
              title={reportType === 'pnl' ? 'Income Statement (P&L)' : reportType === 'bs' ? 'Balance Sheet' : 'Trial Balance'}
              periodLabel={periodLabel}
              companyName={companyName}
            />
            
            {reportType === 'pnl' && data && !Array.isArray(data) && <PnLView data={data} accounts={accounts} />}
            {reportType === 'tb' && Array.isArray(data) && <TrialBalanceView data={data as unknown as TrialBalanceRow[]} />}
            {reportType === 'bs' && Array.isArray(data) && <BalanceSheetView data={data as unknown as BalanceSheetRow[]} accounts={accounts} />}
            
            {!data && <div className="text-center py-20 text-slate-400 italic">No data available for the selected period.</div>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center animate-pulse text-slate-400">Loading Report Configuration...</div>}>
      <ReportsContent />
    </Suspense>
  );
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-sm ${
        active ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-500 hover:text-brand-navy'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ReportHeader({ title, periodLabel, companyName }: ReportHeaderProps) {
  return (
    <div className="border-b-2 border-slate-50 pb-8 mb-10 flex justify-between items-end">
      <div>
        <h2 className="text-4xl font-heading text-brand-navy mb-2">{title}</h2>
        <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] tracking-[0.2em] uppercase">
          <Calendar size={12} className="text-brand-gold" />
          Period: {periodLabel}
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs font-black text-slate-300 uppercase tracking-widest mb-1">Company OS</div>
        <div className="text-xs font-bold text-brand-navy">{companyName}</div>
      </div>
    </div>
  );
}

function PnLView({ data, accounts }: PnLViewProps) {
  const revenueMappedCount = getPlacementAccountCount(accounts, ['Revenue', 'Other Income']);
  const expenseMappedCount = getPlacementAccountCount(accounts, ['Cost of Sales', 'Operating Expenses', 'Other Expense', 'Tax']);

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <div>
         <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-50 pb-2">Revenue</h3>
         <FinancialRow label="Sales Revenue" value={data.totalRevenue} note={`${revenueMappedCount} COA revenue accounts mapped into statement structure`} />
         <div className="border-t-2 border-brand-navy/10 mt-4 pt-4 flex justify-between font-heading text-xl text-brand-navy">
            <span>Total Revenue</span>
            <span>R {data.totalRevenue?.toLocaleString()}</span>
         </div>
      </div>

      <div>
         <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-50 pb-2">Operating Expenses</h3>
         <FinancialRow label="Operational Costs" value={data.totalExpense} indent note={`${expenseMappedCount} COA expense accounts mapped into statement structure`} />
         <div className="border-t-2 border-brand-navy/10 mt-4 pt-4 flex justify-between font-heading text-xl text-brand-navy">
            <span>Total Expenses</span>
            <span>(R {data.totalExpense?.toLocaleString()})</span>
         </div>
      </div>

      <div className="bg-brand-gold/10 p-8 rounded-3xl border border-brand-gold/20 flex justify-between items-center">
         <div>
            <span className="text-xs font-black text-brand-gold uppercase tracking-widest block mb-1">Bottom Line</span>
            <h3 className="text-3xl font-heading text-brand-navy">Net Operating Income</h3>
         </div>
         <div className="text-4xl font-heading text-brand-navy font-bold">
            R {data.netProfit?.toLocaleString()}
         </div>
      </div>
    </div>
  );
}

function TrialBalanceView({ data }: TrialBalanceViewProps) {
  return (
    <div className="space-y-6">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <th className="py-4 px-4 w-1/2">General Ledger Account</th>
            <th className="py-4 px-4 text-right">Debit Balance</th>
            <th className="py-4 px-4 text-right">Credit Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
              <td className="py-4 px-4">
                <div className="font-bold text-slate-700">{row.name}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{row.code}</div>
              </td>
              <td className="py-4 px-4 text-right font-mono text-sm text-slate-600">
                {row.debit > 0 ? `R ${row.debit.toLocaleString()}` : '—'}
              </td>
              <td className="py-4 px-4 text-right font-mono text-sm text-slate-600">
                {row.credit > 0 ? `R ${row.credit.toLocaleString()}` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
           <tr className="bg-slate-50/50 font-heading text-lg">
              <td className="py-6 px-4 text-brand-navy font-bold">Totals</td>
              <td className="py-6 px-4 text-right text-brand-navy font-bold">
                R {data.reduce((sum, row) => sum + row.debit, 0).toLocaleString()}
              </td>
              <td className="py-6 px-4 text-right text-brand-navy font-bold">
                R {data.reduce((sum, row) => sum + row.credit, 0).toLocaleString()}
              </td>
           </tr>
        </tfoot>
      </table>
    </div>
  );
}

function BalanceSheetView({ data, accounts }: BalanceSheetViewProps) {
  const grouped = data.reduce<Record<string, BalanceSheetRow[]>>((acc, row) => {
    const key = row.type || 'other';
    acc[key] = acc[key] || [];
    acc[key].push(row);
    return acc;
  }, {});

  const typeConfig = (type: string) => {
    if (type === 'asset') return { label: 'Assets', placements: ['Current Assets', 'Non-current Assets'] };
    if (type === 'liability') return { label: 'Liabilities', placements: ['Current Liabilities', 'Non-current Liabilities'] };
    if (type === 'equity') return { label: 'Equity', placements: ['Equity'] };
    return { label: 'Other', placements: [] as string[] };
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      {Object.entries(grouped).map(([type, rows]) => (
        <div key={type}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">{typeConfig(type).label}</h3>
            <span className="text-[10px] uppercase font-bold text-slate-400">{rows.length} accounts</span>
          </div>
          <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            {typeConfig(type).placements.length > 0
              ? `${getPlacementAccountCount(accounts, typeConfig(type).placements)} COA accounts are mapped into ${typeConfig(type).placements.join(' / ')}.`
              : 'No direct COA placement guidance is currently defined for this bucket.'}
          </div>
          <div className="bg-slate-50/70 rounded-3xl border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="py-4 px-5">Account</th>
                  <th className="py-4 px-5 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={`${type}-${row.name}`} className="text-sm">
                    <td className="py-4 px-5 font-medium text-slate-700">{row.name}</td>
                    <td className="py-4 px-5 text-right font-mono text-brand-navy">
                      R {Math.abs(row.balance).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

function FinancialRow({ label, value, indent = false, note }: FinancialRowProps) {
  return (
    <div className={`flex justify-between gap-4 py-3 ${indent ? 'pl-8' : ''} text-slate-600 font-medium`}>
      <div>
        <span>{label}</span>
        {note ? <div className="mt-1 text-xs font-normal text-slate-400">{note}</div> : null}
      </div>
      <span className="font-mono">R {value?.toLocaleString() || '0'}</span>
    </div>
  );
}

function ReadinessMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-heading text-brand-navy">{value}</div>
    </div>
  );
}

function normalizeDate(value: string | null) {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : value.slice(0, 10);
}

function formatDisplayDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
