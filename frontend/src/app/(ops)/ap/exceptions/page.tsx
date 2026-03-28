"use client";

import React from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { ChevronLeft, AlertTriangle, Plus, X } from 'lucide-react';
import Link from 'next/link';

interface PendingBill {
  id: string;
  invoice_no: string;
  vendor?: { name?: string };
}

interface ExceptionRecord {
  id: string;
  reason_code: string;
  reason: string;
  status: string;
  created_at: string;
  invoice_id: string;
}

export default function ExceptionLogPage() {
  const { isAuthenticated } = useAuthStore();
  const [records, setRecords] = React.useState<ExceptionRecord[]>([]);
  const [bills, setBills] = React.useState<PendingBill[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ invoice_id: '', reason_code: '', reason: '' });

  const fetchData = React.useCallback(async () => {
    try {
      const [excRes, dashRes] = await Promise.all([apiFetch('/ap/exceptions'), apiFetch('/ap/dashboard')]);
      if (excRes.ok) setRecords(await excRes.json());
      if (dashRes.ok) {
        const dash = await dashRes.json();
        setBills(dash.pendingInvoices || []);
      }
    } catch (err) {
      console.error('Failed to fetch AP exceptions:', err);
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await apiFetch(`/ap/vendor-bills/${form.invoice_id}/exceptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason_code: form.reason_code,
          reason: form.reason,
        }),
      });
      if (res.ok) {
        setMessage('Exception logged.');
        setForm({ invoice_id: '', reason_code: '', reason: '' });
        setShowForm(false);
        await fetchData();
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to log exception.');
      }
    } catch {
      setMessage('Connection error while logging exception.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/ap" className="p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-slate-500">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-heading text-brand-navy font-bold">AP Exceptions</h1>
            <p className="text-slate-500 text-sm">Track unmatched bills and 3-way match issues.</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-3 bg-brand-navy text-white rounded-2xl font-bold text-sm shadow-xl hover:opacity-90 transition-all">
          <Plus size={18} />
          Log Exception
        </button>
      </div>

      <div className="grid gap-4">
        {records.map((record) => (
          <div key={record.id} className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="text-rose-500" size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-4">
                <div className="font-bold text-brand-navy">{record.reason_code}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400">{record.status}</div>
              </div>
              <div className="mt-1 text-sm text-slate-500">{record.reason}</div>
              <div className="mt-1 text-xs text-slate-400">Bill {record.invoice_id.slice(0, 8).toUpperCase()} · {new Date(record.created_at).toLocaleString()}</div>
            </div>
          </div>
        ))}
        {!records.length && <div className="rounded-[28px] border border-dashed border-slate-200 bg-white py-20 text-center text-slate-400 italic">No AP exceptions logged yet.</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brand-navy/60 backdrop-blur-sm px-4 py-10">
          <div className="w-full max-w-3xl overflow-hidden rounded-[40px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50 p-8">
              <div>
                <h2 className="text-2xl font-heading text-brand-navy">Log AP Exception</h2>
                <p className="text-sm text-slate-400">Record a 3-way match or approval issue.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="rounded-2xl border border-slate-200 bg-white p-3 transition-all hover:bg-slate-50">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-6 p-8">
              <Field label="Bill">
                <select value={form.invoice_id} onChange={(e) => setForm((prev) => ({ ...prev, invoice_id: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-gold focus:bg-white" required>
                  <option value="">Select bill</option>
                  {bills.map((bill) => <option key={bill.id} value={bill.id}>{bill.vendor?.name || 'Vendor'} · {bill.invoice_no}</option>)}
                </select>
              </Field>
              <Field label="Reason Code">
                <input value={form.reason_code} onChange={(e) => setForm((prev) => ({ ...prev, reason_code: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-gold focus:bg-white" required />
              </Field>
              <div className="col-span-2">
                <Field label="Reason">
                  <textarea value={form.reason} onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))} className="w-full min-h-[140px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-gold focus:bg-white" required />
                </Field>
              </div>
              <div className="col-span-2 text-sm text-slate-500">{message}</div>
              <div className="col-span-2 flex justify-end gap-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 font-bold text-slate-400 hover:text-slate-600">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-2xl bg-brand-navy px-10 py-4 font-heading text-lg text-white shadow-xl transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? 'Saving...' : 'Log Exception'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
