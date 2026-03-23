"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Mail, 
  Phone, 
  Linkedin, 
  FileText, 
  Calendar, 
  ChevronLeft,
  CheckCircle2,
  Clock,
  MessageSquare,
  Award,
  MoreHorizontal,
  TrendingUp,
  Download,
  Briefcase
} from 'lucide-react';

type CandidateStage = 'applied' | 'screened' | 'interview1' | 'interview2' | 'offer' | 'hired' | 'rejected';

interface CandidateDepartment {
  name: string;
}

interface CandidateRequisition {
  title: string;
  department: CandidateDepartment;
}

interface InterviewScorecard {
  scores: Record<string, number>;
  recommendation: string;
}

interface CandidateInterview {
  id: string;
  type: string;
  scheduled_at: string;
  scorecard?: InterviewScorecard | null;
}

interface CandidateApplication {
  id: string;
  stage: CandidateStage;
  requisition: CandidateRequisition;
  interviews: CandidateInterview[];
  notes?: string | null;
}

interface CandidateProfileData {
  name: string;
  source?: string;
  email?: string;
  phone?: string | null;
  linkedin_url?: string | null;
  applications: CandidateApplication[];
}

export default function CandidateProfile() {
  const { id } = useParams();
  const router = useRouter();
  const candidateId = Array.isArray(id) ? id[0] : id;
  const [candidate, setCandidate] = useState<CandidateProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCandidate = useCallback(async () => {
    if (!candidateId) return;
    try {
      const res = await fetch(`/api/ats/candidates/${candidateId}`);
      if (res.ok) setCandidate(await res.json());
    } catch (error) {
      console.error('Error fetching candidate:', error);
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  const updateStage = async (applicationId: string, newStage: CandidateStage) => {
    try {
      const res = await fetch(`/api/ats/applications/${applicationId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage })
      });
      if (res.ok) fetchCandidate();
    } catch (error) {
      console.error('Error updating stage:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold"></div>
      </div>
    );
  }

  if (!candidate) return <div className="p-8">Candidate not found.</div>;

  return (
    <div className="min-h-full bg-slate-50/50">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
            <ChevronLeft size={20} />
          </button>
          <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
          <div>
            <h2 className="font-heading font-bold text-slate-900 tracking-tight">{candidate.name}</h2>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Candidate Identity Card</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:border-brand-gold transition-all flex items-center gap-2 shadow-sm">
            <Download size={16} />
            Export Portfolio
          </button>
          <button className="px-4 py-2 bg-brand-navy text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-brand-navy/10">
            Schedule Interview
          </button>
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-[1600px] mx-auto">
        {/* Left Column: Basic Info & Documents */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="h-24 bg-gradient-to-br from-brand-navy to-slate-800 relative">
              <div className="absolute -bottom-10 left-8 p-1 bg-white rounded-2xl shadow-xl">
                <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400 uppercase tracking-tighter">
                  {candidate.name.split(' ').map((namePart) => namePart[0]).join('')}
                </div>
              </div>
            </div>
            
            <div className="pt-14 pb-8 px-8 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 group flex items-center gap-2">
                  {candidate.name}
                  <CheckCircle2 size={18} className="text-emerald-500" />
                </h3>
                <p className="text-slate-500 text-sm font-medium mt-1">Source: {candidate.source}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-600 hover:text-brand-gold transition-colors cursor-pointer group">
                  <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-brand-gold/10 transition-colors">
                    <Mail size={16} />
                  </div>
                  <span className="text-sm font-medium">{candidate.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <Phone size={16} />
                  </div>
                  <span className="text-sm font-medium">{candidate.phone || 'Not provided'}</span>
                </div>
                {candidate.linkedin_url && (
                  <a href={candidate.linkedin_url} target="_blank" className="flex items-center gap-3 text-slate-600 hover:text-indigo-600 transition-colors group">
                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                      <Linkedin size={16} />
                    </div>
                    <span className="text-sm font-medium underline underline-offset-4 decoration-slate-200 group-hover:decoration-indigo-200">View LinkedIn Profile</span>
                  </a>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Supporting Artifacts</h4>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-brand-gold hover:bg-white transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                      <FileText size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-brand-gold transition-colors tracking-tight">Curriculum Vitae</div>
                      <div className="text-[10px] text-slate-400 font-medium">PDF Document • 2.4 MB</div>
                    </div>
                  </div>
                  <Download size={14} className="text-slate-300 group-hover:text-brand-gold" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Key Metrics</h4>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-600">Culture Match Score</span>
                  <span className="text-xs font-bold text-brand-gold">88%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-gold rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-600">Technical Proficiency</span>
                  <span className="text-xs font-bold text-indigo-500">94%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '94%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Applications & Timeline */}
        <div className="lg:col-span-2 space-y-8">
          {candidate.applications.map((app) => (
            <div key={app.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
              {/* Application Header */}
              <div className="px-8 py-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <Briefcase size={20} className="text-brand-navy" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 tracking-tight">{app.requisition.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-medium text-slate-500">{app.requisition.department.name}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="text-xs font-medium text-slate-500 font-mono tracking-tighter uppercase">{app.id.split('-')[0]}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Current Milestone</div>
                    <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-brand-navy shadow-sm">
                      {app.stage.toUpperCase()}
                    </div>
                  </div>
                  <button className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                    <MoreHorizontal size={20} className="text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-10">
                {/* Governance Controller */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                    <TrendingUp size={14} />
                    Pipeline Movement
                  </h4>
                  <div className="flex items-center gap-2">
                    {(['applied', 'screened', 'interview1', 'interview2', 'offer', 'hired'] as CandidateStage[]).map((stage, idx) => {
                      const isPast = ['applied', 'screened', 'interview1', 'interview2', 'offer', 'hired', 'rejected'].indexOf(app.stage) >= idx;
                      const isCurrent = app.stage === stage;
                      return (
                        <React.Fragment key={stage}>
                          <button 
                            onClick={() => updateStage(app.id, stage)}
                            className={`flex flex-col items-center gap-2 transition-all p-2 rounded-xl group relative ${isCurrent ? 'scale-110' : ''}`}
                            disabled={isCurrent}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${
                              isCurrent ? 'bg-brand-gold border-brand-gold text-brand-navy shadow-lg shadow-brand-gold/20' : 
                              isPast ? 'bg-brand-navy border-brand-navy text-white' : 
                              'bg-white border-slate-100 text-slate-300 hover:border-slate-200'
                            }`}>
                              {isPast && !isCurrent ? <CheckCircle2 size={18} /> : <span>{idx + 1}</span>}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-tighter transition-colors ${
                              isCurrent ? 'text-brand-gold' : isPast ? 'text-brand-navy' : 'text-slate-300'
                            }`}>
                              {stage}
                            </span>
                          </button>
                          {idx < 5 && (
                            <div className={`h-0.5 w-full flex-1 rounded-full transition-colors ${isPast && app.stage !== stage ? 'bg-brand-navy' : 'bg-slate-100'}`}></div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Interview History */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
                      <Clock size={14} />
                      Interview Log
                    </h4>
                    <div className="space-y-4">
                      {app.interviews.map((interview) => (
                        <div key={interview.id} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:border-indigo-100 hover:bg-white transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                                <Calendar size={16} className="text-indigo-600" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900 tracking-tight">{interview.type.toUpperCase()} INTERVIEW</div>
                                <div className="text-[10px] text-slate-500 font-medium">{new Date(interview.scheduled_at).toLocaleString()}</div>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded uppercase">Completed</span>
                          </div>
                          
                          {interview.scorecard && (
                            <div className="pt-4 border-t border-slate-100 space-y-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Award size={14} className="text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scorecard Result</span>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                {Object.entries(interview.scorecard.scores).map(([key, value]) => (
                                  <div key={key}>
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">
                                      <span>{key.replace('_', ' ')}</span>
                                      <span>{value}/5</span>
                                    </div>
                                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-brand-navy rounded-full" style={{ width: `${(value / 5) * 100}%` }}></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 p-3 bg-white border border-slate-100 rounded-xl">
                                <span className="text-[10px] font-bold text-slate-900 uppercase">Recommendation: </span>
                                <span className={`text-[10px] font-bold uppercase ${interview.scorecard.recommendation === 'hire' ? 'text-emerald-600' : 'text-slate-600'}`}>
                                  {interview.scorecard.recommendation}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {app.interviews.length === 0 && (
                        <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl opacity-40">
                          <Calendar size={32} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Interviews Engaged</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes & Activity */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
                      <MessageSquare size={14} />
                      Recruiter Intelligence
                    </h4>
                    <div className="space-y-4">
                      <div className="p-5 bg-brand-gold/5 rounded-2xl border border-brand-gold/10">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare size={14} className="text-brand-gold" />
                          <span className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">Internal Memo</span>
                        </div>
                        <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                          &quot;{app.notes || 'No candidate notes have been logged for this application yet.'}&quot;
                        </p>
                        <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          <span>SYSTEM LOG</span>
                          <button className="text-brand-gold hover:underline">Edit Memo</button>
                        </div>
                      </div>

                      <div className="p-5 border border-slate-100 rounded-2xl space-y-4">
                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Hiring Manager Verdict</h5>
                        <div className="flex gap-4">
                          <button className="flex-1 py-2 rounded-xl border border-slate-200 text-[10px] font-bold uppercase tracking-tighter hover:border-emerald-500 hover:text-emerald-500 transition-all">Recommend Hire</button>
                          <button className="flex-1 py-2 rounded-xl border border-slate-200 text-[10px] font-bold uppercase tracking-tighter hover:border-red-500 hover:text-red-500 transition-all">Recommend Reject</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
