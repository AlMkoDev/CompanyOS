"use client";

import React from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { ChevronLeft, CheckCircle2, Plus, X } from 'lucide-react';
import Link from 'next/link';

interface VendorRecord { id: string; name: string; }

interface ManualEntryRecord {
  id: string;
  entry_no: string;
  description: string;
  reason: string;
  amount: number | string;
  tax_amount?: number | string | null;
  status: string;
  vendor?: VendorRecord | null;
}

export default function ManualEntriesPage() {
  const { isAuthenticated } = useAuthStore();
  const [entries, setEntries] = React.useState<ManualEntryRecord[]>([]);
  const [vendors, setVendors] = React.useState<VendorRecord[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [form, setForm] = React.useState({ description: '', reason: '', vendor_id: '', amount: '', tax_amount: '' });

  const fetchData = React.useCallback(async () => {
    try {
      const [entriesRes, vendorRes] = await Promise.all([apiFetch('/ap/manual-entries'), apiFetch('/ap/vendors')]);
      if (entriesRes.ok) setEntries(await entriesRes.json());
      if (vendorRes.ok) setVendors(await vendorRes.json());
    } catch (err) {
      console.error('Failed to fetch manual entries:', err);
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [fetchData, isAuthenticated]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await apiFetch('/ap/manual-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: form.description,
          reason: form.reason,
          vendor_id: form.vendor_id || undefined,
          amount: Number(form.amount),
          tax_amount: form.tax_amount ? Number(form.tax_amount) : undefined,
        }),
      });
      if (res.ok) {
        setMessage('Manual AP entry submitted.');
        setForm({ description: '', reason: '', vendor_id: '', amount: '', tax_amount: '' });
        setShowForm(false);
        await fetchData();
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to submit manual entry.');
      }
    } catch {
      setMessage('Connection error while submitting manual entry.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await apiFetch(`/ap/manual-entries/${id}/approve`, { method: 'PUT' });
      if (res.ok) {
        setMessage('Manual AP entry approved.');
        await fetchData();
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to approve manual entry.');
      }
    } catch {
      setMessage('Connection error while approving manual entry.');
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
            <h1 className="text-3xl font-heading text-brand-navy font-bold">Manual AP Entries</h1>
            <p className="text-slate-500 text-sm">Capture non-PO spend for secondary review.</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-3 bg-brand-navy text-white rounded-2xl font-bold text-sm shadow-xl hover:opacity-90 transition-all">
          <Plus size={18} />
          New Entry
        </button>
      </div>

      <div className="grid gap-4">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{entry.entry_no}</div>
              <div className="mt-2 text-lg font-heading text-brand-navy">{entry.description}</div>
              <div className="text-sm text-slate-500">{entry.reason}</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-brand-navy">R {Number(entry.amount || 0).toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400">{entry.status}</div>
            </div>
            {entry.status !== 'approved' && (
              <button onClick={() => handleApprove(entry.id)} className="inline-flex items-center gap-2 self-start md:self-auto rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-600 transition-all hover:bg-emerald-100">
                <CheckCircle2 size={14} />
                Approve
              </button>
            )}
          </div>
        ))}
        {!entries.length && <div className="rounded-[28px] border border-dashed border-slate-200 bg-white py-20 text-center text-slate-400 italic">No manual AP entries captured yet.</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brand-navy/60 backdrop-blur-sm px-4 py-10">
          <div className="w-full max-w-3xl overflow-hidden rounded-[40px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50 p-8">
              <div>
                <h2 className="text-2xl font-heading text-brand-navy">Manual AP Entry</h2>
                <p className="text-sm text-slate-400">Capture a non-PO expense for secondary approval.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="rounded-2xl border border-slate-200 bg-white p-3 transition-all hover:bg-slate-50">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-6 p-8">
              <Field label="Description">
                <input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-gold focus:bg-white" required />
              </Field>
              <Field label="Reason">
                <input value={form.reason} onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-gold focus:bg-white" required />
              </Field>
              <Field label="Vendor">
                <select value={form.vendor_id} onChange={(e) => setForm((prev) => ({ ...prev, vendor_id: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-gold focus:bg-white">
                  <option value="">Select vendor</option>
                  {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
                </select>
              </Field>
              <Field label="Amount">
                <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-gold focus:bg-white" required />
              </Field>
              <Field label="Tax Amount">
                <input type="number" min="0" step="0.01" value={form.tax_amount} onChange={(e) => setForm((prev) => ({ ...prev, tax_amount: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-gold focus:bg-white" />
              </Field>
              <div className="col-span-2 text-sm text-slate-500">{message}</div>
              <div className="col-span-2 flex justify-end gap-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 font-bold text-slate-400 hover:text-slate-600">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-2xl bg-brand-navy px-10 py-4 font-heading text-lg text-white shadow-xl transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? 'Submitting...' : 'Submit Entry'}
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
