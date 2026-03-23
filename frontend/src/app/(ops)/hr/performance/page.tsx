"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Users, 
  Target, 
  Calendar, 
  ChevronRight, 
  ArrowUpRight, 
  Plus,
  TrendingUp,
  Award,
  Zap,
  MoreVertical,
  Activity
} from 'lucide-react';

interface PerformanceCycle {
  id: string;
  name: string;
  period: string;
  status: string;
  _count: {
    reviews: number;
  };
}

export default function PerformanceDashboard() {
  const [cycles, setCycles] = useState<PerformanceCycle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    try {
      const res = await fetch('/api/performance/cycles');
      if (res.ok) setCycles(await res.json());
    } catch (error) {
      console.error('Error fetching cycles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-slate-50/30 min-h-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Talent Strategy</span>
          </div>
          <h1 className="text-4xl font-heading font-bold text-slate-900 tracking-tight">Performance <span className="text-brand-gold font-light italic">Intelligence</span></h1>
          <p className="text-slate-500 font-medium">Cultivating excellence through metrics-driven feedback loops.</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-6 py-2.5 bg-brand-navy text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-brand-navy/10 group">
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            New Review Cycle
          </button>
        </div>
      </div>

      {/* Strategic Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Avg Rating', value: '4.2', icon: Award, trend: '+0.3', sub: 'vs last year', color: 'text-brand-gold' },
          { label: 'Completion', value: '84%', icon: Activity, trend: '+12%', sub: 'in current cycle', color: 'text-emerald-600' },
          { label: 'Top Talents', value: '18', icon: Zap, trend: '+2', sub: 'potentials identified', color: 'text-indigo-600' },
          { label: 'OKR Alignment', value: '92%', icon: Target, trend: '+5%', sub: 'strategy connected', color: 'text-slate-900' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg bg-slate-50 ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</div>
              <div className={`flex items-center gap-1 text-[10px] font-bold ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-indigo-500'} mb-1.5`}>
                <ArrowUpRight size={12} />
                {stat.trend}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Cycles List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active <span className="font-light italic">Review Cycles</span></h2>
            <Link href="#" className="text-xs font-bold text-brand-gold hover:underline uppercase tracking-widest">View Archives</Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {cycles.map((cycle) => (
              <div key={cycle.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group border-l-4 border-l-brand-gold">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-brand-gold transition-colors">{cycle.name}</h3>
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-slate-400" />
                        {cycle.period}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={14} className="text-slate-400" />
                        {cycle._count.reviews} Reviews
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      cycle.status === 'manager_review' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {cycle.status.replace('_', ' ')}
                    </span>
                    <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>Campaign Progress</span>
                    <span className="text-slate-900">75%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-gold w-3/4 rounded-full shadow-[0_0_8px_rgba(184,134,11,0.3)]"></div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden ring-2 ring-slate-50 shadow-sm">
                        <Image src={`https://i.pravatar.cc/100?u=emp${i}`} alt="Avatar" width={32} height={32} className="w-full h-full object-cover" unoptimized />
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-brand-navy text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-50 shadow-sm">
                      +12
                    </div>
                  </div>
                  <Link 
                    href={`/hr/performance/cycle/${cycle.id}`}
                    className="flex items-center gap-2 text-xs font-bold text-slate-900 hover:text-brand-gold group/btn"
                  >
                    Manage Cycle
                    <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-8">
          {/* Performance Heatmap Mini */}
          <div className="bg-brand-navy text-white p-8 rounded-3xl shadow-xl shadow-brand-navy/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <TrendingUp size={120} />
            </div>
            <h3 className="text-lg font-bold mb-2">Talent <span className="text-brand-gold font-light italic">Calibration</span></h3>
            <p className="text-xs text-slate-300 font-medium mb-6 leading-relaxed">The Q1 assessment cycle is nearing completion. Calibration sessions open in 4 days.</p>
            <div className="space-y-4">
              <button className="w-full py-3 bg-brand-gold text-brand-navy rounded-xl font-bold text-sm hover:bg-white transition-all shadow-sm">
                Schedule Calibration
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-brand-gold" />
              Rating Distribution
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Exceeds Expectations', count: 12, color: 'bg-emerald-500' },
                { label: 'Meets Expectations', count: 45, color: 'bg-brand-gold' },
                { label: 'Developement Needed', count: 5, color: 'bg-indigo-300' },
              ].map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>{item.label}</span>
                    <span className="text-slate-900">{item.count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${(item.count / 62) * 100}%` }}></div>
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
