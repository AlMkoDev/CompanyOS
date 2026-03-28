"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, ChevronLeft, Clock3, Plus, RotateCw, Send, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface AccountOption {
  id: string;
  code: string;
  name: string;
}

interface JournalEntryLine {
  account_id: string;
  debit: number;
  credit: number;
  narration: string;
}

interface JournalEntryRecord {
  id: string;
  entry_date: string;
  description: string;
  reference?: string | null;
  status: string;
  created_at: string;
  period?: { year: number; month: number; status: string } | null;
  lines: Array<{
    debit: number;
    credit: number;
    narration?: string | null;
    account?: {
      code: string;
      name: string;
    };
  }>;
}

type JournalLineField = keyof JournalEntryLine;

export default function JournalEntryPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [accounts, setAccounts] = React.useState<AccountOption[]>([]);
  const [entries, setEntries] = React.useState<JournalEntryRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [actionId, setActionId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  const [header, setHeader] = React.useState({
    entry_date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
  });

  const [lines, setLines] = React.useState<JournalEntryLine[]>([
    { account_id: '', debit: 0, credit: 0, narration: '' },
    { account_id: '', debit: 0, credit: 0, narration: '' },
  ]);

  const loadJournal = React.useCallback(async () => {
    setLoading(true);
    try {
      const [accountsRes, entriesRes] = await Promise.all([
        apiFetch('/accounting/accounts'),
        apiFetch('/accounting/journal-entries'),
      ]);

      if (accountsRes.ok) {
        setAccounts(await accountsRes.json());
      }
      if (entriesRes.ok) {
        setEntries(await entriesRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch accounting data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) loadJournal();
  }, [isAuthenticated, loadJournal]);

  const addLine = () => {
    setLines((prev) => [...prev, { account_id: '', debit: 0, credit: 0, narration: '' }]);
  };

  const removeLine = (index: number) => {
    setLines((prev) => {
      if (prev.length <= 2) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateLine = <T extends JournalLineField>(index: number, field: T, value: JournalEntryLine[T]) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === 'debit' && typeof value === 'number' && value > 0) next[index].credit = 0;
      if (field === 'credit' && typeof value === 'number' && value > 0) next[index].debit = 0;
      return next;
    });
  };

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  const isBalanced = diff < 0.01 && totalDebit > 0;

  const refreshEntries = React.useCallback(async () => {
    const res = await apiFetch('/accounting/journal-entries');
    if (res.ok) {
      setEntries(await res.json());
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!isBalanced) {
      setError('Journal must be balanced and have at least one valid entry.');
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch('/accounting/journal-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...header,
          entry_date: new Date(header.entry_date).toISOString(),
          lines: lines.filter((line) => line.account_id && (line.debit > 0 || line.credit > 0)),
        }),
      });

      if (res.ok) {
        setHeader({
          entry_date: new Date().toISOString().split('T')[0],
          description: '',
          reference: '',
        });
        setLines([
          { account_id: '', debit: 0, credit: 0, narration: '' },
          { account_id: '', debit: 0, credit: 0, narration: '' },
        ]);
        setMessage('Journal entry saved successfully.');
        await refreshEntries();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.message || 'Failed to create journal entry');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setSaving(false);
    }
  };

  const handlePost = async (entryId: string) => {
    setActionId(entryId);
    setMessage('');
    setError('');
    try {
      const res = await apiFetch(`/accounting/journal-entries/${entryId}/post`, { method: 'POST' });
      if (res.ok) {
        setMessage('Journal entry posted.');
        await refreshEntries();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.message || 'Failed to post journal entry.');
      }
    } catch {
      setError('Connection error while posting journal entry.');
    } finally {
      setActionId(null);
    }
  };

  const handleReverse = async (entryId: string) => {
    setActionId(entryId);
    setMessage('');
    setError('');
    try {
      const res = await apiFetch(`/accounting/journal-entries/${entryId}/reverse`, { method: 'POST' });
      if (res.ok) {
        setMessage('Journal entry reversed.');
        await refreshEntries();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.message || 'Failed to reverse journal entry.');
      }
    } catch {
      setError('Connection error while reversing journal entry.');
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <div className="p-10 text-center font-heading text-xl">Loading Accounts...</div>;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col gap-8">
      <Link href="/accounting" className="flex items-center gap-2 text-slate-500 hover:text-brand-navy mb-2 transition-colors text-sm font-bold">
        <ChevronLeft size={16} />
        Back to Dashboard
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-8">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          <div className="bg-brand-navy p-8 text-white">
            <h2 className="text-2xl font-heading mb-2">New Journal Entry</h2>
            <p className="text-white/60 text-sm">Record balanced transactions across the general ledger and post them when ready.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Entry Date</label>
                <input
                  type="date"
                  required
                  value={header.entry_date}
                  onChange={(e) => setHeader((prev) => ({ ...prev, entry_date: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-gold outline-none transition-all"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Description / Narration</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly Rent Payment"
                  required
                  value={header.description}
                  onChange={(e) => setHeader((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-gold outline-none transition-all"
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Reference</label>
                <input
                  type="text"
                  placeholder="Optional posting reference"
                  value={header.reference}
                  onChange={(e) => setHeader((prev) => ({ ...prev, reference: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-gold outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Transaction Lines</h3>
                <button
                  type="button"
                  onClick={addLine}
                  className="text-xs font-bold text-brand-gold flex items-center gap-1 hover:underline"
                >
                  <Plus size={14} /> Add Line
                </button>
              </div>

              <div className="space-y-3">
                {lines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-center group">
                    <div className="col-span-5">
                      <select
                        required
                        value={line.account_id}
                        onChange={(e) => updateLine(idx, 'account_id', e.target.value)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-brand-gold outline-none"
                      >
                        <option value="">Select Account...</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Debit"
                        value={line.debit || ''}
                        onChange={(e) => updateLine(idx, 'debit', parseFloat(e.target.value) || 0)}
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 text-right outline-none font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Credit"
                        value={line.credit || ''}
                        onChange={(e) => updateLine(idx, 'credit', parseFloat(e.target.value) || 0)}
                        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 text-right outline-none font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Memo"
                        value={line.narration}
                        onChange={(e) => updateLine(idx, 'narration', e.target.value)}
                        className="w-full p-3 border-b border-transparent focus:border-slate-200 text-xs outline-none transition-all"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex gap-10">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-black text-slate-400 block mb-1">Total Debit</span>
                  <span className="text-xl font-bold font-mono text-emerald-600">R {totalDebit.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-black text-slate-400 block mb-1">Total Credit</span>
                  <span className="text-xl font-bold font-mono text-rose-600">R {totalCredit.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {!isBalanced && totalDebit > 0 && (
                  <div className="flex items-center gap-2 text-rose-500 text-xs font-bold animate-pulse">
                    <AlertCircle size={14} /> Out of Balance: R {diff.toLocaleString()}
                  </div>
                )}
                {isBalanced && (
                  <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
                    <CheckCircle2 size={14} /> Ready to Post
                  </div>
                )}
                <button
                  type="submit"
                  disabled={!isBalanced || saving}
                  className={`px-10 py-4 rounded-2xl font-heading text-lg transition-all shadow-xl inline-flex items-center gap-2 ${
                    isBalanced && !saving
                      ? 'bg-brand-gold text-brand-navy hover:scale-105 active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Send size={18} />
                  {saving ? 'Posting...' : 'Post Journal'}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-bold flex items-center gap-2 border border-rose-100">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            {message && (
              <div className="mt-4 p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-sm font-bold flex items-center gap-2 border border-emerald-100">
                <CheckCircle2 size={16} /> {message}
              </div>
            )}
          </form>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-heading text-brand-navy">Journal Register</h2>
              <p className="text-sm text-slate-500">Recent entries with quick post and reversal actions.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <Clock3 size={16} className="text-brand-gold" />
              Live queue
            </div>
          </div>

          <div className="space-y-3">
            {entries.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-400 italic">
                No journal entries yet. Create the first posting above.
              </div>
            )}

            {entries.map((entry) => {
              const entryDebit = entry.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
              const entryCredit = entry.lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
              const latestLine = entry.lines[0];

              return (
                <div key={entry.id} className="rounded-3xl border border-slate-100 bg-slate-50/60 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-heading text-brand-navy">{entry.description}</h3>
                        <span
                          className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${
                            entry.status === 'posted'
                              ? 'bg-emerald-50 text-emerald-600'
                              : entry.status === 'reversed'
                                ? 'bg-slate-100 text-slate-500'
                                : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(entry.entry_date).toLocaleDateString()} · {entry.reference || 'No reference'}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                        {entry.period ? `${entry.period.year}/${String(entry.period.month).padStart(2, '0')}` : 'No linked period'}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-xs font-black uppercase tracking-widest text-slate-400">Balanced</div>
                      <div className={`text-sm font-bold ${Math.abs(entryDebit - entryCredit) < 0.01 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {Math.abs(entryDebit - entryCredit) < 0.01 ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-white border border-slate-100 p-3">
                      <div className="text-[10px] uppercase tracking-widest text-slate-400">Debit / Credit</div>
                      <div className="font-bold text-slate-700">
                        R {entryDebit.toLocaleString()} / R {entryCredit.toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-100 p-3">
                      <div className="text-[10px] uppercase tracking-widest text-slate-400">Lines</div>
                      <div className="font-bold text-slate-700">{entry.lines.length} transaction lines</div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {entry.lines.slice(0, 3).map((line, index) => (
                      <div key={index} className="rounded-2xl bg-white border border-slate-100 px-4 py-3 text-sm flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 truncate">
                            {line.account ? `${line.account.code} - ${line.account.name}` : 'Account not loaded'}
                          </div>
                          <div className="text-xs text-slate-400 truncate">{line.narration || 'No narration'}</div>
                        </div>
                        <div className="text-right text-xs font-bold text-slate-600 whitespace-nowrap">
                          {Number(line.debit || 0) > 0 ? `Dr R ${Number(line.debit).toLocaleString()}` : `Cr R ${Number(line.credit).toLocaleString()}`}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-400">
                      Created {new Date(entry.created_at).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.status === 'draft' && (
                        <button
                          type="button"
                          onClick={() => handlePost(entry.id)}
                          disabled={actionId === entry.id}
                          className="inline-flex items-center gap-2 rounded-full bg-brand-navy px-4 py-2 text-xs font-black text-white disabled:opacity-60"
                        >
                          <Send size={14} />
                          Post
                        </button>
                      )}
                      {entry.status === 'posted' && (
                        <button
                          type="button"
                          onClick={() => handleReverse(entry.id)}
                          disabled={actionId === entry.id}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 disabled:opacity-60"
                        >
                          <RotateCw size={14} />
                          Reverse
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
