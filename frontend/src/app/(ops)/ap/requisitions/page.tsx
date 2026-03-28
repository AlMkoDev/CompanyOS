"use client";

import React from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { ChevronLeft, CheckCircle2, FileText, Plus, X } from 'lucide-react';
import Link from 'next/link';

interface VendorRecord {
  id: string;
  name: string;
}

interface RequisitionRecord {
  id: string;
  requisition_no: string;
  title: string;
  justification?: string | null;
  amount_estimate?: number | string | null;
  status: string;
  vendor?: VendorRecord | null;
  requester?: { first_name?: string; last_name?: string } | null;
}

export default function RequisitionsPage() {
  const { isAuthenticated } = useAuthStore();
  const [requisitions, setRequisitions] = React.useState<RequisitionRecord[]>([]);
  const [vendors, setVendors] = React.useState<VendorRecord[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [form, setForm] = React.useState({
    title: '',
    vendor_id: '',
    amount_estimate: '',
    justification: '',
  });

  const fetchData = React.useCallback(async () => {
    try {
      const [reqRes, vendorRes] = await Promise.all([
        apiFetch('/ap/requisitions'),
        apiFetch('/ap/vendors'),
      ]);
      if (reqRes.ok) setRequisitions(await reqRes.json());
      if (vendorRes.ok) setVendors(await vendorRes.json());
    } catch (err) {
      console.error('Failed to fetch requisitions:', err);
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
      const res = await apiFetch('/ap/requisitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          vendor_id: form.vendor_id || undefined,
          amount_estimate: form.amount_estimate ? Number(form.amount_estimate) : undefined,
          justification: form.justification || undefined,
        }),
      });
      if (res.ok) {
        setMessage('Requisition submitted.');
        setForm({ title: '', vendor_id: '', amount_estimate: '', justification: '' });
        setShowForm(false);
        await fetchData();
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to submit requisition.');
      }
    } catch {
      setMessage('Connection error while submitting requisition.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await apiFetch(`/ap/requisitions/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'approved' }),
      });
      if (res.ok) {
        setMessage('Requisition approved.');
        await fetchData();
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to approve requisition.');
      }
    } catch {
      setMessage('Connection error while approving requisition.');
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
            <h1 className="text-3xl font-heading text-brand-navy font-bold">Purchase Requisitions</h1>
            <p className="text-slate-500 text-sm">Request spend before a purchase order is raised.</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-3 bg-brand-navy text-white rounded-2xl font-bold text-sm shadow-xl hover:opacity-90 transition-all">
          <Plus size={18} />
          New Requisition
        </button>
      </div>

      <div className="grid gap-4">
        {requisitions.map((req) => (
          <div key={req.id} className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{req.requisition_no}</div>
              <div className="mt-2 text-lg font-heading text-brand-navy">{req.title}</div>
              <div className="text-sm text-slate-500">{req.vendor?.name || 'Vendor not selected'}</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-brand-navy">R {Number(req.amount_estimate || 0).toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400">{req.status}</div>
            </div>
            {req.status !== 'approved' && (
              <button onClick={() => handleApprove(req.id)} className="inline-flex items-center gap-2 self-start md:self-auto rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-600 transition-all hover:bg-emerald-100">
                <CheckCircle2 size={14} />
                Approve
              </button>
            )}
          </div>
        ))}
        {!requisitions.length && <div className="rounded-[28px] border border-dashed border-slate-200 bg-white py-20 text-center text-slate-400 italic">No requisitions submitted yet.</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brand-navy/60 backdrop-blur-sm px-4 py-10">
          <div className="w-full max-w-3xl overflow-hidden rounded-[40px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50 p-8">
              <div>
                <h2 className="text-2xl font-heading text-brand-navy">Submit Requisition</h2>
                <p className="text-sm text-slate-400">Create a purchase request before PO creation.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="rounded-2xl border border-slate-200 bg-white p-3 transition-all hover:bg-slate-50">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-6 p-8">
              <Field label="Title">
                <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-gold focus:bg-white" required />
              </Field>
              <Field label="Vendor">
                <select value={form.vendor_id} onChange={(e) => setForm((prev) => ({ ...prev, vendor_id: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-gold focus:bg-white">
                  <option value="">Select vendor</option>
                  {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
                </select>
              </Field>
              <Field label="Estimated Amount">
                <input type="number" min="0" step="0.01" value={form.amount_estimate} onChange={(e) => setForm((prev) => ({ ...prev, amount_estimate: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-gold focus:bg-white" />
              </Field>
              <Field label="Justification">
                <input value={form.justification} onChange={(e) => setForm((prev) => ({ ...prev, justification: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-gold focus:bg-white" />
              </Field>
              <div className="col-span-2 text-sm text-slate-500">{message}</div>
              <div className="col-span-2 flex justify-end gap-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 font-bold text-slate-400 hover:text-slate-600">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-2xl bg-brand-navy px-10 py-4 font-heading text-lg text-white shadow-xl transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? 'Submitting...' : 'Submit Requisition'}
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
