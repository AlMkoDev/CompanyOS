'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { 
  Network, 
  User, 
  Building2,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';

interface OrgNode {
  id: string;
  name: string;
  title: string;
  department: string;
  avatar?: string;
  children: OrgNode[];
}

const ORG_CHART_DATA: OrgNode = {
  id: '1',
  name: 'Sarah Verdant',
  title: 'Managing Director',
  department: 'Executive',
  children: [
    {
      id: '2',
      name: 'James Makokha',
      title: 'Farm Manager',
      department: 'Operations',
      children: [
        { id: '4', name: 'Peter Omondi', title: 'Farm Supervisor', department: 'Operations', children: [] },
        { id: '5', name: 'Lucy Wanjiku', title: 'Quality Auditor', department: 'Operations', children: [] }
      ]
    },
    {
      id: '3',
      name: 'Grace Nyambura',
      title: 'Head of Finance',
      department: 'Finance',
      children: [
        { id: '6', name: 'David Mutua', title: 'Accountant', department: 'Finance', children: [] }
      ]
    }
  ]
};

export default function OrgChartPage() {
  const [zoom, setZoom] = useState(1);
  const [data] = useState<OrgNode | null>(ORG_CHART_DATA);

  const renderNode = (node: OrgNode, level: number = 0) => (
    <div key={node.id} className="flex flex-col items-center relative gap-12">
      {/* Node Content */}
      <div className="relative group shrink-0">
         <div className="absolute -inset-1 bg-gradient-to-r from-brand-navy/20 to-slate-200 rounded-[32px] blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
         <Card className="relative p-6 px-10 rounded-[32px] border-slate-100 bg-white shadow-xl shadow-slate-200 hover:shadow-2xl transition-all w-64 text-center">
            <div className="w-16 h-16 rounded-[20px] bg-slate-50 border border-slate-100 mx-auto mb-4 flex items-center justify-center text-slate-300">
               <User size={32} />
            </div>
            <h4 className="text-lg font-heading font-black text-brand-navy mb-1">{node.name}</h4>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">{node.title}</div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-navy/5 text-brand-navy/70 rounded-lg text-[10px] font-bold">
               <Building2 size={10} />
               {node.department}
            </div>
         </Card>
      </div>

      {/* Connection Lines & Children */}
      {node.children.length > 0 && (
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-12 bg-slate-200 mb-0 shadow-sm"></div>
          <div className="relative flex gap-8">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-200 translate-y-[-1px]"></div>
            {node.children.map((child) => (
               <div key={child.id} className="relative pt-12 flex flex-col items-center">
                  {/* Vertical line from horizontal connector */}
                  <div className="absolute top-0 w-0.5 h-12 bg-slate-200 translate-y-[-1px]"></div>
                  {renderNode(child, level + 1)}
               </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8 h-[calc(100vh-100px)] overflow-hidden">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-heading text-brand-navy font-bold">Interactive Organogram</h1>
          <p className="text-slate-500 text-sm mt-1">Visualize organizational structure and reporting lines.</p>
        </div>
        <div className="flex items-center gap-2 p-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-500"><ZoomOut size={18} /></button>
          <div className="px-3 font-bold text-slate-400 border-x border-slate-50 text-xs">{Math.round(zoom * 100)}%</div>
          <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-500"><ZoomIn size={18} /></button>
          <button onClick={() => setZoom(1)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-500"><Maximize2 size={18} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50/50 rounded-[40px] border border-slate-100 relative p-20 flex justify-center items-start scroll-smooth">
         <div 
           className="transition-transform duration-300 origin-top"
           style={{ transform: `scale(${zoom})` }}
         >
           {data ? renderNode(data) : (
             <div className="flex flex-col items-center gap-4 text-slate-300">
               <div className="animate-spin text-brand-navy"><Network size={40} /></div>
               <span className="font-bold">Building tree...</span>
             </div>
           )}
         </div>
      </div>
    </div>
  );
}
