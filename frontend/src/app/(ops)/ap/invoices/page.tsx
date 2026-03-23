"use client";

import React from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { 
  FileText, 
  CheckCircle2, 
  ChevronLeft,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface VendorSummary {
  name?: string;
}

interface InvoiceRecord {
  id: string;
  invoice_no: string;
  invoice_date: string;
  amount: number | string;
  status: string;
  po_id?: string | null;
  vendor?: VendorSummary;
}

interface ApDashboardResponse {
  pendingInvoices?: InvoiceRecord[];
}

interface StatusConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
}

export default function InvoicesPage() {
  const { isAuthenticated } = useAuthStore();
  const [invoices, setInvoices] = React.useState<InvoiceRecord[]>([]);
  const [selectedInvoice, setSelectedInvoice] = React.useState<InvoiceRecord | null>(null);

  const fetchInvoices = React.useCallback(async () => {
    try {
      const res = await apiFetch('/ap/dashboard');
      if (res.ok) {
        const data: ApDashboardResponse = await res.json();
        setInvoices(data.pendingInvoices || []);
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) fetchInvoices();
  }, [fetchInvoices, isAuthenticated]);

  const handleMatch = async (id: string) => {
     try {
        const res = await apiFetch(`/ap/invoices/${id}/match`, {
           method: 'POST',
        });
        if (res.ok) fetchInvoices();
     } catch (err) { console.error(err); }
  };

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/ap" className="p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-slate-500">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-heading text-brand-navy font-bold">Invoice Intelligence</h1>
            <p className="text-slate-500 text-sm">Automated reconciliation and approval workflows.</p>
          </div>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all text-slate-600">
              <Filter size={18} />
              Advanced Filters
           </button>
           <button className="flex items-center gap-2 px-6 py-3 bg-brand-navy text-white rounded-2xl font-bold text-sm shadow-xl hover:opacity-90 transition-all">
              <ExternalLink size={18} />
              Export Batch
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Invoice List */}
        <div className="lg:col-span-3 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
           <div className="p-8 border-b border-slate-50 relative">
              <Search className="absolute left-12 top-11 text-slate-300" size={18} />
              <input type="text" placeholder="Filter by vendor, PO #, or status..." className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-brand-gold text-sm font-medium" />
           </div>
           <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                       <th className="py-5 px-8">Invoice Identity</th>
                       <th className="py-5 px-8">PO Reference</th>
                       <th className="py-5 px-8 text-right">Amount (ZAR)</th>
                       <th className="py-5 px-8">Matching status</th>
                       <th className="py-5 px-8"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {invoices.map((inv) => (
                       <tr key={inv.id} className={`group hover:bg-slate-50 transition-all cursor-pointer ${selectedInvoice?.id === inv.id ? 'bg-slate-50' : ''}`} onClick={() => setSelectedInvoice(inv)}>
                          <td className="py-6 px-8">
                             <div className="font-bold text-slate-900">{inv.vendor?.name}</div>
                             <div className="text-[10px] text-slate-400 font-mono mt-0.5">#{inv.invoice_no} — {new Date(inv.invoice_date).toLocaleDateString()}</div>
                          </td>
                          <td className="py-6 px-8">
                             <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-brand-gold/10 text-brand-gold rounded-lg"><FileText size={14} /></span>
                                <span className="text-xs font-bold text-slate-600">PO-88293</span>
                             </div>
                          </td>
                          <td className="py-6 px-8 text-right font-bold text-slate-700">
                             {Number(inv.amount).toLocaleString()}
                          </td>
                          <td className="py-6 px-8">
                             <StatusLabel status={inv.status} />
                          </td>
                          <td className="py-6 px-8 text-right">
                             <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-brand-navy shadow-sm transition-all opacity-0 group-hover:opacity-100">
                                <Eye size={16} />
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Action Panel / Match Inspector */}
        <div className="space-y-8">
           {selectedInvoice ? (
              <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-2xl animate-in fade-in slide-in-from-right-5 duration-300">
                 <h3 className="text-xl font-heading text-brand-navy mb-8 border-b border-slate-50 pb-4">Match Inspector</h3>
                 <div className="space-y-8 mb-10">
                    <MatchItem label="Purchase Order" status={selectedInvoice.po_id ? 'verified' : 'missing'} value="PO-88293" />
                    <MatchItem label="Goods Receipt" status={selectedInvoice.status === 'matched' ? 'verified' : 'pending'} value="GR-1102" />
                    <MatchItem label="Invoice Total" status="verified" value={`R ${Number(selectedInvoice.amount).toLocaleString()}`} />
                 </div>

                 <div className="space-y-3">
                    {selectedInvoice.status === 'pending' && (
                       <button 
                        onClick={() => handleMatch(selectedInvoice.id)}
                        className="w-full py-4 bg-brand-gold text-brand-navy rounded-2xl font-bold text-sm shadow-xl shadow-brand-gold/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                       >
                          <CheckCircle2 size={18} />
                          Run 3-Way Match
                       </button>
                    )}
                    {selectedInvoice.status === 'matched' && (
                       <button className="w-full py-4 bg-brand-navy text-white rounded-2xl font-bold text-sm shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
                          <CheckCircle size={18} />
                          Approve for Payment
                       </button>
                    )}
                    <button className="w-full py-4 bg-white border border-rose-100 text-rose-500 rounded-2xl font-bold text-xs hover:bg-rose-50 transition-all">
                       Flag for Dispute
                    </button>
                 </div>
              </div>
           ) : (
              <div className="bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200 p-12 text-center h-[500px] flex flex-col items-center justify-center">
                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                    <FileText size={24} className="text-slate-300" />
                 </div>
                 <h4 className="font-heading text-slate-500 mb-2">Selection Required</h4>
                 <p className="text-slate-400 text-xs max-w-[180px]">Select an invoice from the list to view its 3-way match details.</p>
              </div>
           )}

           <div className="bg-brand-navy rounded-[32px] p-8 text-white">
              <h4 className="text-xs font-black uppercase text-brand-gold tracking-widest mb-4">OCR Intelligence</h4>
              <div className="flex gap-4 items-start">
                 <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                    <Clock size={20} className="text-brand-gold" />
                 </div>
                 <div>
                    <div className="text-sm font-bold mb-1">Queue Processing</div>
                    <div className="text-[10px] text-white/50">8 invoices currently being analyzed by Tesseract AI engine.</div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatusLabel({ status }: { status: string }) {
  const configs: Record<string, StatusConfig> = {
    pending: { label: 'Awaiting Match', icon: <Clock size={12} />, color: 'bg-slate-100 text-slate-500' },
    matched: { label: '3-Way Matched', icon: <CheckCircle2 size={12} />, color: 'bg-emerald-50 text-emerald-600' },
    approved: { label: 'Ready for Pay', icon: <CheckCircle size={12} />, color: 'bg-brand-navy text-white shadow-sm' },
    paid: { label: 'Payment Sent', icon: <CheckCircle size={12} />, color: 'bg-brand-gold text-brand-navy' },
  };
  const config = configs[status] || configs.pending;
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${config.color}`}>
      {config.icon}
      {config.label}
    </div>
  );
}

function MatchItem({ label, status, value }: { label: string, status: 'verified' | 'pending' | 'missing', value: string }) {
  return (
    <div className="flex items-center justify-between">
       <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${status === 'verified' ? 'bg-emerald-500 animate-pulse' : status === 'pending' ? 'bg-brand-gold' : 'bg-rose-500'}`}></div>
          <div className="text-xs font-bold text-slate-500">{label}</div>
       </div>
       <div className="text-xs font-mono text-slate-400">{value}</div>
    </div>
  );
}
