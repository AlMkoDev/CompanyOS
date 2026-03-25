import React from 'react';
import { useRouter } from 'next/navigation';
import { UnauthorizedEntry } from '@/components/common/AccessState';
import { AppModule, canAccessModule } from '@/lib/permissions';
import { useAuthStore } from '@/store/authStore';

interface AppPermissionGuardProps {
  module: AppModule;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AppPermissionGuard({ module, children, fallback }: AppPermissionGuardProps) {
  const router = useRouter();
  const { user } = useAuthStore();

  if (canAccessModule(user, module)) {
    return <>{children}</>;
  }

  return (
    <>
      {fallback || (
        <UnauthorizedEntry
          message={`You do not have permission to access the ${module.toUpperCase()} workspace.`}
          actionLabel="Return to Dashboard"
          onAction={() => router.push('/dashboard')}
        />
      )}
    </>
  );
}
