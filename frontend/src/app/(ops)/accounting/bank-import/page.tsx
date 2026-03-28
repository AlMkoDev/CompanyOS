"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, CheckCircle2, ChevronLeft, FileSpreadsheet, Inbox, ScrollText, Upload, Search, Sparkles } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface BankStatementPreviewRow {
  id?: string;
  date: string;
  description: string;
  amount: number;
  balance: number;
  reference: string;
}

interface BankStatementSummary {
  id: string;
  statement_date: string;
  opening_balance: number | string;
  closing_balance: number | string;
  account_id?: string | null;
  lines?: BankStatementPreviewRow[];
}

interface GLAccount {
  id: string;
  code: string;
  name: string;
}

interface JournalCandidate {
  entry: {
    id: string;
    entry_date: string;
    description: string;
    reference?: string | null;
    status: string;
  };
  matchedLines: Array<{
    account: { code: string; name: string };
    debit: number;
    credit: number;
    narration?: string | null;
  }>;
  journalAmount: number;
  amountDelta: number;
  dateDelta: number;
  score: number;
}

interface ReconciliationMatch {
  id: string;
  line_id: string;
  journal_entry_id: string;
  matched_at: string;
  journal_description?: string | null;
  journal_reference?: string | null;
  journal_date?: string;
  journal_status?: string;
  line_description?: string | null;
  line_date?: string;
  line_amount?: number | string;
}

interface ReconciliationSuggestion {
  line: BankStatementPreviewRow & { id: string };
  match?: ReconciliationMatch | null;
  candidates: JournalCandidate[];
}

interface ReconciliationResponse {
  statement: BankStatementSummary;
  suggestions: ReconciliationSuggestion[];
  matches: ReconciliationMatch[];
  reason?: string;
}

export default function BankImportPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<BankStatementPreviewRow[]>([]);
  const [accounts, setAccounts] = React.useState<GLAccount[]>([]);
  const [statements, setStatements] = React.useState<BankStatementSummary[]>([]);
  const [selectedStatement, setSelectedStatement] = React.useState<BankStatementSummary | null>(null);
  const [selectedAccountId, setSelectedAccountId] = React.useState('');
  const [reconciliation, setReconciliation] = React.useState<ReconciliationResponse | null>(null);
  const [loadingStatements, setLoadingStatements] = React.useState(true);
  const [loadingAccounts, setLoadingAccounts] = React.useState(true);
  const [loadingMatch, setLoadingMatch] = React.useState(false);
  const [actionState, setActionState] = React.useState<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [activeMatch, setActiveMatch] = React.useState<{ lineId: string; journalEntryId: string } | null>(null);
  const [activeUnmatchLineId, setActiveUnmatchLineId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const loadStatements = React.useCallback(async () => {
    try {
      const res = await apiFetch('/accounting/bank-statements');
      if (res.ok) {
        const data = await res.json();
        const rows = Array.isArray(data) ? data : [];
        setStatements(rows);
        setSelectedStatement((current) => current || rows[0] || null);
      }
    } catch (err) {
      console.error('Failed to load bank statements:', err);
    } finally {
      setLoadingStatements(false);
    }
  }, []);

  const loadAccounts = React.useCallback(async () => {
    try {
      const res = await apiFetch('/accounting/accounts');
      if (res.ok) {
        const data = await res.json();
        const rows = Array.isArray(data) ? data : [];
        setAccounts(rows);
        setSelectedAccountId((current) => current || rows[0]?.id || '');
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  const loadReconciliation = React.useCallback(async (statementId: string) => {
    setLoadingMatch(true);
    setReconciliation(null);
    try {
      const res = await apiFetch(`/accounting/bank-statements/${statementId}/reconciliation`);
      if (res.ok) {
        setReconciliation(await res.json());
      }
    } catch (err) {
      console.error('Failed to load reconciliation suggestions:', err);
    } finally {
      setLoadingMatch(false);
    }
  }, []);

  const setActionNotice = React.useCallback((tone: 'success' | 'error' | 'info', message: string) => {
    setActionState({ tone, message });
    window.setTimeout(() => setActionState((current) => (current?.message === message ? null : current)), 3500);
  }, []);

  const handleMatch = React.useCallback(
    async (lineId: string, journalEntryId: string) => {
      if (!selectedStatement?.id) return;
      setActiveMatch({ lineId, journalEntryId });
      try {
        const res = await apiFetch(`/accounting/bank-statements/${selectedStatement.id}/reconciliation/match`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            line_id: lineId,
            journal_entry_id: journalEntryId,
          }),
        });

        if (res.ok) {
          setActionNotice('success', 'Reconciliation match saved.');
          await loadReconciliation(selectedStatement.id);
        } else {
          const data = await res.json().catch(() => null);
          setActionNotice('error', data?.message || 'Failed to save reconciliation match.');
        }
      } catch {
        setActionNotice('error', 'Connection error while saving reconciliation match.');
      } finally {
        setActiveMatch(null);
      }
    },
    [loadReconciliation, selectedStatement?.id, setActionNotice],
  );

  const handleUnmatch = React.useCallback(
    async (lineId: string) => {
      if (!selectedStatement?.id) return;
      setActiveUnmatchLineId(lineId);
      try {
        const res = await apiFetch(`/accounting/bank-statements/${selectedStatement.id}/reconciliation/match/${lineId}/unmatch`, {
          method: 'POST',
        });

        if (res.ok) {
          setActionNotice('success', 'Reconciliation match cleared.');
          await loadReconciliation(selectedStatement.id);
        } else {
          const data = await res.json().catch(() => null);
          setActionNotice('error', data?.message || 'Failed to clear reconciliation match.');
        }
      } catch {
        setActionNotice('error', 'Connection error while clearing reconciliation match.');
      } finally {
        setActiveUnmatchLineId(null);
      }
    },
    [loadReconciliation, selectedStatement?.id, setActionNotice],
  );

  React.useEffect(() => {
    if (isAuthenticated) {
      loadStatements();
      loadAccounts();
    }
  }, [isAuthenticated, loadStatements, loadAccounts]);

  React.useEffect(() => {
    if (selectedStatement?.id) {
      loadReconciliation(selectedStatement.id);
    } else {
      setReconciliation(null);
    }
  }, [selectedStatement?.id, loadReconciliation]);

  const matchedByLineId = React.useMemo(() => {
    return new Map((reconciliation?.matches || []).map((match) => [match.line_id, match]));
  }, [reconciliation?.matches]);

  const suggestionByLineId = React.useMemo(() => {
    return new Map((reconciliation?.suggestions || []).map((item) => [item.line.id, item]));
  }, [reconciliation?.suggestions]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      parseCSV(selected);
    }
  };

  const parseCSV = (inputFile: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').filter((row) => row.trim() !== '');
      const data = rows.slice(1).map((row) => {
        const cols = row.split(',');
        return {
          date: cols[0]?.trim(),
          description: cols[1]?.trim(),
          amount: parseFloat(cols[2]) || 0,
          balance: parseFloat(cols[3]) || 0,
          reference: cols[4]?.trim(),
        };
      });
      setPreview(data.filter((d) => d.date));
    };
    reader.readAsText(inputFile);
  };

  const handleImport = async () => {
    if (!preview.length || !isAuthenticated || !selectedAccountId) {
      setError('Choose a bank account before importing the statement.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/accounting/bank-statements/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: selectedAccountId,
          statement_date: new Date().toISOString(),
          opening_balance: preview[0].balance - preview[0].amount,
          closing_balance: preview[preview.length - 1].balance,
          lines: preview,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        await loadStatements();
        setTimeout(() => router.push('/accounting'), 2000);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.message || 'Failed to import statement rows.');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col gap-8">
      <Link href="/accounting" className="flex items-center gap-2 text-slate-500 hover:text-brand-navy mb-4 transition-colors text-sm font-bold">
        <ChevronLeft size={16} />
        Back to Dashboard
      </Link>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="bg-brand-navy p-12 text-white relative">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              <ScrollText size={12} />
              Bank Reconciliation
            </div>
            <h2 className="text-4xl font-heading mb-4 leading-tight">Bank Reconciliation</h2>
            <p className="text-white/60 text-lg max-w-xl">
              Upload CSV bank exports, review imported statements, and compare them against live ledger postings.
            </p>
          </div>
          <div className="absolute bottom-0 right-0 p-12 opacity-10">
            <FileSpreadsheet size={160} />
          </div>
        </div>

        <div className="p-12 space-y-12">
          <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-8">
            <div className="space-y-6">
              <div className="rounded-[28px] border border-slate-100 bg-white p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-heading text-brand-navy text-lg">Reconciliation Account</h4>
                    <p className="text-xs text-slate-500">Choose the cash account this statement belongs to.</p>
                  </div>
                </div>
                {loadingAccounts ? (
                  <div className="text-sm text-slate-400 italic">Loading accounts...</div>
                ) : (
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white"
                  >
                    <option value="">Select bank account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {!file ? (
                <div className="border-4 border-dashed border-slate-100 rounded-[32px] p-20 text-center hover:border-brand-gold/50 transition-all group cursor-pointer relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all">
                    <Upload size={40} className="text-brand-gold" />
                  </div>
                  <h3 className="text-2xl font-heading text-brand-navy mb-2">Drop your CSV here</h3>
                  <p className="text-slate-400">Standard export format: Date, Description, Amount, Balance, Reference</p>
                </div>
              ) : (
                <div className="animate-in slide-in-from-bottom-5 duration-500 space-y-8">
                  <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{file.name}</div>
                        <div className="text-xs text-slate-500">{preview.length} transactions detected</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-xs font-bold text-rose-500 uppercase tracking-widest hover:underline"
                    >
                      Remove File
                    </button>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50">
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="py-4 px-6 font-mono">Date</th>
                          <th className="py-4 px-6">Description</th>
                          <th className="py-4 px-6 text-right">Amount</th>
                          <th className="py-4 px-6 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {preview.slice(0, 10).map((row, i) => (
                          <tr key={i} className="text-sm">
                            <td className="py-4 px-6 text-slate-500 font-mono">{row.date}</td>
                            <td className="py-4 px-6 font-medium text-slate-700">{row.description}</td>
                            <td className={`py-4 px-6 text-right font-bold ${row.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {row.amount > 0 ? `+R ${row.amount}` : `-R ${Math.abs(row.amount)}`}
                            </td>
                            <td className="py-4 px-6 text-right text-slate-400 font-mono">R {row.balance.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end items-center gap-6">
                    {error && (
                      <div className="text-rose-500 text-sm font-bold flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                      </div>
                    )}
                    <button
                      onClick={handleImport}
                      disabled={loading || success}
                      className={`px-12 py-5 rounded-[24px] font-heading text-xl flex items-center gap-3 transition-all shadow-2xl ${
                        success ? 'bg-emerald-500 text-white' : 'bg-brand-gold text-brand-navy hover:scale-105 active:scale-95'
                      }`}
                    >
                      {loading ? 'Processing...' : success ? 'Import Successful' : 'Analyze & Synchronize'}
                      {!loading && !success && <ArrowRight size={20} />}
                      {success && <CheckCircle2 size={20} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50/60 rounded-[32px] border border-slate-100 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-heading text-brand-navy">Recent Statements</h3>
                  <p className="text-sm text-slate-500">Imported bank statements and suggested ledger matches.</p>
                </div>
                <Inbox className="text-brand-gold" />
              </div>

              {loadingStatements ? (
                <div className="text-sm text-slate-400 italic">Loading statements...</div>
              ) : statements.length === 0 ? (
                <div className="text-sm text-slate-400 italic">No bank statements imported yet.</div>
              ) : (
                <div className="space-y-3">
                  {statements.map((statement) => (
                    <button
                      key={statement.id}
                      onClick={() => setSelectedStatement(statement)}
                      className={`w-full text-left rounded-3xl border px-5 py-4 transition-all ${
                        selectedStatement?.id === statement.id ? 'bg-white border-brand-gold shadow-lg' : 'bg-white/70 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-brand-navy">{new Date(statement.statement_date).toLocaleDateString()}</div>
                          <div className="text-xs text-slate-400 font-mono">{statement.lines?.length || 0} lines</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-widest text-slate-400">Closing Balance</div>
                          <div className="font-bold text-slate-700">R {Number(statement.closing_balance || 0).toLocaleString()}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="rounded-[28px] border border-slate-100 bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-heading text-brand-navy text-lg">Selected Statement</h4>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400">
                    {selectedStatement ? new Date(selectedStatement.statement_date).toLocaleDateString() : 'None selected'}
                  </span>
                </div>

                {selectedStatement ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="text-[10px] uppercase tracking-widest text-slate-400">Opening</div>
                        <div className="font-bold text-brand-navy">R {Number(selectedStatement.opening_balance || 0).toLocaleString()}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="text-[10px] uppercase tracking-widest text-slate-400">Closing</div>
                        <div className="font-bold text-brand-navy">R {Number(selectedStatement.closing_balance || 0).toLocaleString()}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="text-[10px] uppercase tracking-widest text-slate-400">Lines</div>
                        <div className="font-bold text-brand-navy">{selectedStatement.lines?.length || 0}</div>
                      </div>
                    </div>

                    {actionState && (
                      <div
                        className={`rounded-2xl px-4 py-3 text-xs font-bold ${
                          actionState.tone === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : actionState.tone === 'error'
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : 'bg-slate-50 text-slate-600 border border-slate-100'
                        }`}
                      >
                        {actionState.message}
                      </div>
                    )}

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
                      <Sparkles size={14} className="text-brand-gold" />
                      {loadingMatch ? 'Finding suggested matches...' : reconciliation?.reason || 'Suggested matches are based on amount and date proximity.'}
                    </div>

                    <div className="max-h-[380px] overflow-auto rounded-3xl border border-slate-100">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Description</th>
                            <th className="py-3 px-4 text-right">Amount</th>
                            <th className="py-3 px-4 text-right">Reconciliation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {(selectedStatement.lines || []).map((line, i) => {
                            const lineId = line.id;
                            const lineKey = lineId || `${line.date}-${line.description}-${i}`;
                            const suggestion = lineId ? suggestionByLineId.get(lineId) : null;

                            return (
                            <tr key={lineKey} className="text-sm">
                              <td className="py-3 px-4 text-slate-500 font-mono">{line.date}</td>
                              <td className="py-3 px-4 text-slate-700">{line.description}</td>
                              <td className={`py-3 px-4 text-right font-bold ${line.amount >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {line.amount >= 0 ? `+R ${Number(line.amount).toLocaleString()}` : `-R ${Math.abs(Number(line.amount)).toLocaleString()}`}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {lineId && matchedByLineId.has(lineId) ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                      Matched
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleUnmatch(lineId)}
                                      disabled={activeUnmatchLineId === lineId}
                                      className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all hover:border-rose-200 hover:text-rose-600 disabled:opacity-60"
                                    >
                                      {activeUnmatchLineId === lineId ? 'Clearing...' : 'Undo'}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                      Unmatched
                                    </span>
                                    {suggestion?.candidates?.[0] && (
                                      <button
                                        type="button"
                                        onClick={() => lineId && handleMatch(lineId, suggestion.candidates[0].entry.id)}
                                        disabled={!lineId || activeMatch?.lineId === lineId}
                                        className="rounded-full border border-brand-gold/30 bg-brand-gold/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-gold transition-all hover:bg-brand-gold/15 disabled:opacity-60"
                                      >
                                        {activeMatch?.lineId === lineId ? 'Matching...' : 'Match Top'}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Suggested Matches</h4>
                        <Search size={14} className="text-slate-400" />
                      </div>

                      {loadingMatch ? (
                        <div className="text-sm text-slate-400 italic">Loading suggestions...</div>
                      ) : (reconciliation?.suggestions || []).length === 0 ? (
                        <div className="text-sm text-slate-400 italic">No ledger matches found for this statement.</div>
                      ) : (
                        <div className="space-y-3">
                          {reconciliation?.suggestions.map((item, index) => (
                            <div key={index} className="rounded-3xl border border-slate-100 bg-white p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-brand-navy">{item.line.description}</div>
                                  <div className="text-[10px] uppercase tracking-widest text-slate-400">
                                    {item.line.date} · R {Math.abs(item.line.amount).toLocaleString()}
                                  </div>
                                </div>
                                <div className="text-xs font-black uppercase tracking-widest text-emerald-600">
                                  {item.candidates.length} candidate{item.candidates.length === 1 ? '' : 's'}
                                </div>
                              </div>

                              {item.match && (
                                <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 flex items-center justify-between">
                                  <span>
                                    Matched to {item.match.journal_description || 'journal entry'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUnmatch(item.line.id)}
                                    disabled={activeUnmatchLineId === item.line.id}
                                    className="rounded-full border border-emerald-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 transition-all hover:bg-emerald-100 disabled:opacity-60"
                                  >
                                    {activeUnmatchLineId === item.line.id ? 'Clearing...' : 'Undo Match'}
                                  </button>
                                </div>
                              )}

                              <div className="mt-3 space-y-2">
                                {item.candidates.map((candidate) => (
                                  <div key={candidate.entry.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="min-w-0">
                                        <div className="font-semibold text-slate-800 truncate">{candidate.entry.description}</div>
                                        <div className="text-xs text-slate-400">
                                          {new Date(candidate.entry.entry_date).toLocaleDateString()} · {candidate.entry.reference || 'No reference'}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div className="text-right text-xs font-bold text-slate-600">
                                          Score {candidate.score.toFixed(0)}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleMatch(item.line.id, candidate.entry.id)}
                                          disabled={activeMatch?.lineId === item.line.id}
                                          className="rounded-full border border-brand-gold/30 bg-brand-gold/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-gold transition-all hover:bg-brand-gold/20 disabled:opacity-60"
                                        >
                                          {activeMatch?.lineId === item.line.id && activeMatch?.journalEntryId === candidate.entry.id ? 'Matching...' : 'Match'}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 italic">Select an imported statement to review its lines.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
