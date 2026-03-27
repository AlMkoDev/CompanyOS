"use client";

import React, { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Plus, Trash2, Wallet, Users, Target, Activity, Settings, Zap } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import {
  DepartmentActivityComponent,
  DepartmentCommunicationLine,
  DepartmentDataPackItem,
  DepartmentRoutineGroup,
  departmentQuickStartTemplates,
} from '@/lib/setup/departmentTemplates';

const WORKFLOW_ACTIVITY_COMPONENT = 'Core Workflow Definitions';

const subSteps = [
  { id: 1, name: 'Identity', icon: Settings },
  { id: 2, name: 'Mandate', icon: Target },
  { id: 3, name: 'Core Responsibilities', icon: Activity },
  { id: 4, name: 'Deliverables', icon: Activity },
  { id: 5, name: 'KPIs', icon: Activity },
  { id: 6, name: 'Roles', icon: Users },
  { id: 7, name: 'Budget', icon: Wallet },
  { id: 8, name: 'Workflows', icon: Zap },
  { id: 9, name: 'Finish', icon: Settings },
];

const PALETTE = [
  '#B8860B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', 
  '#F59E0B', '#EC4899', '#6366F1', '#14B8A6', '#0F172A'
];

interface KPI {
  name: string;
  target: string;
  unit: string;
}

interface Role {
  title: string;
  responsibilities: string;
  reportsTo: string;
  level?: string;
  hc?: number;
}

interface DepartmentTemplateResponse {
  id?: string;
  name?: string;
  color?: string;
  mandate?: string;
  core_responsibilities?: string;
  deliverables?: string;
  kpis?: KPI[];
  roles?: Role[];
  operational_routines?: DepartmentRoutineGroup[];
  data_pack?: DepartmentDataPackItem[];
  activities?: DepartmentActivityComponent[];
  communication_lines?: DepartmentCommunicationLine[];
  budget_allocation?: number | string;
  workflows?: string[];
}

interface DepartmentConfigPayload {
  template_key: string;
  name: string;
  color: string;
  mandate: string;
  core_responsibilities: string;
  deliverables: string;
  kpis: KPI[];
  roles: Role[];
  operational_routines: DepartmentRoutineGroup[];
  data_pack: DepartmentDataPackItem[];
  activities: DepartmentActivityComponent[];
  communication_lines: DepartmentCommunicationLine[];
  budget: string;
  workflows: string[];
}

const extractWorkflowDefinitions = (
  activities?: DepartmentActivityComponent[] | null,
  workflows?: string[],
) => {
  if (Array.isArray(workflows) && workflows.length > 0) {
    return workflows;
  }

  if (!Array.isArray(activities)) {
    return [];
  }

  const workflowActivity = activities.find(
    (activity) => activity?.component === WORKFLOW_ACTIVITY_COMPONENT,
  );

  return Array.isArray(workflowActivity?.sections)
    ? workflowActivity.sections.filter((section): section is string => typeof section === 'string')
    : [];
};

export default function DepartmentWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ 
    id: '', // Database UUID if exists
    name: 'Department', 
    color: '#0F172A',
    mandate: '', 
    core_responsibilities: '',
    deliverables: '',
    kpis: [] as KPI[], 
    roles: [] as Role[], 
    operational_routines: [] as DepartmentRoutineGroup[],
    data_pack: [] as DepartmentDataPackItem[],
    activities: [] as DepartmentActivityComponent[],
    communication_lines: [] as DepartmentCommunicationLine[],
    budget: '',
    workflows: [] as string[]
  });
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const params = useParams();
  const templateKey = params?.id as string;
  const { isAuthenticated, logout, setup, hydrateSetup } = useAuthStore();
  const templateEnabled = Boolean(templateKey && setup.templateSelections[templateKey]);

  React.useEffect(() => {
    if (!isAuthenticated || !templateKey || setup.selectedDepartments.length > 0) {
      return;
    }

    const controller = new AbortController();

    const loadSetup = async () => {
      try {
        const response = await apiFetch('/company', {
          signal: controller.signal,
        });

        if (response.status === 401) {
          logout();
          router.push('/login');
          return;
        }

        if (!response.ok) {
          return;
        }

        const company = await response.json();
        const config =
          company?.setup?.steps_config && typeof company.setup.steps_config === 'object'
            ? company.setup.steps_config
            : {};
        const selectedDepartments = Array.isArray(config.selectedDepartments)
          ? config.selectedDepartments.filter((value: unknown): value is string => typeof value === 'string')
          : [];
        const templateSelections =
          config.templateSelections && typeof config.templateSelections === 'object'
            ? Object.fromEntries(
                Object.entries(config.templateSelections).map(([key, value]) => [key, Boolean(value)]),
              )
            : {};

        hydrateSetup({
          selectedDepartments,
          templateSelections,
        });
      } catch (error) {
        if (!(error instanceof Error && error.name === 'AbortError')) {
          console.error('Failed to hydrate wizard setup state:', error);
        }
      }
    };

    void loadSetup();

    return () => controller.abort();
  }, [hydrateSetup, isAuthenticated, logout, router, setup.selectedDepartments.length, templateKey]);

  const applyQuickTemplate = React.useCallback(() => {
    const quickTemplate = templateKey ? departmentQuickStartTemplates[templateKey] : undefined;

    if (!quickTemplate || !templateEnabled) {
      return false;
    }

    setData((prev) => ({
      ...prev,
      name: quickTemplate.name,
      color: quickTemplate.color,
      mandate: quickTemplate.mandate,
      core_responsibilities: quickTemplate.coreResponsibilities,
      deliverables: quickTemplate.deliverables,
      kpis: quickTemplate.kpis,
      roles: quickTemplate.roles,
      operational_routines: quickTemplate.operationalRoutines,
      data_pack: quickTemplate.dataPack,
      activities: quickTemplate.activities,
      communication_lines: quickTemplate.communicationLines,
      budget: quickTemplate.budget,
      workflows: quickTemplate.workflows,
    }));

    return true;
  }, [templateEnabled, templateKey]);

  // Fetch existing data
  React.useEffect(() => {
    if (!templateKey) {
      setLoading(false);
      return;
    }

    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const fetchData = async () => {
      const hasQuickTemplate = applyQuickTemplate();
      try {
        const res = await apiFetch(`/departments/template/${templateKey}`, { signal: controller.signal });
        if (res.status === 401) {
          logout();
          return;
        }
        if (res.ok) {
          const text = await res.text();
          if (text && text.trim() && text !== 'null') {
            try {
              const existing = JSON.parse(text) as DepartmentTemplateResponse;
              if (existing && typeof existing === 'object') {
                setData(prev => ({
                  ...prev,
                  id: existing.id || prev.id,
                  name: existing.name || prev.name,
                  color: existing.color || prev.color,
                  mandate: existing.mandate || '',
                  core_responsibilities: existing.core_responsibilities || '',
                  deliverables: existing.deliverables || '',
                  kpis: Array.isArray(existing.kpis) ? existing.kpis : [],
                  roles: Array.isArray(existing.roles) && existing.roles.length > 0 ? existing.roles : prev.roles,
                  operational_routines: Array.isArray(existing.operational_routines) ? existing.operational_routines : prev.operational_routines,
                  data_pack: Array.isArray(existing.data_pack) ? existing.data_pack : prev.data_pack,
                  activities: Array.isArray(existing.activities) ? existing.activities : prev.activities,
                  communication_lines: Array.isArray(existing.communication_lines) ? existing.communication_lines : prev.communication_lines,
                  budget: existing.budget_allocation ? String(existing.budget_allocation) : '',
                  workflows: extractWorkflowDefinitions(existing.activities, existing.workflows)
                }));
              }
            } catch (je) {
              console.error('JSON Parse error:', je);
            }
          } else if (!hasQuickTemplate) {
            const quickTemplate = departmentQuickStartTemplates[templateKey];
            if (quickTemplate) {
              setData(prev => ({
                ...prev,
                name: quickTemplate.name,
                color: quickTemplate.color,
                roles: quickTemplate.roles,
              }));
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Failed to fetch department:', err);
        }
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };
    fetchData();

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [applyQuickTemplate, isAuthenticated, logout, templateKey]);

  const saveData = async () => {
    if (!isAuthenticated) return;
    const payload: DepartmentConfigPayload = {
      template_key: templateKey,
      name: data.name,
      color: data.color,
      mandate: data.mandate,
      core_responsibilities: data.core_responsibilities,
      deliverables: data.deliverables,
      kpis: data.kpis,
      roles: data.roles,
      operational_routines: data.operational_routines,
      data_pack: data.data_pack,
      activities: data.activities,
      communication_lines: data.communication_lines,
      budget: data.budget || '0',
      workflows: data.workflows,
    };

    try {
      const res = await apiFetch(`/departments/${data.id || templateKey}/config`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const saved = await res.json();
        if (!data.id) setData(prev => ({ ...prev, id: saved.id }));
      } else {
        const message = await res.text();
        throw new Error(message || 'Failed to save department configuration.');
      }
    } catch (err) {
      console.error('Failed to save data:', err);
      throw err;
    }
  };

  const { markDeptComplete } = useAuthStore();
  const handleFinish = async () => {
    try {
      await saveData();
      if (templateKey) markDeptComplete(templateKey);
      router.push('/setup/configure');
    } catch (error) {
      alert(
        error instanceof Error && error.message
          ? error.message
          : 'Department configuration could not be saved.',
      );
    }
  };

  const addKPI = () => setData(prev => ({ ...prev, kpis: [...prev.kpis, { name: '', target: '', unit: '' }] }));
  const addRole = () => setData(prev => ({ ...prev, roles: [...prev.roles, { title: '', responsibilities: '', reportsTo: '' }] }));
  const addWorkflow = () => setData(prev => ({ ...prev, workflows: [...prev.workflows, ''] }));

  const updateKPI = (idx: number, field: keyof KPI, val: string) => {
    setData(prev => {
      const next = [...prev.kpis];
      next[idx] = { ...next[idx], [field]: val } as KPI;
      return { ...prev, kpis: next };
    });
  };

  const updateRole = (idx: number, field: keyof Role, val: string) => {
    setData(prev => {
      const next = [...prev.roles];
      next[idx] = { ...next[idx], [field]: val } as Role;
      return { ...prev, roles: next };
    });
  };

  const nextStep = async () => {
    try {
      await saveData();
      setStep(s => s + 1);
    } catch (error) {
      alert(
        error instanceof Error && error.message
          ? error.message
          : 'Department configuration could not be saved.',
      );
    }
  };

  const workflowPreview = data.workflows
    .map((workflow) => workflow.trim())
    .filter(Boolean);

  const coreResponsibilitiesPreview = data.core_responsibilities.trim() || 'No core responsibilities defined yet.';
  const deliverablesPreview = data.deliverables.trim() || 'No deliverables defined yet.';

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-heading text-2xl">Initializing Wizard...</div>;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-3xl font-heading text-brand-navy mb-4">Unauthorized Session</h2>
        <p className="text-slate-500 mb-8 max-w-md">Your session has expired or you are not authorized to access this wizard. Please log in again.</p>
        <button onClick={() => router.push('/login')} className="btn-premium px-8 py-3">Return to Login</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar: Step Progress & Live Constitution */}
      <aside className="w-80 bg-brand-navy text-white p-8 flex flex-col shrink-0">
        <div className="mb-10">
          <h1 className="text-xl font-heading text-brand-gold mb-1">Dept Wizard</h1>
          <p className="text-xs opacity-50 uppercase tracking-widest">{templateKey} Configuration</p>
          {templateEnabled && (
            <p className="mt-3 text-[11px] uppercase tracking-widest text-brand-gold/80">
              Quick template loaded
            </p>
          )}
        </div>

        <nav className="flex-1 space-y-4">
          {subSteps.map((s) => (
            <div key={s.id} className={`flex items-center gap-3 transition-all ${step === s.id ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs ${step === s.id ? 'bg-brand-gold border-brand-gold text-brand-navy shadow-[0_0_15px_rgba(184,134,11,0.4)]' : 'border-white/20'}`}>
                {step > s.id ? '✓' : s.id}
              </div>
              <span className="text-sm font-medium">{s.name}</span>
            </div>
          ))}
        </nav>

        <div className="mt-10 pt-6 border-t border-white/10">
          <h3 className="text-[10px] font-bold text-brand-gold/50 mb-4 tracking-widest uppercase">Live Constitution</h3>
          <div className="bg-white/5 rounded-2xl p-5 text-[11px] space-y-4 opacity-90 border border-white/5 backdrop-blur-sm">
            <div>
              <span className="block text-white/40 mb-1 font-bold">UNIT IDENTITY</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }}></div>
                <span className="font-bold">{data.name}</span>
              </div>
            </div>
            {data.mandate && (
              <div>
                <span className="block text-white/40 mb-1 font-bold italic uppercase tracking-tighter">MANDATE</span>
                <p className="text-white/60 line-clamp-2 text-[10px] leading-tight">
                  {data.mandate.replace(/<[^>]*>/g, '')}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-white/40 mb-1 uppercase font-bold tracking-tighter">KPIs</span>
                <span className="text-xl font-heading">{data.kpis.length}</span>
              </div>
              <div>
                <span className="block text-white/40 mb-1 uppercase font-bold tracking-tighter">BUDGET</span>
                <span className="text-lg font-heading text-brand-gold">R{data.budget || '0'}</span>
              </div>
            </div>
            <div>
              <span className="block text-white/40 mb-1 uppercase font-bold tracking-tighter">OPERATING MODEL</span>
              <p className="text-white/70 text-[10px] leading-tight">
                {coreResponsibilitiesPreview.replace(/<[^>]*>/g, '').slice(0, 120)}
                {coreResponsibilitiesPreview.length > 120 ? '…' : ''}
              </p>
              <p className="mt-2 text-white/50 text-[10px] leading-tight">
                {workflowPreview.length} workflows and {data.roles.length} positions defined.
              </p>
            </div>
          </div>
        </div>
      </aside>


      {/* Main Content Area */}
      <main className="flex-1 p-12 overflow-y-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="max-w-3xl mx-auto">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right duration-500">
              <h2 className="text-4xl font-heading mb-2">Department Identity</h2>
              <p className="text-slate-500 mb-8">Define how this unit presents itself within the ecosystem.</p>
              
              <div className="space-y-8 glass-card p-10 rounded-3xl">
                 <div className="space-y-2">
                   <label htmlFor="dept-name" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Internal Department Name</label>
                   <input 
                     id="dept-name"
                     name="dept-name"
                     type="text" 
                     className="input-premium bg-white text-lg" 
                     value={data.name} 
                     onChange={(e) => setData(prev => ({...prev, name: e.target.value}))} 
                     suppressHydrationWarning 
                   />
                 </div>
                 
                 <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center block">Signature Color Palette</label>
                    <div className="flex flex-wrap gap-4 justify-center">
                       {PALETTE.map(c => (
                         <div 
                           key={c}
                           onClick={() => setData(prev => ({...prev, color: c}))}
                           className={`w-12 h-12 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-110 active:scale-90 ${data.color === c ? 'ring-4 ring-slate-900 ring-offset-4 scale-110' : 'opacity-60'}`}
                           style={{ backgroundColor: c }}
                         ></div>
                       ))}
                    </div>
                 </div>
              </div>
            </div>
          )}

           {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right duration-500">
              <h2 className="text-4xl font-heading mb-2">Strategic Mandate</h2>
              <p className="text-slate-500 mb-8">Establish the mission-critical intent of this functional unit.</p>
              
              <div className="glass-card p-10 rounded-3xl">
                <label htmlFor="dept-mandate" className="text-slate-400 mb-6 font-heading italic text-lg leading-relaxed text-center block px-4 opacity-80">
                  &quot;What is the single, absolute reason this department exists in your company?&quot;
                </label>
                <div className="mt-4">
                  <RichTextEditor 
                    id="dept-mandate"
                    value={data.mandate}
                    onChange={(val) => setData(prev => ({...prev, mandate: val}))}
                    placeholder="The mandate of the Finance department is to ensure long-term solvency..."
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right duration-500">
              <h2 className="text-4xl font-heading mb-2">Core Responsibilities</h2>
              <p className="text-slate-500 mb-8">Define the primary areas of accountability for this department.</p>
              
              <div className="glass-card p-10 rounded-3xl">
                <label htmlFor="dept-responsibilities" className="text-slate-400 mb-6 font-heading italic text-lg leading-relaxed text-center block px-4 opacity-80">
                  &quot;What are the non-negotiable pillars of accountability for this functional unit?&quot;
                </label>
                <div className="mt-4">
                  <RichTextEditor 
                    id="dept-responsibilities"
                    value={data.core_responsibilities}
                    onChange={(val) => setData(prev => ({...prev, core_responsibilities: val}))}
                    placeholder="List the core accountabilities (e.g., Financial Reporting, Audit Compliance)..."
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right duration-500">
              <h2 className="text-4xl font-heading mb-2">Key Deliverables</h2>
              <p className="text-slate-500 mb-8">What tangible outputs does this department produce?</p>
              
              <div className="glass-card p-10 rounded-3xl">
                <label htmlFor="dept-deliverables" className="text-slate-400 mb-6 font-heading italic text-lg leading-relaxed text-center block px-4 opacity-80">
                  &quot;What specific, measurable artifacts or results does this department deliver?&quot;
                </label>
                <div className="mt-4">
                  <RichTextEditor 
                    id="dept-deliverables"
                    value={data.deliverables}
                    onChange={(val) => setData(prev => ({...prev, deliverables: val}))}
                    placeholder="Describe the department's outputs (e.g., Monthly P&L Statements, Annual Budgets)..."
                  />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-right duration-500">
              <h2 className="text-4xl font-heading mb-2">Success Indicators</h2>
              <p className="text-slate-500 mb-8">Quantify the performance targets for this department.</p>
              
              <div className="space-y-4">
                {data.kpis.map((kpi, idx) => (
                  <div key={idx} className="glass-card p-6 rounded-2xl flex gap-4 items-end animate-in slide-in-from-bottom-4">
                    <div className="flex-1 space-y-2">
                       <label htmlFor={`kpi-name-${idx}`} className="sr-only">KPI Name</label>
                       <input 
                         id={`kpi-name-${idx}`}
                         name={`kpi-name-${idx}`}
                         placeholder="KPI Name (e.g. Operating Margin)" 
                         className="input-premium bg-white"
                         value={kpi.name}
                         onChange={(e) => updateKPI(idx, 'name', e.target.value)}
                       />
                    </div>
                    <div className="w-32 space-y-2">
                       <label htmlFor={`kpi-target-${idx}`} className="sr-only">Target</label>
                       <input 
                         id={`kpi-target-${idx}`}
                         name={`kpi-target-${idx}`}
                         placeholder="Target" 
                         className="input-premium bg-white"
                         value={kpi.target}
                         onChange={(e) => updateKPI(idx, 'target', e.target.value)}
                       />
                    </div>
                    <div className="w-24 space-y-2">
                       <label htmlFor={`kpi-unit-${idx}`} className="sr-only">Unit</label>
                       <input 
                         id={`kpi-unit-${idx}`}
                         name={`kpi-unit-${idx}`}
                         placeholder="Unit (%)" 
                         className="input-premium bg-white"
                         value={kpi.unit}
                         onChange={(e) => updateKPI(idx, 'unit', e.target.value)}
                       />
                    </div>
                    <button 
                      onClick={() => setData(prev => ({...prev, kpis: prev.kpis.filter((_, i) => i !== idx)}))}
                      className="p-3 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
                
                <button 
                  onClick={addKPI}
                  className="w-full p-6 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold hover:border-brand-gold hover:text-brand-gold transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={24} /> Add Success Indicator
                </button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="animate-in fade-in slide-in-from-right duration-500">
              <h2 className="text-4xl font-heading mb-2">Core Positions</h2>
              <p className="text-slate-500 mb-8">Define the roles required to execute the department&apos;s mandate.</p>
              
              <div className="space-y-6">
                {data.roles.map((role, idx) => (
                  <div key={idx} className="glass-card p-8 rounded-3xl bg-white space-y-6 border border-slate-100 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label 
                          htmlFor={`role-title-${idx}`}
                          className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                        >
                          Role Title
                        </label>
                        <input 
                          id={`role-title-${idx}`}
                          name={`role-title-${idx}`}
                          placeholder="e.g. Treasury Manager" 
                          className="input-premium border-none shadow-none text-2xl font-heading p-0 focus:ring-0"
                          value={role.title}
                          onChange={(e) => updateRole(idx, 'title', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label 
                          htmlFor={`role-reports-${idx}`}
                          className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                        >
                          Reports To
                        </label>
                        <input 
                          id={`role-reports-${idx}`}
                          name={`role-reports-${idx}`}
                          placeholder="e.g. Finance Director" 
                          className="input-premium bg-slate-50"
                          value={role.reportsTo}
                          onChange={(e) => updateRole(idx, 'reportsTo', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor={`role-responsibilities-${idx}`} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Key Responsibilities</label>
                      <div className="mt-2">
                        <RichTextEditor 
                          id={`role-responsibilities-${idx}`}
                          value={role.responsibilities}
                          onChange={(val) => updateRole(idx, 'responsibilities', val)}
                          placeholder="Key responsibilities and authority..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-50">
                      <button 
                        onClick={() => setData(prev => ({...prev, roles: prev.roles.filter((_, i) => i !== idx)}))}
                        className="text-xs text-red-500 font-bold flex items-center gap-1 hover:underline"
                      >
                        <Trash2 size={12} /> REMOVE POSITION
                      </button>
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={addRole}
                  className="w-full p-8 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold hover:border-brand-gold hover:text-brand-gold transition-all"
                >
                  + Add Key Position
                </button>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="animate-in fade-in slide-in-from-right duration-500">
              <h2 className="text-4xl font-heading mb-2">Financial Allocation</h2>
              <p className="text-slate-500 mb-8">Assign the budget required for full operation.</p>
              
              <div className="glass-card p-12 rounded-3xl bg-white flex flex-col items-center">
                 <label htmlFor="budget-input" className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                    Annualized Operational Budget
                 </label>
                 <div className="flex items-center gap-4">
                    <span className="text-5xl font-heading text-slate-300">R</span>
                    <input 
                      id="budget-input"
                      name="budget-input"
                      type="number" 
                      className="text-7xl font-heading border-none focus:ring-0 w-80 text-brand-navy placeholder:text-slate-100 text-center" 
                      placeholder="0.00"
                      value={data.budget}
                      onChange={(e) => setData(prev => ({...prev, budget: e.target.value}))}
                    />
                 </div>
                 <div className="mt-10 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-gold" style={{ width: '40%' }}></div>
                 </div>
                 <p className="mt-4 text-xs text-slate-400 italic">This budget will be tracked against actual expenses in the dashboard.</p>
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="animate-in fade-in slide-in-from-right duration-500">
              <h2 className="text-4xl font-heading mb-2">Operational Workflows</h2>
              <p className="text-slate-500 mb-8">Define the sequence of actions that turn inputs into value.</p>
              
              <div className="space-y-4">
                {data.workflows.map((wf, idx) => (
                  <div key={idx} className="glass-card p-4 rounded-2xl flex gap-3 items-center group bg-white">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                       {idx + 1}
                    </div>
                    <label htmlFor={`workflow-step-${idx}`} className="sr-only">Workflow Step</label>
                    <input 
                      id={`workflow-step-${idx}`}
                      name={`workflow-step-${idx}`}
                      className="flex-1 bg-transparent border-none focus:ring-0 font-medium" 
                      placeholder="Execution Step (e.g. Monthly Reconciliation)" 
                      value={wf}
                     onChange={(e) => {
                        const val = e.target.value;
                        setData(prev => {
                          const next = [...prev.workflows];
                          next[idx] = val;
                          return { ...prev, workflows: next };
                        });
                      }}
                    />
                    <button 
                      onClick={() => setData(prev => ({
                        ...prev, 
                        workflows: prev.workflows.filter((_, i) => i !== idx)
                      }))}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                
                <button 
                  onClick={addWorkflow}
                  className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-brand-gold hover:text-brand-gold transition-all"
                >
                  + Add Functional Step
                </button>
              </div>
            </div>
          )}

          {step === 9 && (
            <div className="animate-in fade-in zoom-in duration-700 h-[60vh] flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-full bg-brand-gold flex items-center justify-center text-white mb-8 shadow-2xl animate-bounce">
                <Zap size={48} />
              </div>
              <h2 className="text-5xl font-heading mb-4 text-brand-navy">Constitution Ready</h2>
              <p className="text-slate-500 max-w-md mx-auto mb-12 text-lg">
                The {data.name} department is now structurally and strategically codified.
              </p>
              <div className="w-full max-w-4xl mb-12 text-left">
                <div className="bg-white border border-slate-100 rounded-[2rem] shadow-xl p-8 md:p-10">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Operating Model Snapshot</div>
                      <h3 className="text-2xl font-heading text-brand-navy">Review the configured department before finishing</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="text-xs font-bold uppercase tracking-widest text-brand-gold hover:underline"
                    >
                      Review Sections
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/70">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Core Responsibilities</div>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {coreResponsibilitiesPreview.replace(/<[^>]*>/g, '')}
                      </p>
                    </div>
                    <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/70">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Deliverables</div>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {deliverablesPreview.replace(/<[^>]*>/g, '')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 p-5 rounded-2xl border border-slate-100 bg-white">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Workflows</div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{workflowPreview.length} defined steps</span>
                    </div>
                    {workflowPreview.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {workflowPreview.map((workflow, index) => (
                          <div key={`${workflow}-${index}`} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="w-7 h-7 rounded-lg bg-brand-navy text-white flex items-center justify-center text-[10px] font-black shrink-0">
                              {index + 1}
                            </div>
                            <div className="text-sm text-slate-600 leading-relaxed">{workflow}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No workflow definitions captured yet.</p>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={handleFinish} 
                className="btn-premium px-12 py-5 text-xl scale-110 shadow-2xl hover:scale-125 transition-all"
              >
                Finalize {data.name} Configuration →
              </button>
            </div>
          )}

          {/* Pagination */}
          {step < 9 && (
            <div className="mt-12 flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
              <button 
                onClick={() => setStep(s => Math.max(1, s-1))}
                className="text-slate-400 font-bold hover:text-brand-navy transition-colors flex items-center gap-2"
                disabled={step === 1}
              >
                {step > 1 && '← Previous Step'}
              </button>
              <div className="flex gap-3">
                 {subSteps.map(s => (
                   <div 
                    key={s.id} 
                    className={`h-2 rounded-full transition-all duration-500 ${step === s.id ? 'bg-brand-gold w-10 shadow-[0_0_10px_rgba(184,134,11,0.5)]' : 'bg-slate-100 w-2'}`}
                   ></div>
                 ))}
              </div>
              <button 
                onClick={nextStep} 
                className="btn-premium px-8 py-3 rounded-2xl shadow-lg hover:shadow-brand-gold/20"
              >
                Next Sub-step →
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
