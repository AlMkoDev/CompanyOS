"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Edit3, Layers3, Plus, Search } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface GLAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  parent_id?: string | null;
  is_active?: boolean;
}

const ACCOUNT_TYPES = [
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'equity', label: 'Equity' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'expense', label: 'Expense' },
];

export default function ChartOfAccountsPage() {
  const { isAuthenticated } = useAuthStore();
  const [accounts, setAccounts] = React.useState<GLAccount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editSaving, setEditSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [form, setForm] = React.useState({
    code: '',
    name: '',
    type: 'asset',
    parent_id: '',
  });
  const [editForm, setEditForm] = React.useState({
    code: '',
    name: '',
    type: 'asset',
    parent_id: '',
    is_active: true,
  });

  const loadAccounts = React.useCallback(async () => {
    try {
      const res = await apiFetch('/accounting/accounts');
      if (res.ok) {
        setAccounts(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) loadAccounts();
  }, [isAuthenticated, loadAccounts]);

  const editingAccount = React.useMemo(
    () => accounts.find((account) => account.id === editingId) || null,
    [accounts, editingId],
  );

  React.useEffect(() => {
    if (!editingAccount) return;
    setEditForm({
      code: editingAccount.code,
      name: editingAccount.name,
      type: editingAccount.type,
      parent_id: editingAccount.parent_id || '',
      is_active: editingAccount.is_active !== false,
    });
  }, [editingAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await apiFetch('/accounting/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          type: form.type,
          parent_id: form.parent_id || undefined,
        }),
      });

      if (res.ok) {
        setForm({ code: '', name: '', type: 'asset', parent_id: '' });
        setMessage('Account saved successfully.');
        await loadAccounts();
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to save account.');
      }
    } catch {
      setMessage('Connection error while saving account.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditOpen = (account: GLAccount) => {
    setEditingId(account.id);
    setMessage('');
  };

  const handleEditClose = () => {
    setEditingId(null);
    setEditSaving(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    setEditSaving(true);
    setMessage('');
    try {
      const res = await apiFetch(`/accounting/accounts/${editingAccount.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editForm.code,
          name: editForm.name,
          type: editForm.type,
          parent_id: editForm.parent_id || undefined,
          is_active: editForm.is_active,
        }),
      });

      if (res.ok) {
        setMessage('Account updated successfully.');
        handleEditClose();
        await loadAccounts();
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to update account.');
      }
    } catch {
      setMessage('Connection error while updating account.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleActive = async (account: GLAccount) => {
    setMessage('');
    try {
      const res = await apiFetch(`/accounting/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: account.is_active === false }),
      });

      if (res.ok) {
        await loadAccounts();
        setMessage(account.is_active === false ? 'Account reactivated.' : 'Account deactivated.');
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to update account.');
      }
    } catch {
      setMessage('Connection error while updating account.');
    }
  };

  const filteredAccounts = accounts.filter((account) => {
    const haystack = `${account.code} ${account.name} ${account.type}`.toLowerCase();
    return haystack.includes(search.toLowerCase().trim());
  });

  const grouped = filteredAccounts.reduce<Record<string, GLAccount[]>>((acc, account) => {
    const key = account.type || 'other';
    acc[key] = acc[key] || [];
    acc[key].push(account);
    return acc;
  }, {});

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8">
      <Link href="/accounting" className="flex items-center gap-2 text-slate-500 hover:text-brand-navy mb-2 transition-colors text-sm font-bold">
        <ChevronLeft size={16} />
        Back to Accounting
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-heading text-brand-navy">Chart of Accounts</h1>
              <p className="text-slate-500">Maintain the ledgers used by journals, reports, AP, AR, and bank reconciliation.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 text-brand-gold">
              <Layers3 size={24} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Account Code">
              <input
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white"
                placeholder="1000"
                required
              />
            </Field>
            <Field label="Account Name">
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white"
                placeholder="Cash at Bank"
                required
              />
            </Field>
            <Field label="Type">
              <select
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white"
              >
                {ACCOUNT_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Parent Account">
              <select
                value={form.parent_id}
                onChange={(e) => setForm((prev) => ({ ...prev, parent_id: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white"
              >
                <option value="">None</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="md:col-span-2 flex items-center justify-between gap-4 pt-2">
              <span className="text-sm text-slate-500">{message || 'Accounts are used by journals, AP, AR, and bank work.'}</span>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-navy text-white font-bold shadow-xl disabled:opacity-60"
              >
                <Plus size={18} />
                {saving ? 'Saving...' : 'Save Account'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-heading text-brand-navy">Ledger Snapshot</h2>
              <p className="text-sm text-slate-500">Current active chart structure.</p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
              <Search size={16} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search accounts"
                className="w-40 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-4">
            {loading && <div className="text-sm text-slate-400 italic">Loading accounts...</div>}
            {!loading && Object.keys(grouped).length === 0 && (
              <div className="text-sm text-slate-400 italic">
                {search.trim() ? 'No accounts match your search.' : 'No accounts created yet.'}
              </div>
            )}
            {Object.entries(grouped).map(([type, rows]) => (
              <div key={type} className="rounded-3xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{type}</h3>
                  <span className="text-[10px] font-bold text-slate-500">{rows.length} accounts</span>
                </div>
                <div className="space-y-2">
                  {rows.map((account) => (
                    <div key={account.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 border border-slate-100">
                      <div>
                        <div className="font-semibold text-slate-800">{account.code} - {account.name}</div>
                        <div className="text-[10px] uppercase tracking-widest text-slate-400">
                          {account.parent_id ? 'Sub-account' : 'Top-level account'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${account.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          {account.is_active === false ? 'Inactive' : 'Active'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEditOpen(account)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-brand-gold hover:text-brand-navy transition-colors"
                        >
                          <Edit3 size={12} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(account)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-brand-gold hover:text-brand-navy transition-colors"
                        >
                          {account.is_active === false ? 'Reactivate' : 'Deactivate'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editingAccount && (
        <div className="fixed inset-0 z-[80] bg-slate-950/50 backdrop-blur-sm overflow-y-auto py-8 px-4">
          <div className="min-h-full flex items-start justify-center">
            <div className="w-full max-w-2xl rounded-[32px] bg-white shadow-2xl border border-slate-100 p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-heading text-brand-navy">Edit Account</h2>
                  <p className="text-sm text-slate-500">{editingAccount.code} - {editingAccount.name}</p>
                </div>
                <button
                  type="button"
                  onClick={handleEditClose}
                  className="text-sm font-bold text-slate-400 hover:text-brand-navy"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Account Code">
                  <input
                    value={editForm.code}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, code: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white"
                    required
                  />
                </Field>
                <Field label="Account Name">
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white"
                    required
                  />
                </Field>
                <Field label="Type">
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white"
                  >
                    {ACCOUNT_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Parent Account">
                  <select
                    value={editForm.parent_id}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, parent_id: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white"
                  >
                    <option value="">None</option>
                    {accounts
                      .filter((account) => account.id !== editingAccount.id)
                      .map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                  </select>
                </Field>
                <Field label="Status" className="md:col-span-2">
                  <select
                    value={editForm.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, is_active: e.target.value === 'active' }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </Field>

                <div className="md:col-span-2 flex items-center justify-between gap-4 pt-2">
                  <span className="text-sm text-slate-500">
                    Keeping the chart clean helps journals, AP, AR, and bank work stay aligned.
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleEditClose}
                      className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editSaving}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-navy text-white font-bold shadow-xl disabled:opacity-60"
                    >
                      {editSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="block text-xs font-black uppercase tracking-widest text-slate-400">{label}</span>
      {children}
    </label>
  );
}
