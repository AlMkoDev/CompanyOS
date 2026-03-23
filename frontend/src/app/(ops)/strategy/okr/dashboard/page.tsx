"use client";

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  AlertCircle,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  Zap,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface OkrHealthObjective {
  id: string;
  title: string;
  progress: number;
  healthScore: number;
}

interface OkrHealthGroup {
  objectives: OkrHealthObjective[];
}

const DEPARTMENT_HEALTH = [
  { dept: 'Engineering', health: 'good' as const },
  { dept: 'Product', health: 'good' as const },
  { dept: 'Marketing', health: 'warning' as const },
  { dept: 'Sales', health: 'good' as const },
  { dept: 'HR', health: 'warning' as const },
  { dept: 'Finance', health: 'good' as const },
  { dept: 'Operations', health: 'good' as const },
  { dept: 'Strategy', health: 'warning' as const },
];

export default function OkrDashboardPage() {
  const [healthData, setHealthData] = useState<OkrHealthGroup[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadHealthData = async () => {
      try {
        const res = await fetch('/api/okr/dashboard/health');
        const data = await res.json();
        if (isMounted) {
          setHealthData(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    void loadHealthData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="p-8 space-y-8 bg-slate-50/30 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">
            Strategic <span className="text-brand-gold font-light italic">Health</span>
          </h1>
          <p className="text-slate-500 font-medium">Executive overview of organizational alignment and risk.</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
           <Calendar size={18} className="text-brand-gold" />
           <span className="text-sm font-bold text-slate-700">Q3 2024 Cycle</span>
           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse ml-2" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {[
           { label: 'Platform Health', value: '88/100', trend: 'Optimal', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
           { label: 'Strategic Momentum', value: 'Moderate', trend: '+12%', icon: TrendingUp, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
           { label: 'Alignment Gaps', value: '4 Detected', trend: 'Urgent', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
         ].map((stat, i) => (
           <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
               <stat.icon size={80} />
             </div>
             <div className="space-y-6 relative z-10">
               <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                 <stat.icon size={24} />
               </div>
               <div className="space-y-1">
                 <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
               </div>
               <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${stat.bg} ${stat.color} uppercase tracking-tighter`}>{stat.trend}</span>
                  <button className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest flex items-center gap-1 group/btn">
                    Deep Dive <ArrowUpRight size={12} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </button>
               </div>
             </div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Health Map Grid */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={20} className="text-slate-900" />
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Departmental Health Map</h3>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">On Track</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-brand-gold rounded-full" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">At Risk</span>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {DEPARTMENT_HEALTH.map(({ dept, health }) => {
                  return (
                    <div key={dept} className={`p-6 rounded-3xl border transition-all cursor-pointer group hover:scale-[1.02] ${health === 'good' ? 'bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50' : 'bg-amber-50/30 border-amber-100 hover:bg-amber-50'}`}>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{dept}</p>
                       <div className="flex items-center justify-between">
                         <h4 className="text-xl font-bold text-slate-900">{health === 'good' ? '92' : '64'}%</h4>
                         {health === 'good' ? (
                           <ShieldCheck size={18} className="text-emerald-500" />
                         ) : (
                           <AlertCircle size={18} className="text-amber-500" />
                         )}
                       </div>
                    </div>
                  );
                })}
             </div>
           </div>

           {/* Active Objectives Table */}
           <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Risk Exposure List</h3>
                <button className="text-xs font-bold text-rose-500 hover:text-rose-600 uppercase tracking-widest">View All Delayed</button>
             </div>
             <div className="divide-y divide-slate-50">
               {healthData[0]?.objectives.slice(0, 3).map((obj, i: number) => (
                 <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold italic">
                         {obj.title[0]}
                       </div>
                       <div>
                          <h4 className="text-sm font-bold text-slate-900">{obj.title}</h4>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Owner: Global {i % 2 === 0 ? 'Engineering' : 'Strategy'}</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-8">
                       <div className="text-right">
                          <span className="text-xs font-bold text-slate-900 block">{obj.progress}% Done</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Health Score: {obj.healthScore}</span>
                       </div>
                       <ChevronRight size={16} className="text-slate-200" />
                    </div>
                 </div>
               ))}
             </div>
           </div>
        </div>

        {/* Sidebar: Momentum Feed */}
        <div className="space-y-8">
           <div className="bg-brand-navy rounded-[32px] p-8 text-white space-y-6 shadow-xl shadow-brand-navy/20">
              <div className="flex items-center gap-3">
                 <Zap size={20} className="text-brand-gold" />
                 <h3 className="text-lg font-bold tracking-tight">Momentum Feed</h3>
              </div>
              <div className="space-y-6">
                 {[
                   { user: 'CTO', action: 'completed check-in', time: '2h ago', level: 'Engineering' },
                   { user: 'CEO', action: 'updated Q3 strategy', time: '5h ago', level: 'Corporate' },
                   { user: 'COO', action: 'flagged risk node', time: '1d ago', level: 'Operations' },
                 ].map((item, i) => (
                   <div key={i} className="space-y-2 group cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white/90 group-hover:text-brand-gold transition-colors">{item.user}</span>
                        <span className="text-[10px] font-bold text-white/40 uppercase">{item.time}</span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">Systemically <span className="text-white font-medium">{item.action}</span> for the {item.level} layer.</p>
                   </div>
                 ))}
              </div>
              <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all border border-white/10">
                View Full Audit Log
              </button>
           </div>

           <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                 <BarChart3 size={20} className="text-slate-900" />
                 <h3 className="text-lg font-bold tracking-tight">Alignment Depth</h3>
              </div>
              <div className="space-y-4">
                 {[
                   { label: 'Company -> Dept', val: 95, color: 'bg-emerald-500' },
                   { label: 'Dept -> Individual', val: 62, color: 'bg-brand-gold' },
                   { label: 'Cross-Functional', val: 40, color: 'bg-rose-500' },
                 ].map((bar, i) => (
                   <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <span>{bar.label}</span>
                        <span>{bar.val}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                        <div className={`h-full ${bar.color} transition-all duration-1000`} style={{ width: `${bar.val}%` }} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
