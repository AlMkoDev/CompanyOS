export type AppModule =
  | 'dashboard'
  | 'tasks'
  | 'hris'
  | 'departments'
  | 'setup';

export interface PermissionUser {
  roles?: string[];
}

const roleAliases: Record<string, string> = {
  'super admin': 'super_admin',
  'dept admin': 'dept_admin',
  'department admin': 'dept_admin',
  manager: 'manager',
  'chief human resources officer': 'chro',
  'hr director': 'hr_director',
  'administration manager': 'administration_manager',
};

const moduleRoleMatrix: Record<AppModule, string[]> = {
  dashboard: [],
  tasks: [],
  hris: ['super_admin', 'dept_admin', 'manager', 'chro', 'hr_director', 'administration_manager'],
  departments: ['super_admin', 'dept_admin', 'manager', 'administration_manager'],
  setup: ['super_admin'],
};

export function normalizeRoleName(role?: string | null) {
  if (!role) {
    return null;
  }

  const normalized = role.trim().toLowerCase();
  return roleAliases[normalized] || normalized.replace(/\s+/g, '_');
}

export function getNormalizedRoles(user?: PermissionUser | null) {
  return Array.from(
    new Set(
      (user?.roles || [])
        .map((role) => normalizeRoleName(role))
        .filter((role): role is string => Boolean(role)),
    ),
  );
}

export function canAccessModule(user: PermissionUser | null | undefined, module: AppModule) {
  const allowedRoles = moduleRoleMatrix[module];

  if (allowedRoles.length === 0) {
    return true;
  }

  const roles = getNormalizedRoles(user);
  return roles.some((role) => allowedRoles.includes(role));
}
