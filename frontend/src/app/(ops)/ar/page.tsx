"use client";

import React from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  Plus, 
} from 'lucide-react';
import Link from 'next/link';

interface CustomerSummary {
  name?: string;
}

interface ArInvoice {
  id: string;
  invoice_no: string;
  due_date: string;
  amount: number | string;
  paid_amount: number | string;
  status: string;
  customer?: CustomerSummary;
}

interface ArAgingSummary {
  current?: number;
  '1-30'?: number;
  '31-60'?: number;
  '61-90'?: number;
  '90plus'?: number;
  disputed?: number;
}

interface ArDashboardData {
  totalAr?: number;
  customerCount?: number;
  aging?: ArAgingSummary;
  pendingInvoices?: ArInvoice[];
  collectionCases?: number;
  remindersDue?: number;
  disputesAtRisk?: {
    total?: number;
    openCount?: number;
    overdueValue?: number;
    healthPenalty?: number;
    evidencePendingCount?: number;
    overdueEvidenceCount?: number;
    averageResolutionDays?: number;
    averageSlaDays?: number;
    resolvedWithinSlaRate?: number;
    byProduct?: Array<{
      product_code: string;
      dispute_count: number;
      disputed_value: number;
    }>;
    topCustomers?: Array<{
      customer_id: string;
      customer_name: string;
      dispute_count: number;
      disputed_value: number;
    }>;
  };
  topEscalations?: Array<{
    id: string;
    escalation_level: number;
    invoice?: {
      customer?: { name?: string };
      amount?: number | string;
      paid_amount?: number | string;
      due_date?: string;
    };
  }>;
}

interface StatCardProps {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  trend?: string;
  isPositive?: boolean;
  isWarning?: boolean;
}

interface AgingBucketProps {
  label: string;
  value?: number;
  total: number;
  color: string;
}

interface EscalationItemProps {
  level: number;
  customer: string;
  amount: string;
  days: number;
}

export default function ArDashboardPage() {
  const { isAuthenticated } = useAuthStore();
  const [dashboard, setDashboard] = React.useState<ArDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [collectionCount, setCollectionCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashboardRes, collectionsRes] = await Promise.all([
          apiFetch('/ar/dashboard'),
          apiFetch('/ar/collections'),
        ]);

        if (dashboardRes.ok) setDashboard(await dashboardRes.json());
        if (collectionsRes.ok) {
          const collections = await collectionsRes.json();
          setCollectionCount(Array.isArray(collections) ? collections.length : null);
        }
      } catch (err) {
        console.error('Failed to fetch AR dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated) fetchDashboard();
  }, [isAuthenticated]);

  if (loading) return <div className="p-10 text-center font-heading text-xl">Loading AR Intelligence...</div>;

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading text-brand-navy">Accounts Receivable</h1>
          <p className="text-slate-500">Track customer debt, aging profiles, and collections.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/ar/customers" className="btn-secondary bg-white border border-slate-200 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2">
            <Users size={18} />
            Customer List
          </Link>
          <Link href="/disputes" className="btn-secondary bg-white border border-slate-200 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2">
            <AlertCircle size={18} />
            Dispute Portal
          </Link>
          <Link href="/ar/invoices" className="btn-primary bg-brand-navy text-white px-6 py-3 rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-xl flex items-center gap-2">
            <Plus size={18} />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Stats Table & Aging */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <StatCard 
          label="Total AR" 
          value={`R ${(dashboard?.totalAr || 0).toLocaleString()}`} 
          subtext="Outstanding Debt"
          icon={<TrendingUp className="text-emerald-600" />}
          trend="Live"
          isPositive
        />
        <StatCard 
          label="Active Customers" 
          value={dashboard?.customerCount || 0} 
          subtext="Revenue Sources"
          icon={<Users className="text-brand-navy" />}
          trend="Live"
        />
        <StatCard 
          label="Overdue (90 Days+)" 
          value={`R ${(dashboard?.aging?.['90plus'] || 0).toLocaleString()}`} 
          subtext="Critical Risk"
          icon={<AlertCircle className="text-rose-600" />}
          trend={dashboard?.remindersDue ? `${dashboard.remindersDue} Due` : 'Live'}
          isWarning
        />
        <StatCard 
          label="Collection cases" 
          value={dashboard?.collectionCases ?? collectionCount ?? 0} 
          subtext="Active Recoveries"
          icon={<Clock className="text-brand-gold" />}
          trend="Live"
        />
        <StatCard
          label="Disputes At Risk"
          value={`R ${(dashboard?.disputesAtRisk?.total || 0).toLocaleString()}`}
          subtext={`${dashboard?.disputesAtRisk?.openCount || 0} open disputes · ${dashboard?.disputesAtRisk?.evidencePendingCount || 0} awaiting evidence`}
          icon={<AlertCircle className="text-orange-500" />}
          trend={dashboard?.disputesAtRisk?.overdueEvidenceCount ? `${dashboard.disputesAtRisk.overdueEvidenceCount} late` : dashboard?.disputesAtRisk?.healthPenalty ? `-${Math.round(dashboard.disputesAtRisk.healthPenalty)} pts` : 'Live'}
          isWarning
        />
      </div>

      {/* Aging Baskets */}
      <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
        <h3 className="text-xl font-heading text-brand-navy mb-8">AR Aging Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <AgingBucket label="Current" value={dashboard?.aging?.current} total={dashboard?.totalAr || 1} color="bg-brand-navy/20" />
          <AgingBucket label="1-30 Days" value={dashboard?.aging?.['1-30']} total={dashboard?.totalAr || 1} color="bg-emerald-500/20" />
          <AgingBucket label="31-60 Days" value={dashboard?.aging?.['31-60']} total={dashboard?.totalAr || 1} color="bg-brand-gold/20" />
          <AgingBucket label="61-90 Days" value={dashboard?.aging?.['61-90']} total={dashboard?.totalAr || 1} color="bg-orange-500/20" />
          <AgingBucket label="90+ Days" value={dashboard?.aging?.['90plus']} total={dashboard?.totalAr || 1} color="bg-rose-500/20" />
          <AgingBucket label="Disputed" value={dashboard?.aging?.disputed} total={dashboard?.totalAr || 1} color="bg-sky-500/20" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-heading text-brand-navy">Dispute Product Hotspots</h3>
              <p className="text-sm text-slate-500">Revenue at risk by product code across active disputes.</p>
            </div>
            <div className="rounded-2xl bg-orange-50 px-4 py-3 text-right">
              <div className="text-[10px] font-black uppercase tracking-widest text-orange-600">Avg Resolution</div>
              <div className="text-lg font-bold text-brand-navy">
                {(dashboard?.disputesAtRisk?.averageResolutionDays || 0).toFixed(1)}d
              </div>
              <div className="text-[11px] text-slate-500">
                vs SLA {(dashboard?.disputesAtRisk?.averageSlaDays || 0).toFixed(1)}d
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {dashboard?.disputesAtRisk?.byProduct?.length ? (
              dashboard.disputesAtRisk.byProduct.map((product) => (
                <div key={product.product_code} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-brand-navy">{product.product_code}</div>
                      <div className="text-xs text-slate-500">{product.dispute_count} active disputes</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-brand-navy">R {product.disputed_value.toLocaleString()}</div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-400">At risk</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-6 text-sm text-slate-500">
                No active dispute hotspots yet.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-heading text-brand-navy">Top Dispute Customers</h3>
              <p className="text-sm text-slate-500">Customers with the highest active dispute frequency right now.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Resolved Within SLA</div>
              <div className="text-lg font-bold text-brand-navy">
                {Math.round((dashboard?.disputesAtRisk?.resolvedWithinSlaRate || 0) * 100)}%
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {dashboard?.disputesAtRisk?.topCustomers?.length ? (
              dashboard.disputesAtRisk.topCustomers.map((customer) => (
                <div key={customer.customer_id} className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-brand-navy">{customer.customer_name}</div>
                      <div className="text-xs text-slate-500">{customer.dispute_count} active disputes</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-brand-navy">R {customer.disputed_value.toLocaleString()}</div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-400">Disputed value</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-6 text-sm text-slate-500">
                No customer dispute concentration yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        {/* Pending Invoices */}
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-xl font-heading text-brand-navy">Overdue Invoices</h3>
            <Link href="/ar/invoices" className="text-xs font-bold text-brand-gold uppercase tracking-widest hover:underline">View All Invoices →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                  <th className="py-5 px-8">Customer / Ref</th>
                  <th className="py-5 px-8">Due Date</th>
                  <th className="py-5 px-8 text-right">Balance (ZAR)</th>
                  <th className="py-5 px-8">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {dashboard?.pendingInvoices?.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-6 px-8">
                      <div className="font-bold text-slate-900">{inv.customer?.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">#{inv.invoice_no}</div>
                    </td>
                    <td className="py-6 px-8 text-sm text-slate-600">
                      {new Date(inv.due_date).toLocaleDateString()}
                    </td>
                    <td className="py-6 px-8 text-right font-bold text-slate-700">
                      {(Number(inv.amount) - Number(inv.paid_amount)).toLocaleString()}
                    </td>
                    <td className="py-6 px-8">
                       <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
                {!dashboard?.pendingInvoices?.length && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-400 italic">No outstanding invoices.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Collection Escalations */}
        <div className="bg-brand-navy rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
           <h3 className="text-xl font-heading mb-8 relative z-10 flex items-center gap-2">
              <AlertCircle size={20} className="text-brand-gold" />
              Live Escalations
           </h3>
           <div className="space-y-6 relative z-10">
              {dashboard?.topEscalations?.length ? (
                dashboard.topEscalations.map((item) => (
                  <EscalationItem
                    key={item.id}
                    level={item.escalation_level}
                    customer={item.invoice?.customer?.name || 'Unassigned customer'}
                    amount={`R ${(Number(item.invoice?.amount ?? 0) - Number(item.invoice?.paid_amount ?? 0)).toLocaleString()}`}
                    days={item.invoice?.due_date ? Math.max(0, Math.ceil((Date.now() - new Date(item.invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))) : 0}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
                  No active escalation cases are currently open.
                </div>
              )}
              <Link href="/ar/collections" className="block text-center py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold text-xs transition-all border border-white/10 mt-6">
                 Launch Recoveries Console
              </Link>
           </div>
           <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subtext, icon, trend, isPositive, isWarning }: StatCardProps) {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div className="p-4 bg-slate-50 rounded-2xl">{icon}</div>
        {trend && (
           <span className={`text-[10px] font-black px-3 py-1 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : isWarning ? 'bg-rose-50 text-rose-600' : 'bg-slate-100'}`}>
             {trend}
           </span>
        )}
      </div>
      <h4 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">{label}</h4>
      <p className="text-3xl font-heading text-brand-navy font-bold">{value}</p>
      <span className="text-[11px] text-slate-400">{subtext}</span>
    </div>
  );
}

function AgingBucket({ label, value = 0, total, color }: AgingBucketProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex flex-col gap-3">
       <div className="flex justify-between items-end">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
          <span className="text-sm font-bold text-brand-navy">R {(value || 0).toLocaleString()}</span>
       </div>
       <div className="w-full h-8 bg-slate-50 rounded-xl overflow-hidden relative border border-slate-50">
          <div className={`${color} h-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-slate-600">{Math.round(percentage)}%</span>
       </div>
    </div>
  );
}

function EscalationItem({ level, customer, amount, days }: EscalationItemProps) {
   return (
      <div className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer">
         <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-bold">{customer}</span>
            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${level === 3 ? 'bg-rose-500' : 'bg-brand-gold text-brand-navy'}`}>L{level}</span>
         </div>
         <div className="flex justify-between items-center">
            <span className="text-lg font-bold font-mono text-brand-gold">{amount}</span>
            <span className="text-[10px] text-white/50">{days} days overdue</span>
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
  return (
    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider ${styles[status] ?? styles.draft}`}>
      {status}
    </span>
  );
}
