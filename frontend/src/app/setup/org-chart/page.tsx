"use client";

import React from 'react';
import { WizardHeader } from '@/components/wizard/WizardHeader';
import { useRouter } from 'next/navigation';

export default function OrgChartStep() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 p-10 overflow-hidden">
      <WizardHeader currentStep={4} />

      <div className="max-w-6xl mx-auto h-[70vh] flex flex-col items-center justify-center animate-in zoom-in-95 duration-700">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-heading mb-2">Organizational Schematic</h2>
          <p className="text-slate-500">Visualize the flow of authority and collaboration across units.</p>
        </div>

        {/* Mock Tree Visualization */}
        <div className="relative w-full border border-slate-200 rounded-3xl bg-white/50 p-10 shadow-inner flex flex-col items-center overflow-auto">
          {/* Root Card (Founder / Board) */}
          <div className="w-48 p-4 bg-brand-navy text-white text-center rounded-xl shadow-xl mb-16 relative z-10">
            <div className="text-[10px] uppercase opacity-60 mb-1">Board of Directors</div>
            <div className="font-heading text-lg">Super Administrator</div>
          </div>

          {/* Department Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* SVG Connecting Lines - conceptual */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[4.5rem] w-full h-16 pointer-events-none opacity-20">
               <svg width="100%" height="100%" viewBox="0 0 400 64">
                 <path d="M 200 0 V 32 H 32 V 64 M 200 32 H 368 V 64 M 200 32 V 64" fill="transparent" stroke="#0F172A" strokeWidth="2" />
               </svg>
            </div>

            <OrgNode title="Finance" head="CFO" color="bg-brand-gold" />
            <OrgNode title="Operations" head="COO" color="bg-emerald-600" />
            <OrgNode title="Human Resources" head="CHRO" color="bg-blue-600" />
          </div>
        </div>

        <div className="flex justify-between items-center mt-10 w-full pt-10 border-t border-slate-200">
          <button onClick={() => router.push('/setup/configure')} className="px-6 py-2 text-slate-400 font-medium hover:text-slate-600 transition-colors">← Back to Config</button>
          <button 
            onClick={() => router.push('/setup/access')} 
            className="btn-premium"
          >
            Finalize Governance →
          </button>
        </div>
      </div>
    </div>
  );
}

interface OrgNodeProps {
  title: string;
  head: string;
  color: string;
}

function OrgNode({ title, head, color }: OrgNodeProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-md p-6 w-52 text-center group hover:border-brand-gold transition-all cursor-move">
      <div className={`w-3 h-10 ${color} absolute top-0 left-1/2 -translate-x-1/2 rounded-full -mt-5 group-hover:h-12 transition-all`}></div>
      <h5 className="font-heading text-lg mt-2">{title}</h5>
      <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">{head}</div>
      <div className="mt-4 flex flex-col gap-1">
         <div className="h-1 bg-slate-100 rounded"></div>
         <div className="h-1 bg-slate-100 rounded w-2/3 mx-auto"></div>
      </div>
    </div>
  );
}
