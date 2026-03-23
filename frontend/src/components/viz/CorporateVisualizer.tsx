"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

interface DeptData {
  id: string;
  name: string;
  color: string;
  template_key: string;
  _count?: {
    members: number;
    tasks: number;
  };
}

interface CorporateVisualizerProps {
  departments: DeptData[];
  loading: boolean;
}

interface DeptNodeProps {
  label: string;
  status: 'optimized' | 'pending';
  color: string;
  onClick: () => void;
}

export function CorporateVisualizer({ departments, loading }: CorporateVisualizerProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="p-10 bg-slate-900 rounded-3xl text-white h-[400px] flex items-center justify-center border border-white/5 relative overflow-hidden">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-gold border-t-transparent animate-spin"></div>
          <span className="text-brand-gold font-bold tracking-widest uppercase text-[10px]">Synchronizing Schematic...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 bg-slate-900 rounded-3xl text-white overflow-hidden relative shadow-2xl border border-white/5 min-h-[450px]">
      <div className="absolute top-0 right-0 p-4 text-[10px] text-brand-gold uppercase tracking-[0.2em] font-bold opacity-30">Structural Schematic v5.0</div>
      
      <div className="flex flex-col items-center gap-16 relative z-10">
        {/* CEO / BRAIN */}
        <div 
          onClick={() => router.push('/org-chart')}
          className="w-56 p-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-center relative z-20 hover:scale-105 hover:bg-white/20 hover:border-brand-gold/50 transition-all duration-500 cursor-pointer group shadow-2xl shadow-brand-gold/5"
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-gold rounded-full text-[8px] font-black text-brand-navy shadow-lg">CORE COMMAND</div>
          <h2 className="text-xl font-heading mb-1 text-white">Company Executive</h2>
          <p className="text-[10px] opacity-40 uppercase tracking-widest font-bold">Global Strategy & Oversight</p>
          <div className="mt-4 flex justify-center gap-1">
             <div className="w-1 h-4 bg-brand-gold rounded-full animate-bounce delay-75"></div>
             <div className="w-1 h-3 bg-brand-gold/50 rounded-full mt-1 animate-bounce"></div>
          </div>
        </div>

        {/* Dynamic Department Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative w-full px-4">
          {departments.length > 0 ? (
            departments.map((dept) => (
              <DeptNode 
                key={dept.id} 
                label={dept.name} 
                status="optimized" 
                color={dept.color} 
                onClick={() => router.push(`/departments/${dept.id}`)}
              />
            ))
          ) : (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-white/10 rounded-3xl">
              <p className="text-slate-500 text-sm">No departments active in this ecosystem.</p>
              <button 
                onClick={() => router.push('/setup/departments')}
                className="mt-4 text-brand-gold font-bold text-xs uppercase hover:underline"
              >
                + Initialize Units
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Background Grid Polish */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
    </div>
  );
}

function DeptNode({ label, status, color, onClick }: DeptNodeProps) {
  return (
    <div 
      onClick={onClick}
      className={`p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-gold/30 hover:scale-105 hover:shadow-2xl transition-all duration-500 cursor-pointer group text-left relative overflow-hidden`}
    >
       <div className="flex justify-between items-start mb-6">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-inner"
            style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
          >
            {label[0]}
          </div>
          <div className={`w-2 h-2 rounded-full ${status === 'optimized' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-brand-gold animate-pulse'}`}></div>
       </div>
       <h4 className="font-heading text-lg mb-1 truncate text-white decoration-brand-gold group-hover:underline underline-offset-4">{label}</h4>
       <p className="text-[9px] opacity-30 uppercase font-black tracking-widest mb-3">Functional Unit</p>
       <div className="flex gap-1">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i === 2 ? 'bg-white/10' : 'bg-brand-gold/40'}`}></div>
          ))}
       </div>
       <div className="absolute -bottom-2 -right-2 w-16 h-16 rounded-full opacity-5 blur-2xl transition-all group-hover:opacity-20 group-hover:scale-150" style={{ backgroundColor: color }}></div>
    </div>
  );
}
