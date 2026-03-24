"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { apiFetch } from '@/lib/api';

interface BootstrapUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId: string;
  roles: string[];
  mfaEnabled?: boolean;
  company?: {
    setup?: {
      is_complete?: boolean;
      current_step?: number;
      completed_steps?: string[];
    };
    [key: string]: unknown;
  };
}

export default function RootPage() {
  const { setAuth, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const bootstrapSession = async () => {
      try {
        const res = await apiFetch('/auth/me');
        if (!res.ok) {
          throw new Error('No active session');
        }

        const data = (await res.json()) as { user: BootstrapUser };
        setAuth(data.user);
        router.push('/dashboard');
      } catch {
        logout();
        router.push('/login');
      }
    };

    bootstrapSession();
  }, [setAuth, logout, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-pulse text-slate-300 font-heading text-xl tracking-widest">
        INITIALIZING ECOSYSTEM...
      </div>
    </div>
  );
}
