"use client";

import React from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { CheckCircle2, ChevronLeft, Plus, RefreshCw, X } from 'lucide-react';
import Link from 'next/link';

interface VendorRecord {
  id: string;
  name: string;
}

interface PurchaseOrderRecord {
  id: string;
  total: number | string;
  status: string;
  vendor?: VendorRecord;
  created_at?: string;
}

interface ApDashboardResponse {
  recentPOs?: PurchaseOrderRecord[];
}

export default function PurchaseOrdersPage() {
  const { isAuthenticated } = useAuthStore();
  const [purchaseOrders, setPurchaseOrders] = React.useState<PurchaseOrderRecord[]>([]);
  const [vendors, setVendors] = React.useState<VendorRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [form, setForm] = React.useState({
    vendor_id: '',
    total: '',
    order_date: new Date().toISOString().split('T')[0],
  });

  const fetchData = React.useCallback(async () => {
    try {
      const [dashboardRes, vendorRes] = await Promise.all([
        apiFetch('/ap/dashboard'),
        apiFetch('/ap/vendors'),
      ]);

      if (dashboardRes.ok) {
        const data: ApDashboardResponse = await dashboardRes.json();
        setPurchaseOrders(data.recentPOs || []);
      }
      if (vendorRes.ok) {
        setVendors(await vendorRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch purchase orders:', err);
    } finally {
      setLoading(false);
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
      const res = await apiFetch('/ap/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: form.vendor_id,
          total: form.total ? Number(form.total) : undefined,
          order_date: form.order_date ? new Date(form.order_date).toISOString() : undefined,
        }),
      });

      if (res.ok) {
        setMessage('Purchase order created successfully.');
        setShowForm(false);
        setForm({ vendor_id: '', total: '', order_date: new Date().toISOString().split('T')[0] });
        await fetchData();
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to create purchase order.');
      }
    } catch {
      setMessage('Connection error while creating purchase order.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await apiFetch(`/ap/purchase-orders/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        setMessage('Purchase order approved.');
        await fetchData();
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to approve purchase order.');
      }
    } catch {
      setMessage('Connection error while approving purchase order.');
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
            <h1 className="text-3xl font-heading text-brand-navy font-bold">Purchase Orders</h1>
            <p className="text-slate-500 text-sm">Create, review, and approve supplier commitments.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-brand-navy text-white rounded-2xl font-bold text-sm shadow-xl hover:opacity-90 transition-all"
          >
            <Plus size={18} />
            New Order
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-xl font-heading text-brand-navy">Recent Purchase Orders</h3>
            <button onClick={fetchData} className="text-xs font-bold text-brand-gold uppercase tracking-widest hover:underline flex items-center gap-2">
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {loading && <div className="py-20 text-center text-slate-400">Loading purchase orders...</div>}
            {purchaseOrders.map((po) => (
              <div key={po.id} className="p-6 flex items-center justify-between gap-6">
                <div>
                  <div className="font-bold text-brand-navy">{po.vendor?.name || 'Vendor not loaded'}</div>
                  <div className="text-xs text-slate-400">PO #{po.id.slice(0, 8).toUpperCase()}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-brand-navy">R {Number(po.total).toLocaleString()}</div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-400">{po.status}</div>
                </div>
                <div className="flex gap-2">
                  {po.status === 'pending' && (
                    <button
                      onClick={() => handleApprove(po.id)}
                      className="rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-600 transition-all hover:bg-emerald-100"
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!loading && purchaseOrders.length === 0 && (
              <div className="py-20 text-center text-slate-400 italic">No purchase orders found yet.</div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-[32px] bg-brand-navy p-8 text-white shadow-xl">
            <h3 className="text-lg font-heading mb-4">Order Lifecycle</h3>
            <div className="space-y-3 text-sm text-white/75">
              <div>1. Create a supplier commitment</div>
              <div>2. Approve the order</div>
              <div>3. Receive goods and match vendor bills</div>
              <div>4. Send approved bills to payment runs</div>
            </div>
          </div>
          <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-heading text-brand-navy mb-4">Quick Status</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Open orders</span>
              <span className="font-bold text-brand-navy">{purchaseOrders.length}</span>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brand-navy/60 backdrop-blur-sm px-4 py-10">
          <div className="w-full max-w-3xl overflow-hidden rounded-[40px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50 p-8">
              <div>
                <h2 className="text-2xl font-heading text-brand-navy">Create Purchase Order</h2>
                <p className="text-sm text-slate-400">Capture a supplier commitment for AP processing.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="rounded-2xl border border-slate-200 bg-white p-3 transition-all hover:bg-slate-50">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-6 p-8">
              <Field label="Vendor">
                <select
                  value={form.vendor_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, vendor_id: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white"
                  required
                >
                  <option value="">Select vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Order Total">
                <input
                  value={form.total}
                  onChange={(e) => setForm((prev) => ({ ...prev, total: e.target.value }))}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white"
                  placeholder="0.00"
                />
              </Field>
              <Field label="Order Date">
                <input
                  value={form.order_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, order_date: e.target.value }))}
                  type="date"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white"
                />
              </Field>
              <div className="col-span-2 text-sm text-slate-500">{message}</div>
              <div className="col-span-2 flex justify-end gap-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 font-bold text-slate-400 hover:text-slate-600">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded-2xl bg-brand-navy px-10 py-4 font-heading text-lg text-white shadow-xl transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? 'Saving...' : 'Create Order'}
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
