"use client";

import React, { useState } from 'react';
import { WizardHeader } from '@/components/wizard/WizardHeader';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { apiFetch } from '@/lib/api';
import { departmentQuickStartTemplates } from '@/lib/setup/departmentTemplates';

const templates = [
  { id: 'fin', name: 'Finance', icon: 'Wallet', desc: 'Accounting, Budgeting & P&L', color: 'bg-amber-600' },
  { id: 'hr', name: 'Human Resources', icon: 'Users', desc: 'Talent, Payroll & Culture', color: 'bg-blue-600' },
  { id: 'ops', name: 'Operations', icon: 'Settings', desc: 'Processes & Supply Chain', color: 'bg-emerald-600' },
  { id: 'mkt', name: 'Marketing', icon: 'Megaphone', desc: 'Brand & Content Calendar', color: 'bg-purple-600' },
  { id: 'sls', name: 'Sales & CRM', icon: 'TrendingUp', desc: 'Leads & Deal Pipelines', color: 'bg-rose-600' },
  { id: 'leg', name: 'Legal', icon: 'Shield', desc: 'Contracts & Compliance', color: 'bg-slate-700' },
  { id: 'it', name: 'IT & Systems', icon: 'Cpu', desc: 'Assets & Technical Debt', color: 'bg-indigo-600' },
  { id: 'stg', name: 'Strategy & OKRs', icon: 'Target', desc: 'Roadmaps & Goal Tracking', color: 'bg-cyan-600' },
  { id: 'adm', name: 'Administration', icon: 'Clipboard', desc: 'Records & Procurement', color: 'bg-teal-600' },
  { id: 'cus', name: 'Custom Dept', icon: 'Plus', desc: 'Build from the ground up', color: 'bg-slate-400' },
];

export default function DepartmentsStep() {
  const { setup, setDepartments, setTemplatePreference, logout } = useAuthStore();
  const [selected, setSelected] = useState<string[]>(setup.selectedDepartments || []);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter(i => i !== id) : [...selected, id];
    setSelected(next);
    setDepartments(next);

    if (!selected.includes(id) && id !== 'cus' && setup.templateSelections[id] === undefined) {
      setTemplatePreference(id, true);
    }
  };

  const toggleTemplate = (id: string) => {
    setTemplatePreference(id, !setup.templateSelections[id]);
  };

  const handleNext = async () => {
    if (selected.length === 0) return alert('Please select at least one department.');
    setDepartments(selected);
    setSaving(true);

    const quickTemplateIds = selected.filter((id) => setup.templateSelections[id] && departmentQuickStartTemplates[id]);

    try {
      const response = await apiFetch('/company/setup', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          step: 2,
          isComplete: false,
          config: {
            selectedDepartments: selected,
            quickTemplatesApplied: quickTemplateIds,
            templateSelections: Object.fromEntries(
              selected.map((id) => [id, Boolean(setup.templateSelections[id])]),
            ),
          },
        }),
      });

      if (response.status === 401) {
        logout();
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to save department selection.');
      }

      router.push('/setup/configure');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save department selection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <WizardHeader currentStep={2} />

      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <h2 className="text-3xl font-heading mb-2">Assemble Departments</h2>
          <p className="text-slate-500">Select the functional units that will make up your organization.</p>
          <p className="text-sm text-slate-400 mt-2">
            Standard departments can be preloaded with built-in templates for a faster setup.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-brand-navy/5 px-4 py-1.5 rounded-full text-brand-navy font-bold text-sm">
            <span className="w-5 h-5 rounded-full bg-brand-navy text-white flex items-center justify-center text-[10px]">{selected.length}</span>
            Departments Selected
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((dept) => (
            <div 
              key={dept.id}
              onClick={() => toggle(dept.id)}
              className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
                selected.includes(dept.id) 
                  ? 'bg-white border-2 border-brand-gold shadow-md ring-4 ring-brand-gold/10' 
                  : 'bg-white border border-slate-100 hover:border-slate-300 shadow-sm opacity-80'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl ${dept.color} text-white mb-4 flex items-center justify-center text-xl shadow-lg`}>
                {dept.name[0]}
              </div>
              <h3 className="font-heading text-lg mb-1">{dept.name}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{dept.desc}</p>

              {dept.id !== 'cus' && departmentQuickStartTemplates[dept.id] && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!selected.includes(dept.id)) {
                        toggle(dept.id);
                        return;
                      }
                      toggleTemplate(dept.id);
                    }}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors ${
                      setup.templateSelections[dept.id]
                        ? 'bg-brand-gold/15 text-brand-gold'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <span className="text-sm">{setup.templateSelections[dept.id] ? '✓' : '+'}</span>
                    {setup.templateSelections[dept.id] ? 'Quick Template On' : 'Use Quick Template'}
                  </button>
                </div>
              )}
              
              {selected.includes(dept.id) && (
                <div className="absolute top-4 right-4 text-brand-gold">
                  <span className="text-2xl font-bold">✓</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-10 border-t border-slate-200">
          <button onClick={() => router.back()} className="px-6 py-2 text-slate-400 font-medium hover:text-slate-600 transition-colors">← Back to Identity</button>
          <button 
            onClick={handleNext} 
            disabled={selected.length === 0 || saving} 
            className="btn-premium disabled:grayscale disabled:opacity-30"
          >
            {saving ? 'Saving Selection...' : `Configure Selected Departments (${selected.length}) →`}
          </button>
        </div>
      </div>
    </div>
  );
}
