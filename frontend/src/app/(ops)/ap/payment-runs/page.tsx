"use client";

import React from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { 
  CreditCard, 
  Download, 
  CheckCircle2, 
  ChevronLeft,
  FileSpreadsheet,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface PaymentRun {
  id: string;
  status: string;
  run_date: string;
  total_amount: number | string;
}

interface PaymentRunsResponse {
  recentPaymentRuns?: PaymentRun[];
}

export default function PaymentRunsPage() {
  const { isAuthenticated } = useAuthStore();
  const [runs, setRuns] = React.useState<PaymentRun[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchRuns = React.useCallback(async () => {
    try {
      const res = await apiFetch('/ap/dashboard');
      if (res.ok) {
        const data: PaymentRunsResponse = await res.json();
        setRuns(data.recentPaymentRuns || []);
      }
    } catch (err) {
      console.error('Failed to fetch payment runs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) fetchRuns();
  }, [fetchRuns, isAuthenticated]);

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/ap" className="p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-slate-500">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-heading text-brand-navy font-bold">Payment Orchestration</h1>
            <p className="text-slate-500 text-sm">Review, approve, and execute bulk payment runs.</p>
          </div>
        </div>
        <button 
          className="flex items-center gap-2 px-8 py-4 bg-brand-gold text-brand-navy rounded-[24px] font-heading text-lg shadow-xl shadow-brand-gold/20 hover:scale-105 transition-all"
        >
          <CreditCard size={20} />
          Initiate New Run
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active/Recent Runs */}
        <div className="lg:col-span-2 space-y-6">
           {runs.map((run) => (
              <div key={run.id} className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm hover:shadow-2xl transition-all group flex flex-col md:flex-row gap-8 items-center">
                 <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center shrink-0">
                    <FileSpreadsheet size={32} className="text-brand-navy" />
                 </div>
                 <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                       <h3 className="text-xl font-heading text-brand-navy">Run #{run.id.slice(0, 8).toUpperCase()}</h3>
                       <StatusBadge status={run.status} />
                    </div>
                    <p className="text-slate-400 text-sm mb-4">Executed on {new Date(run.run_date).toLocaleDateString()} — Includes 12 Invoices</p>
                    <div className="text-2xl font-heading text-brand-navy font-bold">R {Number(run.total_amount).toLocaleString()}</div>
                 </div>
                 <div className="flex gap-3">
                    <button className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-brand-navy hover:shadow-md transition-all">
                       <Download size={20} />
                    </button>
                    <button className="px-6 py-4 bg-brand-navy text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-all">
                       View Details
                    </button>
                 </div>
              </div>
           ))}
           {runs.length === 0 && !loading && (
              <div className="py-20 text-center bg-white border border-slate-100 rounded-[40px] border-dashed">
                 <p className="text-slate-400 italic">No payment runs found in your history.</p>
              </div>
           )}
        </div>

        {/* Action Panel: Bank Connectivity */}
        <div className="space-y-8">
           <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm relative overflow-hidden">
              <h3 className="text-xl font-heading text-brand-navy mb-8">Bank Connectivity</h3>
              <div className="space-y-8">
                 <BankStatus system="FNB Business" status="Connected" color="bg-brand-gold" />
                 <BankStatus system="Standard Bank" status="Standby" color="bg-emerald-500" />
                 
                 <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                       <AlertCircle size={18} className="text-brand-gold" />
                       <span className="text-xs font-bold text-slate-700">Security Requirement</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">Runs exceeding R 500,000 require dual-authorization from both the Finance Director and CFO.</p>
                 </div>

                 <button className="w-full py-5 bg-brand-navy/5 text-brand-navy rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand-navy/10 transition-all">
                    Configure Gateway
                    <ArrowRight size={16} />
                 </button>
              </div>
           </div>

           <div className="bg-emerald-600 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                 <h4 className="text-4xl font-heading mb-4 leading-tight">Zero-Error Disbursement</h4>
                 <p className="text-white/70 text-sm mb-6">Automated verification of vendor bank coordinates before every run.</p>
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                       <CheckCircle2 size={24} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">ISO 20022 Enabled</span>
                 </div>
              </div>
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <CreditCard size={120} />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-500',
    approved: 'bg-emerald-50 text-emerald-600',
    completed: 'bg-brand-gold text-brand-navy',
  };
  return (
    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider ${styles[status] ?? styles.draft}`}>
      {status}
    </span>
  );
}

function BankStatus({ system, status, color }: { system: string, status: string, color: string }) {
   return (
      <div className="flex justify-between items-center">
         <div className="flex items-center gap-4">
            <div className={`w-2 h-2 rounded-full ${color}`}></div>
            <span className="text-sm font-bold text-slate-700">{system}</span>
         </div>
         <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-tighter">{status}</span>
      </div>
   );
}
