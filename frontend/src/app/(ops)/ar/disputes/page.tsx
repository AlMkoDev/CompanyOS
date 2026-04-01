"use client";

import React from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AlertCircle, ChevronLeft, Clock3, Filter, FileText, Search, ShieldAlert, MessageSquare, X } from 'lucide-react';

interface DisputeActivity {
  id: string;
  activity_type: string;
  notes?: string | null;
  internal_only?: boolean;
  customer_visible?: boolean;
  mentions?: string[];
  task_title?: string | null;
  task_due_date?: string | null;
  task_priority?: string | null;
  task_status?: string | null;
  notification_channel?: string | null;
  template_key?: string | null;
  actor?: {
    first_name?: string;
    last_name?: string;
  } | null;
  task_assignee?: {
    first_name?: string;
    last_name?: string;
  } | null;
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

interface DisputeDocument {
  id: string;
  document_type: string;
  title: string;
  customer_visible?: boolean;
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
  documents?: DisputeDocument[];
  acceptance_status?: string | null;
  accepted_at?: string | null;
}

const STATUS_OPTIONS = ['ALL', 'OPEN', 'UNDER_REVIEW', 'EVIDENCE_PENDING', 'ESCALATED', 'RESOLUTION_PROPOSED', 'RESOLVED', 'CLOSED'];

export default function ArDisputesPage() {
  const { isAuthenticated } = useAuthStore();
  const [disputes, setDisputes] = React.useState<DisputeRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [message, setMessage] = React.useState('');
  const [selectedDispute, setSelectedDispute] = React.useState<DisputeRecord | null>(null);
  const [savingComment, setSavingComment] = React.useState(false);
  const [activityForm, setActivityForm] = React.useState({
    notes: '',
    mentions: '',
    internal_only: true,
    create_task: false,
    task_title: '',
    task_due_date: '',
    task_priority: 'MEDIUM',
  });

  const fetchDisputes = React.useCallback(async () => {
    try {
      const res = await apiFetch('/ar/disputes');
      if (res.ok) {
        const data = await res.json();
        setDisputes(data);
        setSelectedDispute((current) => (current ? data.find((item: DisputeRecord) => item.id === current.id) || null : null));
        setMessage('');
        return data as DisputeRecord[];
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to load dispute register.');
      }
    } catch {
      setMessage('Connection error while loading dispute register.');
    } finally {
      setLoading(false);
    }
    return [];
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

  const handleOpenHub = (dispute: DisputeRecord) => {
    setSelectedDispute(dispute);
    setActivityForm({
      notes: '',
      mentions: '',
      internal_only: true,
      create_task: false,
      task_title: '',
      task_due_date: '',
      task_priority: 'MEDIUM',
    });
    setMessage('');
  };

  const handleGenerateDossier = async (disputeId: string) => {
    setMessage('');
    try {
      const res = await apiFetch(`/ar/disputes/${disputeId}/dossier`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to generate compliance dossier.');
        return;
      }

      const data = await res.json().catch(() => null);
      setMessage(data?.reused_existing ? 'Existing compliance dossier is already available.' : 'Compliance dossier generated.');
      await refreshDisputes();
    } catch {
      setMessage('Connection error while generating compliance dossier.');
    }
  };

  const getLatestInternalDossiers = (documents?: DisputeDocument[]) => {
    const internalDocs = (documents || []).filter((document) => !document.customer_visible);
    const latestByKey = new Map<string, DisputeDocument>();

    for (const document of internalDocs) {
      const key = `${document.document_type}::${document.title}`;
      const existing = latestByKey.get(key);
      if (!existing || new Date(document.created_at).getTime() > new Date(existing.created_at).getTime()) {
        latestByKey.set(key, document);
      }
    }

    return Array.from(latestByKey.values()).sort(
      (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    );
  };

  const refreshDisputes = async () => {
    await fetchDisputes();
  };

  const handleAddActivity = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedDispute || !activityForm.notes.trim()) {
      return;
    }

    setSavingComment(true);
    try {
      const mentions = activityForm.mentions
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      const res = await apiFetch(`/ar/disputes/${selectedDispute.id}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: activityForm.create_task ? 'INTERNAL_TASK_COMMENT' : 'INTERNAL_COMMENT',
          notes: activityForm.notes,
          internal_only: activityForm.internal_only,
          mentions,
          task_title: activityForm.create_task ? activityForm.task_title || 'Dispute follow-up' : undefined,
          task_due_date: activityForm.create_task && activityForm.task_due_date ? new Date(activityForm.task_due_date).toISOString() : undefined,
          task_priority: activityForm.create_task ? activityForm.task_priority : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to add collaboration update.');
        return;
      }

      setMessage('Collaboration update saved.');
      await refreshDisputes();
    } catch {
      setMessage('Connection error while saving collaboration update.');
    } finally {
      setSavingComment(false);
    }
  };

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
                    {dispute.acceptance_status ? (
                      <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-400">
                        Closure {dispute.acceptance_status.replaceAll('_', ' ')}
                        {dispute.accepted_at ? ` · ${new Date(dispute.accepted_at).toLocaleDateString()}` : ''}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/ar/invoices`}
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50"
                      >
                        Open Invoice Workspace
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleOpenHub(dispute)}
                        className="rounded-full border border-brand-gold/30 bg-brand-gold/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-brand-navy transition-all hover:bg-brand-gold/20"
                      >
                        Collaboration Hub
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateDossier(dispute.id)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50"
                      >
                        Export Dossier
                      </button>
                      {dispute.resolutions?.[0] && (
                        <div className="text-[10px] uppercase tracking-widest text-slate-400">
                          Latest resolution: {dispute.resolutions[0].status}
                        </div>
                      )}
                      {dispute.documents?.some((document) => document.document_type === 'COMPLIANCE_DOSSIER') ? (
                        <div className="text-[10px] uppercase tracking-widest text-emerald-600">
                          Dossier ready
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredDisputes.length && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm italic text-slate-400">
                    <div className="space-y-2">
                      <div>No disputes match the current filter.</div>
                      {!disputes.length ? (
                        <div className="text-xs not-italic text-slate-500">
                          The Collaboration Hub becomes available once at least one dispute is logged in the register.
                        </div>
                      ) : null}
                    </div>
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

      {selectedDispute ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-brand-navy/60 p-4 backdrop-blur-sm md:p-6">
          <div className="my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[36px] border border-white/60 bg-[linear-gradient(180deg,#fefefe_0%,#f8fafc_100%)] shadow-[0_30px_120px_rgba(15,23,42,0.28)]">
            <div className="border-b border-slate-200/70 bg-[radial-gradient(circle_at_top_left,rgba(212,163,25,0.14),transparent_38%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-6 py-6 md:px-8 md:py-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand-gold/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-brand-gold">
                      Internal Workspace
                    </span>
                    <StatusBadge status={selectedDispute.status} />
                  </div>
                  <h2 className="font-heading text-3xl leading-tight text-brand-navy">Collaboration Hub</h2>
                  <p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base">
                    {selectedDispute.case_number || selectedDispute.id} · {selectedDispute.invoice?.customer?.name || 'Unknown customer'} · Invoice {selectedDispute.invoice?.invoice_no || 'Unlinked'}
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <HubMetric
                      label="Disputed Value"
                      value={`R ${Number(selectedDispute.disputed_amount).toLocaleString()}`}
                    />
                    <HubMetric
                      label="Evidence Items"
                      value={String(selectedDispute.attachments?.length || 0)}
                    />
                    <HubMetric
                      label="Timeline Events"
                      value={String(selectedDispute.activities?.length || 0)}
                    />
                    <HubMetric
                      label="Closure State"
                      value={selectedDispute.acceptance_status ? selectedDispute.acceptance_status.replaceAll('_', ' ') : 'No acceptance flow'}
                    />
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDispute(null)}
                  className="rounded-2xl border border-slate-200 bg-white/90 p-3 text-slate-700 shadow-sm transition-all hover:bg-white"
                >
                <X size={20} />
                </button>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 gap-6 overflow-hidden p-4 md:p-6 xl:grid-cols-[minmax(0,1.4fr)_380px]">
              <div className="flex min-h-0 flex-col overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Unified Timeline
                  </div>
                  <div className="text-[11px] uppercase tracking-widest text-slate-400">
                    Latest first
                  </div>
                </div>
                <div className="min-h-0 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 md:p-6">
                  {selectedDispute.activities?.length ? (
                    selectedDispute.activities.map((activity) => (
                      <div key={activity.id} className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-brand-navy">{activity.activity_type.replaceAll('_', ' ')}</span>
                              {activity.internal_only ? (
                                <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">Internal Only</span>
                              ) : null}
                              {activity.customer_visible ? (
                                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">Customer Visible</span>
                              ) : null}
                              {activity.notification_channel ? (
                                <span className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-sky-700">{activity.notification_channel}</span>
                              ) : null}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              {activity.actor?.first_name || activity.actor?.last_name
                                ? `${activity.actor?.first_name || ''} ${activity.actor?.last_name || ''}`.trim()
                                : 'System'}
                              {' · '}
                              {new Date(activity.created_at).toLocaleString()}
                            </div>
                          </div>
                          {activity.template_key ? (
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Template {activity.template_key}
                            </div>
                          ) : null}
                        </div>
                        {activity.notes ? <div className="mt-4 text-sm text-slate-600">{activity.notes}</div> : null}
                        {activity.mentions?.length ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {activity.mentions.map((mention) => (
                              <span key={mention} className="rounded-full bg-brand-navy/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-navy">
                                @{mention}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {activity.task_title ? (
                          <div className="mt-4 rounded-2xl border border-brand-gold/20 bg-white px-4 py-3 text-sm text-slate-600">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Follow-up Task</div>
                            <div className="mt-2 font-semibold text-slate-900">{activity.task_title}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              {activity.task_assignee?.first_name || activity.task_assignee?.last_name
                                ? `Assigned to ${`${activity.task_assignee?.first_name || ''} ${activity.task_assignee?.last_name || ''}`.trim()}`
                                : 'Assigned to dispute owner'}
                              {activity.task_due_date ? ` · Due ${new Date(activity.task_due_date).toLocaleDateString()}` : ''}
                              {activity.task_priority ? ` · ${activity.task_priority}` : ''}
                              {activity.task_status ? ` · ${activity.task_status}` : ''}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-sm italic text-slate-400">No collaboration history yet.</div>
                  )}
                </div>
              </div>

              <div className="min-h-0 space-y-5 overflow-y-auto pr-1">
                <div className="rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-sm">
                  <div className="mb-4">
                    <h3 className="font-heading text-xl text-brand-navy">Export Hub</h3>
                    <p className="text-sm text-slate-500">Generate and review audit-ready dossier documents for legal and compliance use.</p>
                  </div>
                  <div className="space-y-3">
                    {getLatestInternalDossiers(selectedDispute.documents).length ? (
                      getLatestInternalDossiers(selectedDispute.documents)
                        .map((document) => (
                          <div key={document.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <div className="text-sm font-semibold text-brand-navy">{document.title}</div>
                            <div className="mt-1 text-[11px] uppercase tracking-widest text-slate-400">
                              {document.document_type.replaceAll('_', ' ')} · {new Date(document.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        No internal dossier exports yet for this dispute.
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleGenerateDossier(selectedDispute.id)}
                      className="w-full rounded-2xl border border-brand-gold/30 bg-brand-gold/10 px-5 py-3 text-sm font-bold text-brand-navy transition-all hover:bg-brand-gold/20"
                    >
                      Generate Compliance Dossier
                    </button>
                  </div>
                </div>

                <div className="rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <MessageSquare className="text-brand-gold" size={18} />
                    <div>
                      <h3 className="font-heading text-xl text-brand-navy">Add Collaboration Update</h3>
                      <p className="text-sm text-slate-500">Post an internal note, tag teammates, and optionally create a follow-up task.</p>
                    </div>
                  </div>

                  <form onSubmit={handleAddActivity} className="space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-400">Internal note</span>
                      <textarea
                        value={activityForm.notes}
                        onChange={(e) => setActivityForm((prev) => ({ ...prev, notes: e.target.value }))}
                        className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-brand-gold focus:bg-white"
                        placeholder="Summarize the issue, next action, or decision."
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-400">@Mentions</span>
                      <input
                        value={activityForm.mentions}
                        onChange={(e) => setActivityForm((prev) => ({ ...prev, mentions: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-brand-gold focus:bg-white"
                        placeholder="jane.doe, finance.manager"
                      />
                    </label>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={activityForm.internal_only}
                        onChange={(e) => setActivityForm((prev) => ({ ...prev, internal_only: e.target.checked }))}
                      />
                      Mark as internal-only
                    </label>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={activityForm.create_task}
                        onChange={(e) => setActivityForm((prev) => ({ ...prev, create_task: e.target.checked }))}
                      />
                      Create follow-up task from this note
                    </label>

                    {activityForm.create_task ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="block md:col-span-2">
                          <span className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-400">Task title</span>
                          <input
                            value={activityForm.task_title}
                            onChange={(e) => setActivityForm((prev) => ({ ...prev, task_title: e.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-brand-gold focus:bg-white"
                            placeholder="Follow up with customer on missing POD"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-400">Due date</span>
                          <input
                            type="date"
                            value={activityForm.task_due_date}
                            onChange={(e) => setActivityForm((prev) => ({ ...prev, task_due_date: e.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-brand-gold focus:bg-white"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-400">Priority</span>
                          <select
                            value={activityForm.task_priority}
                            onChange={(e) => setActivityForm((prev) => ({ ...prev, task_priority: e.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-brand-gold focus:bg-white"
                          >
                            <option value="LOW">LOW</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="HIGH">HIGH</option>
                            <option value="CRITICAL">CRITICAL</option>
                          </select>
                        </label>
                      </div>
                    ) : null}

                    {message ? <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">{message}</div> : null}

                    <button
                      type="submit"
                      disabled={savingComment || !activityForm.notes.trim()}
                      className="w-full rounded-2xl bg-brand-navy px-5 py-3 text-sm font-bold text-white shadow-xl transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingComment ? 'Saving...' : 'Save Collaboration Update'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HubMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-semibold capitalize text-brand-navy">{value}</div>
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
