"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { AppPermissionGuard } from '@/components/common/AppPermissionGuard';
import { UnauthorizedEntry } from '@/components/common/AccessState';
import { CorporateVisualizer } from '@/components/viz/CorporateVisualizer';
import { OperationalGapDashboard, type Gap } from '@/components/ops/OperationalGapDashboard';
import { apiFetch } from '@/lib/api';
import {
  departmentQuickStartTemplates,
  normalizeDepartmentTemplateKey,
} from '@/lib/setup/departmentTemplates';

interface DepartmentSummary {
  id: string;
  name: string;
  color?: string;
  template_key?: string;
}

interface CompanySummary {
  tagline?: string;
  gap_statuses?: Gap[];
  setup?: {
    steps_config?: {
      quickTemplatesApplied?: string[];
    };
  };
}

interface TaskSummary {
  id: string;
  title: string;
  department_id?: string;
  status: string;
  priority: keyof typeof PRIORITY_COLORS;
  due_date?: string;
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
  source: string;
}

const PRIORITY_COLORS = {
  Critical: 'text-red-600 bg-red-50',
  High: 'text-orange-600 bg-orange-50',
  Medium: 'text-blue-600 bg-blue-50',
  Low: 'text-slate-400 bg-slate-50',
} as const;

export default function DashboardPage() {
  const router = useRouter();
  const { user, setup, logout } = useAuthStore();
  const [departments, setDepartments] = React.useState<DepartmentSummary[]>([]);
  const [company, setCompany] = React.useState<CompanySummary | null>(null);
  const [tasks, setTasks] = React.useState<TaskSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [bootError, setBootError] = React.useState<string | null>(null);
  const templateRecoveryAttempted = React.useRef(false);
  const standardTemplateIds = React.useMemo(
    () => Object.keys(departmentQuickStartTemplates).filter((id) => id !== 'cus'),
    [],
  );

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        setBootError(null);
        let currentDepartments: DepartmentSummary[] = [];
        const deptRes = await apiFetch('/departments');

        if (deptRes.status === 401) {
          logout();
          router.push('/login');
          return;
        }

        if (deptRes.ok) {
          const depts = await deptRes.json();
          currentDepartments = depts;
          setDepartments(depts);
        }

        const quickTemplatesAppliedFromCompany =
          user?.company &&
          typeof user.company === 'object' &&
          user.company.setup &&
          typeof user.company.setup === 'object' &&
          'steps_config' in user.company.setup &&
          user.company.setup.steps_config &&
          typeof user.company.setup.steps_config === 'object' &&
          'quickTemplatesApplied' in user.company.setup.steps_config &&
          Array.isArray(user.company.setup.steps_config.quickTemplatesApplied)
            ? user.company.setup.steps_config.quickTemplatesApplied.filter(
                (id): id is string => typeof id === 'string' && Boolean(departmentQuickStartTemplates[id]),
              )
            : [];

        const quickTemplatesAppliedFromSession = setup.selectedDepartments.filter(
          (id) => setup.templateSelections[id] && Boolean(departmentQuickStartTemplates[id]),
        );

        const quickTemplatesApplied = Array.from(
          new Set([...quickTemplatesAppliedFromCompany, ...quickTemplatesAppliedFromSession]),
        );

        const missingTemplateDepartments =
          !templateRecoveryAttempted.current
            ? quickTemplatesApplied.filter(
                (id) =>
                  !currentDepartments.some(
                    (department) => normalizeDepartmentTemplateKey(department.template_key) === id,
                  ),
              )
            : [];

        if (missingTemplateDepartments.length > 0) {
          templateRecoveryAttempted.current = true;

          for (const id of missingTemplateDepartments) {
            const template = departmentQuickStartTemplates[id];
            const response = await apiFetch(`/departments/${id}/config`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                template_key: id,
                name: template.name,
                description: template.description,
                color: template.color,
                mandate: template.mandate,
                core_responsibilities: template.coreResponsibilities,
                deliverables: template.deliverables,
                roles: template.roles,
                operational_routines: template.operationalRoutines,
                data_pack: template.dataPack,
                activities: template.activities,
                communication_lines: template.communicationLines,
                budget: template.budget,
              }),
            });

            if (response.status === 401) {
              logout();
              router.push('/login');
              return;
            }

            if (!response.ok) {
            console.error(`Failed to recover quick template department ${id}`);
          }
          }

          const refreshedDepartmentsResponse = await apiFetch('/departments');
          if (refreshedDepartmentsResponse.ok) {
            const refreshedDepartments = await refreshedDepartmentsResponse.json();
            currentDepartments = refreshedDepartments;
            setDepartments(refreshedDepartments);
          }
        }

        const [companyRes, tasksRes] = await Promise.allSettled([
          apiFetch('/company'),
          apiFetch('/tasks'),
        ]);

        if (
          (companyRes.status === 'fulfilled' && companyRes.value.status === 401) ||
          (tasksRes.status === 'fulfilled' && tasksRes.value.status === 401)
        ) {
          logout();
          router.push('/login');
          return;
        }

        let companyData: CompanySummary | null = null;

        if (companyRes.status === 'fulfilled' && companyRes.value.ok) {
          const comp = await companyRes.value.json();
          companyData = comp;
          setCompany(comp);
        }

        if (tasksRes.status === 'fulfilled' && tasksRes.value.ok) {
          const tsks = await tasksRes.value.json();
          setTasks(tsks);
        }

        const quickTemplatesAppliedFromApi =
          companyData?.setup?.steps_config?.quickTemplatesApplied?.filter(
            (id): id is string => typeof id === 'string' && Boolean(departmentQuickStartTemplates[id]),
          ) || [];

        const legacyStandardRecovery =
          quickTemplatesAppliedFromApi.length === 0 &&
          quickTemplatesAppliedFromSession.length === 0 &&
          currentDepartments.length === 1 &&
          normalizeDepartmentTemplateKey(currentDepartments[0]?.template_key) === 'adm'
            ? standardTemplateIds
            : [];

        const combinedRecoveryTemplates = Array.from(
          new Set([
            ...quickTemplatesAppliedFromApi,
            ...quickTemplatesAppliedFromSession,
            ...legacyStandardRecovery,
          ]),
        );

        const missingDepartmentsAfterCompanyLoad =
          !templateRecoveryAttempted.current && combinedRecoveryTemplates.length > 0
            ? combinedRecoveryTemplates.filter(
                (id) =>
                  !currentDepartments.some(
                    (department) => normalizeDepartmentTemplateKey(department.template_key) === id,
                  ),
              )
            : [];

        if (missingDepartmentsAfterCompanyLoad.length > 0) {
          templateRecoveryAttempted.current = true;

          if (legacyStandardRecovery.length > 0) {
            const bootstrapResponse = await apiFetch('/departments/bootstrap-standard', {
              method: 'POST',
            });

            if (bootstrapResponse.status === 401) {
              logout();
              router.push('/login');
              return;
            }

            if (bootstrapResponse.ok) {
              const bootstrappedDepartments = await bootstrapResponse.json();
              currentDepartments = bootstrappedDepartments;
              setDepartments(bootstrappedDepartments);
              return;
            }

            console.error('Failed to bootstrap standard departments for legacy company.');
          }

          for (const id of missingDepartmentsAfterCompanyLoad) {
            const template = departmentQuickStartTemplates[id];
            const response = await apiFetch(`/departments/${id}/config`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                template_key: id,
                name: template.name,
                description: template.description,
                color: template.color,
                mandate: template.mandate,
                core_responsibilities: template.coreResponsibilities,
                deliverables: template.deliverables,
                roles: template.roles,
                operational_routines: template.operationalRoutines,
                data_pack: template.dataPack,
                activities: template.activities,
                communication_lines: template.communicationLines,
                budget: template.budget,
              }),
            });

            if (response.status === 401) {
              logout();
              router.push('/login');
              return;
            }

            if (!response.ok) {
              console.error(`Failed to recover quick template department ${id}`);
            }
          }

          const refreshedDepartmentsResponse = await apiFetch('/departments');
          if (refreshedDepartmentsResponse.ok) {
            const refreshedDepartments = await refreshedDepartmentsResponse.json();
            setDepartments(refreshedDepartments);
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setBootError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [logout, router, setup.selectedDepartments, setup.templateSelections, standardTemplateIds, user]);

  if (!user) return null;

  const activeTasks = tasks.filter((task) => task.status !== 'done').length;
  const overdueTasks = tasks.filter(
    (task) => task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date(),
  ).length;
  const configuredDepartments = departments.filter((department) => Boolean(normalizeDepartmentTemplateKey(department.template_key))).length;
  const tasksWithoutDepartments = tasks.filter((task) => !task.department_id).length;
  const activeTasksWithDueDates = tasks.filter((task) => task.status !== 'done' && Boolean(task.due_date)).length;
  const departmentCoverage = departments.length > 0 ? Math.round((configuredDepartments / departments.length) * 100) : 0;
  const operationalSignals = [
    bootError ? `Bootstrap error: ${bootError}` : null,
    tasksWithoutDepartments > 0 ? `${tasksWithoutDepartments} active tasks have no department assigned` : null,
    activeTasksWithDueDates === 0 && activeTasks > 0 ? 'Active tasks do not yet have due dates for SLA tracking' : null,
    overdueTasks > 0 ? `${overdueTasks} tasks are overdue` : 'No overdue tasks detected',
  ].filter(Boolean) as string[];

  return (
    <AppPermissionGuard module="dashboard">
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
         <CorporateVisualizer
            departments={departments.map((department) => ({
              ...department,
              color: department.color ?? '#1e3a8a',
              template_key: normalizeDepartmentTemplateKey(department.template_key) ?? 'standard',
            }))}
            loading={loading}
         />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start pb-20">
        {/* Department Quick List */}
        <section className="lg:col-span-2 space-y-6">
           {bootError && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {bootError}
            </div>
           )}
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
              Live Operational Signals
              <span className="text-[10px] text-slate-400 font-bold uppercase">Source-backed</span>
            </h3>
            <div className="space-y-8">
              <KpiRow
                label="Configured Departments"
                value={`${configuredDepartments}/${departments.length}`}
                progress={departmentCoverage}
                source="/departments"
              />
              <KpiRow
                label="Active Tasks"
                value={`${activeTasks}`}
                progress={Math.min(100, activeTasks * 10)}
                source="/tasks"
              />
              <KpiRow
                label="Overdue Tasks"
                value={`${overdueTasks}`}
                progress={Math.max(5, 100 - Math.min(100, overdueTasks * 15))}
                source="/tasks"
              />
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl border-l-4 border-brand-gold bg-white">
            <h3 className="font-heading text-lg mb-6 text-brand-navy">Live Exception Feed</h3>
            <div className="text-[11px] text-slate-500 space-y-6">
              {operationalSignals.length > 0 ? (
                operationalSignals.map((signal) => (
                  <AuditItem key={signal} time="Now" action="Signal" details={signal} />
                ))
              ) : (
                <AuditItem time="Now" action="Signal" details="No active exceptions detected from the current dashboard sources." />
              )}
              <AuditItem time="Now" action="Access Context" details={`Signed in as ${user.roles.join(', ') || 'Standard User'}`} />
            </div>
          </div>
        </aside>
      </div>
    </div>
    </AppPermissionGuard>
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

function KpiRow({ label, value, progress, source }: KpiRowProps) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-bold text-brand-navy">{value}</span>
      </div>
      <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">{source}</div>
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div className="bg-brand-gold h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
}
