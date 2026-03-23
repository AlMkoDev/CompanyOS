'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Activity,
  FileText,
  BarChart3,
  Clock,
  Target,
  ChevronRight,
  ClipboardList,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';

interface NCR {
  id: string;
  ncr_no: string;
  description: string;
  raised_by: string;
  raised_at: string;
  status: string;
  area?: string;
  severity: string;
  rca?: QaRootCauseAnalysis;
  corrective_actions?: QaCorrectiveAction[];
}

interface QaRootCauseAnalysis {
  id: string;
  final_root_cause?: string;
}

interface QaCorrectiveAction {
  id: string;
  description?: string;
  status?: string;
}

interface QaDashboard {
  ncres: {
    total: number;
    open: number;
    closed: number;
    closureRate: number;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    overdueCars: number;
    averageClosureTime: number;
  };
  audits: {
    totalFindings: number;
    openFindings: number;
    bySeverity: Record<string, number>;
  };
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  identified: { color: 'bg-slate-100 text-slate-600', label: 'Identified' },
  RCA: { color: 'bg-blue-100 text-blue-600', label: 'Root Cause Analysis' },
  CAR_open: { color: 'bg-amber-100 text-amber-600', label: 'CAR Open' },
  closed: { color: 'bg-emerald-100 text-emerald-600', label: 'Closed' },
};

const SEVERITY_CONFIG: Record<string, { color: string; label: string }> = {
  critical: { color: 'bg-rose-500', label: 'Critical' },
  high: { color: 'bg-orange-500', label: 'High' },
  medium: { color: 'bg-amber-500', label: 'Medium' },
  low: { color: 'bg-slate-400', label: 'Low' },
};

export default function QaPage() {
  const [ncrs, setNcrs] = useState<NCR[]>([]);
  const [dashboard, setDashboard] = useState<QaDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | string>('all');

  useEffect(() => {
    fetchNCRs();
    fetchDashboard();
  }, []);

  const fetchNCRs = async () => {
    try {
      const response = await fetch('/api/qa/ncrs');
      if (response.ok) {
        const data = await response.json();
        setNcrs(data);
      }
    } catch (error) {
      console.error('Error fetching NCRs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/qa/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboard(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredNCRs = filter === 'all'
    ? ncrs
    : ncrs.filter(n => n.status === filter || n.severity === filter);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-white to-rose-50/20 p-8 space-y-10 pb-32 max-w-[1800px] mx-auto overflow-x-hidden animate-in fade-in duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 shrink-0">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-navy/5 border border-brand-navy/10 text-brand-navy text-[10px] font-black uppercase tracking-widest">
              <ShieldAlert className="w-3 h-3 text-brand-gold" />
              Compliance & Quality Governance
            </div>
          </div>
          <h1 className="text-5xl font-black text-brand-navy tracking-tight flex items-center gap-4">
            Quality Control
            <div className="p-3 bg-brand-navy/5 text-brand-gold rounded-3xl backdrop-blur-md border border-brand-navy/5">
              <Activity size={32} className="animate-pulse" />
            </div>
          </h1>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 text-slate-400 font-bold text-sm uppercase tracking-widest">
              <ClipboardList size={20} className="text-slate-300" />
              <span>{dashboard?.ncres.total || 0} Total Obligations</span>
            </div>
            <div className="h-5 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-3 text-emerald-600 font-black text-sm uppercase tracking-widest">
              <CheckCircle2 size={20} />
              <span>{dashboard?.ncres.closureRate || 0}% Operational Precision</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" className="h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border-2 border-slate-200 hover:bg-slate-50 transition-all active:scale-95 shadow-lg shadow-slate-100/50">
            <FileText size={18} className="mr-2 text-slate-400" />
            Audit Protocol
          </Button>
          <Button className="h-14 px-10 rounded-2xl bg-brand-navy text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-brand-navy/90 shadow-2xl shadow-brand-navy/20 transition-all active:scale-95 flex gap-3 group">
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
            Raise Deviation
          </Button>
        </div>
      </div>

      {/* Dashboard Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Closure Rate Gauge */}
        <Card className="p-8 border-white/40 shadow-2xl shadow-slate-200/40 rounded-[40px] bg-white/70 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Target size={120} />
          </div>
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <Target size={16} className="text-emerald-500" />
              Resolution Velocity
            </div>
            <div className="space-y-1">
              <div className="text-5xl font-black text-brand-navy tracking-tighter">
                {dashboard?.ncres.closureRate || 0}<span className="text-2xl opacity-40">%</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Across all jurisdictions</p>
            </div>
            <div className="space-y-4">
              <Progress value={dashboard?.ncres.closureRate || 0} className="h-2 bg-slate-100 shadow-inner" />
              <div className="flex items-center gap-6 text-[10px] font-black uppercase">
                <span className="text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-lg">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  {dashboard?.ncres.closed || 0} Resolved
                </span>
                <span className="text-amber-600 flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-lg">
                   <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                   {dashboard?.ncres.open || 0} Active
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Severity Distribution */}
        <Card className="p-8 border-white/40 shadow-2xl shadow-slate-200/40 rounded-[40px] bg-white/70 backdrop-blur-xl relative overflow-hidden group">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <Activity size={16} className="text-rose-500" />
              Criticality Matrix
            </div>
            <div className="space-y-1">
              <div className="text-5xl font-black text-brand-navy tracking-tighter">
                {dashboard?.ncres.bySeverity?.critical || 0}
                <span className="text-2xl text-slate-300 font-medium">/{dashboard?.ncres.total || 0}</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Critical Deviations</p>
            </div>
            <div className="space-y-3 pt-2">
              {Object.entries(dashboard?.ncres.bySeverity || {}).map(([severity, count]) => (
                <div key={severity} className="flex items-center justify-between group/item">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${SEVERITY_CONFIG[severity]?.color} shadow-[0_0_10px_rgba(0,0,0,0.1)] group-hover/item:scale-125 transition-transform`}></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{severity}</span>
                  </div>
                  <span className="text-sm font-black text-brand-navy">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Status Breakdown */}
        <Card className="p-8 border-brand-navy/[0.02] shadow-2xl shadow-brand-navy/10 rounded-[40px] bg-brand-navy text-white relative overflow-hidden group">
          <div className="absolute top-[-20px] right-[-20px] opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-1000">
             <ClipboardList size={180} />
          </div>
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-2 text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
              <Clock size={16} className="text-brand-gold" />
              Workflow Pipeline
            </div>
            <div className="space-y-1">
              <div className="text-5xl font-black tracking-tighter">
                {dashboard?.ncres.byStatus?.CAR_open || 0}
              </div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Remediation in Progress</p>
            </div>
            <div className="space-y-3 pt-2">
              {Object.entries(dashboard?.ncres.byStatus || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between group/status">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[status]?.color.split(' ')[0]} group-hover/status:scale-125 transition-transform`}></div>
                    <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">{STATUS_CONFIG[status]?.label}</span>
                  </div>
                  <span className="text-sm font-black text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Audit Intelligence */}
        <Card className="p-8 border-white/40 shadow-2xl shadow-slate-200/40 rounded-[40px] bg-white text-slate-900 relative overflow-hidden group">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                <BarChart3 size={16} className="text-indigo-500" />
                Audit Intelligence
              </div>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                 <TrendingUp size={16} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-5xl font-black tracking-tighter text-brand-navy">
                {dashboard?.audits.openFindings || 0}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unmitigated Audit Findings</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 group-hover:bg-indigo-50/50 transition-colors">
                 <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Major Findings</div>
                 <div className="text-lg font-black text-brand-navy">{dashboard?.audits.bySeverity?.major || 0}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 group-hover:bg-indigo-50/50 transition-colors">
                 <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Minor Observations</div>
                 <div className="text-lg font-black text-brand-navy">{dashboard?.audits.bySeverity?.minor || 0}</div>
              </div>
            </div>
            {dashboard?.ncres.overdueCars && dashboard.ncres.overdueCars > 0 && (
              <div className="p-4 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-200 animate-in zoom-in duration-500 delay-500">
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="text-rose-200" />
                  <div>
                    <div className="text-lg font-black tracking-tighter leading-none">{dashboard.ncres.overdueCars} Overdue</div>
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mt-1">Immediate Action Required</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-between scroll-mt-20">
         <div className="flex items-center gap-3 shrink-0 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
            <button
              onClick={() => setFilter('all')}
              className={`h-11 px-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
                filter === 'all'
                  ? 'bg-brand-navy text-white shadow-xl shadow-brand-navy/30 scale-105'
                  : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
              }`}
            >
              System Vault
            </button>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`h-11 px-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
                  filter === status
                    ? 'bg-brand-navy text-white shadow-xl shadow-brand-navy/30 scale-105'
                    : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${config.color.split(' ')[0]}`} />
                {config.label}
              </button>
            ))}
          </div>

          <div className="relative group w-72">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-brand-navy transition-colors" size={16} />
             <Input 
                placeholder="Search deviations..." 
                className="h-11 pl-12 rounded-2xl border-slate-100 bg-white/50 focus-visible:ring-brand-navy/10 font-medium text-xs shadow-inner" 
             />
          </div>
      </div>

      {/* NCR List */}
      <div className="flex-1 space-y-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-6">
             {[1,2,3,4].map(i => (
                <div key={i} className="h-32 rounded-[32px] bg-slate-50/50 animate-pulse border border-slate-100"></div>
             ))}
          </div>
        ) : filteredNCRs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-20">
            <div className="p-10 bg-slate-200 rounded-[48px] mb-6">
              <ShieldAlert size={64} className="text-slate-400" />
            </div>
            <h4 className="text-2xl font-black uppercase tracking-[0.3em] text-slate-500">No Records Identifed</h4>
            <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-[10px]">Your quality protocols are fully compliant</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredNCRs.map((ncr) => (
              <Link key={ncr.id} href={`/strategy/qa/ncrs/${ncr.id}`}>
                <Card className="group p-8 border-white/40 shadow-xl shadow-slate-200/30 rounded-[40px] bg-white/80 backdrop-blur-sm hover:shadow-2xl hover:shadow-brand-navy/10 hover:bg-white transition-all duration-700 cursor-pointer overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1.5 h-full opacity-60 group-hover:w-3 group-hover:opacity-100 transition-all duration-700" style={{ backgroundColor: SEVERITY_CONFIG[ncr.severity]?.color.replace('bg-', 'rgb(') }}></div>
                  
                  <div className="flex items-center justify-between gap-12">
                    {/* Left Section */}
                    <div className="flex items-center gap-8 flex-1">
                      <div className="flex flex-col items-center gap-2 min-w-[100px] shrink-0">
                         <div className={`p-4 rounded-[20px] bg-white shadow-lg border border-slate-50 text-slate-400 group-hover:text-brand-navy group-hover:scale-110 transition-all duration-700`}>
                            <AlertCircle size={28} style={{ color: SEVERITY_CONFIG[ncr.severity]?.color.replace('bg-', '') }} />
                         </div>
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{ncr.severity}</span>
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-4">
                          <Badge className={`${STATUS_CONFIG[ncr.status]?.color} border-0 font-black text-[9px] uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-sm`}>
                            {STATUS_CONFIG[ncr.status]?.label}
                          </Badge>
                          <div className="h-1 w-1 bg-slate-200 rounded-full" />
                          <span className="text-[10px] font-mono font-black text-slate-300 uppercase tracking-widest">Record # {ncr.ncr_no}</span>
                        </div>
                        <h3 className="text-xl font-black text-brand-navy group-hover:text-brand-gold transition-colors line-clamp-1 leading-tight uppercase tracking-tight">
                          {ncr.description}
                        </h3>
                        {ncr.area && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                             <Target size={14} className="text-slate-300" />
                             Functional Area: <span className="text-brand-navy font-black">{ncr.area}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-10 shrink-0">
                      <div className="text-right space-y-2">
                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                          Incident Date
                        </div>
                        <div className="text-base font-black text-brand-navy flex items-center gap-2 justify-end">
                          <Clock size={16} className="text-slate-300" />
                          {formatDate(ncr.raised_at)}
                        </div>
                      </div>

                      <div className="h-12 w-[1px] bg-slate-100" />

                      <div className="flex flex-col items-end gap-3 min-w-[120px]">
                        <div className="flex -space-x-3">
                           {[1,2,3].map(i => (
                              <div key={i} className="w-9 h-9 rounded-2xl border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase shrink-0">
                                 {String.fromCharCode(64 + i)}
                              </div>
                           ))}
                        </div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Resolution Team</div>
                      </div>

                      <div className="p-4 bg-brand-navy/5 text-slate-300 rounded-2xl group-hover:bg-brand-navy group-hover:text-white transition-all duration-700 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100">
                         <ChevronRight size={20} />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
