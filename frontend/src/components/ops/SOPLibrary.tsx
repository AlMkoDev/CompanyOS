"use client";

import React from 'react';
import { apiFetch } from '@/lib/api';
import { 
  FileText, 
  Users, 
  Zap, 
  Activity, 
  AlertTriangle,
  ExternalLink,
  BookOpen
} from 'lucide-react';

interface SopRaci {
  responsible?: string[];
  accountable?: string[];
}

interface SopProcedureStep {
  step: number | string;
  action: string;
  system?: string;
  role?: string;
}

interface SopException {
  condition: string;
  response: string;
}

interface SopLink {
  name: string;
  url: string;
}

interface SopRelatedDocuments {
  links?: SopLink[];
}

interface SOP {
  id: string;
  title: string;
  purpose: string;
  scope: string;
  trigger: string;
  raci?: SopRaci;
  procedure: SopProcedureStep[];
  approval_matrix?: Record<string, unknown>;
  output_standard: string;
  systems_used: string[];
  exceptions: SopException[];
  related_documents?: SopRelatedDocuments;
  status: string;
  version: number;
}

interface SOPLibraryProps {
  departmentId: string;
}

export function SOPLibrary({ departmentId }: SOPLibraryProps) {
  const [sops, setSops] = React.useState<SOP[]>([]);
  const [selectedSop, setSelectedSop] = React.useState<SOP | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchSops = async () => {
      try {
        const res = await apiFetch(`/sops?departmentId=${departmentId}`);
        if (res.ok) {
          const data = await res.json();
          setSops(data);
          if (data.length > 0) setSelectedSop(data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch SOPs:', err);
      } finally {
        setLoading(false);
      }
    };

    if (departmentId) fetchSops();
  }, [departmentId]);

  if (loading) return <div className="p-8 text-center text-slate-400">Loading SOP Library...</div>;

  if (sops.length === 0) {
    return (
      <div className="p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
        <BookOpen className="mx-auto mb-4 text-slate-300" size={48} />
        <h3 className="text-xl font-heading text-slate-600 mb-2">No SOPs Found</h3>
        <p className="text-slate-500 max-w-md mx-auto">This department hasn&apos;t adopted any Standard Operating Procedures yet. Gaps are currently being remediated.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar List */}
      <div className="lg:col-span-1 space-y-3">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 mb-4">SOP Registry</h3>
        {sops.map((sop) => (
          <button
            key={sop.id}
            onClick={() => setSelectedSop(sop)}
            className={`w-full text-left p-4 rounded-2xl transition-all border ${
              selectedSop?.id === sop.id 
              ? 'bg-brand-navy text-white border-brand-navy shadow-lg shadow-brand-navy/20' 
              : 'bg-white text-slate-600 border-slate-100 hover:border-brand-gold hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText size={18} className={selectedSop?.id === sop.id ? 'text-brand-gold' : 'text-slate-400'} />
              <div>
                <div className="text-sm font-bold leading-tight">{sop.title}</div>
                <div className="text-[10px] opacity-60 uppercase font-bold tracking-tighter mt-1">v{sop.version}.0 · {sop.status}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-3">
        {selectedSop ? (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 glass-card rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm">
            {/* Header */}
            <header className="bg-slate-50/50 p-8 border-b border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-3xl font-heading text-brand-navy">{selectedSop.title}</h2>
                <div className="flex gap-2">
                   <span className="px-3 py-1 bg-brand-gold/10 text-brand-gold rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-gold/20">Approved</span>
                </div>
              </div>
              <p className="text-slate-500 leading-relaxed italic border-l-4 border-brand-gold pl-4">
                &ldquo;{selectedSop.purpose}&rdquo;
              </p>
            </header>

            {/* Matrix Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-white border-b border-slate-50">
               <div>
                  <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                    <Zap size={14} className="text-brand-gold" /> Trigger & Scope
                  </h4>
                  <div className="space-y-4">
                     <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Trigger Event</div>
                        <div className="text-sm text-slate-700">{selectedSop.trigger}</div>
                     </div>
                     <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Process Scope</div>
                        <div className="text-sm text-slate-700">{selectedSop.scope}</div>
                     </div>
                  </div>
               </div>
               <div>
                  <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                    <Users size={14} className="text-brand-gold" /> RACI Assignment
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                     <RaciItem label="Responsible" values={selectedSop.raci?.responsible} color="brand-navy" />
                     <RaciItem label="Accountable" values={selectedSop.raci?.accountable} color="brand-gold" />
                  </div>
               </div>
            </div>

            {/* Procedure Steps */}
            <div className="p-8">
               <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
                 <Activity size={14} className="text-brand-gold" /> Step-by-Step Procedure
               </h4>
               <div className="space-y-6">
                  {selectedSop.procedure?.map((step, idx) => (
                    <div key={idx} className="flex gap-6 group hover:translate-x-1 transition-transform">
                       <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-brand-gold group-hover:text-white transition-colors">
                          <span className="font-heading font-bold">{step.step}</span>
                       </div>
                       <div className="flex-1 pb-6 border-b border-slate-50 group-last:border-0">
                          <div className="flex justify-between items-start mb-1">
                             <div className="font-bold text-brand-navy leading-tight">{step.action}</div>
                             <div className="text-[10px] font-mono text-slate-400 uppercase">{step.system}</div>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2">
                             <Users size={12} className="opacity-50" />
                             Action by: <span className="font-semibold text-slate-600">{step.role}</span>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Footer sections (Exceptions & Related) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-slate-100">
               <div className="p-8 bg-slate-50/30 border-r border-slate-100">
                  <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                    <AlertTriangle size={14} className="text-orange-500" /> Exceptions & Safety
                  </h4>
                  <div className="space-y-3">
                     {selectedSop.exceptions?.map((ex, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-orange-50 border border-orange-100/50">
                           <div className="text-[10px] font-bold text-orange-600 uppercase mb-1">If: {ex.condition}</div>
                           <div className="text-xs text-slate-600 font-medium">Then: {ex.response}</div>
                        </div>
                     ))}
                  </div>
               </div>
               <div className="p-8 bg-white">
                  <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                    <ExternalLink size={14} className="text-blue-500" /> Related Governance
                  </h4>
                  <div className="space-y-2">
                     {selectedSop.related_documents?.links?.map((link, idx) => (
                        <a 
                          key={idx} 
                          href={link.url} 
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:border-blue-100 hover:bg-blue-50 transition-all group"
                        >
                           <span className="text-xs font-medium text-slate-600 group-hover:text-blue-700">{link.name}</span>
                           <ExternalLink size={12} className="text-slate-300 group-hover:text-blue-400" />
                        </a>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface RaciItemProps {
  label: string;
  values?: string[];
  color: 'brand-navy' | 'brand-gold';
}

function RaciItem({ label, values, color }: RaciItemProps) {
  return (
    <div>
      <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">{label}</div>
      <div className="flex flex-wrap gap-1">
        {values?.map((v: string, i: number) => (
          <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-${color}/10 text-${color} border border-${color}/20`}>
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}
