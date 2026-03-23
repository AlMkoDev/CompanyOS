'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Clock, 
  UserPlus, 
  UserMinus,
  Sparkles,
  Search,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

interface PlanSummary {
  id: string;
  type: 'onboarding' | 'offboarding';
  employee_name: string;
  department: string;
  status: string;
  progress: number;
  start_date: string;
  employee_id: string;
}

export default function TransitionsDashboard() {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setPlans([
        {
          id: '1',
          type: 'onboarding',
          employee_name: 'John Doe',
          department: 'Engineering',
          status: 'started',
          progress: 25,
          start_date: '2024-03-10',
          employee_id: 'emp-1'
        },
        {
          id: '2',
          type: 'onboarding',
          employee_name: 'Jane Smith',
          department: 'Marketing',
          status: 'in_progress',
          progress: 60,
          start_date: '2024-02-15',
          employee_id: 'emp-2'
        },
        {
          id: '3',
          type: 'offboarding',
          employee_name: 'Alice Williams',
          department: 'Finance',
          status: 'last_week',
          progress: 80,
          start_date: '2024-03-20',
          employee_id: 'emp-3'
        }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'started': return <Badge className="bg-blue-50 text-blue-600 border-none shadow-none font-black uppercase tracking-tighter text-[10px] rounded-full px-3 py-1">Started</Badge>;
      case 'in_progress': return <Badge className="bg-amber-50 text-amber-600 border-none shadow-none font-black uppercase tracking-tighter text-[10px] rounded-full px-3 py-1">In Progress</Badge>;
      case 'last_week': return <Badge className="bg-rose-50 text-rose-600 border-none shadow-none font-black uppercase tracking-tighter text-[10px] rounded-full px-3 py-1">Final Week</Badge>;
      default: return <Badge variant="outline" className="rounded-full px-3 py-1 font-black uppercase tracking-tighter text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-12 flex flex-col gap-10 pb-32 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="h-10 w-1 bg-brand-gold rounded-full"></div>
             <h1 className="text-4xl font-heading text-brand-navy font-black tracking-tight flex items-center gap-3">
                Transitions Dashboard
                <div className="p-2 bg-brand-navy/5 text-brand-gold rounded-2xl"><Sparkles size={24} /></div>
             </h1>
          </div>
          <p className="text-slate-400 font-medium text-base ml-4">Monitoring personnel lifecycle transitions and security compliance.</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="p-10 rounded-[48px] border-slate-100 shadow-sm bg-white overflow-hidden relative group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-navy/5 rounded-full blur-3xl group-hover:bg-brand-navy/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Onboarding</h3>
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-[20px] shadow-sm"><UserPlus size={20} /></div>
          </div>
          <div className="text-5xl font-heading font-black text-brand-navy mb-2 tracking-tight">12</div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" /> Ready for 30-day review
          </p>
        </Card>

        <Card className="p-10 rounded-[48px] border-slate-100 shadow-sm bg-white overflow-hidden relative group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
           <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-gold/5 rounded-full blur-3xl group-hover:bg-brand-gold/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pending Offboarding</h3>
            <div className="p-3 bg-rose-50 text-rose-500 rounded-[20px] shadow-sm"><UserMinus size={20} /></div>
          </div>
          <div className="text-5xl font-heading font-black text-brand-navy mb-2 tracking-tight">3</div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Clock size={14} className="text-rose-400" /> Awaiting IT assets return
          </p>
        </Card>

        <Card className="p-10 rounded-[48px] border-none shadow-2xl bg-brand-navy text-white overflow-hidden relative group hover:-translate-y-1 transition-all duration-500">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 group-hover:bg-white/20 transition-colors blur-3xl"></div>
          <div className="flex justify-between items-start mb-6 text-white/50">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Avg. Time to Onboard</h3>
            <div className="p-3 bg-white/10 text-brand-gold rounded-[20px] backdrop-blur-md"><Clock size={20} /></div>
          </div>
          <div className="text-5xl font-heading font-black text-white mb-2 tracking-tight">14.2 <span className="text-xl font-bold text-white/40">DAYS</span></div>
          <p className="text-brand-gold/80 text-xs font-bold uppercase tracking-widest cursor-pointer hover:underline flex items-center gap-2">
            Optimized since last month <Sparkles size={12} />
          </p>
        </Card>
      </div>

      <div className="bg-white rounded-[56px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
           <div className="flex items-center gap-10">
             <h2 className="text-2xl font-heading font-black text-brand-navy tracking-tight">Active Transitions</h2>
             <div className="relative w-80 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-navy transition-colors" size={20} />
                <Input placeholder="Search personnel..." className="h-14 pl-14 rounded-2xl border-slate-100 bg-white shadow-inner focus-visible:ring-brand-navy/10 text-lg font-medium" />
             </div>
           </div>
           <div className="flex gap-3">
             <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-brand-navy">Filter: All Records</Button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-300 border-b border-slate-50">
              <tr>
                <th className="px-10 py-8 font-black uppercase tracking-[0.2em] text-[10px]">Employee</th>
                <th className="px-10 py-8 font-black uppercase tracking-[0.2em] text-[10px]">Transition Type</th>
                <th className="px-10 py-8 font-black uppercase tracking-[0.2em] text-[10px]">Status</th>
                <th className="px-10 py-8 font-black uppercase tracking-[0.2em] text-[10px]">Timeline Progress</th>
                <th className="px-10 py-8 font-black uppercase tracking-[0.2em] text-[10px] text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="p-10 h-24 bg-slate-50/20"></td>
                  </tr>
                ))
              ) : (
                plans.map(plan => (
                  <tr key={plan.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                    <td className="px-10 py-8">
                      <div className="font-black text-brand-navy text-lg tracking-tight group-hover:text-brand-gold transition-colors">{plan.employee_name}</div>
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{plan.department}</div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${plan.type === 'onboarding' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                          {plan.type === 'onboarding' ? <UserPlus size={18} /> : <UserMinus size={18} />}
                        </div>
                        <span className="font-black text-slate-500 uppercase tracking-widest text-[11px]">{plan.type}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8">{getStatusBadge(plan.status)}</td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={`h-full ${plan.type === 'onboarding' ? 'bg-emerald-500' : 'bg-rose-500'} transition-all duration-1000 ease-out`}
                            style={{ width: `${plan.progress}%` }}
                          />
                        </div>
                        <span className="font-mono font-black text-brand-navy text-xs">{plan.progress}%</span>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <Link href={`/hris/${plan.type}/${plan.employee_id}`}>
                        <Button variant="ghost" className="h-12 rounded-[18px] font-black uppercase tracking-widest text-[10px] text-brand-navy hover:bg-brand-navy hover:text-white group-hover:px-8 transition-all gap-3 border border-transparent hover:border-brand-navy/10 active:scale-95">
                          Manage Lifecycle <ChevronRight size={14} />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
