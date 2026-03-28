"use client";

import React from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, ChevronLeft, Clock3, Filter, Lock, Plus, RotateCw, Send, ShieldCheck, Trash2 } from 'lucide-react';
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

interface PeriodReadiness {
  period: { year: number; month: number; status: string };
  draftEntries: number;
  postedEntries: number;
  reversedEntries: number;
  bankStatements: number;
  can_close: boolean;
  blockers: string[];
}

type JournalLineField = keyof JournalEntryLine;
type EntryFilter = 'all' | 'draft' | 'posted' | 'reversed';

export default function JournalEntryPage() {
  const { isAuthenticated } = useAuthStore();
  const [accounts, setAccounts] = React.useState<AccountOption[]>([]);
  const [entries, setEntries] = React.useState<JournalEntryRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [actionId, setActionId] = React.useState<string | null>(null);
  const [pendingAction, setPendingAction] = React.useState<{ type: 'post' | 'reverse'; entry: JournalEntryRecord } | null>(null);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [filter, setFilter] = React.useState<EntryFilter>('all');
  const [readiness, setReadiness] = React.useState<PeriodReadiness | null>(null);

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

  const loadReadiness = React.useCallback(async (entryDate: string) => {
    try {
      const date = new Date(entryDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const res = await apiFetch(`/accounting/periods/close-readiness?year=${year}&month=${month}`);
      if (res.ok) {
        setReadiness(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch close readiness:', err);
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadJournal();
    }
  }, [isAuthenticated, loadJournal]);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadReadiness(header.entry_date);
    }
  }, [isAuthenticated, header.entry_date, loadReadiness]);

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

  const refreshAndReadiness = React.useCallback(async () => {
    await Promise.all([refreshEntries(), loadReadiness(header.entry_date)]);
  }, [refreshEntries, loadReadiness, header.entry_date]);

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
        await refreshAndReadiness();
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

  const executeAction = async (entryId: string, type: 'post' | 'reverse') => {
    setActionId(entryId);
    setMessage('');
    setError('');
    try {
      const res = await apiFetch(`/accounting/journal-entries/${entryId}/${type === 'post' ? 'post' : 'reverse'}`, { method: 'POST' });
      if (res.ok) {
        setMessage(type === 'post' ? 'Journal entry posted.' : 'Journal entry reversed.');
        await refreshAndReadiness();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.message || `Failed to ${type} journal entry.`);
      }
    } catch {
      setError(`Connection error while ${type === 'post' ? 'posting' : 'reversing'} journal entry.`);
    } finally {
      setActionId(null);
      setPendingAction(null);
    }
  };

  const filteredEntries = entries.filter((entry) => filter === 'all' ? true : entry.status === filter);

  const currentPeriodLabel = readiness
    ? `${readiness.period.month}/${readiness.period.year}`
    : new Date(header.entry_date).toLocaleDateString();

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

            <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Posting Controls</h3>
                  <p className="text-xs text-slate-500">Current period readiness for {currentPeriodLabel}.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <ShieldCheck size={14} className="text-brand-gold" />
                  {readiness?.can_close ? 'Ready to close' : 'Review required'}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Metric label="Draft journals" value={readiness?.draftEntries ?? 0} tone={readiness?.draftEntries ? 'rose' : 'emerald'} />
                <Metric label="Posted journals" value={readiness?.postedEntries ?? 0} tone="navy" />
                <Metric label="Reversed journals" value={readiness?.reversedEntries ?? 0} tone="slate" />
                <Metric label="Bank statements" value={readiness?.bankStatements ?? 0} tone="gold" />
              </div>

              {readiness?.blockers?.length ? (
                <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-rose-600 text-sm">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <AlertCircle size={16} />
                    Close blockers
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {readiness.blockers.map((blocker, index) => (
                      <li key={index}>{blocker}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-emerald-600 text-sm">
                  No blockers detected for this period.
                </div>
              )}
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

          <div className="flex flex-wrap items-center gap-2 mb-5">
            {(['all', 'draft', 'posted', 'reversed'] as EntryFilter[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest border transition-colors ${
                  filter === item
                    ? 'bg-brand-navy text-white border-brand-navy'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-brand-gold hover:text-brand-navy'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredEntries.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-400 italic">
                No journal entries match this view.
              </div>
            )}

            {filteredEntries.map((entry) => {
              const entryDebit = entry.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
              const entryCredit = entry.lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);

              return (
                <div key={entry.id} className="rounded-3xl border border-slate-100 bg-slate-50/60 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
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
                          onClick={() => setPendingAction({ type: 'post', entry })}
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
                          onClick={() => setPendingAction({ type: 'reverse', entry })}
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

      {pendingAction && (
        <div className="fixed inset-0 z-[90] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-[32px] bg-white border border-slate-100 shadow-2xl p-8">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  {pendingAction.type === 'post' ? 'Posting Control' : 'Reversal Control'}
                </div>
                <h3 className="text-2xl font-heading text-brand-navy mt-2">{pendingAction.entry.description}</h3>
                <p className="text-sm text-slate-500 mt-2">
                  {pendingAction.type === 'post'
                    ? 'This will move the entry into the posted ledger and make it part of the live trial balance.'
                    : 'This will create a reversal entry and mark the original posting as reversed.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="text-sm font-bold text-slate-400 hover:text-brand-navy"
              >
                Close
              </button>
            </div>

            <div className="rounded-3xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-600 space-y-2">
              <div className="flex items-center gap-2 font-bold text-brand-navy">
                <Lock size={16} />
                Posting details
              </div>
              <div>Entry date: {new Date(pendingAction.entry.entry_date).toLocaleDateString()}</div>
              <div>Reference: {pendingAction.entry.reference || 'No reference'}</div>
              <div>Status: {pendingAction.entry.status}</div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeAction(pendingAction.entry.id, pendingAction.type)}
                className={`px-5 py-3 rounded-2xl font-bold text-white inline-flex items-center gap-2 ${
                  pendingAction.type === 'post' ? 'bg-brand-navy' : 'bg-amber-600'
                }`}
              >
                {pendingAction.type === 'post' ? <Send size={16} /> : <RotateCw size={16} />}
                Confirm {pendingAction.type === 'post' ? 'Posting' : 'Reversal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'rose' | 'emerald' | 'navy' | 'slate' | 'gold';
}) {
  const toneClasses = {
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    navy: 'bg-slate-50 text-brand-navy border-slate-100',
    slate: 'bg-slate-50 text-slate-500 border-slate-100',
    gold: 'bg-amber-50 text-amber-700 border-amber-100',
  }[tone];

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClasses}`}>
      <div className="text-[10px] uppercase tracking-widest opacity-80">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
