'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  CheckCircle2,
  Clock,
  UserPlus,
  UserMinus,
  Sparkles,
  Search,
  ChevronRight,
} from 'lucide-react';

interface EmployeeSummary {
  id: string;
  first_name: string;
  last_name: string;
  department?: { name?: string | null } | null;
}

interface OnboardingTaskSummary {
  id: string;
  status: string;
}

interface OffboardingTaskSummary {
  id: string;
  status: string;
}

interface OnboardingPlan {
  id: string;
  start_date: string;
  status: string;
  employee: EmployeeSummary;
  tasks: OnboardingTaskSummary[];
}

interface OffboardingPlan {
  id: string;
  last_day: string;
  employee: EmployeeSummary;
  tasks: OffboardingTaskSummary[];
}

interface PlansPayload {
  onboarding: OnboardingPlan[];
  offboarding: OffboardingPlan[];
}

interface PlanRow {
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
  const { logout } = useAuthStore();
  const [payload, setPayload] = useState<PlansPayload>({ onboarding: [], offboarding: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadPlans = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFetch('/onboarding/plans');

        if (response.status === 401) {
          logout();
          window.location.href = '/login';
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to load transition plans.');
        }

        const data = (await response.json()) as PlansPayload;
        setPayload(data);
      } catch (loadError) {
        console.error(loadError);
        setError(loadError instanceof Error ? loadError.message : 'Failed to load transition plans.');
      } finally {
        setLoading(false);
      }
    };

    void loadPlans();
  }, [logout]);

  const plans = useMemo<PlanRow[]>(() => {
    const onboardingRows = payload.onboarding.map((plan) => {
      const completedCount = plan.tasks.filter((task) => task.status === 'completed').length;
      const progress = plan.tasks.length > 0 ? Math.round((completedCount / plan.tasks.length) * 100) : 0;

      return {
        id: plan.id,
        type: 'onboarding' as const,
        employee_name: `${plan.employee.first_name} ${plan.employee.last_name}`,
        department: plan.employee.department?.name || 'Unassigned',
        status: plan.status,
        progress,
        start_date: plan.start_date,
        employee_id: plan.employee.id,
      };
    });

    const offboardingRows = payload.offboarding.map((plan) => {
      const completedCount = plan.tasks.filter((task) => task.status === 'done').length;
      const progress = plan.tasks.length > 0 ? Math.round((completedCount / plan.tasks.length) * 100) : 0;

      return {
        id: plan.id,
        type: 'offboarding' as const,
        employee_name: `${plan.employee.first_name} ${plan.employee.last_name}`,
        department: plan.employee.department?.name || 'Unassigned',
        status: plan.tasks.some((task) => task.status !== 'done') ? 'in_progress' : 'completed',
        progress,
        start_date: plan.last_day,
        employee_id: plan.employee.id,
      };
    });

    return [...onboardingRows, ...offboardingRows];
  }, [payload]);

  const filteredPlans = plans.filter((plan) =>
    [plan.employee_name, plan.department, plan.type]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const activeOnboarding = payload.onboarding.length;
  const pendingOffboarding = payload.offboarding.length;
  const averageOnboardingDays =
    payload.onboarding.length > 0
      ? (
          payload.onboarding.reduce((total, plan) => {
            const start = new Date(plan.start_date).getTime();
            const now = Date.now();
            return total + Math.max(0, Math.round((now - start) / (1000 * 60 * 60 * 24)));
          }, 0) / payload.onboarding.length
        ).toFixed(1)
      : '0.0';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'started':
        return <Badge className="bg-blue-50 text-blue-600 border-none shadow-none font-black uppercase tracking-tighter text-[10px] rounded-full px-3 py-1">Started</Badge>;
      case 'in_progress':
      case 'in-progress':
        return <Badge className="bg-amber-50 text-amber-600 border-none shadow-none font-black uppercase tracking-tighter text-[10px] rounded-full px-3 py-1">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-50 text-emerald-600 border-none shadow-none font-black uppercase tracking-tighter text-[10px] rounded-full px-3 py-1">Completed</Badge>;
      default:
        return <Badge variant="outline" className="rounded-full px-3 py-1 font-black uppercase tracking-tighter text-[10px]">{status}</Badge>;
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
          <p className="text-slate-400 font-medium text-base ml-4">Live onboarding and offboarding workflows synchronized with operational tasks.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-[24px] border border-red-100 bg-red-50 px-6 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="p-10 rounded-[48px] border-slate-100 shadow-sm bg-white overflow-hidden relative group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-navy/5 rounded-full blur-3xl group-hover:bg-brand-navy/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Onboarding</h3>
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-[20px] shadow-sm"><UserPlus size={20} /></div>
          </div>
          <div className="text-5xl font-heading font-black text-brand-navy mb-2 tracking-tight">{activeOnboarding}</div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" /> Live onboarding plans
          </p>
        </Card>

        <Card className="p-10 rounded-[48px] border-slate-100 shadow-sm bg-white overflow-hidden relative group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-gold/5 rounded-full blur-3xl group-hover:bg-brand-gold/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pending Offboarding</h3>
            <div className="p-3 bg-rose-50 text-rose-500 rounded-[20px] shadow-sm"><UserMinus size={20} /></div>
          </div>
          <div className="text-5xl font-heading font-black text-brand-navy mb-2 tracking-tight">{pendingOffboarding}</div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Clock size={14} className="text-rose-400" /> Operational closure in progress
          </p>
        </Card>

        <Card className="p-10 rounded-[48px] border-none shadow-2xl bg-brand-navy text-white overflow-hidden relative group hover:-translate-y-1 transition-all duration-500">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 group-hover:bg-white/20 transition-colors blur-3xl"></div>
          <div className="flex justify-between items-start mb-6 text-white/50">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Avg. Time in Onboarding</h3>
            <div className="p-3 bg-white/10 text-brand-gold rounded-[20px] backdrop-blur-md"><Clock size={20} /></div>
          </div>
          <div className="text-5xl font-heading font-black text-white mb-2 tracking-tight">{averageOnboardingDays} <span className="text-xl font-bold text-white/40">DAYS</span></div>
          <p className="text-brand-gold/80 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            Calculated from live plan start dates <Sparkles size={12} />
          </p>
        </Card>
      </div>

      <div className="bg-white rounded-[56px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-10">
            <h2 className="text-2xl font-heading font-black text-brand-navy tracking-tight">Active Transitions</h2>
            <div className="relative w-80 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-navy transition-colors" size={20} />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search personnel..."
                className="h-14 pl-14 rounded-2xl border-slate-100 bg-white shadow-inner focus-visible:ring-brand-navy/10 text-lg font-medium"
              />
            </div>
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
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="p-10 h-24 bg-slate-50/20"></td>
                  </tr>
                ))
              ) : filteredPlans.length > 0 ? (
                filteredPlans.map((plan) => (
                  <tr key={`${plan.type}-${plan.id}`} className="hover:bg-slate-50/50 transition-all duration-300 group">
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
              ) : (
                <tr>
                  <td colSpan={5} className="px-10 py-16 text-center text-slate-500">
                    No transition plans found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
