"use client";

import React from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft,
  Mail,
  Download,
  MoreVertical,
  CheckCircle2,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface ArCustomer {
  name?: string;
  tax_pin?: string;
}

interface ArInvoice {
  id: string;
  invoice_no: string;
  invoice_date: string;
  due_date: string;
  amount: number | string;
  paid_amount: number | string;
  status: string;
  customer?: ArCustomer;
}

export default function ArInvoicesPage() {
  const { isAuthenticated } = useAuthStore();
  const [invoices, setInvoices] = React.useState<ArInvoice[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await apiFetch('/ar/invoices');
        if (res.ok) setInvoices(await res.json());
      } catch (err) {
        console.error('Failed to fetch invoices:', err);
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated) fetchInvoices();
  }, [isAuthenticated]);

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/ar" className="p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-slate-500">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-heading text-brand-navy font-bold">Sales Invoices</h1>
            <p className="text-slate-500 text-sm">Issue and manage revenue billing for your customers.</p>
          </div>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all text-slate-600">
              <Filter size={18} />
              Filter
           </button>
           <Link href="/ar/invoices/new" className="flex items-center gap-2 px-6 py-3 bg-brand-navy text-white rounded-2xl font-bold text-sm shadow-xl hover:opacity-90 transition-all">
              <Plus size={18} />
              Issue Invoice
           </Link>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
         <div className="p-8 border-b border-slate-50 relative">
            <Search className="absolute left-12 top-11 text-slate-300" size={18} />
            <input type="text" placeholder="Search by customer name, invoice #, or reference..." className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-brand-gold text-sm font-medium" />
         </div>

         <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                     <th className="py-5 px-8">Customer Name</th>
                     <th className="py-5 px-8">Invoice ID</th>
                     <th className="py-5 px-8">Issue / Due Date</th>
                     <th className="py-5 px-8 text-right">Invoice Total</th>
                     <th className="py-5 px-8">Collection Status</th>
                     <th className="py-5 px-8"></th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {invoices.map((inv) => (
                     <tr key={inv.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-6 px-8">
                           <div className="font-bold text-slate-900">{inv.customer?.name}</div>
                           <div className="text-[10px] text-slate-400 font-mono mt-0.5">{inv.customer?.tax_pin || 'NO TAX PIN'}</div>
                        </td>
                        <td className="py-6 px-8">
                           <div className="text-sm font-bold text-slate-600">#{inv.invoice_no}</div>
                        </td>
                        <td className="py-6 px-8">
                           <div className="text-sm text-slate-900">{new Date(inv.invoice_date).toLocaleDateString()}</div>
                           <div className="text-[10px] text-slate-400">Due {new Date(inv.due_date).toLocaleDateString()}</div>
                        </td>
                        <td className="py-6 px-8 text-right">
                           <div className="font-bold text-slate-900">R {Number(inv.amount).toLocaleString()}</div>
                           <div className="text-[10px] text-emerald-500 font-bold">PAID R {Number(inv.paid_amount).toLocaleString()}</div>
                        </td>
                        <td className="py-6 px-8">
                           <StatusBadge status={inv.status} />
                        </td>
                        <td className="py-6 px-8 text-right">
                           <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
                              <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-brand-navy shadow-sm"><Mail size={16} /></button>
                              <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-brand-navy shadow-sm"><Download size={16} /></button>
                              <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-brand-navy shadow-sm"><MoreVertical size={16} /></button>
                           </div>
                        </td>
                     </tr>
                  ))}
                  {invoices.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-slate-400 italic">No invoices found.</td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-500',
    sent: 'bg-blue-50 text-blue-600',
    partially_paid: 'bg-orange-50 text-orange-600',
    paid: 'bg-emerald-50 text-emerald-600',
    overdue: 'bg-rose-50 text-rose-600',
  };
  const labels: Record<string, string> = {
    draft: 'Draft',
    sent: 'Dispatched',
    partially_paid: 'Partial Pay',
    paid: 'Settled',
    overdue: 'Action Required',
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${styles[status] ?? styles.draft}`}>
      {status === 'paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
      {labels[status] || status}
    </div>
  );
}
