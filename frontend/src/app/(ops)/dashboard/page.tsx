"use client";

import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { CorporateVisualizer } from '@/components/viz/CorporateVisualizer';
import { OperationalGapDashboard } from '@/components/ops/OperationalGapDashboard';
import { apiFetch } from '@/lib/api';

interface DepartmentSummary {
  id: string;
  name: string;
}

interface CompanySummary {
  tagline?: string;
  gap_statuses?: unknown[];
}

interface TaskSummary {
  id: string;
  title: string;
  department_id?: string;
  status: string;
  priority: keyof typeof PRIORITY_COLORS;
}

interface WorkflowCardProps {
  title: string;
  dept: string;
  status: string;
  priority: keyof typeof PRIORITY_COLORS;
}

interface AuditItemProps {
  time: string;
  action: string;
  details: string;
}

interface KpiRowProps {
  label: string;
  value: string;
  progress: number;
}

const PRIORITY_COLORS = {
  Critical: 'text-red-600 bg-red-50',
  High: 'text-orange-600 bg-orange-50',
  Medium: 'text-blue-600 bg-blue-50',
  Low: 'text-slate-400 bg-slate-50',
} as const;

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [departments, setDepartments] = React.useState<DepartmentSummary[]>([]);
  const [company, setCompany] = React.useState<CompanySummary | null>(null);
  const [tasks, setTasks] = React.useState<TaskSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptRes, companyRes, tasksRes] = await Promise.all([
          apiFetch('/departments'),
          apiFetch('/company'),
          apiFetch('/tasks')
        ]);

        if (deptRes.ok) {
          const depts = await deptRes.json();
          setDepartments(depts);
        }
        if (companyRes.ok) {
          const comp = await companyRes.json();
          setCompany(comp);
        }
        if (tasksRes.ok) {
          const tsks = await tasksRes.json();
          setTasks(tsks);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!user) return null;

  return (
    <div className="p-6 md:p-10 flex flex-col gap-10">
      {/* Signboard Header */}
      <header className="bg-brand-navy rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden shrink-0 border border-white/5">
        <div className="relative z-10 flex justify-between items-center decoration-brand-gold">
          <div>
            <h1 className="text-4xl md:text-5xl font-heading mb-3 leading-tight tracking-tight">
              Welcome to <span className="text-brand-gold">{user?.email?.split('@')[1]?.split('.')[0]?.toUpperCase() || 'Verdant Fields'} AgriTech Ltd</span>
            </h1>
            <p className="text-slate-400 text-lg flex items-center gap-2 italic">
               <span className="w-8 h-[1px] bg-slate-700"></span> 
               &quot;{company?.tagline || 'Operating at the Speed of Thought'}&quot;
            </p>
          </div>
          <div className="hidden lg:block text-right">
             <div className="text-brand-gold/60 font-black text-[10px] tracking-[0.3em] uppercase mb-1">SYSTEM STATUS</div>
             <div className="flex items-center gap-2 justify-end">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                <div className="text-emerald-400 text-3xl font-heading tracking-widest">OPTIMIZED</div>
             </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold opacity-5 rounded-full -mr-20 -mt-20 blur-[120px]"></div>
      </header>

      {/* Operational Gaps Tracking */}
      <section className="animate-in slide-in-from-bottom-5 duration-700 delay-150">
         <div className="flex justify-between items-end mb-6 px-2">
            <h2 className="text-2xl font-heading text-brand-navy flex items-center gap-3">
              Operational Readiness & Gap Tracking
              <span className="text-[10px] bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-brand-gold/20">Phase 1/3</span>
            </h2>
         </div>
         <OperationalGapDashboard 
            gapStatuses={company?.gap_statuses || []} 
            departments={departments} 
         />
      </section>

      {/* Main Structural Visualizer */}
      <section className="animate-in fade-in zoom-in-95 duration-1000">
         <div className="flex justify-between items-end mb-6 px-2">
            <h2 className="text-2xl font-heading text-brand-navy flex items-center gap-3">
              Interactive Corporate Schematic
              <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Live</span>
            </h2>
            <span className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase font-bold opacity-50">Structural Schematic v5.0 // OPS_MODE_ENABLED</span>
         </div>
         <CorporateVisualizer departments={departments} loading={loading} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start pb-20">
        {/* Department Quick List */}
        <section className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-heading">Active Workflows</h3>
              <button 
                onClick={() => window.location.href = '/tasks'} 
                className="text-[10px] font-bold text-brand-gold uppercase tracking-widest hover:underline"
              >
                View All TaskBoards →
              </button>
           </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.length > 0 ? (
                tasks.slice(0, 4).map((task) => (
                  <WorkflowCard 
                    key={task.id}
                    title={task.title} 
                    dept={departments.find(d => d.id === task.department_id)?.name || 'Unknown'} 
                    status={task.status} 
                    priority={task.priority} 
                  />
                ))
              ) : (
                <div className="col-span-2 p-8 text-center bg-white border border-slate-100 rounded-2xl">
                  <p className="text-slate-500 mb-2">No active workflows found.</p>
                  <button onClick={() => window.location.href = '/tasks'} className="text-sm font-bold text-brand-navy hover:text-brand-gold transition-colors">Create your first task →</button>
                </div>
              )}
            </div>
        </section>

        {/* Global KPIs & Activity */}
        <aside className="space-y-6">
          <div className="glass-card p-8 rounded-3xl border-slate-100 shadow-sm">
            <h3 className="font-heading text-2xl mb-8 flex justify-between items-center">
              Master KPIs
              <span className="text-[10px] text-slate-400 font-bold uppercase">Q1 Performance</span>
            </h3>
            <div className="space-y-8">
              <KpiRow label="Monthly Revenue" value="R450k" progress={75} />
              <KpiRow label="Task Velocity" value="85%" progress={85} />
              <KpiRow label="Compliance Score" value="98%" progress={98} />
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl border-l-4 border-brand-gold bg-white">
            <h3 className="font-heading text-lg mb-6 text-brand-navy">Latest Audit Trail</h3>
            <div className="text-[11px] text-slate-500 space-y-6">
              <AuditItem time="2m ago" action="Status Change" details="Task #104 moved to DONE" />
              <AuditItem time="15m ago" action="Config Update" details="Finance mandate revised" />
              <AuditItem time="1h ago" action="User Access" details="New member John invited" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function WorkflowCard({ title, dept, status, priority }: WorkflowCardProps) {
  return (
    <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-center group">
       <div>
          <h4 className="font-bold text-slate-800">{title}</h4>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{dept}</span>
       </div>
       <div className="text-right">
          <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase mb-1 ${PRIORITY_COLORS[priority]}`}>{priority}</div>
           <div className="text-[10px] text-slate-500 font-medium italic">{status}</div>
        </div>
     </div>
  );
}

function AuditItem({ time, action, details }: AuditItemProps) {
  return (
    <div className="flex gap-3">
       <span className="font-mono text-brand-gold shrink-0">{time}</span>
       <div>
          <span className="font-bold text-slate-700 block">{action}</span>
          <span className="opacity-70">{details}</span>
       </div>
    </div>
  );
}

function KpiRow({ label, value, progress }: KpiRowProps) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-bold text-brand-navy">{value}</span>
      </div>
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div className="bg-brand-gold h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
}
