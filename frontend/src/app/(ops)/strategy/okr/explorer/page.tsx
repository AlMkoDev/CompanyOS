"use client";

import React, { useState, useEffect } from 'react';
import {
  Target, 
  ChevronRight, 
  ChevronDown, 
  TrendingUp, 
  Users, 
  Zap,
  Activity,
  Plus,
  Filter,
  BarChart3,
  Search,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

interface OkrCycle {
  id: string;
  name: string;
}

interface OkrCheckIn {
  confidence?: number;
}

interface OkrKeyResult {
  id: string;
  title: string;
  current_value: number;
  target_value: number;
  unit: string;
  check_ins?: OkrCheckIn[];
}

interface OkrTreeNode {
  id: string;
  title: string;
  progress: number;
  owner?: {
    first_name: string;
    last_name: string;
  };
  key_results: OkrKeyResult[];
  children: OkrTreeNode[];
}

interface OkrRowProps {
  objective: OkrTreeNode;
  level: number;
  expanded: Record<string, boolean>;
  toggleExpand: (id: string) => void;
}

export default function OkrExplorerPage() {
  const [cycles, setCycles] = useState<OkrCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [tree, setTree] = useState<OkrTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchCycles();
  }, []);

  useEffect(() => {
    if (selectedCycle) {
      fetchTree(selectedCycle);
    }
  }, [selectedCycle]);

  const fetchCycles = async () => {
    try {
      const res = await fetch('/api/okr/cycles');
      const data = await res.json();
      setCycles(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        setSelectedCycle(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching cycles:', err);
      setCycles([]); // Set empty array on error
    }
  };

  const fetchTree = async (cycleId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/okr/explorer?cycleId=${cycleId}`);
      const data = await res.json();
      setTree(data);
    } catch (err) {
      console.error('Error fetching OKR tree:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50/30 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">
            Strategic <span className="text-brand-gold font-light italic">Alignment</span>
          </h1>
          <p className="text-slate-500 font-medium">Cascading objectives and key results explorer.</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-gold/20"
          >
            {Array.isArray(cycles) && cycles.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button className="flex items-center gap-2 bg-brand-navy text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand-navy/10 hover:bg-slate-800 transition-all">
            <Plus size={18} />
            New Strategic Objective
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: 'Overall Progress', value: '42%', trend: '+5%', icon: Target, color: 'text-indigo-500', bg: 'bg-indigo-50' },
           { label: 'On Track', value: '18', trend: '82%', icon: Zap, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
           { label: 'Check-in Rate', value: '94%', trend: 'Weekly', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
           { label: 'Alignment Depth', value: '3 Levels', trend: 'Global', icon: TrendingUp, color: 'text-rose-500', bg: 'bg-rose-50' },
         ].map((stat, i) => (
           <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
             <div className="flex items-center justify-between mb-4">
               <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                 <stat.icon size={20} />
               </div>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.trend}</span>
             </div>
             <div className="space-y-1">
               <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
             </div>
           </div>
         ))}
      </div>

      {/* OKR Tree Grid */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search alignment..." 
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/20 w-64"
              />
            </div>
            <div className="flex items-center gap-2">
               <Filter size={16} className="text-slate-400" />
               <span className="text-xs font-bold text-slate-500">Filter: </span>
               <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:border-brand-gold transition-colors uppercase">Department</button>
               <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:border-brand-gold transition-colors uppercase">Owner</button>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span>Progress</span>
            <span>Status</span>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {tree.length === 0 && !loading ? (
             <div className="p-20 text-center space-y-4">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                 <Target size={32} />
               </div>
               <p className="text-slate-400 font-medium">No objectives found for this cycle.</p>
             </div>
          ) : (
            tree.map(obj => (
              <OkrRow key={obj.id} objective={obj} level={0} expanded={expanded} toggleExpand={toggleExpand} />
            ))
          )}
          {loading && (
            <div className="p-12 text-center animate-pulse text-slate-300">
               Global alignment loading...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OkrRow({ objective, level, expanded, toggleExpand }: OkrRowProps) {
  const isExpanded = expanded[objective.id];
  const hasChildren = objective.children && objective.children.length > 0;
  const hasKRs = objective.key_results && objective.key_results.length > 0;

  return (
    <>
      <div className={`group hover:bg-slate-50/80 transition-colors ${level > 0 ? 'bg-slate-50/20' : ''}`}>
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-4 flex-1">
            <div style={{ paddingLeft: `${level * 2}rem` }} className="flex items-center gap-4">
              {hasChildren ? (
                <button onClick={() => toggleExpand(objective.id)} className="p-1 hover:bg-slate-100 rounded-md text-slate-400 transition-colors">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : (
                <div className="w-5.5" />
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${level === 0 ? 'bg-indigo-50 text-indigo-500 shadow-sm' : level === 1 ? 'bg-emerald-50 text-emerald-500' : 'bg-brand-gold/10 text-brand-gold'}`}>
                {level === 0 ? <ShieldCheck size={20} /> : level === 1 ? <Users size={18} /> : <Star size={16} />}
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-navy transition-colors">{objective.title}</h4>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                   <div className="w-4 h-4 rounded-full bg-slate-300 overflow-hidden border border-white">
                      {/* Avatar placeholder */}
                   </div>
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                     {objective.owner?.first_name} {objective.owner?.last_name}
                   </span>
                </div>
                {hasKRs && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{objective.key_results.length} Key Results</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-12">
            <div className="w-48 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span>{objective.progress}%</span>
                <span>Target 100%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${objective.progress > 70 ? 'bg-emerald-500' : objective.progress > 40 ? 'bg-brand-gold' : 'bg-rose-500'}`}
                  style={{ width: `${objective.progress}%` }}
                />
              </div>
            </div>
            <div className="w-24 flex justify-end">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${objective.progress > 70 ? 'bg-emerald-50 text-emerald-600' : objective.progress > 40 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                {objective.progress > 70 ? 'On Track' : objective.progress > 40 ? 'At Risk' : 'Delayed'}
              </span>
            </div>
          </div>
        </div>

        {/* Key Results Inline View */}
        {isExpanded && hasKRs && (
          <div className="px-20 pb-4 space-y-3">
             {objective.key_results.map((kr) => (
                <div key={kr.id} className="flex items-center justify-between p-4 bg-white/50 border border-slate-100 rounded-2xl">
                   <div className="flex items-center gap-4">
                      <div className="p-2 bg-indigo-50 text-indigo-400 rounded-lg">
                        <BarChart3 size={14} />
                      </div>
                      <div className="space-y-0.5">
                         <span className="text-xs font-bold text-slate-700">{kr.title}</span>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                           {kr.current_value} / {kr.target_value} {kr.unit}
                         </p>
                      </div>
                   </div>
                   <div className="flex items-center gap-8">
                      <div className="text-right">
                         <span className="text-xs font-bold text-slate-900 block">{kr.check_ins?.[0]?.confidence || 0}/10</span>
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Confidence</span>
                      </div>
                      <button className="flex items-center gap-2 text-[10px] font-bold text-brand-navy hover:text-brand-gold transition-colors uppercase tracking-widest">
                        Check-in <ArrowUpRight size={14} />
                      </button>
                   </div>
                </div>
             ))}
          </div>
        )}
      </div>

      {isExpanded && hasChildren && objective.children.map((child) => (
        <OkrRow key={child.id} objective={child} level={level + 1} expanded={expanded} toggleExpand={toggleExpand} />
      ))}
    </>
  );
}

function Star({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
