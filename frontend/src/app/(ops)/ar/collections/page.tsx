"use client";

import React from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  AlertCircle,
  ChevronLeft,
  Phone,
  Mail,
  History,
  ArrowUpRight,
  ShieldAlert,
  MessageSquare,
  FileText,
  Clock,
  X
} from 'lucide-react';
import Link from 'next/link';

interface CollectionCustomer {
  name: string;
}

interface CollectionInvoice {
  customer?: CollectionCustomer;
  invoice_no?: string;
  due_date?: string;
  amount?: number | string;
  paid_amount?: number | string;
}

interface CollectionCase {
  id: string;
  escalation_level: number;
  invoice?: CollectionInvoice;
}

interface RiskCardProps {
  level: number;
  label: string;
  count: number;
  bg: string;
  text: string;
  desc: string;
}

interface CollectionItemProps {
  data: CollectionCase;
}

interface PlaybookStepProps {
  step: number;
  label: string;
  icon: React.ReactNode;
}

export default function ArCollectionsPage() {
  const { isAuthenticated } = useAuthStore();
  const [cases, setCases] = React.useState<CollectionCase[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showBlastPreview, setShowBlastPreview] = React.useState(false);
  const sortedCases = React.useMemo(
    () => [...cases].sort((a, b) => (b.escalation_level ?? 0) - (a.escalation_level ?? 0)),
    [cases],
  );
  const summary = React.useMemo(() => {
    const watchlist = cases.filter((item) => item.escalation_level <= 1).length;
    const escalated = cases.filter((item) => item.escalation_level === 2).length;
    const critical = cases.filter((item) => item.escalation_level >= 3).length;

    return { watchlist, escalated, critical };
  }, [cases]);

  React.useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await apiFetch('/ar/collections');
        if (res.ok) setCases(await res.json());
      } catch (err) {
        console.error('Failed to fetch collection queue:', err);
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated) fetchCases();
  }, [isAuthenticated]);

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8 pb-20">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/ar" className="p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-slate-500">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-heading text-brand-navy font-bold">Recoveries Console</h1>
            <p className="text-slate-500 text-sm">Action-oriented queue for delinquent accounts and debt escalation.</p>
          </div>
        </div>
        <button
          onClick={() => setShowBlastPreview(true)}
          className="flex items-center gap-2 px-6 py-3 bg-brand-navy text-white rounded-2xl font-bold text-sm shadow-xl hover:opacity-90 transition-all"
        >
           <MessageSquare size={18} />
           Open Reminder Blast
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Risk Levels Summary */}
         <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            <RiskCard level={1} label="Watchlist" count={summary.watchlist} bg="bg-emerald-50" text="text-emerald-600" desc="Lower-risk cases currently under watch." />
            <RiskCard level={2} label="Escalated" count={summary.escalated} bg="bg-brand-gold/10" text="text-brand-gold" desc="Cases already in active follow-up." />
            <RiskCard level={3} label="Critical" count={summary.critical} bg="bg-rose-50" text="text-rose-600" desc="Cases needing urgent attention." />
         </div>

         {/* Collection Queue */}
         <div className="lg:col-span-3 space-y-6">
            {sortedCases.map((c) => (
              <CollectionItem key={c.id} data={c} />
            ))}
            {cases.length === 0 && !loading && (
              <div className="py-32 text-center bg-white border border-slate-100 rounded-[40px] border-dashed">
                 <ShieldAlert size={48} className="text-slate-200 mx-auto mb-6" />
                 <h3 className="text-xl font-heading text-slate-500">Queue Clear</h3>
                 <p className="text-slate-400">All overdue accounts are currently within acceptable thresholds.</p>
              </div>
            )}
         </div>

         {/* Sidebar: Strategies & Metrics */}
         <div className="space-y-8">
            <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
               <h3 className="text-lg font-heading text-brand-navy mb-6">Recovery Playbook</h3>
               <div className="space-y-4">
                  <PlaybookStep step={1} label="Automated Email" icon={<Mail size={16} />} />
                  <PlaybookStep step={2} label="Direct Phone Call" icon={<Phone size={16} />} />
                  <PlaybookStep step={3} label="Final Demand Notice" icon={<AlertCircle size={16} />} />
                  <PlaybookStep step={4} label="Legal Handover" icon={<ShieldAlert size={16} />} />
               </div>
            </div>

            <div className="bg-brand-gold rounded-[32px] p-8 text-brand-navy shadow-lg relative overflow-hidden">
               <h4 className="text-sm font-black uppercase tracking-widest mb-2">Open Case Summary</h4>
               <div className="text-4xl font-heading font-black mb-1">{cases.length}</div>
               <p className="text-[10px] font-bold opacity-60">
                  {cases.length > 0 ? 'Live collection cases pulled from the AR queue.' : 'No live collection cases are currently open.'}
               </p>
               <div className="absolute -bottom-4 -right-4 opacity-10">
                  <History size={100} />
               </div>
            </div>
         </div>
      </div>

      {showBlastPreview && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brand-navy/60 backdrop-blur-sm px-4 py-10">
          <div className="w-full max-w-2xl overflow-hidden rounded-[40px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50 p-8">
              <div>
                <h2 className="text-2xl font-heading text-brand-navy">Reminder Blast Preview</h2>
                <p className="text-sm text-slate-400">Live queue summary before a collections reminder goes out.</p>
              </div>
              <button onClick={() => setShowBlastPreview(false)} className="rounded-2xl border border-slate-200 bg-white p-3 transition-all hover:bg-slate-50">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-5 p-8">
              <div className="grid grid-cols-3 gap-4">
                <MiniStat label="Watchlist" value={summary.watchlist} />
                <MiniStat label="Escalated" value={summary.escalated} />
                <MiniStat label="Critical" value={summary.critical} />
              </div>
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-600">
                This preview opens the live collection queue. The actual send action can be wired to a future reminder service when we add broadcast support.
              </div>
              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => setShowBlastPreview(false)} className="px-8 py-4 font-bold text-slate-400 hover:text-slate-600">
                  Close
                </button>
                <Link href="/ar/collections" className="rounded-2xl bg-brand-navy px-10 py-4 font-heading text-lg text-white shadow-xl transition-all hover:opacity-90">
                  Open Queue
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-heading text-brand-navy">{value}</div>
    </div>
  );
}

function RiskCard({ level, label, count, bg, text, desc }: RiskCardProps) {
   return (
      <div className={`${bg} rounded-[32px] p-8 border border-slate-50 shadow-sm transition-transform hover:-translate-y-1`}>
         <div className="flex justify-between items-start mb-4">
            <div className={`p-3 bg-white rounded-2xl ${text}`}><ShieldAlert size={20} /></div>
            <span className="text-2xl font-heading font-bold">{count}</span>
         </div>
         <h4 className={`text-lg font-heading mb-1 ${text}`}>{label} (L{level})</h4>
         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">{desc}</p>
      </div>
   );
}

function CollectionItem({ data }: CollectionItemProps) {
   const overdueDays = React.useMemo(() => {
      const dueDate = data.invoice?.due_date ? new Date(data.invoice.due_date) : null;
      if (!dueDate || Number.isNaN(dueDate.getTime())) return null;
      const diff = Date.now() - dueDate.getTime();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
   }, [data.invoice?.due_date]);

   return (
      <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm hover:shadow-2xl transition-all group">
         <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center shrink-0">
               <span className="text-2xl font-bold text-brand-navy">{data.invoice?.customer?.name?.[0] ?? '?'}</span>
            </div>
            <div className="flex-1 text-center md:text-left">
               <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                  <h3 className="text-2xl font-heading text-brand-navy font-bold">{data.invoice?.customer?.name}</h3>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full ${data.escalation_level === 3 ? 'bg-rose-50 text-rose-600' : 'bg-brand-gold/20 text-brand-navy'}`}>
                     LEVEL {data.escalation_level} ESCALATION
                  </span>
               </div>
               <div className="flex flex-wrap justify-center md:justify-start gap-6 items-center">
                  <div className="text-sm text-slate-400 font-medium flex items-center gap-2">
                     <FileText size={14} />
                     Invoice #{data.invoice?.invoice_no}
                  </div>
                  <div className="text-sm text-slate-400 font-medium flex items-center gap-2">
                     <Clock size={14} />
                     {overdueDays !== null ? `${overdueDays} days overdue` : 'Overdue days not loaded'}
                  </div>
                  <div className="text-xl font-heading text-brand-navy font-bold">
                     R {(Number(data.invoice?.amount ?? 0) - Number(data.invoice?.paid_amount ?? 0)).toLocaleString()}
                  </div>
               </div>
            </div>
            <div className="flex gap-2">
               <button className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-brand-navy transition-all"><Phone size={20} /></button>
               <button className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-brand-navy transition-all"><History size={20} /></button>
               <button className="px-6 py-4 bg-brand-navy text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-lg">Take Action</button>
            </div>
         </div>
         <div className="mt-8 pt-8 border-t border-slate-50 flex justify-between items-center text-xs">
            <div className="text-slate-400 italic font-medium">
               {data.escalation_level >= 3 ? 'Critical escalation queue item.' : 'Live queue item ready for follow-up.'}
            </div>
            <button className="text-brand-gold font-bold uppercase tracking-widest hover:underline flex items-center gap-2">
               View Full Action Log
               <ArrowUpRight size={14} />
            </button>
         </div>
      </div>
   );
}

function PlaybookStep({ step, label, icon }: PlaybookStepProps) {
   return (
      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-50">
         <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[10px] font-black text-brand-navy border border-slate-100">{step}</div>
         <div className="flex-1 flex items-center gap-3">
            <div className="text-slate-400">{icon}</div>
            <span className="text-xs font-bold text-slate-700">{label}</span>
         </div>
      </div>
   );
}
