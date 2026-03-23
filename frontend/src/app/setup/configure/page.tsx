"use client";

import React from 'react';
import { WizardHeader } from '@/components/wizard/WizardHeader';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { apiFetch } from '@/lib/api';
import { departmentQuickStartTemplates } from '@/lib/setup/departmentTemplates';

interface DepartmentTemplate {
  name: string;
  kpis: string[];
  color: string;
}

const templates: Record<string, DepartmentTemplate> = {
  fin: { name: 'Finance', kpis: ['Revenue', 'Expenses', 'Cash Flow'], color: '#B8860B' },
  hr: { name: 'Human Resources', kpis: ['Headcount', 'Retention', 'Time to Hire'], color: '#3B82F6' },
  ops: { name: 'Operations', kpis: ['Efficiency', 'Downtime', 'Throughput'], color: '#10B981' },
  mkt: { name: 'Marketing', kpis: ['Leads', 'Conversion', 'Campaign ROI'], color: '#8B5CF6' },
  sls: { name: 'Sales & CRM', kpis: ['Leads', 'Conversion', 'Campaign ROI'], color: '#EF4444' },
  leg: { name: 'Legal', kpis: ['Leads', 'Conversion', 'Campaign ROI'], color: '#64748b' },
  it: { name: 'IT & Systems', kpis: ['Leads', 'Conversion', 'Campaign ROI'], color: '#6366f1' },
  stg: { name: 'Strategy & OKRs', kpis: ['Leads', 'Conversion', 'Campaign ROI'], color: '#06b6d4' },
  adm: { name: 'Administration', kpis: ['Leads', 'Conversion', 'Campaign ROI'], color: '#14b8a6' },
  cus: { name: 'Custom Dept', kpis: ['Leads', 'Conversion', 'Campaign ROI'], color: '#94a3b8' },
};

export default function ConfigureHub() {
  const { setup, user, setAuth, markDeptComplete } = useAuthStore();
  const selectedDepts = setup.selectedDepartments.length > 0 
    ? setup.selectedDepartments 
    : ['fin', 'hr', 'ops']; // Fallback for dev convenience
  
  const completed = setup.completedDepartments;
  const templateSelections = setup.templateSelections;
  const router = useRouter();
  const [autoApplying, setAutoApplying] = React.useState(false);

  const handleConfigure = (id: string) => {
    router.push(`/setup/configure/${id}`);
  };

  const selectedQuickTemplateDepts = selectedDepts.filter((id) => templateSelections[id] && departmentQuickStartTemplates[id]);
  const allSelectedUseQuickTemplates =
    selectedDepts.length > 0 && selectedQuickTemplateDepts.length === selectedDepts.length;

  const applyQuickTemplatesAndFinish = async () => {
    if (!allSelectedUseQuickTemplates) {
      return;
    }

    setAutoApplying(true);

    try {
      for (const id of selectedDepts) {
        const template = departmentQuickStartTemplates[id];

        const response = await apiFetch(`/departments/${id}/config`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template_key: id,
            name: template.name,
            description: template.description,
            color: template.color,
            mandate: template.mandate,
            core_responsibilities: template.coreResponsibilities,
            deliverables: template.deliverables,
            roles: template.roles,
            budget: template.budget,
          }),
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Failed to apply ${template.name} template.`);
        }

        markDeptComplete(id);
      }

      const companySetupResponse = await apiFetch('/company/setup', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          step: 5,
          isComplete: true,
          config: {
            quickTemplatesApplied: selectedDepts,
          },
        }),
      });

      if (!companySetupResponse.ok) {
        const message = await companySetupResponse.text();
        throw new Error(message || 'Failed to finalize company setup.');
      }

      if (user && user.company) {
        setAuth({
          ...user,
          company: {
            ...user.company,
            setup: {
              ...(user.company.setup || {}),
              is_complete: true,
              current_step: 5,
            },
          },
        });
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to auto-apply quick templates:', error);
      alert(
        error instanceof Error && error.message
          ? error.message
          : 'Quick templates could not be applied automatically. Please review at least one department manually.',
      );
    } finally {
      setAutoApplying(false);
    }
  };

  const handleNext = () => {
    if (allSelectedUseQuickTemplates) {
      void applyQuickTemplatesAndFinish();
      return;
    }

    if (completed.length < selectedDepts.length) {
      alert('Please configure all selected departments first.');
      return;
    }
    router.push('/setup/org-chart');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <WizardHeader currentStep={3} />

      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="text-center">
          <h2 className="text-3xl font-heading mb-2">Configure Departments</h2>
          <p className="text-slate-500">Fine-tune each unit with mandates, KPIs, and operational workflows.</p>
        </div>

        <div className="space-y-4">
          {selectedDepts.map((id) => {
            const isDone = completed.includes(id);
            const template = templates[id] || { name: 'Custom', color: '#64748b' };
            const hasQuickTemplate = Boolean(templateSelections[id] && departmentQuickStartTemplates[id]);
            
            return (
              <div 
                key={id}
                className={`glass-card p-6 rounded-2xl flex items-center justify-between transition-all ${
                  isDone ? 'opacity-60 border-green-200' : 'border-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl shadow-inner" style={{ backgroundColor: template.color }}>
                    {template.name[0]}
                  </div>
                  <div>
                    <h4 className="font-heading text-xl">{template.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">
                      {isDone ? '✅ Implementation Finalized' : '⚙️ Configuration Pending'}
                    </p>
                    {hasQuickTemplate && (
                      <p className="text-[11px] text-brand-gold mt-2 font-semibold uppercase tracking-wide">
                        Quick template ready
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {!isDone && (
                    <button 
                      onClick={() => handleConfigure(id)}
                      className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-black transition-all"
                    >
                      {hasQuickTemplate ? 'Review Template' : 'Begin Wizard'}
                    </button>
                  )}
                  {isDone && (
                    <button 
                      onClick={() => handleConfigure(id)}
                      className="px-4 py-2 text-slate-400 text-sm font-medium hover:text-brand-navy underline"
                    >
                      Edit Config
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center pt-10 border-t border-slate-200">
          <button onClick={() => router.push('/setup/departments')} className="px-6 py-2 text-slate-400 font-medium hover:text-slate-600 transition-colors">← Back to Selection</button>
          <button 
            onClick={handleNext} 
            disabled={autoApplying}
            className="btn-premium disabled:grayscale disabled:opacity-30"
          >
            {autoApplying
              ? 'Applying Templates...'
              : allSelectedUseQuickTemplates
              ? 'Launch Dashboard With Templates →'
              : 'Review Corporate Structure →'}
          </button>
        </div>
      </div>
    </div>
  );
}
