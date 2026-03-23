'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  TrendingUp, 
  Users, 
  DollarSign,
  Calendar,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  close_date: string;
  account: { name: string };
  contact?: { first_name: string; last_name: string };
}

const STAGES = [
  { id: 'qualification', name: 'Qualification', color: 'bg-slate-100 text-slate-600' },
  { id: 'discovery', name: 'Discovery', color: 'bg-blue-50 text-blue-600' },
  { id: 'proposal', name: 'Proposal', color: 'bg-amber-50 text-amber-600' },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-indigo-50 text-indigo-600' },
  { id: 'closed_won', name: 'Closed Won', color: 'bg-emerald-50 text-emerald-600' },
  { id: 'closed_lost', name: 'Closed Lost', color: 'bg-rose-50 text-rose-600' },
];

export default function CRMPipeline() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const mounted = true;

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const response = await fetch('/api/crm/pipeline');
      if (response.ok) {
        const data = await response.json();
        setDeals(data);
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDealsByStage = (stageId: string) => {
    return deals.filter(deal => deal.stage === stageId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  return (
    <div className="p-6 md:p-12 flex flex-col gap-10 pb-32 max-w-[1800px] mx-auto overflow-hidden h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 shrink-0">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="h-10 w-1 bg-brand-navy rounded-full"></div>
             <h1 className="text-4xl font-heading text-brand-navy font-black tracking-tight flex items-center gap-3">
                Sales Pipeline
                <div className="p-2 bg-brand-navy/5 text-brand-gold rounded-2xl"><Sparkles size={24} /></div>
             </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-400 font-medium text-base">
              <Users size={18} />
              <span>12 Active Opportunities</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-base">
              <TrendingUp size={18} />
              <span>{mounted ? formatCurrency(4850000) : 'R 0,00'} Pipeline Value</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative group hidden lg:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-navy transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search deals..." 
                className="h-14 w-80 pl-12 pr-4 rounded-2xl border border-slate-100 bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-brand-navy/5 focus:border-brand-navy/20 transition-all font-medium"
              />
           </div>
           <Button className="h-14 px-8 rounded-2xl bg-brand-navy text-white font-black uppercase tracking-widest text-xs hover:bg-brand-navy/90 shadow-xl shadow-brand-navy/20 transition-all active:scale-95 flex gap-3">
              <Plus size={18} />
              New Opportunity
           </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden flex gap-6 pb-6 select-none custom-scrollbar">
        {STAGES.map((stage) => {
          const stageDeals = getDealsByStage(stage.id);
          const stageTotal = stageDeals.reduce((sum, d) => sum + Number(d.value), 0);

          return (
            <div key={stage.id} className="w-[340px] flex-shrink-0 flex flex-col gap-6 group/column">
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-1.5 rounded-full ${stage.color} text-[10px] font-black uppercase tracking-widest shadow-sm`}>
                    {stage.name}
                  </div>
                  <span className="text-slate-300 font-black text-xs">{stageDeals.length}</span>
                </div>
                <div className="text-[11px] font-mono font-black text-slate-400">
                  {mounted ? formatCurrency(stageTotal) : 'R 0,00'}
                </div>
              </div>

              {/* Column Content */}
              <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 min-h-[500px] rounded-[32px] p-2 bg-slate-100/30 border border-slate-50 relative group-hover/column:bg-slate-100/50 transition-colors duration-500">
                {loading ? (
                  <div className="w-full h-32 rounded-[24px] bg-white/50 animate-pulse border border-slate-100"></div>
                ) : stageDeals.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-20 py-20 grayscale">
                    <div className="p-4 bg-slate-200 rounded-full mb-4"><DollarSign size={24} /></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">No Stage Deals</span>
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <Link key={deal.id} href={`/crm/deals/${deal.id}`}>
                      <Card className="p-6 rounded-[24px] border border-slate-100 bg-white shadow-sm hover:shadow-2xl hover:shadow-brand-navy/10 transition-all duration-500 hover:-translate-y-1.5 group/card cursor-pointer relative overflow-hidden active:scale-[0.98]">
                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                          <MoreHorizontal size={16} className="text-slate-300" />
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover/card:text-brand-gold transition-colors">{deal.account?.name}</div>
                            <h3 className="font-heading font-black text-brand-navy leading-tight text-base line-clamp-2">{deal.title}</h3>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-lg font-black text-brand-navy tracking-tight">
                              {mounted ? formatCurrency(Number(deal.value)) : 'R 0,00'}
                            </div>
                            <Badge className="bg-slate-50 text-slate-500 border-none shadow-none font-mono font-bold text-[10px] px-2 py-0.5 rounded-lg">
                              {deal.probability}%
                            </Badge>
                          </div>

                          <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-tighter">
                              <Calendar size={12} />
                              <span>{new Date(deal.close_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex -space-x-2">
                              <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">JS</div>
                            </div>
                          </div>

                          {/* Progress Line */}
                          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-brand-gold rounded-full" 
                              style={{ width: `${deal.probability}%` }}
                            ></div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
