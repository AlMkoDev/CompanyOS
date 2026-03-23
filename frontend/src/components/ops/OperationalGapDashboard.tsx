"use client";

import React from 'react';
import { AlertCircle, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

export interface Gap {
  id: string;
  item_name: string;
  gap_type: string;
  priority: string;
  status: string;
  description: string;
}

interface Department {
  id: string;
  name: string;
}

interface OperationalGapDashboardProps {
  gapStatuses: Gap[];
  departments: Department[];
}

export function OperationalGapDashboard({ gapStatuses, departments }: OperationalGapDashboardProps) {
  const criticalGaps = gapStatuses.filter(g => g.priority === 'critical');
  void departments;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Operational Gaps" 
          value={gapStatuses.length} 
          icon={<AlertCircle className="text-brand-gold" />} 
        />
        <StatCard 
          label="Critical Failures" 
          value={criticalGaps.length} 
          icon={<ShieldAlert className="text-red-500" />} 
        />
        <StatCard 
          label="Resolution Rate" 
          value={`${Math.round((gapStatuses.filter(g => g.status === 'closed').length / (gapStatuses.length || 1)) * 100)}%`} 
          icon={<CheckCircle2 className="text-emerald-500" />} 
        />
      </div>

      <div className="glass-card rounded-3xl overflow-hidden border border-slate-100 shadow-sm bg-white">
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h3 className="text-xl font-heading text-brand-navy">Critical Operational Risks</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Priority 1 (Closing Data/Tech)</span>
        </div>
        <div className="divide-y divide-slate-50">
          {criticalGaps.map((gap) => (
            <div key={gap.id} className="px-8 py-6 hover:bg-slate-50/50 transition-colors group">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] bg-red-100 text-red-600 font-black px-2 py-0.5 rounded uppercase tracking-tighter">CRITICAL</span>
                    <h4 className="font-bold text-slate-900 group-hover:text-brand-gold transition-colors">{gap.item_name}</h4>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">{gap.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{gap.gap_type} GAP</span>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <Clock size={12} className="text-slate-400" />
                    Target: Next 30 Days
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4">
                 <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-brand-navy border-2 border-white flex items-center justify-center text-[8px] text-white font-bold uppercase">SA</div>
                 </div>
                 <span className="text-[10px] text-slate-400 italic">Owned by System Admin</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-3xl font-heading text-brand-navy mb-1">{value}</div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</div>
      </div>
    </div>
  );
}
