"use client";

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { 
  ArrowLeft, 
  Target, 
  Users, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  Wallet,
  FileText,
  Activity,
  Clock,
  GitBranch,
  Network,
  Database,
  Briefcase,
  ChevronRight,
  PieChart,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { OperationalSpecTable } from '@/components/ui/OperationalSpecTable';
import type { OperationalSpecData } from '@/components/ui/OperationalSpecTable';
import { SOPLibrary } from '@/components/ops/SOPLibrary';
import { KPIRegistry } from '@/components/ops/KPIRegistry';
import { departmentQuickStartTemplates } from '@/lib/setup/departmentTemplates';

interface DepartmentRole {
  title: string;
  responsibilities?: string;
  reportsTo?: string;
  level?: string;
  hc?: number;
}

interface DepartmentKpi {
  name: string;
  target: string;
  unit: string;
}

interface DepartmentMandate {
  mission?: string;
  objectives?: string[];
}

interface DepartmentTemplateKpiFallback {
  name: string;
  target: string;
  unit: string;
}

interface DepartmentData {
  id: string;
  name: string;
  color?: string;
  template_key?: string;
  mandate?: DepartmentMandate;
  roles?: DepartmentRole[];
  kpis?: DepartmentKpi[];
  budget_allocation?: number;
  operational_routines?: OperationalSpecData;
  activities?: OperationalSpecData;
  communication_lines?: OperationalSpecData;
  data_pack?: OperationalSpecData;
}

type DepartmentTab = 'strategy' | 'routines' | 'activities' | 'network' | 'sops' | 'performance';

const inferRoleLevel = (title: string) => {
  if (/chief|cfo|coo|cmo|cro|cto|cio|general counsel|chro|cao|cso/i.test(title)) return 'Executive';
  if (/director|head of|head /i.test(title)) return 'Senior Management';
  if (/manager/i.test(title)) return 'Management';
  if (/senior|specialist|analyst|officer|counsel/i.test(title)) return 'Senior IC';
  return 'Individual Contributor';
};

const normalizeRoutines = (input: DepartmentData['operational_routines'], templateKey?: string): OperationalSpecData => {
  const template = templateKey ? departmentQuickStartTemplates[templateKey] : undefined;
  const source = Array.isArray(input) && input.length > 0 ? input : template?.operationalRoutines;
  if (!source) return {};

  if (!Array.isArray(source)) return input ?? {};

  return source.reduce<Record<string, string[]>>((acc, group) => {
    const cadenceKey = String((group as { cadence?: string }).cadence || '').toLowerCase();
    const items: string[] = Array.isArray((group as { items?: string[] }).items)
      ? [...((group as { items?: string[] }).items ?? [])]
      : [];
    if (cadenceKey) acc[cadenceKey] = items;
    return acc;
  }, {});
};

const normalizeActivities = (input: DepartmentData['activities'], templateKey?: string): OperationalSpecData => {
  const template = templateKey ? departmentQuickStartTemplates[templateKey] : undefined;
  const source = Array.isArray(input) && input.length > 0 ? input : template?.activities;
  if (!source || !Array.isArray(source)) return [];

  return source.map((item) => {
    if ('sections' in item && Array.isArray(item.sections) && item.sections.length > 0 && typeof item.sections[0] === 'object') {
      return item;
    }

    const activity = item as { component?: string; owner?: string; summary?: string; sections?: string[] };
    return {
      component: activity.component || 'Operational Component',
      sections: [
        ...(activity.summary ? [{ name: 'Summary', detail: activity.summary }] : []),
        ...((activity.sections || []).map((section) => ({ name: 'Section', detail: section }))),
        ...(activity.owner ? [{ name: 'Owner', detail: activity.owner }] : []),
      ],
    };
  }) as OperationalSpecData;
};

const normalizeCommunicationLines = (input: DepartmentData['communication_lines'], templateKey?: string): OperationalSpecData => {
  const template = templateKey ? departmentQuickStartTemplates[templateKey] : undefined;
  const source = Array.isArray(input) && input.length > 0 ? input : template?.communicationLines;
  if (!source || !Array.isArray(source)) return [];

  return source.map((item) => {
    if ('from' in item && 'to' in item) {
      return item;
    }

    const line = item as { channel?: string; purpose?: string };
    const [from = 'Department', to = 'Stakeholder'] = (line.channel || '').split(/\s*->\s*/);
    return {
      from,
      to,
      content: line.purpose || '',
    };
  }) as OperationalSpecData;
};

const normalizeDataPack = (input: DepartmentData['data_pack'], templateKey?: string): OperationalSpecData => {
  const template = templateKey ? departmentQuickStartTemplates[templateKey] : undefined;
  const source = Array.isArray(input) && input.length > 0 ? input : template?.dataPack;
  if (!source || !Array.isArray(source)) return [];

  return source.map((item, index) => {
    if ('asset' in item && 'id' in item) {
      return item;
    }

    const dataItem = item as { order?: number; system?: string };
    return {
      id: String(dataItem.order ?? index + 1),
      asset: dataItem.system || '',
    };
  }) as OperationalSpecData;
};

const normalizeRoles = (input: DepartmentRole[] | undefined, templateKey?: string): DepartmentRole[] => {
  const template = templateKey ? departmentQuickStartTemplates[templateKey] : undefined;
  const source = input && input.length > 0 ? input : template?.roles;
  if (!source) return [];

  return source.map((role) => ({
    ...role,
    level: role.level || inferRoleLevel(role.title),
    hc: role.hc || 1,
  }));
};

const normalizeMandate = (input: DepartmentData['mandate'], templateKey?: string): DepartmentMandate => {
  const template = templateKey ? departmentQuickStartTemplates[templateKey] : undefined;

  if (typeof input === 'string') {
    return { mission: input };
  }

  if (input?.mission || input?.objectives) {
    return input;
  }

  if (template) {
    return { mission: template.mandate };
  }

  return {};
};

const normalizeKpis = (input: DepartmentData['kpis'], templateKey?: string): DepartmentKpi[] => {
  if (input && input.length > 0) return input;
  const template = templateKey ? departmentQuickStartTemplates[templateKey] : undefined;
  if (!template) return [];

  return template.kpis.map((kpi: DepartmentTemplateKpiFallback) => ({
    name: kpi.name,
    target: kpi.target,
    unit: kpi.unit,
  }));
};

export default function DepartmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const departmentId = Array.isArray(id) ? id[0] : id;
  const [data, setData] = useState<DepartmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DepartmentTab>('strategy');

  useEffect(() => {
    const fetchDept = async () => {
      try {
        const res = await apiFetch(`/departments/${departmentId}`);
        if (res.ok) {
          const dept = await res.json();
          setData(dept);
        }
      } catch (err) {
        console.error('Failed to fetch department:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && departmentId) fetchDept();
  }, [departmentId, isAuthenticated]);

  if (loading) return (
    <div className="flex h-full items-center justify-center p-20">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Accessing Department Core...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="p-20 text-center">
      <h2 className="text-2xl font-heading mb-4">Functional Unit Not Found</h2>
      <button onClick={() => router.push('/dashboard')} className="btn-premium">Return to HQ</button>
    </div>
  );

  const tabs = [
    { id: 'strategy', label: 'Mandate & Roles', icon: <ShieldCheck size={16} /> },
    { id: 'routines', label: 'Operational Routines', icon: <Clock size={16} /> },
    { id: 'activities', label: 'Detailed Activities', icon: <GitBranch size={16} /> },
    { id: 'sops', label: 'SOP Library', icon: <BookOpen size={16} /> },
    { id: 'performance', label: 'Performance & Data', icon: <TrendingUp size={16} /> },
    { id: 'network', label: 'Network & Assets', icon: <Network size={16} /> },
  ];

  const resolvedTemplate = data.template_key ? departmentQuickStartTemplates[data.template_key] : undefined;
  const resolvedData: DepartmentData = {
    ...data,
    color: data.color || resolvedTemplate?.color,
    mandate: normalizeMandate(data.mandate, data.template_key),
    roles: normalizeRoles(data.roles, data.template_key),
    kpis: normalizeKpis(data.kpis, data.template_key),
    operational_routines: normalizeRoutines(data.operational_routines, data.template_key),
    activities: normalizeActivities(data.activities, data.template_key),
    communication_lines: normalizeCommunicationLines(data.communication_lines, data.template_key),
    data_pack: normalizeDataPack(data.data_pack, data.template_key),
  };

  return (
    <div className="p-6 md:p-10 space-y-10 pb-32 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand-navy hover:border-brand-navy transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: resolvedData.color }}></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Functional Command</span>
            </div>
            <h1 className="text-4xl font-heading text-brand-navy">{resolvedData.name}</h1>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
            <FileText size={14} className="text-slate-400" />
            Charter.pdf
          </button>
          <button 
             onClick={() => router.push(`/setup/configure/${resolvedData.template_key || resolvedData.id}`)}
             className="px-6 py-2 bg-brand-navy text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
          >
            <Zap size={14} className="text-brand-gold" />
            Reconfigure
          </button>
        </div>
      </div>

      {/* Modern Tabbed Interface */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200/60 w-fit backdrop-blur-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as DepartmentTab)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === tab.id 
                ? 'bg-brand-navy text-white shadow-lg' 
                : 'text-slate-500 hover:bg-white hover:text-brand-navy'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 min-h-[600px]">
          {activeTab === 'strategy' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Strategic Mandate */}
              <section className="glass-card p-10 rounded-3xl relative overflow-hidden bg-white border border-slate-100 shadow-sm">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <ShieldCheck className="text-brand-gold" size={24} />
                    <h2 className="text-2xl font-heading text-brand-navy">Strategic Mandate</h2>
                  </div>
                  <div 
                    className="prose prose-slate max-w-none text-slate-600 leading-relaxed italic text-lg"
                    dangerouslySetInnerHTML={{ __html: resolvedData.mandate?.mission || 'No mission defined.' }}
                  />
                  {resolvedData.mandate?.objectives && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {resolvedData.mandate.objectives.map((obj: string, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-700">{obj}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
              </section>

              {/* Functional Roles & Org Chart Summary */}
              <section className="space-y-8">
                 <div className="flex items-center justify-between px-2">
                    <h2 className="text-2xl font-heading text-brand-navy flex items-center gap-3">
                      <Users size={24} className="text-brand-gold" />
                      Command Structure
                    </h2>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{resolvedData.roles?.length || 0} Officers</span>
                 </div>

                 {/* Visual Summary */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                      { label: 'Executive', color: 'bg-brand-navy' },
                      { label: 'Management', color: 'bg-brand-accent' },
                      { label: 'Individual Contributor', color: 'bg-brand-gold' },
                      { label: 'Senior IC', color: 'bg-emerald-500' }
                    ].map((lv) => (
                      <div key={lv.label} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1 group hover:border-brand-gold/20 transition-all">
                        <div className={`w-2 h-2 rounded-full ${lv.color} mb-1`}></div>
                        <span className="text-[10px] font-black uppercase text-slate-400 text-center leading-tight">{lv.label}</span>
                        <span className="text-lg font-heading text-brand-navy">
                          {resolvedData.roles?.filter((role) => role.level?.includes(lv.label)).length || 0}
                        </span>
                      </div>
                    ))}
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(resolvedData.roles || []).map((role, idx) => (
                      <div key={idx} className="p-6 bg-white border border-slate-100 rounded-3xl hover:border-brand-gold/30 hover:shadow-xl transition-all group duration-500">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-bold text-slate-800 group-hover:text-brand-gold transition-colors">{role.title}</h4>
                          <span className="text-[10px] text-brand-navy bg-slate-50 px-2 py-1 rounded-lg font-black tracking-widest uppercase border border-slate-100">{role.level}</span>
                        </div>
                        <div className="flex flex-col gap-2 mb-4">
                          <div className="flex items-center gap-2">
                            <Briefcase size={12} className="text-slate-300" />
                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Reports to: {role.reportsTo}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users size={12} className="text-emerald-500/50" />
                            <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Headcount: {role.hc}</span>
                          </div>
                        </div>
                        {role.responsibilities && (
                          <div 
                            className="text-xs text-slate-500 leading-relaxed italic border-t border-slate-50 pt-4"
                            dangerouslySetInnerHTML={{ __html: role.responsibilities }}
                          />
                        )}
                      </div>
                    ))}
                 </div>
              </section>
            </div>
          )}

          {activeTab === 'routines' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <OperationalSpecTable 
                title="Departmental Routines" 
                data={resolvedData.operational_routines ?? {}} 
                type="routines" 
                icon={<Clock size={24} className="text-brand-gold" />}
              />
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <OperationalSpecTable 
                title="Technical Activities" 
                data={resolvedData.activities ?? []} 
                type="activities" 
                icon={<GitBranch size={24} className="text-brand-accent" />}
              />
            </div>
          )}

          {activeTab === 'sops' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SOPLibrary departmentId={departmentId as string} />
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <KPIRegistry departmentId={departmentId as string} fallbackKpis={resolvedData.kpis} />
            </div>
          )}

          {activeTab === 'network' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <OperationalSpecTable 
                title="Communication Network" 
                data={resolvedData.communication_lines ?? []} 
                type="comms" 
                icon={<Network size={24} className="text-brand-navy" />}
              />
              <OperationalSpecTable 
                title="Infrastructure Data Packs" 
                data={resolvedData.data_pack ?? []} 
                type="datapack" 
                icon={<Database size={24} className="text-emerald-500" />}
              />
            </div>
          )}
        </div>

        {/* Operational Sidebar (1/3 Column) */}
        <div className="space-y-8">
           {/* Budget Allocation */}
           <div className="bg-brand-navy p-8 rounded-[40px] text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/5">
                    <Wallet size={20} className="text-brand-gold" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-1">Treasury Allocation</span>
                    <h3 className="text-sm font-bold text-white">OpEx Budget</h3>
                  </div>
                </div>
                <div className="text-5xl font-heading mb-3 flex items-start">
                   <span className="text-xl text-brand-gold mt-1 mr-1">R</span>
                   {resolvedData.budget_allocation?.toLocaleString() || '0'}
                </div>
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Authorized Quarterly Drawdown</p>
                
                <div className="mt-10 pt-10 border-t border-white/10 space-y-4">
                  <div className="flex justify-between text-[10px] uppercase font-black tracking-widest">
                    <span className="opacity-40">Utilization Efficiency</span>
                    <span className="text-brand-gold">94.2%</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-gold to-yellow-500 w-[94.2%] transition-all duration-1000 shadow-[0_0_10px_rgba(184,134,11,0.5)]"></div>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full -mr-32 -mt-32 blur-[80px]"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-accent/10 rounded-full -ml-24 -mb-24 blur-[60px]"></div>
           </div>

           {/* Performance KPIs */}
           <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl overflow-hidden relative">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center">
                    <TrendingUp size={20} className="text-brand-accent" />
                  </div>
                  <h3 className="font-heading text-xl text-brand-navy">Performance</h3>
                </div>
                <PieChart size={20} className="text-slate-200" />
              </div>
              <div className="space-y-10 relative z-10">
                {resolvedData.kpis?.map((kpi, idx) => (
                  <div key={idx} className="space-y-4 group">
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="font-black text-slate-800 text-xs uppercase tracking-tight group-hover:text-brand-accent transition-colors">{kpi.name}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{kpi.unit}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-heading text-brand-navy">{kpi.target}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase">KPI Target</div>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 flex items-center px-0.5">
                      <div className="h-0.5 bg-brand-gold shadow-[0_0_5px_rgba(184,134,11,0.5)] w-full rounded-full opacity-30"></div>
                    </div>
                  </div>
                ))}
                {(!resolvedData.kpis || resolvedData.kpis.length === 0) && (
                  <div className="py-10 text-center space-y-3">
                    <Activity className="mx-auto text-slate-200" size={32} />
                    <p className="text-slate-400 text-xs italic">No performance benchmarks registered.</p>
                  </div>
                )}
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-[0.03]">
                 <Network size={300} strokeWidth={0.5} />
              </div>
           </div>

           {/* Quick Actions */}
           <div className="p-2 bg-slate-50 rounded-[32px] border border-slate-100 grid grid-cols-1 gap-2">
              {[
                { label: 'Incident Report', icon: <Activity size={16} />, color: 'text-rose-500' },
                { label: 'Asset Requisition', icon: <Database size={16} />, color: 'text-brand-navy' },
                { label: 'Strategic Update', icon: <Target size={16} />, color: 'text-brand-gold' }
              ].map((act) => (
                <button key={act.label} className="flex items-center justify-between p-4 bg-white rounded-2xl hover:shadow-md transition-all group">
                   <div className="flex items-center gap-3">
                      <div className={`${act.color} opacity-60 group-hover:opacity-100 transition-opacity`}>
                        {act.icon}
                      </div>
                      <span className="text-xs font-bold text-slate-600">{act.label}</span>
                   </div>
                   <ChevronRight size={14} className="text-slate-300 group-hover:text-brand-navy transition-colors transform group-hover:translate-x-1" />
                </button>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
