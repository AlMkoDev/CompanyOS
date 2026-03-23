import React from 'react';
import { 
  SupplyChainRole, 
  SupplyChainPermission,
  useSupplyChainPermissions,
  hasSupplyChainRole,
  hasAllSupplyChainPermissions,
  hasAnySupplyChainPermission
} from '@/hooks/useSupplyChainPermissions';
import { Lock, AlertTriangle } from 'lucide-react';

interface PermissionConfig {
  requiredRoles?: SupplyChainRole[];
  requiredPermissions?: SupplyChainPermission[];
  requireAllRoles?: boolean;
  requireAllPermissions?: boolean;
  fallbackComponent?: React.ComponentType;
  redirectTo?: string;
}

export function withSupplyChainPermissions<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  config: PermissionConfig
) {
  const {
    requiredRoles = [],
    requiredPermissions = [],
    requireAllRoles = false,
    requireAllPermissions = true,
    fallbackComponent: FallbackComponent,
    redirectTo,
  } = config;

  return function PermissionWrappedComponent(props: P) {
    const { roles, permissions, isLoading, error } = useSupplyChainPermissions();

    // Show loading state
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4"></div>
            <p className="text-slate-600">Checking permissions...</p>
          </div>
        </div>
      );
    }

    // Check role-based access
    let hasRequiredRoles = true;
    if (requiredRoles.length > 0) {
      if (requireAllRoles) {
        hasRequiredRoles = requiredRoles.every(role => hasSupplyChainRole(roles, role));
      } else {
        hasRequiredRoles = requiredRoles.some(role => hasSupplyChainRole(roles, role));
      }
    }

    // Check permission-based access
    let hasRequiredPermissions = true;
    if (requiredPermissions.length > 0) {
      if (requireAllPermissions) {
        hasRequiredPermissions = hasAllSupplyChainPermissions(permissions, requiredPermissions);
      } else {
        hasRequiredPermissions = hasAnySupplyChainPermission(permissions, requiredPermissions);
      }
    }

    // Determine if access should be granted
    const hasAccess = hasRequiredRoles && hasRequiredPermissions;

    if (hasAccess) {
      return <WrappedComponent {...props} />;
    }

    // Show custom fallback component
    if (FallbackComponent) {
      return <FallbackComponent />;
    }

    // Show default unauthorized page
    return <DefaultUnauthorizedPage error={error} redirectTo={redirectTo} />;
  };
}

interface DefaultUnauthorizedPageProps {
  error?: string | null;
  redirectTo?: string;
}

function DefaultUnauthorizedPage({ error, redirectTo }: DefaultUnauthorizedPageProps) {
  const handleGoBack = () => {
    if (redirectTo) {
      window.location.href = redirectTo;
    } else {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <Lock className="mx-auto h-16 w-16 text-slate-400 mb-6" />
          
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Access Denied
          </h1>
          
          <p className="text-slate-600 mb-6">
            You don&apos;t have the required permissions to access this page.
          </p>

          {error && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleGoBack}
              className="w-full px-4 py-2 bg-brand-gold text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Go Back
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
