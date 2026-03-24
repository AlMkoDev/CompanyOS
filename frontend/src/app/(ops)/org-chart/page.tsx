"use client";

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { getDepartmentTemplate } from '@/lib/setup/departmentTemplates';

interface DepartmentRole {
  title?: string;
  level?: string;
  hc?: number;
}

interface DepartmentNode {
  id: string;
  name: string;
  color?: string;
  icon?: string | null;
  template_key?: string | null;
  roles?: DepartmentRole[];
}

export default function OrgChartPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [departments, setDepartments] = useState<DepartmentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const res = await apiFetch('/departments');
        if (res.ok) {
          const data = await res.json();
          setDepartments(data);
        }
      } catch (err) {
        console.error('Failed to fetch org chart:', err);
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated) fetchOrg();
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Assembling Hierarchy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 min-h-screen">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-heading text-brand-navy mb-2">Interactive Schematic</h1>
        <p className="text-slate-500">Global Structural Overview of {user?.company?.name || 'the Organization'}</p>
      </div>

      <div className="relative w-full border border-slate-200 rounded-3xl bg-slate-50 p-10 shadow-inner flex flex-col items-center overflow-auto min-h-[70vh]">
        {/* Root Node */}
        <div className="w-64 p-6 bg-brand-navy text-white text-center rounded-2xl shadow-2xl mb-16 relative z-10 border border-brand-gold/30">
          <div className="text-[10px] uppercase font-bold tracking-widest text-brand-gold mb-2">Executive Layer</div>
          <div className="font-heading text-2xl mb-1">Board & CEO</div>
          <div className="text-xs opacity-60">Global Operations</div>
        </div>

        {/* Tree Container */}
        <div className="relative w-full max-w-7xl flex flex-wrap justify-center gap-8 px-4">
          
          {departments.map((dept) => {
             const templateRoles = getDepartmentTemplate(dept.template_key)?.roles || [];
             const roles = dept.roles && dept.roles.length > 0 ? dept.roles : templateRoles;
             // Find executive head
             const head = roles?.find((role) => role.level === 'Executive') || roles?.[0];
             
             return (
               <div 
                 key={dept.id}
                 onClick={() => router.push(`/departments/${dept.id}`)}
                 className="bg-white border border-slate-200 rounded-2xl shadow-lg p-6 w-64 text-center group hover:border-brand-gold hover:shadow-2xl transition-all cursor-pointer relative"
               >
                 <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-1.5 h-6 bg-slate-200 group-hover:bg-brand-gold transition-colors"></div>
                 <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center text-xl shadow-inner text-white group-hover:scale-110 transition-transform" style={{ backgroundColor: dept.color || '#0F172A' }}>
                   {dept.icon ? (
                     <span className="opacity-90">{dept.name[0]}</span> // Replace icon font with initial for now
                   ) : dept.name[0]}
                 </div>
                 
                 <h5 className="font-heading text-lg text-brand-navy line-clamp-1">{dept.name}</h5>
                 {head && (
                   <div className="mt-3 py-2 bg-slate-50 rounded-lg border border-slate-100 group-hover:bg-brand-gold/5 transition-colors">
                     <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit Lead</div>
                     <div className="text-xs font-bold text-slate-700 line-clamp-1">{head.title}</div>
                   </div>
                 )}
                 <div className="mt-4 flex justify-between text-[10px] font-bold text-slate-400 border-t border-slate-100 pt-3">
                   <span className="uppercase tracking-widest text-emerald-600">Active</span>
                   <span className="uppercase">HC: {roles?.reduce((acc, role) => acc + (role.hc || 1), 0) || 0}</span>
                 </div>
               </div>
             );
          })}
        </div>
      </div>
    </div>
  );
}
