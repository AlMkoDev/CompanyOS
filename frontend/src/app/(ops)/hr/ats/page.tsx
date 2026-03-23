"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  Briefcase, 
  Calendar, 
  ChevronRight, 
  Plus, 
  MoreVertical,
  Star
} from 'lucide-react';

interface CandidateSummary {
  id: string;
  name?: string;
  source?: string;
}

interface RequisitionSummary {
  id: string;
  title?: string;
}

interface PipelineApplication {
  id: string;
  candidate_id: string;
  rating?: number;
  applied_at: string;
  candidate?: CandidateSummary;
  requisition?: RequisitionSummary;
}

type PipelineStageId = 'applied' | 'screened' | 'interview1' | 'interview2' | 'offer' | 'hired';

type PipelineData = Partial<Record<PipelineStageId, PipelineApplication[]>>;

interface AtsRequisition {
  id: string;
}

const stages = [
  { id: 'applied', name: 'Applied', color: 'bg-slate-100 text-slate-600' },
  { id: 'screened', name: 'Screened', color: 'bg-blue-50 text-blue-600' },
  { id: 'interview1', name: 'Interview 1', color: 'bg-indigo-50 text-indigo-600' },
  { id: 'interview2', name: 'Interview 2', color: 'bg-violet-50 text-violet-600' },
  { id: 'offer', name: 'Offer', color: 'bg-emerald-50 text-emerald-600' },
  { id: 'hired', name: 'Hired', color: 'bg-brand-gold/10 text-brand-gold' },
];

export default function AtsDashboard() {
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [requisitions, setRequisitions] = useState<AtsRequisition[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pipelineRes, reqsRes] = await Promise.all([
        fetch('/api/ats/pipeline'),
        fetch('/api/ats/requisitions')
      ]);
      
      if (pipelineRes.ok) setPipeline(await pipelineRes.json());
      if (reqsRes.ok) setRequisitions(await reqsRes.json());
    } catch (error) {
      console.error('Error fetching ATS data:', error);
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
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 bg-brand-gold/10 text-brand-gold text-[10px] font-bold uppercase tracking-wider rounded">HRIS Elite</div>
            <span className="text-slate-400 text-xs font-medium">VF-HR-002</span>
          </div>
          <h1 className="text-4xl font-heading font-bold text-slate-900 tracking-tight">Recruitment <span className="text-brand-gold">Pipeline</span></h1>
          <p className="text-slate-500 mt-1 font-medium">Manage top talent and orchestrate the hiring journey.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/hr/ats/requisitions" className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:border-brand-gold hover:text-brand-gold transition-all flex items-center gap-2 shadow-sm">
            <Briefcase size={18} />
            Requisitions
          </Link>
          <button className="px-5 py-2.5 bg-brand-navy text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-brand-navy/10">
            <Plus size={18} />
            Create Role
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Requisitions', value: requisitions.length, icon: Briefcase, color: 'text-brand-gold' },
          { label: 'Total Candidates', value: Object.values(pipeline || {}).flat().length, icon: Users, color: 'text-blue-500' },
          { label: 'Interviews Today', value: 3, icon: Calendar, color: 'text-indigo-500' },
          { label: 'Hires this Month', value: pipeline?.hired?.length || 0, icon: Star, color: 'text-emerald-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl bg-slate-50 ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={20} />
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</div>
            <div className="text-xs font-bold text-slate-400 uppercase mt-1 tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4 -mx-8 px-8">
        <div className="flex gap-6 min-w-max pb-4">
          {stages.map((stage) => (
            <div key={stage.id} className="w-80 flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${stage.color}`}>
                    {stage.name}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {pipeline?.[stage.id]?.length || 0}
                  </span>
                </div>
                <button className="text-slate-400 hover:text-slate-600 transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-3 min-h-[500px] bg-slate-50/50 p-3 rounded-2xl border border-dashed border-slate-200">
                {pipeline?.[stage.id as PipelineStageId]?.map((app) => (
                  <Link 
                    key={app.id} 
                    href={`/hr/ats/candidates/${app.candidate_id}`}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-gold transition-all group relative overflow-hidden active:scale-[0.98]"
                  >
                    <div className="absolute top-0 right-0 w-1 h-full bg-brand-gold translate-x-1 group-hover:translate-x-0 transition-transform"></div>
                    
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-900 group-hover:text-brand-gold transition-colors truncate pr-4">
                        {app.candidate?.name}
                      </h4>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: app.rating || 0 }).map((_, i) => (
                          <Star key={i} size={10} className="fill-brand-gold text-brand-gold" />
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <Briefcase size={10} className="text-slate-300" />
                        {app.requisition?.title}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                          {app.candidate?.source}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(app.applied_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                
                {(!pipeline?.[stage.id] || pipeline?.[stage.id]?.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-12 opacity-40 grayscale group-hover:opacity-60 transition-opacity">
                    <Search size={32} className="text-slate-300 mb-2" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center px-4">
                      Empty Segment
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
