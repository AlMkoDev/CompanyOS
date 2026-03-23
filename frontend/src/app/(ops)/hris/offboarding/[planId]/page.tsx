'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Trash2, 
  ShieldAlert, 
  MonitorOff, 
  CreditCard, 
  FileCheck,
  Star,
  MessageSquare,
  ChevronRight,
  HeartCrack,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function OffboardingPlanDetail() {
  const [deprovisioned, setDeprovisioned] = useState(false);
  const [nps, setNps] = useState<number | null>(null);

  const checklist = [
    { title: 'Return Laptop & Charger', status: 'completed', icon: <MonitorOff size={22} /> },
    { title: 'Deactivate Access Badge', status: 'pending', icon: <ShieldAlert size={22} /> },
    { title: 'Final Salary Settlement', status: 'pending', icon: <CreditCard size={22} /> },
    { title: 'Archive Employee Files', status: 'pending', icon: <FileCheck size={22} /> },
  ];

  return (
    <div className="p-6 md:p-12 flex flex-col gap-10 pb-32 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <Link href="/hris/onboarding" className="p-4 bg-white border border-slate-100 rounded-2xl hover:bg-rose-600 hover:text-white transition-all text-slate-400 shadow-sm active:scale-95 group">
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div className="space-y-1">
             <div className="flex items-center gap-3">
               <div className="h-8 w-1 bg-rose-500 rounded-full"></div>
               <h1 className="text-3xl font-heading text-brand-navy font-black tracking-tight">Offboarding: Alice Williams</h1>
             </div>
             <div className="flex items-center gap-4 ml-4">
               <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Finance Department</span>
               <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
               <span className="text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] italic flex items-center gap-2">
                 <HeartCrack size={14} /> Final Engagement: Mar 20, 2024
               </span>
             </div>
          </div>
        </div>
        <Button variant="outline" className="h-14 px-8 rounded-[20px] border-rose-200 text-rose-500 font-extrabold hover:bg-rose-50 gap-3 shadow-sm active:scale-95">
          <Trash2 size={20} /> Archive Personnel Record
        </Button>
      </div>

      <div className="grid gap-10 lg:grid-cols-12">
        {/* Departure Checklist */}
        <div className="lg:col-span-7 space-y-10">
           <Card className="rounded-[56px] border-slate-100 p-10 md:p-14 overflow-hidden relative shadow-2xl shadow-slate-200/50 bg-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full blur-[100px] opacity-40 -mr-32 -mt-32"></div>
              <h2 className="text-2xl font-heading font-black text-brand-navy mb-10 flex items-center gap-4 tracking-tight">
                 <AlertCircle className="text-rose-500" size={28} /> Separation Protocol Checklist
              </h2>
              
              <div className="grid gap-4">
                 {checklist.map((item, i) => (
                   <div key={i} className="group p-8 bg-slate-50/30 border border-slate-100 rounded-[40px] flex items-center justify-between hover:border-rose-100/50 hover:bg-white hover:shadow-xl hover:shadow-rose-100/10 transition-all duration-300">
                      <div className="flex items-center gap-8">
                         <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-500 shadow-inner group-hover:scale-110 group-hover:rotate-3 ${item.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300 group-hover:text-rose-500 border border-slate-50'}`}>
                           {item.icon}
                         </div>
                         <div>
                            <div className={`text-xl font-heading transition-all ${item.status === 'completed' ? 'text-slate-300 line-through' : 'text-brand-navy font-black tracking-tight'}`}>{item.title}</div>
                            <div className={`text-[10px] font-black uppercase tracking-[0.2em] mt-1 ${item.status === 'completed' ? 'text-emerald-500' : 'text-slate-300'}`}>{item.status}</div>
                         </div>
                      </div>
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${item.status === 'completed' ? 'bg-emerald-50 text-emerald-500' : 'text-slate-200 group-hover:text-rose-400 group-hover:bg-rose-50'}`}>
                         <CheckCircle size={28} strokeWidth={item.status === 'completed' ? 3 : 2} />
                      </div>
                   </div>
                 ))}
              </div>

              <div className="mt-14 p-10 bg-slate-900 rounded-[48px] text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group/it">
                 <div className="absolute inset-0 bg-gradient-to-r from-rose-900/20 to-transparent opacity-0 group-hover/it:opacity-100 transition-opacity"></div>
                 <div className="relative z-10 text-center md:text-left">
                    <h3 className="text-xl font-black mb-1 tracking-tight flex items-center gap-3 justify-center md:justify-start">
                       <ShieldAlert size={20} className="text-rose-500" /> Executive Access Lockdown
                    </h3>
                    <p className="text-slate-400 text-sm font-medium">Global termination of all cloud credentials and local network access.</p>
                 </div>
                 <Button 
                   onClick={() => setDeprovisioned(!deprovisioned)}
                   className={`relative z-10 h-16 px-10 rounded-[22px] font-black uppercase tracking-widest transition-all duration-500 active:scale-95 ${deprovisioned ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-900/40' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xl shadow-rose-900/60 hover:-translate-y-1'}`}
                 >
                   {deprovisioned ? 'Protocol Executed' : 'Execute Total Lockout'}
                 </Button>
              </div>
           </Card>
        </div>

        {/* Exit Interview */}
        <div className="lg:col-span-5 space-y-10">
           <Card className="rounded-[56px] border-slate-100 p-10 shadow-2xl shadow-slate-200/50 bg-white relative overflow-hidden group/sentiment">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full blur-3xl opacity-50"></div>
              <h2 className="text-2xl font-heading font-black text-brand-navy mb-10 flex items-center gap-4 tracking-tight">
                 <MessageSquare className="text-brand-gold" size={24} /> Exit Sentiment Scan
              </h2>

              <div className="space-y-10">
                 <div className="space-y-6">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest text-center block">Employer Net Promoter Score (eNPS)</label>
                    <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                       {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                         <button 
                           key={i} 
                           onClick={() => setNps(i)}
                           className={`h-11 rounded-xl font-black text-xs transition-all duration-300 border-2 ${nps === i ? 'bg-brand-navy border-brand-navy text-white scale-110 shadow-xl shadow-brand-navy/20' : 'bg-white border-slate-100 text-slate-300 hover:border-brand-gold/30 hover:text-brand-gold hover:scale-105'}`}
                         >
                           {i}
                         </button>
                       ))}
                    </div>
                    <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">
                       <span>Highly Unlikely</span>
                       <span>Definite Advocate</span>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Primary Exit Vector</label>
                    <div className="relative group/select">
                      <select className="w-full h-16 bg-slate-50 border-2 border-slate-50 rounded-[22px] px-8 font-black text-brand-navy focus:ring-4 ring-brand-navy/5 appearance-none focus:bg-white transition-all cursor-pointer">
                         <option>Strategic Career Growth</option>
                         <option>Geopolitical Relocation</option>
                         <option>Personal Equilibrium</option>
                         <option>Competitive Compensation</option>
                         <option>Other / Confidential</option>
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-focus-within/select:rotate-180 transition-transform">
                        <ChevronRight className="rotate-90" size={20} />
                      </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Critical Insight Feedback</label>
                    <textarea 
                      placeholder="Identify organizational growth opportunities..." 
                      className="w-full h-40 bg-slate-50 border-2 border-slate-50 rounded-[32px] p-8 font-medium text-slate-600 focus:ring-4 ring-brand-navy/5 focus:bg-white transition-all placeholder:text-slate-300 placeholder:italic resize-none"
                    />
                 </div>

                 <Button className="w-full h-20 bg-brand-navy rounded-[30px] font-black uppercase tracking-widest text-brand-gold text-xs shadow-2xl shadow-brand-navy/30 hover:shadow-brand-navy/40 hover:-translate-y-1 transition-all flex gap-4 active:scale-95 group/submit">
                    Finalize Separation Interview <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
                 </Button>
              </div>
           </Card>

           <Card className="p-10 rounded-[48px] border-amber-100/50 bg-amber-50/20 backdrop-blur-md flex items-start gap-6 border-2 relative overflow-hidden group/alert">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 rounded-full blur-2xl opacity-20 -mr-12 -mt-12"></div>
              <div className="p-4 bg-white text-brand-gold rounded-[20px] shadow-lg shadow-brand-gold/10 group-hover:rotate-12 transition-transform duration-500"><Star size={24} fill="currentColor" /></div>
              <div className="relative z-10">
                 <h4 className="font-black text-amber-900 text-lg tracking-tight mb-1">High-Impact Departure Alert</h4>
                 <p className="text-sm text-amber-800/60 font-medium leading-relaxed italic">System identifies this individual as &quot;Mission Critical&quot;. Qualitative feedback will be encrypted and transmitted to Board Level retention analytics.</p>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
