"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Lock, CalendarDays, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface AccountingPeriod {
  id: string;
  year: number;
  month: number;
  status: string;
  closed_at?: string | null;
  closed_by?: string | null;
}

interface CloseReadiness {
  period: AccountingPeriod;
  draftEntries: number;
  postedEntries: number;
  reversedEntries: number;
  bankStatements: number;
  can_close: boolean;
  blockers: string[];
}

export default function CloseWorkflowPage() {
  const { isAuthenticated } = useAuthStore();
  const [periods, setPeriods] = React.useState<AccountingPeriod[]>([]);
  const [readiness, setReadiness] = React.useState<CloseReadiness | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [confirmed, setConfirmed] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [form, setForm] = React.useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const loadPeriods = React.useCallback(async () => {
    try {
      const res = await apiFetch('/accounting/periods');
      if (res.ok) {
        setPeriods(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReadiness = React.useCallback(async (year: number, month: number) => {
    try {
      const res = await apiFetch(`/accounting/periods/close-readiness?year=${year}&month=${month}`);
      if (res.ok) {
        setReadiness(await res.json());
      }
    } catch (err) {
      console.error('Failed to load close readiness:', err);
      setReadiness(null);
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) loadPeriods();
  }, [isAuthenticated, loadPeriods]);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadReadiness(form.year, form.month);
    }
  }, [isAuthenticated, form.year, form.month, loadReadiness]);

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) {
      setMessage('Please confirm the close checklist before locking the period.');
      return;
    }
    if (!readiness?.can_close) {
      setMessage('Resolve draft journals before closing the period.');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      const res = await apiFetch('/accounting/periods/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setMessage('Period closed successfully.');
        setConfirmed(false);
        await loadPeriods();
        await loadReadiness(form.year, form.month);
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || 'Failed to close period.');
      }
    } catch {
      setMessage('Connection error while closing the period.');
    } finally {
      setSaving(false);
    }
  };

  const activePeriod = [...periods].sort((a, b) => (b.year - a.year) || (b.month - a.month))[0];

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8">
      <Link href="/accounting" className="flex items-center gap-2 text-slate-500 hover:text-brand-navy mb-2 transition-colors text-sm font-bold">
        <ChevronLeft size={16} />
        Back to Accounting
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8">
        <div className="bg-brand-navy text-white rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              <Lock size={12} />
              Close Workflow
            </div>
            <h1 className="text-3xl font-heading mb-3">Period Close</h1>
            <p className="text-white/70 leading-relaxed">
              Lock the month when journals, AP, AR, and bank activity are reconciled. Closed periods stay readable but no longer accept new posting.
            </p>
            <div className="mt-6 rounded-3xl bg-white/10 p-4 text-sm text-white/80 border border-white/10">
              {readiness
                ? readiness.can_close
                  ? 'Ready to close: no draft journals remain open for this period.'
                  : `${readiness.draftEntries} draft journal entries still need attention before closing.`
                : 'Loading close readiness...'}
            </div>
          </div>
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-brand-gold/10 rounded-full blur-3xl"></div>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-heading text-brand-navy">Close the Current Period</h2>
              <p className="text-sm text-slate-500">Select the month you want to lock.</p>
            </div>
            <CalendarDays className="text-brand-gold" />
          </div>

          <form onSubmit={handleClose} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Year">
              <input
                type="number"
                min={2000}
                max={2100}
                value={form.year}
                onChange={(e) => setForm((prev) => ({ ...prev, year: Number(e.target.value) }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white"
              />
            </Field>
            <Field label="Month">
              <input
                type="number"
                min={1}
                max={12}
                value={form.month}
                onChange={(e) => setForm((prev) => ({ ...prev, month: Number(e.target.value) }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition-all focus:border-brand-gold focus:bg-white"
              />
            </Field>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
              <Metric label="Draft journals" value={readiness?.draftEntries ?? 0} tone={readiness?.draftEntries ? 'rose' : 'emerald'} />
              <Metric label="Posted journals" value={readiness?.postedEntries ?? 0} tone="navy" />
              <Metric label="Reversed journals" value={readiness?.reversedEntries ?? 0} tone="slate" />
              <Metric label="Bank statements" value={readiness?.bankStatements ?? 0} tone="gold" />
            </div>

            <div className="md:col-span-2 rounded-3xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <ShieldCheck size={14} />
                Close checklist
              </div>
              <label className="flex items-start gap-3 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-navy focus:ring-brand-gold"
                />
                <span>
                  I have reviewed the draft journals, posted activity, and bank reconciliation status for this period.
                </span>
              </label>
              {readiness?.blockers?.length ? (
                <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-rose-600 text-sm">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <AlertTriangle size={16} />
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

            <div className="md:col-span-2 flex items-center justify-between gap-4 pt-2">
              <span className="text-sm text-slate-500">
                {message || (activePeriod ? `Latest tracked period: ${activePeriod.month}/${activePeriod.year} (${activePeriod.status})` : 'No periods tracked yet.')}
              </span>
              <button
                type="submit"
                disabled={saving || !confirmed || !readiness?.can_close}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-navy text-white font-bold shadow-xl disabled:opacity-60"
              >
                <CheckCircle2 size={18} />
                {saving ? 'Closing...' : 'Close Period'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-heading text-brand-navy">Period Register</h2>
            <p className="text-sm text-slate-500">Open and closed periods by month.</p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{periods.length} periods</span>
        </div>

        {loading ? (
          <div className="text-sm italic text-slate-400">Loading periods...</div>
        ) : periods.length === 0 ? (
          <div className="text-sm italic text-slate-400">No periods have been tracked yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {periods.map((period) => (
              <div key={period.id} className="rounded-3xl border border-slate-100 bg-slate-50/60 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-brand-navy">{period.month}/{period.year}</h3>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full ${period.status === 'closed' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {period.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {period.status === 'closed' ? `Closed on ${period.closed_at ? new Date(period.closed_at).toLocaleDateString() : 'unknown date'}` : 'Open for posting'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-xs font-black uppercase tracking-widest text-slate-400">{label}</span>
      {children}
    </label>
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
