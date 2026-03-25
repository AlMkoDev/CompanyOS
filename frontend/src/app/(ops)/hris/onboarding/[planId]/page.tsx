'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  ArrowLeft,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  Zap,
  CheckCircle,
  MoreVertical,
} from 'lucide-react';

interface PlanTask {
  id: string;
  title: string;
  status: string;
  category?: string | null;
}

interface Milestone {
  id: string;
  type: string;
  due_date: string;
  completed_at?: string | null;
}

interface PlanDetail {
  id: string;
  start_date: string;
  status: string;
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    department?: { name?: string | null } | null;
    position?: { title?: string | null } | null;
  };
  tasks: PlanTask[];
  milestones: Milestone[];
}

export default function OnboardingPlanDetail() {
  const params = useParams();
  const router = useRouter();
  const { logout } = useAuthStore();
  const employeeId = params.planId as string;
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  useEffect(() => {
    const loadPlan = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFetch(`/onboarding/plans/${employeeId}`);

        if (response.status === 401) {
          logout();
          router.push('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to load onboarding plan.');
        }

        setPlan((await response.json()) as PlanDetail);
      } catch (loadError) {
        console.error(loadError);
        setError(loadError instanceof Error ? loadError.message : 'Failed to load onboarding plan.');
      } finally {
        setLoading(false);
      }
    };

    void loadPlan();
  }, [employeeId, logout, router]);

  const toggleTask = async (taskId: string) => {
    if (!plan) return;

    const currentTask = plan.tasks.find((task) => task.id === taskId);
    if (!currentTask) return;

    const nextStatus = currentTask.status === 'completed' ? 'pending' : 'completed';
    setUpdatingTaskId(taskId);

    try {
      const response = await apiFetch(`/onboarding/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (response.status === 401) {
        logout();
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to update onboarding task.');
      }

      setPlan((currentPlan) =>
        currentPlan
          ? {
              ...currentPlan,
              tasks: currentPlan.tasks.map((task) =>
                task.id === taskId ? { ...task, status: nextStatus } : task,
              ),
            }
          : currentPlan,
      );
    } catch (updateError) {
      console.error(updateError);
      setError(updateError instanceof Error ? updateError.message : 'Failed to update onboarding task.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const completedCount = useMemo(
    () => plan?.tasks.filter((task) => task.status === 'completed').length || 0,
    [plan],
  );
  const progress = plan && plan.tasks.length > 0 ? Math.round((completedCount / plan.tasks.length) * 100) : 0;

  if (loading) {
    return <div className="p-10 text-slate-500">Loading onboarding plan...</div>;
  }

  if (!plan) {
    return <div className="p-10 text-red-600">{error || 'Onboarding plan not found.'}</div>;
  }

  return (
    <div className="p-6 md:p-12 flex flex-col gap-10 pb-32 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <Link href="/hris/onboarding" className="p-4 bg-white border border-slate-100 rounded-2xl hover:bg-brand-navy hover:text-white transition-all text-slate-400 shadow-sm active:scale-95 group">
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-brand-gold rounded-full"></div>
              <h1 className="text-3xl font-heading text-brand-navy font-black tracking-tight">
                Onboarding: {plan.employee.first_name} {plan.employee.last_name}
              </h1>
            </div>
            <div className="flex items-center gap-4 ml-4">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                {plan.employee.department?.name || 'Unassigned Department'}
              </span>
              <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] italic">
                Commenced {new Date(plan.start_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {progress === 100 ? (
            <Badge className="bg-emerald-50 text-emerald-600 border-none px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] shadow-sm">Process Certified</Badge>
          ) : (
            <Badge className="bg-brand-gold/10 text-brand-navy border-none px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px] shadow-sm animate-pulse">In Progress</Badge>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-[24px] border border-red-100 bg-red-50 px-6 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-10">
          <Card className="p-10 rounded-[56px] border-slate-100 shadow-2xl shadow-slate-200/50 bg-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full blur-[80px] opacity-60"></div>
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-10 text-center">Operational Readiness</h3>

            <div className="relative w-48 h-48 mx-auto mb-10">
              <svg className="w-full h-full transform -rotate-90 scale-110">
                <circle className="text-slate-50" strokeWidth="10" stroke="currentColor" fill="transparent" r="64" cx="80" cy="80" />
                <circle className="text-emerald-500 transition-all duration-1000 ease-out" strokeWidth="10" strokeDasharray={402} strokeDashoffset={402 - (402 * progress) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="64" cx="80" cy="80" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-brand-navy tracking-tighter">{progress}%</span>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Complete</span>
              </div>
            </div>

            <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400">Tasks Resolved</span>
                <span className="text-xs font-black text-brand-navy">{completedCount} / {plan.tasks.length}</span>
              </div>
              <div className="w-full h-1.5 bg-white rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </Card>

          <Card className="p-10 rounded-[56px] border-slate-100 bg-slate-50 shadow-inner">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 text-center">Lifecycle Context</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-5 p-5 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                <div className="w-14 h-14 bg-brand-navy rounded-[22px] flex items-center justify-center text-brand-gold font-black text-xl shadow-lg shadow-brand-navy/20">HR</div>
                <div>
                  <div className="text-base font-black text-brand-navy">{plan.employee.position?.title || 'No Position'}</div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Current Position</p>
                </div>
              </div>
              <div className="flex items-center gap-5 p-5 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                <div className="w-14 h-14 bg-slate-50 rounded-[22px] flex items-center justify-center text-slate-300 shadow-inner"><User size={28} /></div>
                <div>
                  <div className="text-base font-black text-brand-navy">{plan.employee.department?.name || 'Unassigned'}</div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Owning Department</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-10">
          <div className="grid gap-4">
            {plan.tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => {
                  if (!updatingTaskId) {
                    void toggleTask(task.id);
                  }
                }}
                className={`p-8 bg-white border-2 rounded-[40px] shadow-sm flex items-center justify-between transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 group ${task.status === 'completed' ? 'border-emerald-50/50 bg-emerald-50/10' : 'border-slate-50'}`}
              >
                <div className="flex items-center gap-8">
                  <div className={`transition-all duration-500 h-10 w-10 rounded-[14px] flex items-center justify-center shadow-inner ${task.status === 'completed' ? 'bg-emerald-500 text-white rotate-12' : 'bg-slate-50 text-slate-200 group-hover:bg-white group-hover:text-brand-gold group-hover:border group-hover:border-brand-gold/20'}`}>
                    {task.status === 'completed' ? <CheckCircle size={24} strokeWidth={3} /> : <div className="w-3 h-3 rounded-full bg-current"></div>}
                  </div>
                  <div>
                    <div className={`text-xl font-heading transition-all duration-500 ${task.status === 'completed' ? 'text-slate-300 line-through opacity-60' : 'text-brand-navy font-black tracking-tight'}`}>{task.title}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border-slate-100 ${task.status === 'completed' ? 'opacity-40' : 'text-slate-400'}`}>{task.category || 'General'}</Badge>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-12 w-12 rounded-2xl hover:bg-slate-50 text-slate-300 hover:text-brand-navy">
                  <MoreVertical size={20} />
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-slate-50/50 p-12 rounded-[64px] border border-white">
            <h3 className="text-2xl font-heading font-black text-brand-navy mb-12 flex items-center gap-4 tracking-tight">
              <ShieldCheck size={28} className="text-brand-gold" /> Strategic Performance Gates
            </h3>
            <div className="relative">
              <div className="absolute left-7 top-4 bottom-4 w-1 bg-white rounded-full"></div>
              <div className="space-y-12 relative">
                {plan.milestones.map((milestone) => (
                  <div key={milestone.id} className="flex gap-10 items-start group">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-4 shadow-xl transition-all duration-500 ${milestone.completed_at ? 'bg-emerald-500 border-white text-white rotate-3 group-hover:scale-110' : 'bg-white border-white text-slate-200 group-hover:text-brand-navy group-hover:border-brand-gold/20 group-hover:-rotate-3 translate-x-px'}`}>
                      {milestone.completed_at ? <CheckCircle2 size={30} strokeWidth={2.5} /> : <Zap size={24} />}
                    </div>
                    <div className="pt-2 flex-1">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                        <h4 className={`text-lg font-black tracking-tight ${milestone.completed_at ? 'text-emerald-700' : 'text-brand-navy opacity-40'}`}>{milestone.type.toUpperCase()} Milestone</h4>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl text-[10px] text-slate-400 font-black uppercase tracking-widest shadow-sm">
                          <Calendar size={12} className="text-brand-gold" /> {new Date(milestone.due_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
