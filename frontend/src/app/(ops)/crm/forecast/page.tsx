'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  DollarSign, 
  Target,
  BarChart3,
  Sparkles,
  Zap,
  Plus,
} from 'lucide-react';

interface ForecastDistribution {
  month: string;
  value: number;
}

interface ForecastData {
  total_pipeline: number;
  weighted_pipeline: number;
  deal_count: number;
  monthly_distribution: ForecastDistribution[];
}

export default function ForecastPage() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const response = await fetch('/api/crm/forecast');
        if (response.ok) {
          const json = await response.json();
          setData(json);
        }
      } catch (error) {
        console.error('Error fetching forecast:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) return <div className="p-12 animate-pulse font-black text-slate-200">Generating Intelligence...</div>;
  if (!data) return <div className="p-12">No data available.</div>;

  const maxVal = Math.max(...data.monthly_distribution.map(d => Number(d.value)));

  return (
    <div className="p-6 md:p-12 flex flex-col gap-10 pb-32 max-w-[1600px] mx-auto overflow-y-auto h-screen custom-scrollbar">
      {/* Header Intelligence */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 shrink-0">
        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <div className="h-10 w-1.5 bg-brand-gold rounded-full"></div>
             <h1 className="text-4xl font-heading text-brand-navy font-black tracking-tighter flex items-center gap-4">
                Revenue Intelligence
                <div className="p-2.5 bg-brand-gold/10 text-brand-gold rounded-2xl animate-pulse"><Zap size={24} fill="currentColor" /></div>
             </h1>
          </div>
          <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">
            Predictive forecasting and weighted pipeline analysis for the upcoming fiscal quarters.
          </p>
        </div>
        <div className="flex items-center gap-4">
           <Button variant="ghost" className="h-14 rounded-2xl border border-slate-100 px-6 font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-brand-navy">Export Model</Button>
           <Button className="h-14 px-8 rounded-2xl bg-brand-navy text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-brand-navy/20 flex gap-3 active:scale-95">
              <Plus size={18} />
              Adjustment Layer
           </Button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Unweighted Pipeline', value: data.total_pipeline, icon: DollarSign, color: 'text-brand-navy', trend: '+12% vs last month', bg: 'bg-white' },
          { label: 'Weighted Forecast', value: data.weighted_pipeline, icon: Target, color: 'text-brand-gold', trend: 'High Confidence', bg: 'bg-white' },
          { label: 'Deal Velocity', value: data.deal_count, icon: Zap, color: 'text-emerald-500', trend: '8 New Deals', bg: 'bg-emerald-50/30' }
        ].map((stat, i) => (
          <Card key={i} className={`p-10 rounded-[48px] border-none shadow-xl ${stat.bg} relative overflow-hidden group`}>
             <div className="relative z-10 flex flex-col justify-between h-full gap-8">
                <div className="flex items-center justify-between">
                   <div className={`p-4 rounded-3xl ${stat.color.replace('text', 'bg')}/10 ${stat.color}`}>
                     <stat.icon size={24} />
                   </div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">{stat.trend}</div>
                </div>
                <div>
                   <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">{stat.label}</div>
                   <div className={`text-4xl font-heading font-black tracking-tighter ${stat.color}`}>
                     {typeof stat.value === 'number' ? formatCurrency(stat.value) : stat.value}
                   </div>
                </div>
             </div>
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-slate-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </Card>
        ))}
      </div>

      {/* Main Insights Chart Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-10 rounded-[56px] border border-slate-50 bg-white shadow-2xl flex flex-col gap-10">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-heading font-black text-brand-navy tracking-tight flex items-center gap-3">
                <BarChart3 size={24} className="text-brand-gold" />
                Monthly Distribution
              </h2>
              <div className="flex items-center gap-4">
                 <Badge className="bg-slate-50 text-slate-400 border-none font-bold uppercase tracking-widest text-[9px] px-3">2024 Fiscal</Badge>
              </div>
           </div>

           <div className="flex-1 flex items-end justify-between gap-6 px-4 py-8 bg-slate-50/30 rounded-[40px] border border-slate-50 h-[400px]">
              {data.monthly_distribution.map((item, i) => {
                const height = (Number(item.value) / maxVal) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar">
                     <div className="relative w-full flex items-end justify-center">
                        <div 
                          className="w-16 md:w-24 bg-brand-navy rounded-[24px] transition-all duration-1000 ease-out group-hover/bar:bg-brand-gold group-hover/bar:-translate-y-2 cursor-pointer shadow-lg shadow-brand-navy/5 relative"
                          style={{ height: `${height}%` }}
                        >
                           <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap bg-brand-navy text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-xl">
                             {formatCurrency(Number(item.value))}
                           </div>
                        </div>
                     </div>
                     <span className="text-[11px] font-black uppercase tracking-widest text-slate-300 group-hover/bar:text-brand-navy transition-colors">{item.month}</span>
                  </div>
                );
              })}
           </div>

           <div className="grid grid-cols-3 gap-6 p-4">
              <div className="p-6 rounded-[32px] bg-slate-100/50 space-y-2">
                 <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Confidence Score</div>
                 <div className="text-xl font-black text-brand-navy">88%</div>
              </div>
              <div className="p-6 rounded-[32px] bg-slate-100/50 space-y-2">
                 <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Avg Deal Size</div>
                 <div className="text-xl font-black text-brand-navy">{formatCurrency(data.weighted_pipeline / data.deal_count)}</div>
              </div>
              <div className="p-6 rounded-[32px] bg-brand-gold/10 space-y-2">
                 <div className="text-[9px] font-black text-brand-gold uppercase tracking-widest">Projected Growth</div>
                 <div className="text-xl font-black text-brand-gold">+18.5%</div>
              </div>
           </div>
        </Card>

        {/* Intelligence Sidebar */}
        <div className="space-y-8 flex flex-col">
          <Card className="p-10 rounded-[56px] bg-brand-navy text-white shadow-2xl flex-1 relative overflow-hidden group">
             <div className="relative z-10 flex flex-col h-full gap-8">
                <h2 className="text-xl font-heading font-black tracking-tight flex items-center gap-3">
                   <Sparkles size={22} className="text-brand-gold" />
                   Smart Insights
                </h2>
                <div className="space-y-6">
                   <div className="p-6 rounded-[32px] bg-white/5 border border-white/10 space-y-3">
                      <div className="flex items-center gap-2 text-brand-gold font-black text-[10px] uppercase tracking-widest">
                         <Zap size={14} />
                         Revenue Alert
                      </div>
                      <p className="text-xs font-medium text-white/60 leading-relaxed italic">
                         Highly weighted deal &quot;Q1 Equipment Refresh&quot; is stalling in Discovery. Probabilty adjusted -10%.
                      </p>
                   </div>

                   <div className="p-6 rounded-[32px] bg-white/5 border border-white/10 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-widest">
                         <TrendingUp size={14} />
                         Upside Potential
                      </div>
                      <p className="text-xs font-medium text-white/60 leading-relaxed italic">
                        Enterprise software deals showing 20% higher conversion this month. Suggest focus shift.
                      </p>
                   </div>
                </div>

                <Button className="mt-auto h-14 rounded-2xl bg-white text-brand-navy font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all shadow-xl active:scale-95">
                   Run Simulation
                </Button>
             </div>
             <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-brand-gold opacity-10 rounded-full blur-3xl group-hover:scale-110 transition-transform"></div>
          </Card>
        </div>
      </div>
    </div>
  );
}
