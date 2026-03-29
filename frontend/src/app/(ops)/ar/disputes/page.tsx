"use client";

import React from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AlertCircle, ChevronLeft, Clock3, Filter, FileText, Search, ShieldAlert } from 'lucide-react';

interface DisputeActivity {
  id: string;
  activity_type: string;
  notes?: string | null;
  created_at: string;
}

interface DisputeResolution {
  id: string;
  resolution_type: string;
  status: string;
  posted_to_gl: boolean;
  credit_amount?: number | string | null;
  writeoff_amount?: number | string | null;
}

interface DisputeAttachment {
  id: string;
  category: string;
  file_name: string;
  created_at: string;
}

interface DisputeRecord {
  id: string;
  case_number?: string | null;
  status: string;
  priority: string;
  dispute_type: string;
  disputed_amount: number | string;
  due_date: string;
  evidence_due_date?: string | null;
  raised_date?: string;
  product_code?: string | null;
  reason_code?: string | null;
  blocks_payment: boolean;
  affects_revenue: boolean;
  invoice?: {
    id?: string;
    invoice_no?: string;
    customer?: {
      name?: string;
    };
  };
  activities?: DisputeActivity[];
  resolutions?: DisputeResolution[];
  attachments?: DisputeAttachment[];
}

const STATUS_OPTIONS = ['ALL', 'OPEN', 'UNDER_REVIEW', 'EVIDENCE_PENDING', 'ESCALATED', 'RESOLUTION_PROPOSED', 'RESOLVED', 'CLOSED'];

export default function ArDisputesPage() {
  const { isAuthenticated } = useAuthStore();
  const [disputes, setDisputes] = React.useState<DisputeRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [message, setMessage] = React.useState('');

  const fetchDisputes = React.useCallback(async () => {
    try {
      const res = await apiFetch('/ar/disputes');
      if (res.ok) {
        setDisputes(await res.json());
        setMessage('');
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to load dispute register.');
      }
    } catch {
      setMessage('Connection error while loading dispute register.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) fetchDisputes();
  }, [fetchDisputes, isAuthenticated]);

  const filteredDisputes = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return disputes.filter((dispute) => {
      const matchesStatus = statusFilter === 'ALL' || dispute.status === statusFilter;
      if (!matchesStatus) return false;

      if (!normalizedQuery) return true;

      const haystack = [
        dispute.case_number,
        dispute.invoice?.invoice_no,
        dispute.invoice?.customer?.name,
        dispute.dispute_type,
        dispute.priority,
        dispute.reason_code,
        dispute.product_code,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [disputes, query, statusFilter]);

  const summary = React.useMemo(() => {
    const open = disputes.filter((item) => ['OPEN', 'UNDER_REVIEW', 'ESCALATED'].includes(item.status)).length;
    const evidencePending = disputes.filter((item) => item.status === 'EVIDENCE_PENDING').length;
    const resolutionQueue = disputes.filter((item) => item.status === 'RESOLUTION_PROPOSED').length;
    const postedResolutions = disputes.filter((item) => item.resolutions?.some((resolution) => resolution.posted_to_gl)).length;

    return { open, evidencePending, resolutionQueue, postedResolutions };
  }, [disputes]);

  return (
    <div className="flex flex-col gap-8 p-6 pb-20 md:p-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href="/ar" className="rounded-xl border border-slate-100 bg-white p-2 text-slate-500 transition-all hover:bg-slate-50">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="font-heading text-3xl font-bold text-brand-navy">Dispute Register</h1>
            <p className="text-sm text-slate-500">One workspace for intake, evidence, approval, and closure tracking across all AR disputes.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/disputes" className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-brand-navy transition-all hover:bg-slate-50">
            Open Customer Portal
          </Link>
          <Link href="/ar/invoices" className="rounded-2xl bg-brand-navy px-6 py-3 text-sm font-bold text-white shadow-xl transition-all hover:opacity-90">
            Invoice Workspace
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <SummaryCard label="Open Cases" value={summary.open} tone="rose" icon={<AlertCircle size={18} />} />
        <SummaryCard label="Evidence Pending" value={summary.evidencePending} tone="sky" icon={<FileText size={18} />} />
        <SummaryCard label="Resolution Queue" value={summary.resolutionQueue} tone="amber" icon={<Clock3 size={18} />} />
        <SummaryCard label="Posted Resolutions" value={summary.postedResolutions} tone="emerald" icon={<ShieldAlert size={18} />} />
      </div>

      <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative max-w-2xl flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by case ID, customer, invoice, type, reason code, or product"
              className="w-full rounded-3xl border border-slate-100 bg-slate-50 py-4 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-brand-gold"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-500">
              <Filter size={16} />
              Status
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-brand-gold"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {message && <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</div>}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-4 py-4">Case</th>
                <th className="px-4 py-4">Customer / Invoice</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4 text-right">Value</th>
                <th className="px-4 py-4">SLA Dates</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDisputes.map((dispute) => (
                <tr key={dispute.id} className="align-top transition-colors hover:bg-slate-50/60">
                  <td className="px-4 py-5">
                    <div className="font-semibold text-brand-navy">{dispute.case_number || `DSP-${dispute.id.slice(0, 8).toUpperCase()}`}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-slate-400">{dispute.priority}</div>
                    {dispute.raised_date && (
                      <div className="mt-1 text-xs text-slate-400">Raised {new Date(dispute.raised_date).toLocaleDateString()}</div>
                    )}
                  </td>
                  <td className="px-4 py-5">
                    <div className="font-semibold text-slate-900">{dispute.invoice?.customer?.name || 'Unknown customer'}</div>
                    <div className="mt-1 text-xs text-slate-500">Invoice #{dispute.invoice?.invoice_no || 'Unlinked'}</div>
                    {dispute.reason_code && <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-400">{dispute.reason_code}</div>}
                  </td>
                  <td className="px-4 py-5">
                    <div className="font-semibold text-slate-700">{dispute.dispute_type}</div>
                    <div className="mt-1 text-xs text-slate-500">{dispute.product_code || 'No product tag'}</div>
                  </td>
                  <td className="px-4 py-5 text-right">
                    <div className="font-heading text-2xl text-brand-navy">R {Number(dispute.disputed_amount).toLocaleString()}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-slate-400">
                      {dispute.blocks_payment ? 'Blocks payment' : 'Does not block payment'}
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="text-sm font-medium text-slate-700">Due {new Date(dispute.due_date).toLocaleDateString()}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      Evidence {dispute.evidence_due_date ? new Date(dispute.evidence_due_date).toLocaleDateString() : 'not required'}
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <StatusBadge status={dispute.status} />
                    <div className="mt-3 text-xs text-slate-500">
                      {dispute.activities?.length || 0} timeline events · {dispute.attachments?.length || 0} evidence items
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/ar/invoices`}
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50"
                      >
                        Open Invoice Workspace
                      </Link>
                      {dispute.resolutions?.[0] && (
                        <div className="text-[10px] uppercase tracking-widest text-slate-400">
                          Latest resolution: {dispute.resolutions[0].status}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredDisputes.length && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm italic text-slate-400">
                    No disputes match the current filter.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center font-heading text-lg text-slate-500">
                    Loading dispute register...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: 'rose' | 'sky' | 'amber' | 'emerald';
  icon: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    rose: 'bg-rose-50 text-rose-600',
    sky: 'bg-sky-50 text-sky-600',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
      <div className="mb-5 flex items-start justify-between">
        <div className={`rounded-2xl p-4 ${styles[tone]}`}>{icon}</div>
        <div className="text-3xl font-heading font-bold text-brand-navy">{value}</div>
      </div>
      <div className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    OPEN: 'bg-rose-50 text-rose-600',
    RAISED: 'bg-rose-50 text-rose-600',
    UNDER_REVIEW: 'bg-amber-50 text-amber-700',
    EVIDENCE_PENDING: 'bg-sky-50 text-sky-700',
    ESCALATED: 'bg-orange-50 text-orange-700',
    RESOLUTION_PROPOSED: 'bg-indigo-50 text-indigo-700',
    CUSTOMER_APPROVAL: 'bg-fuchsia-50 text-fuchsia-700',
    NEGOTIATION: 'bg-violet-50 text-violet-700',
    RESOLVED: 'bg-emerald-50 text-emerald-600',
    CREDIT_ISSUED: 'bg-emerald-50 text-emerald-600',
    CLOSED: 'bg-slate-100 text-slate-600',
    AUTO_CLOSED: 'bg-slate-100 text-slate-600',
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${styles[status] || styles.OPEN}`}>
      {status.replaceAll('_', ' ')}
    </span>
  );
}
