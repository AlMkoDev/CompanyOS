"use client";

import React from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

type JournalLineField = keyof JournalEntryLine;

export default function JournalEntryPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [accounts, setAccounts] = React.useState<AccountOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const [header, setHeader] = React.useState({
    entry_date: new Date().toISOString().split('T')[0],
    description: '',
    reference: ''
  });

  const [lines, setLines] = React.useState([
    { account_id: '', debit: 0, credit: 0, narration: '' },
    { account_id: '', debit: 0, credit: 0, narration: '' }
  ]);

  React.useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await apiFetch('/accounting/accounts');
        if (res.ok) setAccounts(await res.json());
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated) fetchAccounts();
  }, [isAuthenticated]);

  const addLine = () => {
    setLines([...lines, { account_id: '', debit: 0, credit: 0, narration: '' }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = <T extends JournalLineField>(index: number, field: T, value: JournalEntryLine[T]) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    // If setting debit, clear credit and vice versa
    if (field === 'debit' && value > 0) newLines[index].credit = 0;
    if (field === 'credit' && value > 0) newLines[index].debit = 0;
    setLines(newLines);
  };

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  const isBalanced = diff < 0.01 && totalDebit > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      setError('Journal must be balanced and have at least one valid entry.');
      return;
    }

    try {
      const res = await apiFetch('/accounting/journal-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...header,
          entry_date: new Date(header.entry_date).toISOString(),
          lines: lines.filter(l => l.account_id && (l.debit > 0 || l.credit > 0))
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/accounting'), 1500);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to create journal entry');
      }
    } catch {
      setError('Failed to connect to server');
    }
  };

  if (loading) return <div className="p-10 text-center font-heading text-xl">Loading Accounts...</div>;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <Link href="/accounting" className="flex items-center gap-2 text-slate-500 hover:text-brand-navy mb-8 transition-colors text-sm font-bold">
        <ChevronLeft size={16} />
        Back to Dashboard
      </Link>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <div className="bg-brand-navy p-8 text-white">
          <h2 className="text-2xl font-heading mb-2">New Journal Entry</h2>
          <p className="text-white/60 text-sm">Record manual financial transactions across your general ledger.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Header Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Entry Date</label>
              <input 
                type="date" 
                required
                value={header.entry_date}
                onChange={e => setHeader({...header, entry_date: e.target.value})}
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
                onChange={e => setHeader({...header, description: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-gold outline-none transition-all"
              />
            </div>
          </div>

          {/* Lines Table */}
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
                      onChange={e => updateLine(idx, 'account_id', e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-brand-gold outline-none"
                    >
                      <option value="">Select Account...</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input 
                      type="number" 
                      placeholder="Debit"
                      value={line.debit || ''}
                      onChange={e => updateLine(idx, 'debit', parseFloat(e.target.value) || 0)}
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 text-right outline-none font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <input 
                      type="number" 
                      placeholder="Credit"
                      value={line.credit || ''}
                      onChange={e => updateLine(idx, 'credit', parseFloat(e.target.value) || 0)}
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 text-right outline-none font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <input 
                      type="text" 
                      placeholder="Memo"
                      value={line.narration}
                      onChange={e => updateLine(idx, 'narration', e.target.value)}
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
                disabled={!isBalanced || success}
                className={`px-10 py-4 rounded-2xl font-heading text-lg transition-all shadow-xl ${
                  isBalanced && !success 
                    ? 'bg-brand-gold text-brand-navy hover:scale-105 active:scale-95' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {success ? 'Posting...' : 'Post Journal'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-bold flex items-center gap-2 border border-rose-100">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {success && (
            <div className="mt-4 p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-sm font-bold flex items-center gap-2 border border-emerald-100">
              <CheckCircle2 size={16} /> Journal posted successfully! Redirecting...
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
