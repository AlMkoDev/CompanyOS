"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, FileText, Plus, Search } from 'lucide-react';
import { apiFetch, apiUrl } from '@/lib/api';
import { normalizeRoleName } from '@/lib/permissions';
import { useAuthStore } from '@/store/authStore';

type InvoiceContext = {
  invoice_id: string;
  invoice_no: string;
  customer_name?: string;
  open_balance: number;
  invoice_amount: number;
  invoice_date: string;
  due_date: string;
  status: string;
};

type EvidenceItem = {
  category: string;
  file_name: string;
  file_type: string;
  file_url?: string;
  reference?: string;
  notes?: string;
};

type LookupResult = {
  case_number: string;
  status: string;
  priority: string;
  dispute_type: string;
  disputed_amount: number;
  submitted_at: string;
  due_date: string;
  evidence_due_date?: string | null;
  customer_name?: string;
  invoice_no?: string;
  timeline: Array<{ id: string; activity_type: string; notes?: string; created_at: string }>;
  evidence_items: Array<{ id: string; category: string; file_name: string; notes?: string | null }>;
};

const emptyEvidence = (): EvidenceItem => ({
  category: 'PHOTO',
  file_name: '',
  file_type: 'image',
  file_url: '',
  reference: '',
  notes: '',
});

const AR_WORKSPACE_ALLOWED_ROLES = new Set([
  'accounts receivable specialist',
  'accounting manager',
  'finance manager',
  'financial controller',
  'finance director',
  'chief financial officer (cfo)',
  'system administrator',
  'super admin',
]);

export default function PublicDisputePortalPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [invoiceNo, setInvoiceNo] = React.useState('');
  const [invoiceContext, setInvoiceContext] = React.useState<InvoiceContext | null>(null);
  const [contextMessage, setContextMessage] = React.useState('');
  const [loadingContext, setLoadingContext] = React.useState(false);
  const [workspaceUser, setWorkspaceUser] = React.useState<{ roles?: string[] } | null>(null);
  const [checkingWorkspaceAccess, setCheckingWorkspaceAccess] = React.useState(true);
  const [returningToWorkspace, setReturningToWorkspace] = React.useState(false);
  const [workspaceMessage, setWorkspaceMessage] = React.useState('');

  const [form, setForm] = React.useState({
    dispute_type: 'QUALITY',
    disputed_amount: '',
    customer_name: '',
    submitter_email: '',
    submitter_phone: '',
    brief_description: '',
    preferred_resolution: 'credit',
    urgency: 'medium',
    reason_code: '',
  });
  const [evidenceItems, setEvidenceItems] = React.useState<EvidenceItem[]>([emptyEvidence()]);
  const [submitMessage, setSubmitMessage] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const [lookupCaseNumber, setLookupCaseNumber] = React.useState('');
  const [lookupInvoiceNo, setLookupInvoiceNo] = React.useState('');
  const [lookupResult, setLookupResult] = React.useState<LookupResult | null>(null);
  const [lookupMessage, setLookupMessage] = React.useState('');
  const [lookingUp, setLookingUp] = React.useState(false);

  React.useEffect(() => {
    const verifyWorkspaceAccess = async () => {
      setCheckingWorkspaceAccess(true);
      try {
        const res = await apiFetch('/auth/me');
        if (!res.ok) {
          setWorkspaceUser(null);
          return;
        }

        const data = (await res.json()) as {
          user?: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            companyId: string;
            roles: string[];
            mfaEnabled?: boolean;
            company?: Record<string, unknown>;
          };
        };

        if (data.user) {
          setAuth(data.user);
          setWorkspaceUser(data.user);
        } else {
          setWorkspaceUser(null);
        }
      } catch {
        setWorkspaceUser(null);
      } finally {
        setCheckingWorkspaceAccess(false);
      }
    };

    verifyWorkspaceAccess();
  }, [setAuth]);

  const canReturnToArWorkspace = React.useMemo(() => {
    if (!workspaceUser?.roles?.length) {
      return false;
    }

    return workspaceUser.roles.some((role) => {
      const normalized = normalizeRoleName(role);
      if (!normalized) {
        return false;
      }

      return AR_WORKSPACE_ALLOWED_ROLES.has(normalized.replace(/_/g, ' '));
    });
  }, [workspaceUser?.roles]);

  const handleReturnToWorkspace = async () => {
    setReturningToWorkspace(true);
    setWorkspaceMessage('');

    try {
      const res = await apiFetch('/auth/me');
      if (!res.ok) {
        setWorkspaceUser(null);
        setWorkspaceMessage('Your workspace session is no longer active. Please reopen the AR workspace from a signed-in session.');
        return;
      }

      const data = (await res.json()) as {
        user?: {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          companyId: string;
          roles: string[];
          mfaEnabled?: boolean;
          company?: Record<string, unknown>;
        };
      };

      if (!data.user) {
        setWorkspaceMessage('Unable to confirm your workspace session right now.');
        return;
      }

      const isArUser = (data.user.roles || []).some((role) => {
        const normalized = normalizeRoleName(role);
        if (!normalized) {
          return false;
        }

        return AR_WORKSPACE_ALLOWED_ROLES.has(normalized.replace(/_/g, ' '));
      });

      if (!isArUser) {
        setWorkspaceMessage('This shortcut is only available to AR workspace users.');
        setWorkspaceUser(data.user);
        return;
      }

      setAuth(data.user);
      setWorkspaceUser(data.user);
      router.push('/ar');
    } catch {
      setWorkspaceMessage('Unable to reconnect to the AR workspace right now.');
    } finally {
      setReturningToWorkspace(false);
    }
  };

  const fetchInvoiceContext = async () => {
    if (!invoiceNo.trim()) {
      setContextMessage('Enter an invoice number to start.');
      setInvoiceContext(null);
      return;
    }

    setLoadingContext(true);
    setContextMessage('');
    try {
      const res = await fetch(apiUrl(`/ar/public/invoices/${encodeURIComponent(invoiceNo.trim())}/context`));
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setInvoiceContext(null);
        setContextMessage(data?.message || 'Invoice not found for dispute intake.');
        return;
      }

      const data = (await res.json()) as InvoiceContext;
      setInvoiceContext(data);
      setForm((prev) => ({
        ...prev,
        customer_name: prev.customer_name || data.customer_name || '',
        disputed_amount: prev.disputed_amount || String(data.open_balance || ''),
      }));
      setLookupInvoiceNo(data.invoice_no);
    } catch {
      setContextMessage('Unable to validate the invoice right now.');
      setInvoiceContext(null);
    } finally {
      setLoadingContext(false);
    }
  };

  const submitDispute = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitMessage('');

    try {
      const payload = {
        invoice_no: invoiceNo.trim(),
        ...form,
        disputed_amount: Number(form.disputed_amount),
        evidence_items: evidenceItems.filter((item) => item.file_name.trim()),
      };

      const res = await fetch(apiUrl('/ar/public/disputes/intake'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setSubmitMessage(data?.message || 'Unable to submit dispute.');
        return;
      }

      setSubmitMessage(`Case ${data.case_number} submitted. Routed to ${data.route_to}.`);
      setLookupCaseNumber(data.case_number);
      setLookupInvoiceNo(invoiceNo.trim());
      setForm((prev) => ({
        ...prev,
        brief_description: '',
      }));
    } catch {
      setSubmitMessage('Unable to submit dispute right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const lookupCase = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!lookupCaseNumber.trim() || !lookupInvoiceNo.trim()) {
      setLookupMessage('Enter both case number and invoice number.');
      return;
    }

    setLookingUp(true);
    setLookupMessage('');
    try {
      const res = await fetch(
        apiUrl(`/ar/public/disputes/${encodeURIComponent(lookupCaseNumber.trim())}?invoiceNo=${encodeURIComponent(lookupInvoiceNo.trim())}`),
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setLookupResult(null);
        setLookupMessage(data?.message || 'Case not found.');
        return;
      }

      setLookupResult(data as LookupResult);
    } catch {
      setLookupMessage('Unable to look up the case right now.');
      setLookupResult(null);
    } finally {
      setLookingUp(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.04),_transparent_45%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-6 py-10 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="font-heading text-4xl text-brand-navy">Dispute Intake Portal</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Submit a structured dispute with evidence at first contact, receive a case ID instantly, and track progress without a login.
            </p>
            {workspaceMessage ? <p className="mt-3 text-sm text-amber-700">{workspaceMessage}</p> : null}
          </div>
          {canReturnToArWorkspace ? (
            <button
              type="button"
              onClick={handleReturnToWorkspace}
              disabled={returningToWorkspace}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-brand-navy shadow-sm disabled:opacity-60"
            >
              {returningToWorkspace ? 'Returning...' : 'Back to Workspace'}
            </button>
          ) : null}
        </div>
        {checkingWorkspaceAccess ? (
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Checking workspace access...</div>
        ) : null}

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <FileText className="text-brand-gold" />
              <div>
                <h2 className="font-heading text-2xl text-brand-navy">Submit a Dispute</h2>
                <p className="text-sm text-slate-500">We auto-fill invoice context first so you do not re-enter what we already know.</p>
              </div>
            </div>

            <div className="mb-6 rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-400">Invoice validation</label>
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="Enter invoice number"
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
                />
                <button
                  type="button"
                  onClick={fetchInvoiceContext}
                  className="rounded-2xl bg-brand-navy px-5 py-3 text-sm font-bold text-white"
                >
                  {loadingContext ? 'Checking...' : 'Validate Invoice'}
                </button>
              </div>
              {contextMessage && <p className="mt-3 text-sm text-rose-600">{contextMessage}</p>}
              {invoiceContext && (
                <div className="mt-4 grid grid-cols-2 gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-slate-700">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</div>
                    <div className="mt-1 font-semibold">{invoiceContext.customer_name || 'Unknown customer'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Open balance</div>
                    <div className="mt-1 font-semibold">R {invoiceContext.open_balance.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice date</div>
                    <div className="mt-1 font-semibold">{new Date(invoiceContext.invoice_date).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Due date</div>
                    <div className="mt-1 font-semibold">{new Date(invoiceContext.due_date).toLocaleDateString()}</div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={submitDispute} className="space-y-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Dispute reason">
                  <select
                    value={form.dispute_type}
                    onChange={(e) => setForm((prev) => ({ ...prev, dispute_type: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
                  >
                    <option value="PRICING">Pricing</option>
                    <option value="QUALITY">Quality</option>
                    <option value="QUANTITY">Quantity</option>
                    <option value="DELIVERY">Delivery</option>
                    <option value="DUPLICATE">Duplicate</option>
                    <option value="OTHER">Other</option>
                  </select>
                </Field>
                <Field label="Disputed amount">
                  <input
                    value={form.disputed_amount}
                    onChange={(e) => setForm((prev) => ({ ...prev, disputed_amount: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
                    required
                  />
                </Field>
                <Field label="Customer contact name">
                  <input
                    value={form.customer_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, customer_name: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
                    required
                  />
                </Field>
                <Field label="Customer email">
                  <input
                    type="email"
                    value={form.submitter_email}
                    onChange={(e) => setForm((prev) => ({ ...prev, submitter_email: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
                    required
                  />
                </Field>
                <Field label="Phone">
                  <input
                    value={form.submitter_phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, submitter_phone: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                </Field>
                <Field label="Preferred resolution">
                  <select
                    value={form.preferred_resolution}
                    onChange={(e) => setForm((prev) => ({ ...prev, preferred_resolution: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
                  >
                    <option value="credit">Credit</option>
                    <option value="adjustment">Adjustment</option>
                    <option value="replacement">Replacement</option>
                    <option value="refund">Refund</option>
                  </select>
                </Field>
              </div>

              <Field label="Brief description">
                <textarea
                  value={form.brief_description}
                  onChange={(e) => setForm((prev) => ({ ...prev, brief_description: e.target.value.slice(0, 200) }))}
                  maxLength={200}
                  className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
                  required
                />
              </Field>

              <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-heading text-xl text-brand-navy">Evidence at Intake</h3>
                    <p className="text-sm text-slate-500">Capture only the evidence that directly supports this dispute.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEvidenceItems((prev) => [...prev, emptyEvidence()])}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-brand-navy"
                  >
                    <Plus size={16} />
                    Add evidence
                  </button>
                </div>
                <div className="space-y-4">
                  {evidenceItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                      <input
                        value={item.file_name}
                        onChange={(e) =>
                          setEvidenceItems((prev) =>
                            prev.map((current, currentIndex) =>
                              currentIndex === index ? { ...current, file_name: e.target.value } : current,
                            ),
                          )
                        }
                        placeholder="File name or evidence reference"
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
                      />
                      <select
                        value={item.category}
                        onChange={(e) =>
                          setEvidenceItems((prev) =>
                            prev.map((current, currentIndex) =>
                              currentIndex === index ? { ...current, category: e.target.value } : current,
                            ),
                          )
                        }
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
                      >
                        <option value="PHOTO">Photo / Video</option>
                        <option value="DOCUMENT">Document</option>
                        <option value="SCREENSHOT">Screenshot</option>
                        <option value="DELIVERY_PROOF">Delivery Proof</option>
                        <option value="COMMUNICATION_LOG">Communication Log</option>
                        <option value="POD">POD</option>
                      </select>
                      <input
                        value={item.file_type}
                        onChange={(e) =>
                          setEvidenceItems((prev) =>
                            prev.map((current, currentIndex) =>
                              currentIndex === index ? { ...current, file_type: e.target.value } : current,
                            ),
                          )
                        }
                        placeholder="Type (pdf, image, video)"
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
                      />
                      <input
                        value={item.file_url || ''}
                        onChange={(e) =>
                          setEvidenceItems((prev) =>
                            prev.map((current, currentIndex) =>
                              currentIndex === index ? { ...current, file_url: e.target.value } : current,
                            ),
                          )
                        }
                        placeholder="Optional file link"
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
                      />
                      <input
                        value={item.reference || ''}
                        onChange={(e) =>
                          setEvidenceItems((prev) =>
                            prev.map((current, currentIndex) =>
                              currentIndex === index ? { ...current, reference: e.target.value } : current,
                            ),
                          )
                        }
                        placeholder="Reference / POD / contract"
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold md:col-span-2"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {submitMessage && <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-brand-navy">{submitMessage}</div>}

              <button
                type="submit"
                disabled={submitting || !invoiceContext}
                className="rounded-2xl bg-brand-navy px-6 py-4 text-sm font-bold text-white disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Dispute'}
              </button>
            </form>
          </div>

          <div className="space-y-8">
            <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <Search className="text-brand-gold" />
                <div>
                  <h2 className="font-heading text-2xl text-brand-navy">Track a Case</h2>
                  <p className="text-sm text-slate-500">No login required for basic lookup.</p>
                </div>
              </div>
              <form onSubmit={lookupCase} className="space-y-4">
                <input
                  value={lookupCaseNumber}
                  onChange={(e) => setLookupCaseNumber(e.target.value)}
                  placeholder="Case ID"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
                />
                <input
                  value={lookupInvoiceNo}
                  onChange={(e) => setLookupInvoiceNo(e.target.value)}
                  placeholder="Invoice number"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
                />
                {lookupMessage && <p className="text-sm text-rose-600">{lookupMessage}</p>}
                <button type="submit" disabled={lookingUp} className="rounded-2xl bg-brand-gold px-5 py-3 text-sm font-bold text-brand-navy">
                  {lookingUp ? 'Checking...' : 'Check Status'}
                </button>
              </form>
            </div>

            {lookupResult && (
              <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-heading text-2xl text-brand-navy">{lookupResult.case_number}</h3>
                    <p className="text-sm text-slate-500">{lookupResult.customer_name} · Invoice {lookupResult.invoice_no}</p>
                  </div>
                  <div className="rounded-full bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-600">
                    {lookupResult.status}
                  </div>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priority</div>
                    <div className="mt-1 font-semibold">{lookupResult.priority}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Disputed amount</div>
                    <div className="mt-1 font-semibold">R {lookupResult.disputed_amount.toLocaleString()}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">Case timeline</h4>
                  {lookupResult.timeline.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-sm font-semibold text-brand-navy">{item.activity_type.replace(/_/g, ' ')}</div>
                        <div className="text-[11px] text-slate-400">{new Date(item.created_at).toLocaleString()}</div>
                      </div>
                      {item.notes && <p className="mt-2 text-sm text-slate-500">{item.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-[32px] border border-orange-100 bg-orange-50 p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 text-orange-500" size={18} />
                <div className="text-sm text-orange-900">
                  <p className="font-semibold">Evidence-first reminder</p>
                  <p className="mt-1">
                    Submit only evidence directly tied to the dispute reason, keep it readable, and consolidate similar items where possible.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      {children}
    </label>
  );
}
