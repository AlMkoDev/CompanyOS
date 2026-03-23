"use client";

import React from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { 
  Calculator, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  FileText, 
  Upload,
  PieChart,
  History
} from 'lucide-react';
import Link from 'next/link';

interface TrialBalanceRow {
  code: string;
  name: string;
  debit: number;
  credit: number;
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

  React.useEffect(() => {
    const fetchAccountingData = async () => {
      try {
        const res = await apiFetch('/accounting/trial-balance');
        if (res.ok) {
          const data = await res.json();
          setTb(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch accounting data:', err);
      }
    };

    if (isAuthenticated) fetchAccountingData();
  }, [isAuthenticated]);

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading text-brand-navy">Accounting Dashboard</h1>
          <p className="text-slate-500">Manage your general ledger, journals, and financial reports.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/accounting/bank-import" className="btn-secondary flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-slate-50 transition-all text-sm font-bold">
            <Upload size={16} />
            Import CSV
          </Link>
          <Link href="/accounting/journal" className="btn-primary bg-brand-navy text-white flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-brand-navy/90 transition-all shadow-lg text-sm font-bold">
            <Plus size={16} />
            New Journal
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Cash" 
          value="R 1,240,000" 
          change="+12%" 
          isPositive={true} 
          icon={<Calculator className="text-emerald-600" />} 
        />
        <StatCard 
          label="Accounts Receivable" 
          value="R 450,000" 
          change="+5%" 
          isPositive={true} 
          icon={<ArrowUpRight className="text-blue-600" />} 
        />
        <StatCard 
          label="Accounts Payable" 
          value="R 180,000" 
          change="-2%" 
          isPositive={false} 
          icon={<ArrowDownLeft className="text-rose-600" />} 
        />
        <StatCard 
          label="Net Profit (YTD)" 
          value="R 850,000" 
          change="+18%" 
          isPositive={true} 
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
              <p className="text-xs text-slate-500 mb-4">The previous period (February 2026) is open for adjustments.</p>
              <button className="w-full py-3 bg-brand-navy text-white rounded-xl text-xs font-bold hover:bg-brand-navy/90 transition-all shadow-md">
                Lock Period & Close
              </button>
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
