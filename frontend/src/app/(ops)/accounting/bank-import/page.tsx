"use client";

import React from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BankStatementPreviewRow {
  date: string;
  description: string;
  amount: number;
  balance: number;
  reference: string;
}

export default function BankImportPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<BankStatementPreviewRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      parseCSV(selected);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').filter(row => row.trim() !== '');
      // Header: Date, Description, Amount, Balance, Reference
      const data = rows.slice(1).map(row => {
        const cols = row.split(',');
        return {
          date: cols[0]?.trim(),
          description: cols[1]?.trim(),
          amount: parseFloat(cols[2]) || 0,
          balance: parseFloat(cols[3]) || 0,
          reference: cols[4]?.trim()
        };
      });
      setPreview(data.filter(d => d.date));
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!preview.length || !isAuthenticated) return;
    setLoading(true);
    try {
      const res = await apiFetch('/accounting/bank-statements/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: '88888888-8888-8888-8888-888888888888', // Mock account
          statement_date: new Date().toISOString(),
          opening_balance: preview[0].balance - preview[0].amount,
          closing_balance: preview[preview.length - 1].balance,
          lines: preview
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/accounting'), 2000);
      } else {
        setError('Failed to import statement rows.');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto flex flex-col gap-8">
      <Link href="/accounting" className="flex items-center gap-2 text-slate-500 hover:text-brand-navy mb-4 transition-colors text-sm font-bold">
        <ChevronLeft size={16} />
        Back to Dashboard
      </Link>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="bg-brand-navy p-12 text-white relative">
          <div className="relative z-10">
            <h2 className="text-4xl font-heading mb-4 leading-tight">Bank Statement Intelligence</h2>
            <p className="text-white/60 text-lg max-w-xl">Upload your CSV bank exports to automatically synchronize and reconcile your ledger with real-world transactions.</p>
          </div>
          <div className="absolute bottom-0 right-0 p-12 opacity-10">
            <FileSpreadsheet size={160} />
          </div>
        </div>

        <div className="p-12 space-y-12">
          {/* Upload Section */}
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
                <button onClick={() => setFile(null)} className="text-xs font-bold text-rose-500 uppercase tracking-widest hover:underline">Remove File</button>
              </div>

              {/* Preview Table */}
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
                 {error && <div className="text-rose-500 text-sm font-bold flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
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
      </div>
    </div>
  );
}
