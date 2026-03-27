"use client";

import React from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { 
  Building2, 
  ShoppingCart, 
  FileCheck, 
  CreditCard, 
  Plus, 
  Search,
  ArrowUpRight,
  MoreVertical,
  Filter
} from 'lucide-react';
import Link from 'next/link';

interface VendorSummary {
  name?: string;
}

interface PendingInvoice {
  id: string;
  invoice_no: string;
  invoice_date: string;
  due_date: string;
  amount: number | string;
  status: string;
  vendor?: VendorSummary;
}

interface RecentPurchaseOrder {
  id: string;
  total: number | string;
  status: string;
  vendor?: VendorSummary;
}

interface ApDashboardData {
  totalOutstanding?: number;
  vendorCount?: number;
  pendingInvoices?: PendingInvoice[];
  recentPOs?: RecentPurchaseOrder[];
  recentPaymentRuns?: {
    id: string;
    status: string;
    run_date: string;
    total_amount: number | string;
  }[];
}

interface StatCardProps {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  trend: string;
  isPositive?: boolean;
  isWarning?: boolean;
  isNeutral?: boolean;
}

export default function ApDashboardPage() {
  const { isAuthenticated } = useAuthStore();
  const [dashboard, setDashboard] = React.useState<ApDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const latestRun = dashboard?.recentPaymentRuns?.[0] ?? null;
  const pendingInvoices = dashboard?.pendingInvoices || [];
  const matchedInvoices = pendingInvoices.filter((invoice) => invoice.status === 'matched');
  const matchedRatio = pendingInvoices.length > 0 ? Math.round((matchedInvoices.length / pendingInvoices.length) * 100) : null;

  React.useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await apiFetch('/ap/dashboard');
        if (res.ok) setDashboard(await res.json());
      } catch (err) {
        console.error('Failed to fetch AP dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated) fetchDashboard();
  }, [isAuthenticated]);

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading text-brand-navy">Accounts Payable</h1>
          <p className="text-slate-500">Manage vendors, purchase orders, and payment approvals.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/ap/vendors" className="btn-secondary bg-white border border-slate-200 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2">
            <Building2 size={18} />
            Vendor Directory
          </Link>
          <Link href="/ap/invoices" className="btn-primary bg-brand-navy text-white px-6 py-3 rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-xl flex items-center gap-2">
            <Plus size={18} />
            Record Invoice
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Outstanding AP" 
          value={dashboard ? `R ${(dashboard.totalOutstanding || 0).toLocaleString()}` : "R 0"} 
          subtext="Unpaid Invoices"
          icon={<CreditCard className="text-rose-600" />}
          trend="Live"
          isNeutral
        />
        <StatCard 
          label="Active Vendors" 
          value={dashboard?.vendorCount ?? 0} 
          subtext="Onboarded Partners"
          icon={<Building2 className="text-brand-navy" />}
          trend="Live"
          isPositive
        />
        <StatCard 
          label="Pending POs" 
          value={dashboard?.recentPOs?.length ?? 0} 
          subtext="Awaiting Approval"
          icon={<ShoppingCart className="text-brand-gold" />}
          trend={`${dashboard?.recentPOs?.filter((po) => ['high', 'urgent'].includes(String(po.status).toLowerCase())).length ?? 0} High`}
          isWarning
        />
        <StatCard 
          label="Matched Ratio" 
          value={matchedRatio !== null ? `${matchedRatio}%` : 'Live'}
          subtext="3-Way Match Success"
          icon={<FileCheck className="text-emerald-600" />}
          trend={matchedRatio !== null ? `${matchedInvoices.length}/${pendingInvoices.length}` : 'Live'}
          isPositive
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Invoices List */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-xl font-heading text-brand-navy">Approval Queue</h3>
            <div className="flex gap-2">
               <button className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-brand-navy transition-all"><Filter size={16} /></button>
               <button className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-brand-navy transition-all"><Search size={16} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                  <th className="py-4 px-8">Vendor / Invoice</th>
                  <th className="py-4 px-8">Date / Due</th>
                  <th className="py-4 px-8 text-right">Amount</th>
                  <th className="py-4 px-8">Status</th>
                  <th className="py-4 px-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {dashboard?.pendingInvoices?.map((inv) => (
                  <tr key={inv.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-5 px-8">
                       <div className="font-bold text-slate-900 group-hover:text-brand-navy transition-all">{inv.vendor?.name}</div>
                       <div className="text-[10px] text-slate-400 font-mono">INV: {inv.invoice_no}</div>
                    </td>
                    <td className="py-5 px-8">
                       <div className="text-sm text-slate-600">{new Date(inv.invoice_date).toLocaleDateString()}</div>
                       <div className="text-[10px] text-rose-400 font-bold uppercase tracking-tighter">Due {new Date(inv.due_date).toLocaleDateString()}</div>
                    </td>
                    <td className="py-5 px-8 text-right font-bold text-slate-900">
                       R {Number(inv.amount).toLocaleString()}
                    </td>
                    <td className="py-5 px-8">
                       <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-5 px-8 text-right">
                       <button className="p-2 text-slate-300 hover:bg-white hover:shadow-sm rounded-lg transition-all opacity-0 group-hover:opacity-100">
                          <MoreVertical size={16} />
                       </button>
                    </td>
                  </tr>
                ))}
                {!dashboard?.pendingInvoices?.length && !loading && (
                   <tr>
                      <td colSpan={5} className="py-20 text-center text-slate-400 italic">No invoices in approval queue.</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-slate-50/50 border-t border-slate-50 text-center">
             <Link href="/ap/invoices" className="text-xs font-bold text-brand-gold uppercase tracking-widest hover:underline">
                Batch Process {dashboard?.pendingInvoices?.length ?? 0} Invoices →
             </Link>
          </div>
        </div>

        {/* Sidebar: Recent POs & Actions */}
        <div className="space-y-8">
           <div className="bg-brand-navy rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
              <h3 className="text-lg font-heading mb-6 relative z-10 flex items-center gap-2">
                 <ShoppingCart size={20} className="text-brand-gold" />
                 Recent POs
              </h3>
              <div className="space-y-4 relative z-10">
                 {dashboard?.recentPOs?.map((po) => (
                    <div key={po.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer">
                       <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-bold">R {Number(po.total).toLocaleString()}</span>
                          <span className="text-[9px] uppercase font-black px-2 py-0.5 bg-brand-gold text-brand-navy rounded-full">{po.status}</span>
                       </div>
                       <div className="text-[10px] text-white/50">{po.vendor?.name || 'Order Details'}</div>
                    </div>
                 ))}
                 <Link href="/ap/purchase-orders" className="flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-xs font-bold border border-white/10">
                    Manage All Orders
                    <ArrowUpRight size={14} />
                 </Link>
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-gold/10 rounded-full blur-3xl"></div>
           </div>

           <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
              <h3 className="text-lg font-heading text-brand-navy mb-6">Payment Scheduling</h3>
              <div className="space-y-6">
                 <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 border-l-4 border-l-brand-gold">
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Latest Payment Run</div>
                    {latestRun ? (
                      <>
                        <div className="text-xl font-heading text-brand-navy font-bold">
                          {new Date(latestRun.run_date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="mt-3 flex justify-between items-center text-[10px]">
                           <span className="text-slate-500 font-bold">{latestRun.status.toUpperCase()}</span>
                           <span className="text-brand-navy font-black italic">
                              R {Number(latestRun.total_amount).toLocaleString()} TOTAL
                           </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-xl font-heading text-brand-navy font-bold">No payment run yet</div>
                        <div className="mt-3 flex justify-between items-center text-[10px]">
                           <span className="text-slate-500 font-bold">
                              {dashboard?.pendingInvoices?.length ?? 0} INVOICES READY
                           </span>
                           <span className="text-brand-navy font-black italic">READY TO BATCH</span>
                        </div>
                      </>
                    )}
                 </div>
                 <Link href="/ap/payment-runs" className="block w-full text-center py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-bold text-xs hover:bg-emerald-100 transition-all">
                    Initiate Bulk Payment Run
                 </Link>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subtext, icon, trend, isPositive, isWarning }: StatCardProps) {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div className="p-4 bg-slate-50 rounded-2xl">{icon}</div>
        <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
           isPositive ? 'bg-emerald-50 text-emerald-600' : 
           isWarning ? 'bg-brand-gold/10 text-brand-gold' : 
           'bg-slate-100 text-slate-600'
        }`}>
          {trend}
        </span>
      </div>
      <h4 className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mb-1">{label}</h4>
      <p className="text-3xl font-heading text-brand-navy font-bold mb-1">{value}</p>
      <span className="text-[11px] text-slate-400 font-medium">{subtext}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-500',
    matched: 'bg-emerald-50 text-emerald-600',
    approved: 'bg-brand-navy text-white shadow-lg shadow-brand-navy/10',
    paid: 'bg-brand-gold text-brand-navy',
  };
  return (
    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider ${styles[status] ?? styles.pending}`}>
      {status}
    </span>
  );
}
