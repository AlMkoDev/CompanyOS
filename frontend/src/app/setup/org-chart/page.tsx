"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { WizardHeader } from '@/components/wizard/WizardHeader';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface DepartmentNode {
  id: string;
  name: string;
  color?: string | null;
  description?: string | null;
}

export default function OrgChartStep() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const [departments, setDepartments] = React.useState<DepartmentNode[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadDepartments = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiFetch('/departments', {
          signal: controller.signal,
        });

        if (response.status === 401) {
          logout();
          router.push('/login');
          return;
        }

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || 'Failed to load departments.');
        }

        const payload = await response.json();
        setDepartments(Array.isArray(payload) ? payload : []);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        setError(err instanceof Error ? err.message : 'Failed to load departments.');
      } finally {
        setLoading(false);
      }
    };

    void loadDepartments();

    return () => controller.abort();
  }, [isAuthenticated, logout, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-3xl font-heading text-brand-navy mb-4">Unauthorized Entry</h2>
        <p className="text-slate-500 mb-8 max-w-md">
          You must sign in again before reviewing the company structure.
        </p>
        <button onClick={() => router.push('/login')} className="btn-premium px-8 py-3">
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-10 overflow-hidden">
      <WizardHeader currentStep={4} />

      <div className="max-w-6xl mx-auto h-[70vh] flex flex-col items-center justify-center animate-in zoom-in-95 duration-700">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-heading mb-2">Organizational Schematic</h2>
          <p className="text-slate-500">Visualize the flow of authority and collaboration across configured units.</p>
        </div>

        <div className="relative w-full border border-slate-200 rounded-3xl bg-white/50 p-10 shadow-inner flex flex-col items-center overflow-auto">
          <div className="w-48 p-4 bg-brand-navy text-white text-center rounded-xl shadow-xl mb-16 relative z-10">
            <div className="text-[10px] uppercase opacity-60 mb-1">Board of Directors</div>
            <div className="font-heading text-lg">Super Administrator</div>
          </div>

          {loading ? (
            <div className="py-20 text-slate-500 font-medium">Loading persisted departments...</div>
          ) : error ? (
            <div className="py-16 text-center">
              <h3 className="text-xl font-heading text-brand-navy mb-3">Structure unavailable</h3>
              <p className="text-slate-500 max-w-lg">{error}</p>
            </div>
          ) : departments.length === 0 ? (
            <div className="py-16 text-center">
              <h3 className="text-xl font-heading text-brand-navy mb-3">No departments configured</h3>
              <p className="text-slate-500 max-w-lg">
                Complete department configuration before reviewing the corporate structure.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12 relative w-full">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[4.5rem] w-full h-16 pointer-events-none opacity-20">
                <svg width="100%" height="100%" viewBox="0 0 400 64">
                  <path d="M 200 0 V 32 H 32 V 64 M 200 32 H 368 V 64 M 200 32 V 64" fill="transparent" stroke="#0F172A" strokeWidth="2" />
                </svg>
              </div>

              {departments.map((department) => (
                <OrgNode
                  key={department.id}
                  title={department.name}
                  summary={department.description || 'Configured operational unit'}
                  color={department.color || '#64748b'}
                />
              ))}
            </div>
          )}
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
  summary: string;
  color: string;
}

function OrgNode({ title, summary, color }: OrgNodeProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-md p-6 w-52 text-center group hover:border-brand-gold transition-all cursor-move">
      <div
        className="w-3 h-10 absolute top-0 left-1/2 -translate-x-1/2 rounded-full -mt-5 group-hover:h-12 transition-all"
        style={{ backgroundColor: color }}
      ></div>
      <h5 className="font-heading text-lg mt-2">{title}</h5>
      <div className="text-xs text-slate-500 mt-3 leading-relaxed">{summary}</div>
      <div className="mt-4 flex flex-col gap-1">
        <div className="h-1 bg-slate-100 rounded"></div>
        <div className="h-1 bg-slate-100 rounded w-2/3 mx-auto"></div>
      </div>
    </div>
  );
}
