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
  const { isAuthenticated, user, setAuth, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const bootstrapSession = async () => {
      if (isAuthenticated && user) {
        const setup = user.company?.setup;
        if (
          setup &&
          (setup.is_complete ||
            setup.current_step >= 4 ||
            (setup.completed_steps && setup.completed_steps.length >= 4))
        ) {
          router.push('/dashboard');
        } else {
          router.push('/setup/identity');
        }
        return;
      }

      try {
        const res = await apiFetch('/auth/me');
        if (!res.ok) {
          throw new Error('No active session');
        }

        const data = (await res.json()) as { user: BootstrapUser };
        setAuth(data.user, null);

        const setup = data.user.company?.setup;
        if (
          setup &&
          (setup.is_complete ||
            setup.current_step >= 4 ||
            (setup.completed_steps && setup.completed_steps.length >= 4))
        ) {
          router.push('/dashboard');
        } else {
          router.push('/setup/identity');
        }
      } catch {
        logout();
        router.push('/auth/login');
      }
    };

    bootstrapSession();
  }, [isAuthenticated, user, setAuth, logout, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-pulse text-slate-300 font-heading text-xl tracking-widest">
        INITIALIZING ECOSYSTEM...
      </div>
    </div>
  );
}
