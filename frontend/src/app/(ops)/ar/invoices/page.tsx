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
  Clock,
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
  customer?: ArCustomer;
}

export default function ArInvoicesPage() {
  const { isAuthenticated } = useAuthStore();
  const [invoices, setInvoices] = React.useState<ArInvoice[]>([]);
  const [customers, setCustomers] = React.useState<ArCustomer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [form, setForm] = React.useState({
    customer_id: '',
    invoice_no: '',
    amount: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
  });

  const fetchInvoices = React.useCallback(async () => {
    try {
      const res = await apiFetch('/ar/invoices');
      if (res.ok) setInvoices(await res.json());
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
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
      }
    } catch {
      setMessage('Connection error while issuing invoice.');
    } finally {
      setSaving(false);
    }
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</span>
      {children}
    </label>
  );
}

