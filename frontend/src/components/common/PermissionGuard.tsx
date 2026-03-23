import React from 'react';
import { 
  useSupplyChainPermissions, 
  SupplyChainRole, 
  SupplyChainPermission,
  hasSupplyChainRole,
  hasSupplyChainPermission,
  hasAnySupplyChainPermission,
  hasAllSupplyChainPermissions
} from '@/hooks/useSupplyChainPermissions';
import { AlertTriangle, Lock, Eye, EyeOff } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  // Role-based access
  requiredRoles?: SupplyChainRole[];
  requireAllRoles?: boolean;
  // Permission-based access
  requiredPermissions?: SupplyChainPermission[];
  requireAllPermissions?: boolean;
  // Fallback behavior
  fallback?: React.ReactNode;
  showFallback?: boolean;
  // Loading behavior
  showLoadingState?: boolean;
  // Error behavior
  showErrorState?: boolean;
}

export function PermissionGuard({
  children,
  requiredRoles = [],
  requireAllRoles = false,
  requiredPermissions = [],
  requireAllPermissions = true,
  fallback,
  showFallback = true,
  showLoadingState = true,
  showErrorState = true,
}: PermissionGuardProps) {
  const { roles, permissions, isLoading, error } = useSupplyChainPermissions();

  // Show loading state
  if (isLoading && showLoadingState) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-gold"></div>
        <span className="ml-2 text-slate-600">Checking permissions...</span>
      </div>
    );
  }

  // Show error state
  if (error && showErrorState) {
    return (
      <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <AlertTriangle className="text-yellow-600" size={20} />
        <span className="text-yellow-800">Permission check failed. Using fallback permissions.</span>
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
    return <>{children}</>;
  }

  // Show fallback or default unauthorized message
  if (showFallback) {
    return fallback || <UnauthorizedFallback />;
  }

  return null;
}

// Specialized permission guards for common use cases
interface ActionGuardProps {
  children: React.ReactNode;
  permission: SupplyChainPermission;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export function ActionGuard({ children, permission, fallback, showFallback = false }: ActionGuardProps) {
  return (
    <PermissionGuard
      requiredPermissions={[permission]}
      fallback={fallback}
      showFallback={showFallback}
      showLoadingState={false}
      showErrorState={false}
    >
      {children}
    </PermissionGuard>
  );
}

interface RoleGuardProps {
  children: React.ReactNode;
  role: SupplyChainRole;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export function RoleGuard({ children, role, fallback, showFallback = false }: RoleGuardProps) {
  return (
    <PermissionGuard
      requiredRoles={[role]}
      fallback={fallback}
      showFallback={showFallback}
      showLoadingState={false}
      showErrorState={false}
    >
      {children}
    </PermissionGuard>
  );
}

// Button wrapper that disables/hides based on permissions
interface PermissionButtonProps {
  children: React.ReactNode;
  permission?: SupplyChainPermission;
  role?: SupplyChainRole;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  hideWhenNoAccess?: boolean;
  showTooltip?: boolean;
  tooltipText?: string;
}

export function PermissionButton({
  children,
  permission,
  role,
  onClick,
  disabled = false,
  className = '',
  hideWhenNoAccess = false,
  showTooltip = true,
  tooltipText,
}: PermissionButtonProps) {
  const { roles, permissions } = useSupplyChainPermissions();

  const hasAccess = 
    (!permission || hasSupplyChainPermission(permissions, permission)) &&
    (!role || hasSupplyChainRole(roles, role));

  if (!hasAccess && hideWhenNoAccess) {
    return null;
  }

  const isDisabled = disabled || !hasAccess;
  const buttonClassName = `${className} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  const button = (
    <button
      onClick={hasAccess ? onClick : undefined}
      disabled={isDisabled}
      className={buttonClassName}
      title={!hasAccess && showTooltip ? (tooltipText || 'Insufficient permissions') : undefined}
    >
      {!hasAccess && showTooltip && (
        <Lock size={16} className="inline mr-1" />
      )}
      {children}
    </button>
  );

  return button;
}

// Navigation guard for routes
interface RouteGuardProps {
  children: React.ReactNode;
  requiredPermissions?: SupplyChainPermission[];
  requiredRoles?: SupplyChainRole[];
}

export function RouteGuard({
  children,
  requiredPermissions = [],
  requiredRoles = [],
}: RouteGuardProps) {
  const { roles, permissions, isLoading } = useSupplyChainPermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold"></div>
      </div>
    );
  }

  const hasRequiredRoles = requiredRoles.length === 0 || 
    requiredRoles.some(role => hasSupplyChainRole(roles, role));
  
  const hasRequiredPermissions = requiredPermissions.length === 0 || 
    hasAllSupplyChainPermissions(permissions, requiredPermissions);

  if (hasRequiredRoles && hasRequiredPermissions) {
    return <>{children}</>;
  }

  // In a real app, you'd use router.push(redirectTo)
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Lock className="mx-auto h-16 w-16 text-slate-400 mb-4" />
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-600 mb-4">
          You don&apos;t have permission to access this page.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-brand-gold text-white rounded-lg hover:bg-yellow-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

// Conditional rendering based on permissions
interface ConditionalRenderProps {
  children: React.ReactNode;
  permission?: SupplyChainPermission;
  role?: SupplyChainRole;
  permissions?: SupplyChainPermission[];
  roles?: SupplyChainRole[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export function ConditionalRender({
  children,
  permission,
  role,
  permissions = [],
  roles = [],
  requireAll = true,
  fallback = null,
}: ConditionalRenderProps) {
  const userPermissions = useSupplyChainPermissions();

  // Build arrays of required permissions and roles
  const requiredPermissions = [
    ...(permission ? [permission] : []),
    ...permissions,
  ];
  
  const requiredRoles = [
    ...(role ? [role] : []),
    ...roles,
  ];

  // Check access
  let hasAccess = true;

  if (requiredPermissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAccess && hasAllSupplyChainPermissions(userPermissions.permissions, requiredPermissions);
    } else {
      hasAccess = hasAccess && hasAnySupplyChainPermission(userPermissions.permissions, requiredPermissions);
    }
  }

  if (requiredRoles.length > 0) {
    if (requireAll) {
      hasAccess = hasAccess && requiredRoles.every(r => hasSupplyChainRole(userPermissions.roles, r));
    } else {
      hasAccess = hasAccess && requiredRoles.some(r => hasSupplyChainRole(userPermissions.roles, r));
    }
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Default unauthorized fallback component
function UnauthorizedFallback() {
  return (
    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
      <EyeOff className="text-red-600" size={20} />
      <div>
        <div className="font-medium text-red-900">Access Restricted</div>
        <div className="text-sm text-red-700">You don&apos;t have permission to view this content.</div>
      </div>
    </div>
  );
}

// Permission status indicator
interface PermissionStatusProps {
  permission?: SupplyChainPermission;
  role?: SupplyChainRole;
  showIcon?: boolean;
  showText?: boolean;
}

export function PermissionStatus({ 
  permission, 
  role, 
  showIcon = true, 
  showText = true 
}: PermissionStatusProps) {
  const { roles, permissions } = useSupplyChainPermissions();

  const hasAccess = 
    (!permission || hasSupplyChainPermission(permissions, permission)) &&
    (!role || hasSupplyChainRole(roles, role));

  return (
    <div className={`flex items-center gap-1 ${hasAccess ? 'text-green-600' : 'text-red-600'}`}>
      {showIcon && (hasAccess ? <Eye size={16} /> : <EyeOff size={16} />)}
      {showText && (
        <span className="text-sm">
          {hasAccess ? 'Authorized' : 'Restricted'}
        </span>
      )}
    </div>
  );
}
