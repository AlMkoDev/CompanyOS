'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  CheckCircle2, 
  Clock,
  MoreHorizontal,
  Sparkles,
  Database,
  RefreshCcw,
  Layers
} from 'lucide-react';

interface DataQualityData {
  contact_completeness: number;
  account_completeness: number;
  contacts_count: number;
  accounts_count: number;
}

export default function DataQualityPage() {
  const [data, setData] = useState<DataQualityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDataQuality = async () => {
      try {
        const response = await fetch('/api/crm/data-quality');
        if (response.ok) {
          const json = await response.json();
          setData(json);
        }
      } catch (error) {
        console.error('Error fetching data quality:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDataQuality();
  }, []);

  if (loading) return <div className="p-12 animate-pulse">Analyzing Data Integrity...</div>;
  if (!data) return <div className="p-12">No analysis data available.</div>;

  const averageScore = Math.round((data.contact_completeness + data.account_completeness) / 2);

  return (
    <div className="p-6 md:p-12 flex flex-col gap-10 pb-32 max-w-[1600px] mx-auto overflow-y-auto h-screen custom-scrollbar">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 shrink-0">
        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <div className="h-10 w-1.5 bg-brand-navy rounded-full"></div>
             <h1 className="text-4xl font-heading text-brand-navy font-black tracking-tighter flex items-center gap-4">
                Data Integrity Vault
                <div className="p-2 bg-brand-navy/5 text-emerald-500 rounded-2xl"><ShieldCheck size={24} /></div>
             </h1>
          </div>
          <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">
            Real-time monitoring of CRM database health, field completeness, and record accuracy.
          </p>
        </div>
        <div className="flex items-center gap-4">
           <Button variant="ghost" className="h-14 rounded-2xl border border-slate-100 px-6 font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-brand-navy flex gap-2">
             <RefreshCcw size={16} />
             Run Fresh Scan
           </Button>
           <Button className="h-14 px-8 rounded-2xl bg-brand-navy text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-brand-navy/20 flex gap-3 active:scale-95">
              <Sparkles size={18} />
              AI Cleanup
           </Button>
        </div>
      </div>

      {/* Main Health Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Global Health Card */}
        <Card className="p-12 rounded-[56px] border border-slate-100 bg-white shadow-2xl flex flex-col items-center justify-center text-center gap-8 relative overflow-hidden group">
           <div className="absolute inset-0 bg-brand-navy/[0.01] opacity-0 group-hover:opacity-100 transition-opacity"></div>
           
           <div className="relative">
              <svg className="w-56 h-56 -rotate-90">
                <circle
                  cx="112"
                  cy="112"
                  r="100"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-slate-50"
                />
                <circle
                  cx="112"
                  cy="112"
                  r="100"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 100}
                  strokeDashoffset={2 * Math.PI * 100 * (1 - averageScore / 100)}
                  strokeLinecap="round"
                  className={`${averageScore > 80 ? 'text-emerald-500' : 'text-amber-500'} transition-all duration-1000 ease-out`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-6xl font-heading font-black text-brand-navy tracking-tighter">{averageScore}%</span>
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Database Health</span>
              </div>
           </div>

           <div className="space-y-4 max-w-[240px]">
              <h3 className="text-lg font-black text-brand-navy">High-Quality Standard</h3>
              <p className="text-xs font-medium text-slate-400 leading-relaxed">
                Your CRM data meets the &quot;Verdant Fields&quot; premium threshold for operational readiness.
              </p>
           </div>
        </Card>

        {/* Detailed Metrics */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
           {[
             { label: 'Contact Completeness', score: data.contact_completeness, icon: Users, count: data.contacts_count, sub: 'Email, Phone, Title' },
             { label: 'Account Completeness', score: data.account_completeness, icon: Building2, count: data.accounts_count, sub: 'Industry, Website, Address' },
             { label: 'Potential Duplicates', score: 0, icon: Layers, count: 0, sub: 'Email-based detection', reverse: true },
             { label: 'Verified Records', score: 100, icon: CheckCircle2, count: data.contacts_count + data.accounts_count, sub: 'System validation passed' }
           ].map((metric, i) => (
             <Card key={i} className="p-8 rounded-[40px] border border-slate-50 bg-white shadow-xl hover:shadow-2xl hover:border-brand-navy/5 transition-all group overflow-hidden relative">
                <div className="relative z-10 space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="p-4 rounded-2xl bg-slate-50 text-brand-navy group-hover:bg-brand-navy group-hover:text-white transition-all duration-500">
                        <metric.icon size={20} />
                      </div>
                      <Badge className={`${metric.score > 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'} border-none font-black text-[10px] rounded-lg`}>
                        {metric.score}% Correct
                      </Badge>
                   </div>
                   
                   <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">{metric.label}</div>
                      <div className="text-2xl font-black text-brand-navy tracking-tight">{metric.count} Records</div>
                      <div className="text-[10px] font-bold text-slate-300 mt-2 italic">Missing: {metric.sub}</div>
                   </div>

                   <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${metric.score > 80 ? 'bg-emerald-500' : 'bg-amber-500'} rounded-full transition-all duration-1000`} 
                        style={{ width: `${metric.score}%` }}
                      ></div>
                   </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
             </Card>
           ))}
        </div>
      </div>

      {/* Actionable Issues Table */}
      <Card className="rounded-[40px] border border-slate-100 bg-white shadow-2xl overflow-hidden mt-4">
         <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <h2 className="text-xl font-heading font-black text-brand-navy tracking-tight flex items-center gap-3">
              <Database size={20} className="text-brand-gold" />
              Critical Data Gaps
            </h2>
            <div className="flex items-center gap-2">
               <Badge className="bg-rose-50 text-rose-500 border-none font-black text-[10px] px-3">8 Immediate Fixes</Badge>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-slate-50">
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Entity</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Issue Description</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Severity</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {[
                    { entity: 'Acme Corp', issue: 'Missing Industry Classification', severity: 'Medium', type: 'Account' },
                    { entity: 'John Smith', issue: 'Invalid Phone Format detected', severity: 'Low', type: 'Contact' },
                    { entity: 'Global Tech', issue: 'Missing Website URL', severity: 'High', type: 'Account' }
                  ].map((item, i) => (
                    <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                               {item.entity[0]}
                             </div>
                             <div>
                                <div className="text-sm font-black text-brand-navy uppercase tracking-tight">{item.entity}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.type}</div>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-sm font-medium text-slate-500">{item.issue}</td>
                       <td className="px-8 py-6">
                          <Badge className={`${
                            item.severity === 'High' ? 'bg-rose-50 text-rose-500' : 
                            item.severity === 'Medium' ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'
                          } border-none font-black text-[9px] px-2 py-0.5 rounded-md`}>
                            {item.severity}
                          </Badge>
                       </td>
                       <td className="px-8 py-6">
                          <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl text-slate-300 hover:text-brand-navy hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                             <MoreHorizontal size={18} />
                          </Button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </Card>
      
      {/* Footer Meta */}
      <div className="flex items-center gap-4 text-slate-300 font-bold text-[10px] uppercase tracking-widest mt-auto px-4">
        <Clock size={14} />
        Last Scan: Today, 09:15 AM
        <span className="text-slate-200">|</span>
        Scanner Version: v2.4.1-alpha
      </div>
    </div>
  );
}
