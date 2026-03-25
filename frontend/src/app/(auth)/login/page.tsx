"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { apiFetch } from '@/lib/api';

interface CompanySetup {
  is_complete?: boolean;
  current_step?: number;
  completed_steps?: string[];
}

interface LoginUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId: string;
  roles: string[];
  mfaEnabled?: boolean;
  company?: {
    setup?: CompanySetup;
    [key: string]: unknown;
  };
}

interface AuthSuccessResponse {
  user: LoginUser;
  access_token?: string;
}

interface MfaChallengeResponse {
  mfaRequired: true;
  mfaToken: string;
  user: LoginUser;
}

interface MfaSetupResponse {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

interface MfaSetupRequiredResponse {
  mfaSetupRequired: true;
  mfaSetupToken: string;
  user: LoginUser;
}

async function extractErrorMessage(res: Response, fallback: string) {
  try {
    const payload = await res.json();
    if (payload && typeof payload.message === 'string') {
      return payload.message;
    }
    if (payload && Array.isArray(payload.message) && payload.message.length > 0) {
      return payload.message.join(', ');
    }
  } catch {
    // Fall back to the default when the response is not JSON.
  }

  return fallback;
}

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [mfaCode, setMfaCode] = useState('');
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaSetupToken, setMfaSetupToken] = useState<string | null>(null);
  const [mfaSetup, setMfaSetup] = useState<MfaSetupResponse | null>(null);
  const [pendingUser, setPendingUser] = useState<LoginUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const completeLogin = (data: AuthSuccessResponse) => {
    setAuth(data.user, data.access_token ?? null);
    router.push('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error(await extractErrorMessage(res, 'Invalid credentials'));
      }

      const data = (await res.json()) as AuthSuccessResponse | MfaChallengeResponse | MfaSetupRequiredResponse;

      if ('mfaRequired' in data && data.mfaRequired) {
        setMfaToken(data.mfaToken);
        setPendingUser(data.user);
        setMfaCode('');
        return;
      }

      if ('mfaSetupRequired' in data && data.mfaSetupRequired) {
        setPendingUser(data.user);
        setMfaToken(null);
        setMfaSetupToken(data.mfaSetupToken);
        setMfaCode('');

        const setupRes = await apiFetch('/auth/mfa/setup-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: data.mfaSetupToken }),
        });

        if (!setupRes.ok) {
          throw new Error(
            await extractErrorMessage(
              setupRes,
              'MFA is required for this account, but setup could not be started.',
            ),
          );
        }

        const setupData = (await setupRes.json()) as MfaSetupResponse;
        setMfaSetup(setupData);
        return;
      }

      completeLogin(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to login');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mfaToken) {
      setError('Your MFA session expired. Please sign in again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch('/auth/mfa/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: mfaToken, code: mfaCode }),
      });

      if (!res.ok) {
        throw new Error(await extractErrorMessage(res, 'Invalid MFA code'));
      }

      const data = (await res.json()) as AuthSuccessResponse;
      completeLogin(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to verify MFA');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mfaSetupToken) {
      setError('Your MFA setup session expired. Please sign in again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch('/auth/mfa/setup-login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: mfaSetupToken, code: mfaCode }),
      });

      if (!res.ok) {
        throw new Error(await extractErrorMessage(res, 'Invalid MFA code'));
      }

      const data = (await res.json()) as AuthSuccessResponse;
      completeLogin(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete MFA setup');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetMfaStep = () => {
    setMfaToken(null);
    setMfaSetupToken(null);
    setMfaSetup(null);
    setPendingUser(null);
    setMfaCode('');
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="glass-card w-full max-w-md p-10 rounded-2xl shadow-xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-heading mb-2">
            {mfaSetupToken ? 'Secure Your Account' : mfaToken ? 'Verify Your Access' : 'Welcome Back'}
          </h1>
          <p className="text-slate-500">
            {mfaSetupToken
              ? `MFA is required for ${pendingUser?.email ?? 'this account'} before access is granted.`
              : mfaToken
              ? `Enter the authenticator code for ${pendingUser?.email ?? 'your account'}.`
              : 'Access your CompanyOS ecosystem.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {mfaSetupToken ? (
          <form onSubmit={handleMfaSetupSubmit} className="space-y-6">
            {mfaSetup && (
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  This account has a privileged role and must enable MFA before signing in.
                </div>

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
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                Authenticator Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                className="input-premium tracking-[0.3em] text-center"
                required
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\s+/g, ''))}
                suppressHydrationWarning
              />
            </div>

            <button
              type="submit"
              disabled={loading || !mfaSetup}
              className="btn-premium w-full py-4 text-lg mt-4 shadow-lg shadow-brand-gold/20"
              suppressHydrationWarning
            >
              {loading ? 'Verifying...' : 'Enable MFA And Sign In'}
            </button>

            <button
              type="button"
              onClick={resetMfaStep}
              className="w-full text-sm text-slate-500 hover:text-slate-700 transition-colors"
              suppressHydrationWarning
            >
              Use a different account
            </button>
          </form>
        ) : mfaToken ? (
          <form onSubmit={handleMfaSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                Authenticator Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                className="input-premium tracking-[0.3em] text-center"
                required
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\s+/g, ''))}
                suppressHydrationWarning
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-premium w-full py-4 text-lg mt-4 shadow-lg shadow-brand-gold/20"
              suppressHydrationWarning
            >
              {loading ? 'Verifying...' : 'Complete Sign In'}
            </button>

            <button
              type="button"
              onClick={resetMfaStep}
              className="w-full text-sm text-slate-500 hover:text-slate-700 transition-colors"
              suppressHydrationWarning
            >
              Use a different account
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
              <input
                type="email"
                placeholder="admin@company.com"
                className="input-premium"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                suppressHydrationWarning
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="input-premium"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                suppressHydrationWarning
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-premium w-full py-4 text-lg mt-4 shadow-lg shadow-brand-gold/20"
              suppressHydrationWarning
            >
              {loading ? 'Authenticating...' : 'Enter Ecosystem'}
            </button>
          </form>
        )}

        <div className="mt-10 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              Don&apos;t have an operating system?{' '}
            <button 
              onClick={() => router.push('/register')}
              className="text-brand-gold font-bold hover:underline"
              suppressHydrationWarning
            >
              Construct One
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
