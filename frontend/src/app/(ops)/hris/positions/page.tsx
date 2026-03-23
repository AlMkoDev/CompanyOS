'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Users, 
  Briefcase,
  TrendingUp,
  Target,
  Plus
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Position {
  id: string;
  title: string;
  department: string;
  level: string;
  headcount: number;
  actual_headcount: number;
  description: string;
}

export default function PositionsLibraryPage() {
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    // Mock Positions Data
    setTimeout(() => {
      setPositions([
        {
          id: '1',
          title: 'Managing Director',
          department: 'Executive',
          level: 'L10',
          headcount: 1,
          actual_headcount: 1,
          description: 'Overall strategic leadership and profit responsibility.'
        },
        {
          id: '2',
          title: 'Farm Manager',
          department: 'Operations',
          level: 'L7',
          headcount: 2,
          actual_headcount: 1,
          description: 'Managing day-to-day agricultural production and farm logistics.'
        },
        {
          id: '3',
          title: 'Head of Finance',
          department: 'Finance',
          level: 'L8',
          headcount: 1,
          actual_headcount: 1,
          description: 'Financial planning, statutory compliance and treasury management.'
        }
      ]);
    }, 1000);
  }, []);

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-heading text-brand-navy font-bold">Position Library</h1>
          <p className="text-slate-500 text-sm mt-1">Define roles, levels, and manpower requirements.</p>
        </div>
        <Button className="h-12 px-6 rounded-2xl bg-brand-navy border-none font-bold text-white shadow-xl hover:opacity-90 transition-all flex gap-2">
          <Plus size={18} /> New Position
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
         <Card className="p-8 rounded-[32px] border-slate-100 shadow-sm bg-white">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Global Headcount</h3>
              <div className="p-2 bg-slate-50 text-slate-400 rounded-xl"><Users size={16} /></div>
            </div>
            <div className="text-3xl font-heading font-black text-brand-navy mb-1">142</div>
            <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-[10px] uppercase">
               <TrendingUp size={12} />
               +4 this month
            </div>
         </Card>
         <Card className="p-8 rounded-[32px] border-slate-100 shadow-sm bg-white">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Positions</h3>
              <div className="p-2 bg-slate-50 text-slate-400 rounded-xl"><Briefcase size={16} /></div>
            </div>
            <div className="text-3xl font-heading font-black text-brand-navy mb-1">18</div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Across 4 Departments</p>
         </Card>
         <Card className="p-8 rounded-[32px] border-slate-100 shadow-sm bg-brand-navy text-white">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-black text-brand-navy-foreground/50 uppercase tracking-widest">Open Roles</h3>
              <div className="p-2 bg-white/10 text-brand-gold rounded-xl"><Target size={16} /></div>
            </div>
            <div className="text-3xl font-heading font-black text-white mb-1">5</div>
            <p className="text-brand-gold/80 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:underline">View in recruitment →</p>
         </Card>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <div className="relative w-96 group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-navy transition-colors">
                    <Search size={18} />
                </div>
                <Input placeholder="Search positions..." className="h-12 pl-12 rounded-xl border-slate-100 bg-slate-50 focus-visible:ring-brand-navy/20" />
            </div>
            <Button variant="outline" className="rounded-xl border-slate-200 text-slate-500 font-bold gap-2">
                <Filter size={16} /> Filter Dept
            </Button>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
              <thead className="text-slate-400 border-b border-slate-50">
                <tr>
                   <th className="p-6 font-black uppercase tracking-widest text-[10px]">Title</th>
                   <th className="p-6 font-black uppercase tracking-widest text-[10px]">Department</th>
                   <th className="p-6 font-black uppercase tracking-widest text-[10px]">Level</th>
                   <th className="p-6 font-black uppercase tracking-widest text-[10px]">Manpower</th>
                   <th className="p-6 font-black uppercase tracking-widest text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {positions.map(pos => (
                  <tr key={pos.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                        <div className="font-bold text-brand-navy text-base">{pos.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-xs">{pos.description}</div>
                    </td>
                    <td className="p-6 font-bold text-slate-600 italic underline decoration-slate-200 underline-offset-4">{pos.department}</td>
                    <td className="p-6"><Badge className="bg-slate-100 text-slate-600 rounded-lg border-none shadow-none font-black px-3 py-1">{pos.level}</Badge></td>
                    <td className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-1000 ${pos.actual_headcount >= pos.headcount ? 'bg-emerald-500' : 'bg-brand-gold'}`}
                                    style={{ width: `${(pos.actual_headcount / pos.headcount) * 100}%` }}
                                />
                            </div>
                            <span className="font-mono font-bold text-brand-navy text-xs">{pos.actual_headcount}/{pos.headcount}</span>
                        </div>
                    </td>
                    <td className="p-6 text-right">
                        <Button variant="ghost" className="rounded-xl font-bold text-brand-navy hover:bg-slate-100">Details</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
