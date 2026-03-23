"use client";

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { WizardHeader } from '@/components/wizard/WizardHeader';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function IdentityStep() {
  const [identity, setIdentity] = useState({ tagline: '', industry: '', description: '', primaryColor: '#0F172A', secondaryColor: '#B8860B' });
  const router = useRouter();
  const { user, setAuth } = useAuthStore();

  useEffect(() => {
    const fetchIdentity = async () => {
      try {
        const res = await apiFetch('/company');
        if (res.ok) {
          const data = await res.json();

          // If setup is already complete but local cache was stale, auto-redirect to dashboard
          if (data.setup && (data.setup.is_complete || data.setup.current_step >= 4)) {
             if (user) {
               setAuth({ ...user, company: data }, null);
             }
             router.push('/dashboard');
             return;
          }

          setIdentity({
            tagline: data.tagline || '',
            industry: data.industry || '',
            description: data.description || '',
            primaryColor: data.brand_colors?.primary || '#0F172A',
            secondaryColor: data.brand_colors?.secondary || '#B8860B'
          });
        }
      } catch (err) {
        console.error('Failed to fetch identity:', err);
        router.push('/auth/login');
      }
    };
    fetchIdentity();
  }, [user, setAuth, router]);

  const handleNext = async () => {
    try {
      await apiFetch('/company', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tagline: identity.tagline,
          industry: identity.industry,
          description: identity.description,
          brand_colors: {
            primary: identity.primaryColor,
            secondary: identity.secondaryColor
          }
        })
      });
      router.push('/setup/departments');
    } catch (err) {
      console.error('Failed to save identity:', err);
      // Still proceed for UX, but log error
      router.push('/setup/departments');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <WizardHeader currentStep={1} />
      
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-10">
        {/* Form Area */}
        <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-left duration-700">
          <div>
            <h2 className="text-3xl font-heading mb-2">Establish Identity</h2>
            <p className="text-slate-500">Define the visual and strategic soul of your organization.</p>
          </div>

          <div className="glass-card p-8 rounded-2xl space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Company Tagline</label>
              <input 
                type="text" 
                placeholder="e.g. Scaling Innovation Globally" 
                className="input-premium"
                onChange={(e) => setIdentity({ ...identity, tagline: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Primary Brand Color</label>
                <div className="flex gap-4 items-center">
                  <input type="color" className="w-12 h-12 rounded cursor-pointer" value={identity.primaryColor} onChange={(e) => setIdentity({ ...identity, primaryColor: e.target.value })} />
                  <span className="text-slate-500 font-mono uppercase">{identity.primaryColor}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Secondary Accent</label>
                <div className="flex gap-4 items-center">
                  <input type="color" className="w-12 h-12 rounded cursor-pointer" value={identity.secondaryColor} onChange={(e) => setIdentity({ ...identity, secondaryColor: e.target.value })} />
                  <span className="text-slate-500 font-mono uppercase">{identity.secondaryColor}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Company Description / Mission</label>
              <textarea 
                rows={4} 
                className="input-premium resize-none" 
                placeholder="Briefly describe what your company does..."
                onChange={(e) => setIdentity({ ...identity, description: e.target.value })}
              ></textarea>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button className="px-6 py-2 text-slate-400 font-medium hover:text-slate-600">Save Draft</button>
              <button onClick={handleNext} className="btn-premium">Confirm & Continue</button>
            </div>
          </div>
        </div>

        {/* Preview Sidebar */}
        <aside className="w-full md:w-80 space-y-6 sticky top-10 self-start">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Dashboard Preview</h3>
            </div>
            <div className="p-6">
              <div 
                className="w-full h-32 rounded-xl mb-4 flex items-center justify-center text-white text-center p-4 transition-all duration-500"
                style={{ backgroundColor: identity.primaryColor }}
              >
                <div>
                  <div className="text-sm font-bold mb-1 opacity-80">COMPANY NAME</div>
                  <div className="text-xs font-medium italic opacity-60">&quot;{identity.tagline || 'Your Tagline here'}&quot;</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-100 rounded w-full"></div>
                <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100"></div>
                  <div className="w-8 h-8 rounded-lg bg-slate-100"></div>
                  <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: identity.secondaryColor }}></div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
