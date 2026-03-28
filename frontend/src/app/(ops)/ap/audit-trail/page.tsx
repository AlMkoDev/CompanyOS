"use client";

import React from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { ChevronLeft, FileClock } from 'lucide-react';
import Link from 'next/link';

interface AuditRecord {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  details?: string | null;
  created_at: string;
  actor?: { first_name?: string; last_name?: string; email?: string } | null;
}

export default function AuditTrailPage() {
  const { isAuthenticated } = useAuthStore();
  const [records, setRecords] = React.useState<AuditRecord[]>([]);

  React.useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await apiFetch('/ap/audit-trail');
        if (res.ok) setRecords(await res.json());
      } catch (err) {
        console.error('Failed to fetch audit trail:', err);
      }
    };

    if (isAuthenticated) fetchRecords();
  }, [isAuthenticated]);

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Link href="/ap" className="p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-slate-500">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-heading text-brand-navy font-bold">AP Audit Trail</h1>
          <p className="text-slate-500 text-sm">Immutable record of AP lifecycle changes and approvals.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {records.map((record) => (
          <div key={record.id} className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
              <FileClock className="text-brand-navy" size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-4">
                <div className="font-bold text-brand-navy">{record.entity_type} · {record.action}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400">{new Date(record.created_at).toLocaleString()}</div>
              </div>
              <div className="mt-1 text-sm text-slate-500">Entity {record.entity_id}</div>
              {record.details && <div className="mt-2 text-xs text-slate-400">{record.details}</div>}
            </div>
          </div>
        ))}
        {!records.length && <div className="rounded-[28px] border border-dashed border-slate-200 bg-white py-20 text-center text-slate-400 italic">No AP audit records yet.</div>}
      </div>
    </div>
  );
}
