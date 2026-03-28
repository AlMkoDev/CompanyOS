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
  CreditCard,
  History,
  Download,
  MoreVertical,
  BellRing,
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
} from 'lucide-react';
import Link from 'next/link';

interface ArCustomer {
  id?: string;
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
  sent_at?: string | null;
  delivered_at?: string | null;
  delivery_method?: string | null;
  last_reminder_at?: string | null;
  reminder_count?: number;
  customer?: ArCustomer;
}

interface ReceiptRecord {
  id: string;
  amount: number | string;
  payment_date: string;
  method?: string;
  reference?: string;
}

interface InvoiceReceiptSummary {
  invoice: ArInvoice & {
    payments?: ReceiptRecord[];
  };
  total_received: number;
  outstanding_balance: number;
  payment_count: number;
}

interface DunningEvent {
  id: string;
  event_type: string;
  stage?: number | null;
  channel?: string | null;
  created_at: string;
  details?: {
    overdue_days?: number;
    outstanding_balance?: number;
    delivered?: boolean;
  };
}

interface InvoiceDunningSummary {
  invoice: ArInvoice;
  overdue_days: number;
  outstanding_balance: number;
  next_reminder_stage?: number | null;
  reminder_history: DunningEvent[];
}

interface DisputeActivity {
  id: string;
  activity_type: string;
  notes?: string | null;
  created_at: string;
}

interface DisputeCase {
  id: string;
  status: string;
  priority: string;
  dispute_type: string;
  disputed_amount: number | string;
  resolved_amount?: number | string | null;
  due_date: string;
  reason_code?: string | null;
  product_code?: string | null;
  blocks_payment: boolean;
  affects_revenue: boolean;
  resolution_notes?: string | null;
  activities: DisputeActivity[];
}

interface InvoiceActionButtonProps {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

type FeedbackState = {
  tone: 'success' | 'error' | 'info';
  text: string;
} | null;

export default function ArInvoicesPage() {
  const { isAuthenticated } = useAuthStore();
  const [invoices, setInvoices] = React.useState<ArInvoice[]>([]);
  const [customers, setCustomers] = React.useState<ArCustomer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);
  const [showPaymentForm, setShowPaymentForm] = React.useState(false);
  const [showReceiptHistory, setShowReceiptHistory] = React.useState(false);
  const [showDunningPanel, setShowDunningPanel] = React.useState(false);
  const [showDisputePanel, setShowDisputePanel] = React.useState(false);
  const [selectedInvoice, setSelectedInvoice] = React.useState<ArInvoice | null>(null);
  const [receiptSummary, setReceiptSummary] = React.useState<InvoiceReceiptSummary | null>(null);
  const [dunningSummary, setDunningSummary] = React.useState<InvoiceDunningSummary | null>(null);
  const [disputes, setDisputes] = React.useState<DisputeCase[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [feedback, setFeedback] = React.useState<FeedbackState>(null);
  const [form, setForm] = React.useState({
    customer_id: '',
    invoice_no: '',
    amount: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
  });
  const [paymentForm, setPaymentForm] = React.useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    method: 'Bank Transfer',
    reference: '',
  });
  const [disputeForm, setDisputeForm] = React.useState({
    dispute_type: 'QUALITY',
    priority: 'MEDIUM',
    disputed_amount: '',
    reason_code: '',
    product_code: '',
    notes: '',
    blocks_payment: true,
    affects_revenue: true,
  });

  const fetchInvoices = React.useCallback(async () => {
    try {
      const res = await apiFetch('/ar/invoices');
      if (res.ok) {
        setInvoices(await res.json());
        setLoadError('');
      } else {
        const data = await res.json().catch(() => null);
        setLoadError(data?.message || `Failed to load invoices (${res.status}).`);
        setFeedback({
          tone: 'error',
          text: data?.message || `Failed to load invoices (${res.status}).`,
        });
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
      setLoadError('Connection error while loading invoices.');
      setFeedback({
        tone: 'error',
        text: 'Connection error while loading invoices.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomers = React.useCallback(async () => {
    try {
      const res = await apiFetch('/ar/customers');
      if (res.ok) setCustomers(await res.json());
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchInvoices();
      fetchCustomers();
    }
  }, [fetchCustomers, fetchInvoices, isAuthenticated]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setFeedback(null);
    try {
      const res = await apiFetch('/ar/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: form.customer_id,
          invoice_no: form.invoice_no || undefined,
          amount: Number(form.amount),
          invoice_date: form.invoice_date ? new Date(form.invoice_date).toISOString() : undefined,
          due_date: form.due_date ? new Date(form.due_date).toISOString() : undefined,
        }),
      });

      if (res.ok) {
        setMessage('Invoice issued successfully.');
        setFeedback({ tone: 'success', text: 'Invoice issued successfully.' });
        setShowForm(false);
        setForm({
          customer_id: '',
          invoice_no: '',
          amount: '',
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: '',
        });
        await fetchInvoices();
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to issue invoice.');
        setFeedback({ tone: 'error', text: data?.message || 'Failed to issue invoice.' });
      }
    } catch {
      setMessage('Connection error while issuing invoice.');
      setFeedback({ tone: 'error', text: 'Connection error while issuing invoice.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const outstanding = Math.max(0, Number(selectedInvoice.amount) - Number(selectedInvoice.paid_amount));
    if (Number(paymentForm.amount) > outstanding + 0.009) {
      setMessage(`Payment exceeds the outstanding balance of R ${outstanding.toLocaleString()}.`);
      setFeedback({
        tone: 'error',
        text: `Payment exceeds the outstanding balance of R ${outstanding.toLocaleString()}.`,
      });
      return;
    }

    setSaving(true);
    setMessage('');
    setFeedback(null);

    try {
      const res = await apiFetch('/ar/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: selectedInvoice.id,
          amount: Number(paymentForm.amount),
          payment_date: paymentForm.payment_date ? new Date(paymentForm.payment_date).toISOString() : undefined,
          method: paymentForm.method || undefined,
          reference: paymentForm.reference || undefined,
        }),
      });

      if (res.ok) {
        setMessage('Payment recorded successfully.');
        setFeedback({ tone: 'success', text: 'Payment recorded successfully.' });
        setShowPaymentForm(false);
        setSelectedInvoice(null);
        setPaymentForm({
          amount: '',
          payment_date: new Date().toISOString().split('T')[0],
          method: 'Bank Transfer',
          reference: '',
        });
        await fetchInvoices();
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to record payment.');
        setFeedback({ tone: 'error', text: data?.message || 'Failed to record payment.' });
      }
    } catch {
      setMessage('Connection error while recording payment.');
      setFeedback({ tone: 'error', text: 'Connection error while recording payment.' });
    } finally {
      setSaving(false);
    }
  };

  const handleViewReceipts = async (invoice: ArInvoice) => {
    setMessage('');
    setFeedback(null);
    setSelectedInvoice(invoice);
    try {
      const res = await apiFetch(`/ar/invoices/${invoice.id}/receipts`);
      if (res.ok) {
        setReceiptSummary(await res.json());
        setShowReceiptHistory(true);
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to load receipt history.');
        setFeedback({ tone: 'error', text: data?.message || 'Failed to load receipt history.' });
      }
    } catch {
      setMessage('Connection error while loading receipt history.');
      setFeedback({ tone: 'error', text: 'Connection error while loading receipt history.' });
    }
  };

  const handleSendInvoice = async (invoice: ArInvoice) => {
    setFeedback(null);
    try {
      const res = await apiFetch(`/ar/invoices/${invoice.id}/send`, {
        method: 'POST',
      });
      if (res.ok) {
        setMessage(`Invoice ${invoice.invoice_no} sent successfully.`);
        setFeedback({ tone: 'success', text: `Invoice ${invoice.invoice_no} sent successfully.` });
        await fetchInvoices();
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to send invoice.');
        setFeedback({ tone: 'error', text: data?.message || 'Failed to send invoice.' });
      }
    } catch {
      setMessage('Connection error while sending invoice.');
      setFeedback({ tone: 'error', text: 'Connection error while sending invoice.' });
    }
  };

  const handleOpenDunningPanel = async (invoice: ArInvoice) => {
    setMessage('');
    setFeedback(null);
    setSelectedInvoice(invoice);

    try {
      const res = await apiFetch(`/ar/invoices/${invoice.id}/dunning`);
      if (res.ok) {
        setDunningSummary(await res.json());
        setShowDunningPanel(true);
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to load delivery and reminder history.');
        setFeedback({ tone: 'error', text: data?.message || 'Failed to load delivery and reminder history.' });
      }
    } catch {
      setMessage('Connection error while loading delivery and reminder history.');
      setFeedback({ tone: 'error', text: 'Connection error while loading delivery and reminder history.' });
    }
  };

  const handleOpenDisputePanel = async (invoice: ArInvoice) => {
    setMessage('');
    setFeedback(null);
    setSelectedInvoice(invoice);
    setDisputeForm((prev) => ({
      ...prev,
      disputed_amount: String(Math.max(0, Number(invoice.amount) - Number(invoice.paid_amount))),
    }));

    try {
      const res = await apiFetch(`/ar/invoices/${invoice.id}/disputes`);
      if (res.ok) {
        setDisputes(await res.json());
        setShowDisputePanel(true);
      } else {
        const data = await res.json().catch(() => null);
        setFeedback({ tone: 'error', text: data?.message || 'Failed to load disputes.' });
      }
    } catch {
      setFeedback({ tone: 'error', text: 'Connection error while loading disputes.' });
    }
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setSaving(true);
    setFeedback(null);

    try {
      const res = await apiFetch('/ar/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: selectedInvoice.id,
          dispute_type: disputeForm.dispute_type,
          priority: disputeForm.priority,
          disputed_amount: Number(disputeForm.disputed_amount),
          reason_code: disputeForm.reason_code || undefined,
          product_code: disputeForm.product_code || undefined,
          notes: disputeForm.notes || undefined,
          blocks_payment: disputeForm.blocks_payment,
          affects_revenue: disputeForm.affects_revenue,
        }),
      });

      if (res.ok) {
        setFeedback({ tone: 'success', text: `Dispute opened for invoice ${selectedInvoice.invoice_no}.` });
        await fetchInvoices();
        await handleOpenDisputePanel(selectedInvoice);
      } else {
        const data = await res.json().catch(() => null);
        setFeedback({ tone: 'error', text: data?.message || 'Failed to open dispute.' });
      }
    } catch {
      setFeedback({ tone: 'error', text: 'Connection error while opening dispute.' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDisputeStatus = async (disputeId: string, status: string) => {
    setSaving(true);
    setFeedback(null);

    try {
      const res = await apiFetch(`/ar/disputes/${disputeId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setFeedback({ tone: 'success', text: `Dispute moved to ${status.replaceAll('_', ' ')}.` });
        if (selectedInvoice) {
          await fetchInvoices();
          await handleOpenDisputePanel(selectedInvoice);
        }
      } else {
        const data = await res.json().catch(() => null);
        setFeedback({ tone: 'error', text: data?.message || 'Failed to update dispute status.' });
      }
    } catch {
      setFeedback({ tone: 'error', text: 'Connection error while updating dispute status.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendReminder = async () => {
    if (!selectedInvoice) return;

    setSaving(true);
    setMessage('');
    setFeedback(null);

    try {
      const res = await apiFetch(`/ar/invoices/${selectedInvoice.id}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: dunningSummary?.invoice.delivery_method || 'email',
        }),
      });

      if (res.ok) {
        setMessage(`Reminder sent for invoice ${selectedInvoice.invoice_no}.`);
        setFeedback({ tone: 'success', text: `Reminder sent for invoice ${selectedInvoice.invoice_no}.` });
        await fetchInvoices();
        await handleOpenDunningPanel(selectedInvoice);
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to send reminder.');
        setFeedback({ tone: 'error', text: data?.message || 'Failed to send reminder.' });
      }
    } catch {
      setMessage('Connection error while sending reminder.');
      setFeedback({ tone: 'error', text: 'Connection error while sending reminder.' });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCollectionCase = async (invoice: ArInvoice) => {
    setFeedback(null);
    try {
      const res = await apiFetch('/ar/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          notes: `Collection case opened from invoice queue for ${invoice.invoice_no}.`,
        }),
      });

      if (res.ok) {
        setMessage(`Collection case opened for invoice ${invoice.invoice_no}.`);
        setFeedback({ tone: 'success', text: `Collection case opened for invoice ${invoice.invoice_no}.` });
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to open collection case.');
        setFeedback({ tone: 'error', text: data?.message || 'Failed to open collection case.' });
      }
    } catch {
      setMessage('Connection error while opening collection case.');
      setFeedback({ tone: 'error', text: 'Connection error while opening collection case.' });
    }
  };

  const handleComingSoonAction = (label: string) => {
    setMessage(`${label} is queued for a later refinement pass.`);
    setFeedback({ tone: 'info', text: `${label} is queued for a later refinement pass.` });
  };

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
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-brand-navy text-white rounded-2xl font-bold text-sm shadow-xl hover:opacity-90 transition-all"
          >
            <Plus size={18} />
            Issue Invoice
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        <div className="p-8 border-b border-slate-50 relative">
          <Search className="absolute left-12 top-11 text-slate-300" size={18} />
          <input type="text" placeholder="Search by customer name, invoice #, or reference..." className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-brand-gold text-sm font-medium" />
        </div>

        {loadError && (
          <div className="mx-8 mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {loadError}
          </div>
        )}

        {feedback && (
          <div
            className={`mx-8 mt-6 rounded-2xl px-5 py-4 text-sm ${
              feedback.tone === 'success'
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                : feedback.tone === 'error'
                  ? 'border border-rose-200 bg-rose-50 text-rose-700'
                  : 'border border-sky-200 bg-sky-50 text-sky-700'
            }`}
          >
            {feedback.text}
          </div>
        )}

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
                    <div className="text-[10px] text-emerald-500 font-bold">RECEIVED R {Number(inv.paid_amount).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 font-bold">OPEN R {Math.max(0, Number(inv.amount) - Number(inv.paid_amount)).toLocaleString()}</div>
                  </td>
                  <td className="py-6 px-8">
                       <StatusBadge status={inv.status} />
                  </td>
                  <td className="py-6 px-8 text-right">
                    <div className="flex gap-2 justify-end opacity-100 transition-all">
                      <InvoiceActionButton label="Send invoice" onClick={() => handleSendInvoice(inv)}>
                        <Mail size={16} />
                      </InvoiceActionButton>
                      <InvoiceActionButton
                        label="Record payment"
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setPaymentForm((prev) => ({ ...prev, amount: String(Number(inv.amount) - Number(inv.paid_amount)) }));
                          setShowPaymentForm(true);
                        }}
                      >
                        <CreditCard size={16} />
                      </InvoiceActionButton>
                      <InvoiceActionButton label="View receipt allocation" onClick={() => handleViewReceipts(inv)}>
                        <History size={16} />
                      </InvoiceActionButton>
                      <InvoiceActionButton label="Open collection case" onClick={() => handleOpenCollectionCase(inv)}>
                        <AlertCircle size={16} />
                      </InvoiceActionButton>
                      <InvoiceActionButton label="Delivery & reminders" onClick={() => handleOpenDunningPanel(inv)}>
                        <BellRing size={16} />
                      </InvoiceActionButton>
                      <InvoiceActionButton label="Manage disputes" onClick={() => handleOpenDisputePanel(inv)}>
                        <ShieldAlert size={16} />
                      </InvoiceActionButton>
                      <InvoiceActionButton label="Download invoice PDF (Coming soon)" onClick={() => handleComingSoonAction('Invoice PDF download')} disabled>
                        <Download size={16} />
                      </InvoiceActionButton>
                      <InvoiceActionButton label="More invoice actions (Coming soon)" onClick={() => handleComingSoonAction('Additional invoice actions')} disabled>
                        <MoreVertical size={16} />
                      </InvoiceActionButton>
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && !loading && !loadError && (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-400 italic">No invoices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/60 backdrop-blur-sm p-6">
          <div className="bg-white rounded-[40px] w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-heading text-brand-navy">Issue AR Invoice</h2>
                <p className="text-slate-400 text-sm">Bill a customer and track the outstanding balance.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-10 grid grid-cols-2 gap-6">
              <Field label="Customer">
                <select value={form.customer_id} onChange={(e) => setForm((prev) => ({ ...prev, customer_id: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white" required>
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id || customer.name} value={customer.id || customer.name}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Invoice No">
                <input value={form.invoice_no} onChange={(e) => setForm((prev) => ({ ...prev, invoice_no: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white" placeholder="AR-0001" />
              </Field>
              <Field label="Amount">
                <input value={form.amount} onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))} type="number" min="0" step="0.01" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white" placeholder="0.00" required />
              </Field>
              <Field label="Invoice Date">
                <input value={form.invoice_date} onChange={(e) => setForm((prev) => ({ ...prev, invoice_date: e.target.value }))} type="date" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white" />
              </Field>
              <Field label="Due Date">
                <input value={form.due_date} onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))} type="date" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white" />
              </Field>
              <div className="col-span-2 text-sm text-slate-500">{message}</div>
              <div className="col-span-2 flex justify-end gap-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 font-bold text-slate-400">Cancel</button>
                <button type="submit" disabled={saving} className="px-10 py-4 bg-brand-navy text-white rounded-2xl font-heading text-lg shadow-xl hover:opacity-90 transition-all disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentForm && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brand-navy/60 backdrop-blur-sm px-4 py-10">
          <div className="w-full max-w-3xl overflow-hidden rounded-[40px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50 p-8">
              <div>
                <h2 className="text-2xl font-heading text-brand-navy">Record Customer Payment</h2>
                <p className="text-sm text-slate-400">Apply a payment against invoice #{selectedInvoice.invoice_no}.</p>
              </div>
              <button onClick={() => setShowPaymentForm(false)} className="rounded-2xl border border-slate-200 bg-white p-3 transition-all hover:bg-slate-50">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePayment} className="grid grid-cols-2 gap-6 p-8">
              <div className="col-span-2 rounded-3xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Outstanding balance</span>
                  <span className="font-bold text-brand-navy">
                    R {Math.max(0, Number(selectedInvoice.amount) - Number(selectedInvoice.paid_amount)).toLocaleString()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentForm((prev) => ({ ...prev, amount: String(Math.max(0, Number(selectedInvoice.amount) - Number(selectedInvoice.paid_amount))) }))}
                  className="mt-4 text-xs font-black uppercase tracking-widest text-brand-gold hover:underline"
                >
                  Apply Full Outstanding
                </button>
              </div>
              <Field label="Amount">
                <input
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white"
                  required
                />
              </Field>
              <Field label="Payment Date">
                <input
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, payment_date: e.target.value }))}
                  type="date"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white"
                />
              </Field>
              <Field label="Method">
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, method: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white"
                >
                  <option>Bank Transfer</option>
                  <option>Card</option>
                  <option>Cash</option>
                  <option>Cheque</option>
                </select>
              </Field>
              <Field label="Reference">
                <input
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, reference: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white"
                  placeholder="Optional payment reference"
                />
              </Field>
              <div className="col-span-2 text-sm text-slate-500">{message}</div>
              <div className="col-span-2 flex justify-end gap-4">
                <button type="button" onClick={() => setShowPaymentForm(false)} className="px-8 py-4 font-bold text-slate-400 hover:text-slate-600">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded-2xl bg-brand-navy px-10 py-4 font-heading text-lg text-white shadow-xl transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReceiptHistory && receiptSummary && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brand-navy/60 backdrop-blur-sm px-4 py-10">
          <div className="w-full max-w-3xl overflow-hidden rounded-[40px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50 p-8">
              <div>
                <h2 className="text-2xl font-heading text-brand-navy">Receipt Allocation</h2>
                <p className="text-sm text-slate-400">Invoice #{receiptSummary.invoice.invoice_no} · {receiptSummary.invoice.customer?.name}</p>
              </div>
              <button onClick={() => setShowReceiptHistory(false)} className="rounded-2xl border border-slate-200 bg-white p-3 transition-all hover:bg-slate-50">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6 p-8">
              <div className="grid grid-cols-3 gap-4">
                <ReceiptMetric label="Invoice Total" value={`R ${Number(receiptSummary.invoice.amount).toLocaleString()}`} />
                <ReceiptMetric label="Received" value={`R ${receiptSummary.total_received.toLocaleString()}`} />
                <ReceiptMetric label="Outstanding" value={`R ${receiptSummary.outstanding_balance.toLocaleString()}`} />
              </div>
              <div className="rounded-3xl border border-slate-100 bg-white">
                <div className="border-b border-slate-100 px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">
                  Applied Receipts
                </div>
                <div className="divide-y divide-slate-50">
                  {receiptSummary.invoice.payments?.length ? (
                    receiptSummary.invoice.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between px-6 py-4 text-sm">
                        <div>
                          <div className="font-semibold text-slate-900">{payment.method || 'Receipt'}</div>
                          <div className="text-xs text-slate-400">
                            {new Date(payment.payment_date).toLocaleDateString()} {payment.reference ? `· ${payment.reference}` : ''}
                          </div>
                        </div>
                        <div className="font-bold text-brand-navy">R {Number(payment.amount).toLocaleString()}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-10 text-center text-sm italic text-slate-400">No receipts have been applied to this invoice yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDunningPanel && dunningSummary && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brand-navy/60 backdrop-blur-sm px-4 py-10">
          <div className="w-full max-w-4xl overflow-hidden rounded-[40px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50 p-8">
              <div>
                <h2 className="text-2xl font-heading text-brand-navy">Delivery & Reminders</h2>
                <p className="text-sm text-slate-400">
                  Invoice #{dunningSummary.invoice.invoice_no} · {dunningSummary.invoice.customer?.name}
                </p>
              </div>
              <button onClick={() => setShowDunningPanel(false)} className="rounded-2xl border border-slate-200 bg-white p-3 transition-all hover:bg-slate-50">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6 p-8">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <ReceiptMetric
                  label="Sent"
                  value={dunningSummary.invoice.sent_at ? new Date(dunningSummary.invoice.sent_at).toLocaleDateString() : 'Not sent'}
                />
                <ReceiptMetric
                  label="Delivered"
                  value={dunningSummary.invoice.delivered_at ? new Date(dunningSummary.invoice.delivered_at).toLocaleDateString() : 'Pending'}
                />
                <ReceiptMetric
                  label="Next Reminder"
                  value={dunningSummary.next_reminder_stage ? `${dunningSummary.next_reminder_stage}-day` : 'None due'}
                />
                <ReceiptMetric
                  label="Outstanding"
                  value={`R ${dunningSummary.outstanding_balance.toLocaleString()}`}
                />
              </div>

              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-600">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delivery status</div>
                    <div className="mt-2 font-semibold text-slate-900">
                      {dunningSummary.invoice.delivery_method
                        ? `${dunningSummary.invoice.delivery_method.toUpperCase()} dispatch logged`
                        : 'No delivery method logged yet'}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Overdue by {dunningSummary.overdue_days} day{dunningSummary.overdue_days === 1 ? '' : 's'} · {dunningSummary.invoice.reminder_count || 0} reminder(s) sent
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!dunningSummary.next_reminder_stage || saving}
                    onClick={handleSendReminder}
                    className="rounded-2xl bg-brand-navy px-6 py-3 text-sm font-bold text-white shadow-xl transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    {saving ? 'Sending...' : dunningSummary.next_reminder_stage ? `Send ${dunningSummary.next_reminder_stage}-Day Reminder` : 'No Reminder Due'}
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-white">
                <div className="border-b border-slate-100 px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">
                  Reminder History
                </div>
                <div className="divide-y divide-slate-50">
                  {dunningSummary.reminder_history.length ? (
                    dunningSummary.reminder_history.map((event) => (
                      <div key={event.id} className="flex items-center justify-between gap-4 px-6 py-4 text-sm">
                        <div>
                          <div className="font-semibold text-slate-900">
                            {event.event_type === 'invoice_sent'
                              ? 'Invoice delivered'
                              : event.stage
                                ? `${event.stage}-day reminder sent`
                                : 'Reminder event'}
                          </div>
                          <div className="text-xs text-slate-400">
                            {new Date(event.created_at).toLocaleString()}
                            {event.channel ? ` · ${event.channel}` : ''}
                            {typeof event.details?.overdue_days === 'number' ? ` · ${event.details.overdue_days} days overdue` : ''}
                          </div>
                        </div>
                        <div className="text-right text-xs font-bold uppercase tracking-widest text-slate-400">
                          {event.event_type === 'invoice_sent' ? 'Delivery' : 'Dunning'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-10 text-center text-sm italic text-slate-400">No delivery or reminder events have been logged yet.</div>
                  )}
                </div>
              </div>
              <div className="text-sm text-slate-500">{message}</div>
            </div>
          </div>
        </div>
      )}

      {showDisputePanel && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brand-navy/60 backdrop-blur-sm px-4 py-10">
          <div className="w-full max-w-5xl overflow-hidden rounded-[40px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50 p-8">
              <div>
                <h2 className="text-2xl font-heading text-brand-navy">Dispute Workflow</h2>
                <p className="text-sm text-slate-400">
                  Invoice #{selectedInvoice.invoice_no} · {selectedInvoice.customer?.name}
                </p>
              </div>
              <button onClick={() => setShowDisputePanel(false)} className="rounded-2xl border border-slate-200 bg-white p-3 transition-all hover:bg-slate-50">
                <X size={20} />
              </button>
            </div>
            <div className="grid gap-8 p-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-100 bg-white">
                  <div className="border-b border-slate-100 px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">
                    Active Disputes
                  </div>
                  <div className="divide-y divide-slate-50">
                    {disputes.length ? (
                      disputes.map((dispute) => (
                        <div key={dispute.id} className="space-y-4 px-6 py-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="font-semibold text-slate-900">
                                {dispute.dispute_type} · {dispute.priority}
                              </div>
                              <div className="text-xs text-slate-400">
                                Due {new Date(dispute.due_date).toLocaleDateString()}
                                {dispute.product_code ? ` · ${dispute.product_code}` : ''}
                                {dispute.reason_code ? ` · ${dispute.reason_code}` : ''}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <StatusBadge status={dispute.status.toLowerCase()} />
                              <span className="text-sm font-bold text-brand-navy">R {Number(dispute.disputed_amount).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {['UNDER_REVIEW', 'EVIDENCE_PENDING', 'RESOLUTION_PROPOSED', 'RESOLVED', 'CLOSED'].map((nextStatus) => (
                              <button
                                key={nextStatus}
                                type="button"
                                disabled={saving || dispute.status === nextStatus}
                                onClick={() => handleUpdateDisputeStatus(dispute.id, nextStatus)}
                                className="rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all hover:border-brand-gold hover:text-brand-navy disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {nextStatus.replaceAll('_', ' ')}
                              </button>
                            ))}
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Activity</div>
                            <div className="mt-3 space-y-3">
                              {dispute.activities.length ? (
                                dispute.activities.map((activity) => (
                                  <div key={activity.id} className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="font-semibold text-slate-900">{activity.activity_type.replaceAll('_', ' ')}</div>
                                      <div className="text-xs text-slate-500">{activity.notes || 'No notes captured.'}</div>
                                    </div>
                                    <div className="text-[10px] text-slate-400">{new Date(activity.created_at).toLocaleDateString()}</div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs italic text-slate-400">No dispute activity logged yet.</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-6 py-10 text-center text-sm italic text-slate-400">No disputes raised for this invoice yet.</div>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreateDispute} className="space-y-5 rounded-[32px] border border-slate-100 bg-slate-50 p-6">
                <div>
                  <h3 className="text-xl font-heading text-brand-navy">Raise Dispute</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Opening a blocked-payment dispute pauses normal aging and moves the amount into the disputed bucket.
                  </p>
                </div>
                <Field label="Dispute Type">
                  <select value={disputeForm.dispute_type} onChange={(e) => setDisputeForm((prev) => ({ ...prev, dispute_type: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white">
                    <option value="QUALITY">QUALITY</option>
                    <option value="PRICING">PRICING</option>
                    <option value="QUANTITY">QUANTITY</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </Field>
                <Field label="Priority">
                  <select value={disputeForm.priority} onChange={(e) => setDisputeForm((prev) => ({ ...prev, priority: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white">
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </Field>
                <Field label="Disputed Amount">
                  <input value={disputeForm.disputed_amount} onChange={(e) => setDisputeForm((prev) => ({ ...prev, disputed_amount: e.target.value }))} type="number" min="0" step="0.01" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white" required />
                </Field>
                <Field label="Reason Code">
                  <input value={disputeForm.reason_code} onChange={(e) => setDisputeForm((prev) => ({ ...prev, reason_code: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white" placeholder="DAMAGED_IN_TRANSIT" />
                </Field>
                <Field label="Product Code">
                  <input value={disputeForm.product_code} onChange={(e) => setDisputeForm((prev) => ({ ...prev, product_code: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white" placeholder="EGG / POTATO / MARROW" />
                </Field>
                <Field label="Notes">
                  <textarea value={disputeForm.notes} onChange={(e) => setDisputeForm((prev) => ({ ...prev, notes: e.target.value }))} className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white" placeholder="Capture the customer claim and evidence request." />
                </Field>
                <label className="flex items-center gap-3 text-sm text-slate-600">
                  <input type="checkbox" checked={disputeForm.blocks_payment} onChange={(e) => setDisputeForm((prev) => ({ ...prev, blocks_payment: e.target.checked }))} />
                  Block payment and pause normal aging
                </label>
                <label className="flex items-center gap-3 text-sm text-slate-600">
                  <input type="checkbox" checked={disputeForm.affects_revenue} onChange={(e) => setDisputeForm((prev) => ({ ...prev, affects_revenue: e.target.checked }))} />
                  Count amount as revenue at risk
                </label>
                {feedback && (
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      feedback.tone === 'success'
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                        : feedback.tone === 'error'
                          ? 'border border-rose-200 bg-rose-50 text-rose-700'
                          : 'border border-sky-200 bg-sky-50 text-sky-700'
                    }`}
                  >
                    {feedback.text}
                  </div>
                )}
                <button type="submit" disabled={saving} className="w-full rounded-2xl bg-brand-navy px-6 py-4 font-heading text-lg text-white shadow-xl transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? 'Saving...' : 'Raise Dispute'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReceiptMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-heading text-brand-navy">{value}</div>
    </div>
  );
}

function InvoiceActionButton({ label, onClick, children, disabled = false }: InvoiceActionButtonProps) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      title={label}
      aria-label={label}
      aria-disabled={disabled}
      className={`relative group/action p-2.5 rounded-xl border shadow-sm transition-all ${
        disabled
          ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
          : 'border-slate-100 bg-white text-slate-400 hover:text-brand-navy'
      }`}
    >
      {children}
      <span className="pointer-events-none absolute -top-11 right-1/2 translate-x-1/2 whitespace-nowrap rounded-xl bg-brand-navy px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white opacity-0 shadow-xl transition-opacity group-hover/action:opacity-100 group-focus-visible/action:opacity-100">
        {label}
      </span>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-500',
    sent: 'bg-blue-50 text-blue-600',
    partially_paid: 'bg-orange-50 text-orange-600',
    paid: 'bg-emerald-50 text-emerald-600',
    overdue: 'bg-rose-50 text-rose-600',
    open: 'bg-rose-50 text-rose-600',
    under_review: 'bg-amber-50 text-amber-700',
    evidence_pending: 'bg-sky-50 text-sky-700',
    resolution_proposed: 'bg-indigo-50 text-indigo-700',
    resolved: 'bg-emerald-50 text-emerald-600',
    closed: 'bg-slate-100 text-slate-600',
  };
  const labels: Record<string, string> = {
    draft: 'Draft',
    sent: 'Dispatched',
    partially_paid: 'Partial Pay',
    paid: 'Settled',
    overdue: 'Action Required',
    open: 'Open',
    under_review: 'Under Review',
    evidence_pending: 'Evidence Pending',
    resolution_proposed: 'Resolution Proposed',
    resolved: 'Resolved',
    closed: 'Closed',
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${styles[status] ?? styles.draft}`}>
      {status === 'paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
      {labels[status] || status}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</span>
      {children}
    </label>
  );
}
