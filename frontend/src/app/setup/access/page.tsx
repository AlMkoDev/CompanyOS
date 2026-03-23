"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { WizardHeader } from '@/components/wizard/WizardHeader';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { apiFetch } from '@/lib/api';

interface MfaSetupResponse {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export default function AccessStep() {
  const router = useRouter();

  const { user, setAuth } = useAuthStore();
  const [mfaSetup, setMfaSetup] = useState<MfaSetupResponse | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaSuccess, setMfaSuccess] = useState<string | null>(null);

  const handleFinish = async () => {
    try {
      await apiFetch('/company/setup', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ step: 5, isComplete: true })
      });

      // Update local store so immediate re-renders know it's complete
      if (user && user.company) {
        setAuth({
          ...user,
          company: {
            ...user.company,
            setup: { ...(user.company.setup || {}), is_complete: true, current_step: 5 }
          }
        }, null);
      }
      
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to complete setup:', err);
      // fallback
      router.push('/dashboard');
    }
  };

  const handleStartMfaSetup = async () => {
    if (!user) {
      setMfaError('You must be logged in to configure MFA.');
      return;
    }

    setMfaLoading(true);
    setMfaError(null);
    setMfaSuccess(null);

    try {
      const res = await apiFetch('/auth/mfa/setup', {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to start MFA setup');
      }

      const data = (await res.json()) as MfaSetupResponse;
      setMfaSetup(data);
    } catch (err: unknown) {
      setMfaError(err instanceof Error ? err.message : 'Failed to start MFA setup');
      console.error(err);
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    if (!user) {
      setMfaError('You must be logged in to verify MFA.');
      return;
    }

    setMfaLoading(true);
    setMfaError(null);
    setMfaSuccess(null);

    try {
      const res = await apiFetch('/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: mfaCode }),
      });

      if (!res.ok) {
        throw new Error('Invalid authenticator code');
      }

      if (user) {
        setAuth({ ...user, mfaEnabled: true }, null);
      }

      setMfaSuccess('Multi-factor authentication is now active for this account.');
      setMfaSetup(null);
      setMfaCode('');
    } catch (err: unknown) {
      setMfaError(err instanceof Error ? err.message : 'Failed to verify MFA');
      console.error(err);
    } finally {
      setMfaLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <WizardHeader currentStep={5} />

      <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right duration-700">
        <div className="text-center">
          <h2 className="text-3xl font-heading mb-2">Governance Framework</h2>
          <p className="text-slate-500">Lock in your multi-layered security and invite your foundational team.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* RBAC Summary */}
          <div className="glass-card p-8 rounded-2xl bg-brand-navy text-white">
            <h3 className="font-heading text-2xl mb-6">Permission Matrix</h3>
            <div className="space-y-4 text-sm opacity-80">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span>Super Admin</span>
                <span className="text-brand-gold">Full Access</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span>Dept Admin</span>
                <span>Self-contained</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span>Manager</span>
                <span>Operations only</span>
              </div>
              <div className="flex justify-between text-xs pt-4 opacity-50">
               * RBAC patterns inherited from CompanyOS spec append-A
              </div>
            </div>
          </div>

          {/* MFA Panel */}
          <div className="glass-card p-8 rounded-2xl bg-white border-slate-100">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-heading text-2xl mb-2">Authenticator MFA</h3>
                <p className="text-slate-500 text-sm">
                  Add a second factor to the owner account before launch.
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                  user?.mfaEnabled
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {user?.mfaEnabled ? 'Enabled' : 'Optional'}
              </span>
            </div>

            {mfaError && (
              <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {mfaError}
              </div>
            )}

            {mfaSuccess && (
              <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {mfaSuccess}
              </div>
            )}

            <div className="space-y-4">
              {!user?.mfaEnabled && !mfaSetup && (
                <button
                  onClick={handleStartMfaSetup}
                  disabled={mfaLoading}
                  className="btn-premium w-full"
                >
                  {mfaLoading ? 'Preparing Authenticator Setup...' : 'Set Up Authenticator App'}
                </button>
              )}

              {user?.mfaEnabled && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                  <p className="text-sm font-semibold text-emerald-700">
                    Authenticator MFA is active for {user.email}.
                  </p>
                </div>
              )}

              {mfaSetup && (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex justify-center">
                    <Image
                      src={mfaSetup.qrCodeDataUrl}
                      alt="QR code for MFA setup"
                      width={192}
                      height={192}
                      unoptimized
                      className="h-48 w-48 rounded-2xl border border-slate-200 bg-white p-3"
                    />
                  </div>

                  <div className="rounded-xl bg-white p-4 text-xs text-slate-500 border border-slate-200">
                    <div className="font-bold uppercase tracking-widest text-slate-400 mb-2">Manual Key</div>
                    <div className="break-all font-mono text-sm text-slate-700">{mfaSetup.secret}</div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="123456"
                      className="input-premium tracking-[0.3em] text-center"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\s+/g, ''))}
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={handleVerifyMfa}
                      disabled={mfaLoading || mfaCode.trim().length === 0}
                      className="btn-premium flex-1"
                    >
                      {mfaLoading ? 'Verifying...' : 'Enable MFA'}
                    </button>
                    <button
                      onClick={() => {
                        setMfaSetup(null);
                        setMfaCode('');
                        setMfaError(null);
                      }}
                      disabled={mfaLoading}
                      className="flex-1 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-500 hover:bg-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card p-8 rounded-2xl bg-white border-slate-100">
          <h3 className="font-heading text-2xl mb-4">Initial Team</h3>
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl text-center border-2 border-dashed border-slate-200">
              <p className="text-slate-400 text-sm mb-3">Invite colleagues to their departments</p>
              <button className="text-brand-navy font-bold text-sm hover:underline">+ Send Invites</button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-brand-navy text-white flex items-center justify-center text-xs">JD</div>
              <div className="flex-1">
                <div className="text-sm font-bold">John Doe</div>
                <div className="text-[10px] text-slate-400">Owner (Admin)</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-brand-gold p-8 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="relative z-10">
            <h3 className="text-2xl font-heading">Finalize Construction</h3>
            <p className="text-slate-500">Your virtual company is structurally sound and ready for operations.</p>
          </div>
          <button 
            onClick={handleFinish}
            className="btn-gold relative z-10 scale-125 px-10 py-4 shadow-2xl hover:scale-110 active:scale-95 transition-all text-xl"
          >
            Launch System →
          </button>

          {/* Background Shimmer Effect */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-gold/5 -skew-x-12 translate-x-1/2"></div>
        </div>

        <div className="flex justify-start items-center">
          <button onClick={() => router.push('/setup/org-chart')} className="px-6 py-2 text-slate-400 font-medium hover:text-slate-600 transition-colors">← Back to Org Chart</button>
        </div>
      </div>
    </div>
  );
}
