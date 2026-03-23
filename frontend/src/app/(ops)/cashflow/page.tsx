"use client";

import React from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { 
  TrendingUp, 
  Calendar, 
  FileBox, 
  Plus, 
  RefreshCw, 
  Download, 
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface CashflowItem {
  category: string;
  amount: number | string;
}

interface ForecastWeek {
  id: string;
  week_no: number;
  week_start: string;
  opening_balance?: number | string;
  closing_balance?: number | string;
  items?: CashflowItem[];
}

interface CashflowForecastSummary {
  id: string;
}

interface CashflowForecastDetail {
  id: string;
  status?: string;
  weeks: ForecastWeek[];
}

export default function CashFlowPage() {
  const { isAuthenticated } = useAuthStore();
  const [selectedForecast, setSelectedForecast] = React.useState<CashflowForecastDetail | null>(null);
  const [scenario, setScenario] = React.useState<'base' | 'best' | 'worst'>('base');

  const fetchDetail = React.useCallback(async (id: string) => {
    try {
      const res = await apiFetch(`/cashflow/${id}`);
      if (res.ok) setSelectedForecast(await res.json());
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchForecasts = React.useCallback(async () => {
    try {
      const res = await apiFetch('/cashflow');
      if (res.ok) {
        const data: CashflowForecastSummary[] = await res.json();
        if (data.length > 0 && !selectedForecast) {
          fetchDetail(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [fetchDetail, selectedForecast]);

  React.useEffect(() => {
    if (isAuthenticated) fetchForecasts();
  }, [fetchForecasts, isAuthenticated]);

  const handlePopulate = async () => {
     if (!selectedForecast) return;
     try {
        await apiFetch(`/cashflow/${selectedForecast.id}/populate`, {
           method: 'POST',
        });
        fetchDetail(selectedForecast.id);
     } catch (err) { console.error(err); }
  };

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8 pb-32">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading text-brand-navy font-bold">Cash Flow Intelligence</h1>
          <p className="text-slate-500">13-week rolling liquidity forecast and scenario modeling.</p>
        </div>
        <div className="flex gap-3">
           <button 
            onClick={handlePopulate}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all text-slate-600 shadow-sm"
           >
              <RefreshCw size={18} />
              Sync ERP Data
           </button>
           <button className="flex items-center gap-2 px-6 py-3 bg-brand-navy text-white rounded-2xl font-bold text-sm shadow-xl hover:opacity-90 transition-all">
              <Plus size={18} />
              New Forecast Cycle
           </button>
        </div>
      </div>

      {/* Scenario & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm gap-6">
         <div className="flex bg-slate-100 p-1.5 rounded-2xl shrink-0">
            <button onClick={() => setScenario('worst')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${scenario === 'worst' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Worst Case</button>
            <button onClick={() => setScenario('base')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${scenario === 'base' ? 'bg-brand-navy text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Base Case</button>
            <button onClick={() => setScenario('best')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${scenario === 'best' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Best Case</button>
         </div>

         <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
               <Calendar size={14} className="text-brand-gold" />
               <span className="text-xs font-bold text-slate-600">Period: Q1 2026</span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${selectedForecast?.status === 'signed_off' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-orange-50 border-orange-100 text-orange-600'}`}>
               <CheckCircle size={14} />
               <span className="text-xs font-bold uppercase tracking-widest">{selectedForecast?.status || 'Draft'}</span>
            </div>
               <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-brand-navy hover:shadow-md transition-all">
               <Download size={18} />
            </button>
         </div>
      </div>

      {/* 13-Week Matrix Table */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
         <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1500px]">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="py-6 px-8 border-r border-slate-100 sticky left-0 bg-slate-50/50 z-20 w-[280px]">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Liquidity Matrix Row</div>
                     </th>
                     {selectedForecast?.weeks.map((week) => (
                        <th key={week.id} className="py-6 px-10 text-center border-r border-slate-100 min-w-[160px]">
                           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Week {week.week_no}</div>
                           <div className="text-xs font-heading font-bold text-brand-navy">{new Date(week.week_start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                        </th>
                     ))}
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {/* Summary Rows */}
                  <RowGroup label="Opening Cash Position" icon={<FileBox size={14} />} color="text-slate-500 font-bold bg-slate-50/30">
                     {selectedForecast?.weeks.map((w) => (
                        <td key={w.id} className="py-5 px-10 text-right border-r border-slate-100 font-mono text-xs">{(Number(w.opening_balance) || 0).toLocaleString()}</td>
                     ))}
                  </RowGroup>

                  <SectionHeader label="Auto-Inflows (ERP)" color="bg-emerald-50/50 text-emerald-700" />
                  <MatrixRow label="Sales Receipts (AR)" source="auto">
                     {selectedForecast?.weeks.map((w) => {
                        const amount = (w.items ?? [])
                          .filter((item) => item.category === 'AR Inflow')
                          .reduce((sum, item) => sum + Number(item.amount), 0);
                        return <td key={w.id} className="py-5 px-10 text-right border-r border-slate-100 font-mono text-xs text-emerald-600">{amount > 0 ? `+${amount.toLocaleString()}` : '—'}</td>
                     })}
                  </MatrixRow>

                  <SectionHeader label="Manual Inflows" color="bg-slate-50 text-slate-400" />
                   <MatrixRow label="Customer Deposits" source="manual">
                     {selectedForecast?.weeks.map((w) => <td key={w.id} className="py-5 px-10 text-right border-r border-slate-100 font-mono text-xs">—</td>)}
                  </MatrixRow>

                  <SectionHeader label="Auto-Outflows (ERP)" color="bg-rose-50/50 text-rose-700" />
                  <MatrixRow label="Supplier Payments (AP)" source="auto">
                     {selectedForecast?.weeks.map((w) => {
                        const amount = (w.items ?? [])
                          .filter((item) => item.category === 'AP Outflow')
                          .reduce((sum, item) => sum + Number(item.amount), 0);
                        return <td key={w.id} className="py-5 px-10 text-right border-r border-slate-100 font-mono text-xs text-rose-500">{amount !== 0 ? amount.toLocaleString() : '—'}</td>
                     })}
                  </MatrixRow>

                  <SectionHeader label="Commitments" color="bg-slate-50 text-slate-400" />
                  <MatrixRow label="Payroll Settlement">
                     {selectedForecast?.weeks.map((w) => <td key={w.id} className="py-5 px-10 text-right border-r border-slate-100 font-mono text-xs text-rose-400">{(w.week_no === 4 || w.week_no === 8 || w.week_no === 12) ? '-850,000' : '—'}</td>)}
                  </MatrixRow>
                  <MatrixRow label="Tax & Statutory (KRA)">
                     {selectedForecast?.weeks.map((w) => <td key={w.id} className="py-5 px-10 text-right border-r border-slate-100 font-mono text-xs">—</td>)}
                  </MatrixRow>

                  {/* Summary Rows */}
                  <RowGroup label="Net Cash Variation" color="text-brand-gold font-black border-t-2 border-slate-100">
                     {selectedForecast?.weeks.map((w) => {
                        const delta = (w.items ?? []).reduce((sum, item) => sum + Number(item.amount), 0) + ((w.week_no % 4 === 0) ? -850000 : 0);
                        return <td key={w.id} className={`py-5 px-10 text-right border-r border-slate-100 font-mono text-xs ${delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{delta.toLocaleString()}</td>
                     })}
                  </RowGroup>

                  <RowGroup label="Closing Week Liquidity" color="text-brand-navy font-black bg-brand-gold/10 text-base">
                     {selectedForecast?.weeks.map((w) => (
                        <td key={w.id} className="py-6 px-10 text-right border-r border-slate-100 font-heading">R {(Number(w.closing_balance) || 0).toLocaleString()}</td>
                     ))}
                  </RowGroup>
               </tbody>
            </table>
         </div>
         <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
            <div className="flex gap-6 items-center">
               <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Threshold OK (+R 2M)</span>
               </div>
               <div className="text-xs text-slate-400 font-medium max-w-sm">This forecast uses Base Case assumptions. Toggle Best/Worst case to see scenario sensitivity.</div>
            </div>
            <button className="px-10 py-4 bg-brand-navy text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-brand-navy/10 flex items-center gap-2">
               <CheckCircle size={20} />
               Sign-off Forecast
            </button>
         </div>
      </div>

      {/* Floating Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <h4 className="flex items-center gap-2 text-brand-navy font-bold mb-4">
               <TrendingUp size={18} className="text-brand-gold" />
               Variance Analysis
            </h4>
            <div className="space-y-4">
               <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Best vs Base</span>
                  <span className="text-emerald-600 font-bold">+R 1,450,000</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Worst vs Base</span>
                  <span className="text-rose-600 font-bold">-R 2,120,000</span>
               </div>
            </div>
         </div>
         <div className="bg-brand-navy p-8 rounded-[32px] text-white shadow-xl col-span-2 relative overflow-hidden">
            <div className="relative z-10">
               <h4 className="text-lg font-heading mb-2 flex items-center gap-2">
                  <AlertCircle size={20} className="text-brand-gold" />
                  Actionable Strategy
               </h4>
               <p className="text-sm text-white/70 leading-relaxed mb-4">You have a projected cash dip in Week 8 due to concurrent VAT filing and Payroll. Consider negotiating Vendor Inv #88293 to Net 60 to preserve R 235k.</p>
               <button className="text-xs font-black uppercase text-brand-gold tracking-widest hover:underline">Apply Optimization →</button>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <Info size={120} />
            </div>
         </div>
      </div>
    </div>
  );
}

function SectionHeader({ label, color }: { label: string, color: string }) {
   return (
      <tr className={color}>
         <td className="py-2 px-8 text-[10px] font-black uppercase tracking-[0.2em] border-r border-white/20 sticky left-0 z-20" colSpan={1}>
            {label}
         </td>
         <td colSpan={13} className="py-2"></td>
      </tr>
   );
}

function MatrixRow({ label, source, children }: { label: string, source?: 'auto' | 'manual', children: React.ReactNode }) {
   return (
      <tr className="group hover:bg-slate-50 transition-colors">
         <td className="py-5 px-8 border-r border-slate-100 sticky left-0 bg-white group-hover:bg-slate-50 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
               <div className="text-xs font-bold text-slate-700">{label}</div>
               {source === 'auto' && <span className="text-[8px] font-black px-1.5 py-0.5 bg-brand-navy/5 text-brand-navy rounded uppercase tracking-tighter">AI/ERP</span>}
            </div>
         </td>
         {children}
      </tr>
   );
}

function RowGroup({ label, icon, color, children }: { label: string, icon?: React.ReactNode, color?: string, children: React.ReactNode }) {
   return (
      <tr className={color}>
         <td className={`py-6 px-8 border-r border-slate-100 sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)] ${color?.includes('bg-') ? color : 'bg-white'}`}>
            <div className={`flex items-center gap-3 text-xs uppercase tracking-widest ${color || 'text-slate-900'}`}>
               {icon}
               {label}
            </div>
         </td>
         {children}
      </tr>
   );
}
