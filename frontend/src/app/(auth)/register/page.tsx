"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { apiFetch } from '@/lib/api';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', companyName: '', firstName: '', lastName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error('Failed to register account');
      }
      
      // Auto-login after register
      const loginRes = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      if (!loginRes.ok) {
        throw new Error('Registration succeeded, but automatic sign-in failed');
      }

      const loginData = await loginRes.json();
      
      setAuth(loginData.user);
      router.push('/setup/identity'); // Step 1 of Wizard
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="glass-card w-full max-w-md p-10 rounded-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-heading mb-2">Create your CompanyOS</h1>
          <p className="text-slate-500">Digital Transformation starts here.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            placeholder="Company Name" 
            className="input-premium" 
            required
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            suppressHydrationWarning
          />
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="First Name" 
              className="input-premium" 
              required
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              suppressHydrationWarning
            />
            <input 
              type="text" 
              placeholder="Last Name" 
              className="input-premium" 
              required
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              suppressHydrationWarning
            />
          </div>
          <input 
            type="email" 
            placeholder="Admin Email" 
            className="input-premium" 
            required
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            suppressHydrationWarning
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="input-premium" 
            required
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            suppressHydrationWarning
          />

          <button type="submit" disabled={loading} className="btn-premium w-full mt-4" suppressHydrationWarning>
            {loading ? 'Initializing...' : 'Construct Company'}
          </button>
        </form>
      </div>
    </div>
  );
}
