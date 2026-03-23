'use client';

import React, { useState, useEffect, use } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  Building2, 
  Phone, 
  Mail, 
  MessageSquare, 
  FileText,
  Clock,
  TrendingUp,
  Plus,
  Sparkles,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface Activity {
  id: string;
  type: string;
  subject: string;
  description?: string;
  due_date: string;
  completed_at?: string;
  contact?: { first_name: string; last_name: string };
}

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  close_date: string;
  account: { name: string; industry?: string; website?: string };
  contact?: { first_name: string; last_name: string; email?: string; phone?: string; job_title?: string };
  activities: Activity[];
}

const STAGES = [
  'qualification',
  'discovery',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost'
];

export default function DealDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        const response = await fetch(`/api/crm/deals/${id}`);
        if (response.ok) {
          const data = await response.json();
          setDeal(data);
        }
      } catch (error) {
        console.error('Error fetching deal:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeal();
  }, [id]);

  if (loading) return <div className="p-12 animate-pulse">Loading...</div>;
  if (!deal) return <div className="p-12 underline">Deal not found.</div>;

  const currentStageIndex = STAGES.indexOf(deal.stage);

  return (
    <div className="p-6 md:p-12 flex flex-col gap-8 pb-32 max-w-[1600px] mx-auto overflow-y-auto h-screen custom-scrollbar">
      {/* Navigation & Actions */}
      <div className="flex items-center justify-between">
        <Link href="/crm" className="group flex items-center gap-2 text-slate-400 hover:text-brand-navy transition-colors font-bold uppercase tracking-widest text-[10px]">
          <div className="p-2 rounded-lg group-hover:bg-brand-navy/5 transition-colors">
            <ArrowLeft size={16} />
          </div>
          Back to Pipeline
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="h-12 rounded-xl border border-slate-100 font-bold text-xs uppercase tracking-widest text-slate-500">Edit Deal</Button>
          <Button className="h-12 px-6 rounded-xl bg-brand-navy text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-navy/10 active:scale-95">Action Menu</Button>
        </div>
      </div>

      {/* Main Header Card */}
      <Card className="p-10 rounded-[48px] border border-slate-100 bg-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-navy/[0.02] rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-brand-navy/[0.04] transition-colors"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-gold/[0.02] rounded-full -ml-32 -mb-32 blur-3xl group-hover:bg-brand-gold/[0.04] transition-colors"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge className="bg-emerald-50 text-emerald-600 border-none shadow-none font-black uppercase tracking-widest text-[10px] px-3 py-1 rounded-full">
                {deal.stage.replace('_', ' ')}
              </Badge>
              <div className="flex items-center gap-2 text-slate-300 font-black text-xs uppercase tracking-tighter">
                <Sparkles size={14} className="text-brand-gold" />
                {deal.probability}% Win Probability
              </div>
            </div>
            <h1 className="text-5xl font-heading text-brand-navy font-black tracking-tighter leading-none">
              {deal.title}
            </h1>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                <Building2 size={18} className="text-brand-gold" />
                {deal.account.name}
              </div>
              <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
              <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                <Calendar size={18} />
                Est. Close: {new Date(deal.close_date).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="bg-brand-navy p-10 rounded-[40px] text-white shadow-2xl shadow-brand-navy/20 relative group/value overflow-hidden">
             <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/value:opacity-100 transition-opacity"></div>
             <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2">Deal Contract Value</div>
             <div className="text-5xl font-heading font-black tracking-tighter flex items-center gap-2">
               {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(deal.value)}
             </div>
             <div className="mt-4 flex items-center gap-2 text-brand-gold font-bold text-xs">
               <TrendingUp size={16} />
               Premium Tier Opportunity
             </div>
          </div>
        </div>

        {/* Pipeline Stepper */}
        <div className="mt-12 flex items-center justify-between gap-2 border-t border-slate-50 pt-10">
          {STAGES.map((s, i) => {
            const isCompleted = i < currentStageIndex;
            const isCurrent = i === currentStageIndex;
            return (
              <div key={s} className="flex-1 flex flex-col gap-3 group/step">
                <div className={`h-2 rounded-full transition-all duration-700 ${
                  isCompleted ? 'bg-emerald-500' : 
                  isCurrent ? 'bg-brand-navy' : 'bg-slate-100'
                }`}></div>
                <div className="px-1 flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    isCurrent ? 'text-brand-navy' : 
                    isCompleted ? 'text-emerald-600' : 'text-slate-300'
                  }`}>
                    {s.replace('_', ' ')}
                  </span>
                  {isCurrent && <span className="text-[9px] font-bold text-slate-400 italic">In Progress</span>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Activity & Timeline */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-[40px] border border-slate-100 bg-white shadow-xl overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <h2 className="text-xl font-heading font-black text-brand-navy tracking-tight flex items-center gap-3">
                 <Clock size={20} className="text-brand-gold" />
                 Activity Timeline
              </h2>
              <Button size="sm" className="bg-brand-navy hover:bg-brand-navy/90 rounded-xl font-black text-[10px] uppercase tracking-widest px-4 h-10 flex gap-2">
                <Plus size={14} />
                Log Activity
              </Button>
            </div>
            
            <div className="p-8 space-y-8">
              {deal.activities.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                  <div className="p-4 bg-slate-50 rounded-full mb-4"><MessageSquare size={32} /></div>
                  <span className="font-black uppercase tracking-widest text-[11px]">No Activity Logged Yet</span>
                </div>
              ) : (
                deal.activities.map((activity, idx) => (
                  <div key={activity.id} className="relative pl-10 group/item">
                    {/* Line Connector */}
                    {idx < deal.activities.length - 1 && (
                      <div className="absolute left-4 top-8 bottom-[-32px] w-[1px] bg-slate-100"></div>
                    )}
                    
                    {/* Icon Circle */}
                    <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center z-10 group-hover/item:border-brand-gold group-hover/item:scale-110 transition-all duration-300">
                      {activity.type === 'call' && <Phone size={14} className="text-indigo-500" />}
                      {activity.type === 'email' && <Mail size={14} className="text-emerald-500" />}
                      {activity.type === 'meeting' && <Users size={14} className="text-brand-gold" />}
                      {activity.type === 'note' && <FileText size={14} className="text-slate-400" />}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-brand-navy text-sm uppercase tracking-tight">{activity.subject}</h4>
                        <span className="text-[10px] font-mono font-black text-slate-300 bg-slate-50 px-2 py-0.5 rounded-md">
                          {new Date(activity.due_date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm font-medium leading-relaxed">
                        {activity.description || 'No detailed description provided for this activity.'}
                      </p>
                      {activity.contact && (
                        <div className="flex items-center gap-2 pt-2">
                           <div className="w-5 h-5 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">
                             {activity.contact.first_name[0]}{activity.contact.last_name[0]}
                           </div>
                           <span className="text-[10px] font-bold text-slate-400">With {activity.contact.first_name} {activity.contact.last_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Entity Info */}
        <div className="space-y-8">
          <Card className="p-8 rounded-[40px] border border-slate-100 bg-white shadow-xl space-y-8">
            <h2 className="text-lg font-heading font-black text-brand-navy tracking-tight flex items-center gap-3">
              <Users size={20} className="text-brand-gold" />
              Stakeholders
            </h2>

            {deal.contact && (
              <div className="p-6 rounded-3xl bg-slate-50/50 border border-slate-100 group/person hover:border-brand-gold/20 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand-navy text-white flex items-center justify-center text-xl font-black shadow-lg shadow-brand-navy/10">
                    {deal.contact.first_name[0]}{deal.contact.last_name[0]}
                  </div>
                  <div>
                    <div className="font-black text-brand-navy text-lg leading-none">{deal.contact.first_name} {deal.contact.last_name}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{deal.contact.job_title}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-500 hover:text-brand-navy transition-colors cursor-pointer">
                    <Mail size={16} className="text-slate-300" />
                    <span>{deal.contact.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-500 hover:text-brand-navy transition-colors cursor-pointer">
                    <Phone size={16} className="text-slate-300" />
                    <span>{deal.contact.phone}</span>
                  </div>
                </div>
                
                <Button variant="ghost" className="w-full mt-6 h-10 rounded-xl border border-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-brand-navy hover:bg-white group-hover/person:border-brand-gold/30">View Full Profile</Button>
              </div>
            )}

            <div className="pt-6 border-t border-slate-50">
               <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Account Intelligence</h3>
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">Industry</span>
                    <span className="text-xs font-black text-brand-navy uppercase">{deal.account.industry}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">Website</span>
                    <a href={deal.account.website} target="_blank" className="text-xs font-black text-indigo-600 hover:underline flex items-center gap-1">
                      {deal.account.website?.replace('https://', '')}
                      <ExternalLink size={12} />
                    </a>
                 </div>
               </div>
            </div>
          </Card>

          <Card className="p-8 rounded-[40px] border-none bg-brand-navy text-white shadow-2xl overflow-hidden relative group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
            <h2 className="text-lg font-heading font-black text-white tracking-tight flex items-center gap-3 mb-6">
              <ShieldAlert size={20} className="text-brand-gold" />
               Critical Alerts
            </h2>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-4">
               <div className="p-2 bg-brand-gold/20 text-brand-gold rounded-lg"><Clock size={16} /></div>
               <div className="space-y-1">
                 <div className="text-sm font-black text-white uppercase tracking-tight">Contract Expiration</div>
                 <p className="text-xs font-medium text-white/50 leading-relaxed italic">Main license for {deal.account.name} expires in 12 days. Escalation triggered.</p>
               </div>
            </div>
            <Button className="w-full mt-8 h-12 rounded-xl bg-white text-brand-navy font-black uppercase tracking-widest text-xs hover:bg-white/90 shadow-xl active:scale-95">Open Retention Suite</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
