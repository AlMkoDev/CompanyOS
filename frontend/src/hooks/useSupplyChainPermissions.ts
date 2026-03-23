import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { apiFetch } from '@/lib/api';

// Supply Chain specific roles (matching backend)
export enum SupplyChainRole {
  PROCUREMENT_MANAGER = 'procurement_manager',
  PROCUREMENT_OFFICER = 'procurement_officer',
  WAREHOUSE_MANAGER = 'warehouse_manager',
  WAREHOUSE_CLERK = 'warehouse_clerk',
  FINANCE_APPROVER = 'finance_approver',
  INVENTORY_VIEWER = 'inventory_viewer',
}

// Supply Chain permissions (matching backend)
export enum SupplyChainPermission {
  // Product permissions
  CREATE_PRODUCT = 'create_product',
  READ_PRODUCT = 'read_product',
  UPDATE_PRODUCT = 'update_product',
  DELETE_PRODUCT = 'delete_product',
  
  // Supplier permissions
  CREATE_SUPPLIER = 'create_supplier',
  READ_SUPPLIER = 'read_supplier',
  UPDATE_SUPPLIER = 'update_supplier',
  DELETE_SUPPLIER = 'delete_supplier',
  MANAGE_SUPPLIER_STATUS = 'manage_supplier_status',
  
  // Inventory permissions
  READ_INVENTORY = 'read_inventory',
  ADJUST_INVENTORY = 'adjust_inventory',
  TRANSFER_INVENTORY = 'transfer_inventory',
  RECEIVE_INVENTORY = 'receive_inventory',
  FULFILL_INVENTORY = 'fulfill_inventory',
  
  // Purchase Order permissions
  CREATE_PO = 'create_po',
  READ_PO = 'read_po',
  UPDATE_PO = 'update_po',
  DELETE_PO = 'delete_po',
  APPROVE_PO = 'approve_po',
  
  // Purchase Requisition permissions
  CREATE_PR = 'create_pr',
  READ_PR = 'read_pr',
  UPDATE_PR = 'update_pr',
  DELETE_PR = 'delete_pr',
  APPROVE_PR_L1 = 'approve_pr_l1',
  APPROVE_PR_L2 = 'approve_pr_l2',
  
  // Document permissions
  UPLOAD_DOCUMENTS = 'upload_documents',
  READ_DOCUMENTS = 'read_documents',
  DELETE_DOCUMENTS = 'delete_documents',
  
  // Reporting permissions
  VIEW_REPORTS = 'view_reports',
  EXPORT_DATA = 'export_data',
  
  // Audit permissions
  AUDIT_LEDGER = 'audit_ledger',
}

interface UserPermissions {
  roles: SupplyChainRole[];
  permissions: SupplyChainPermission[];
  departmentRoles: string[];
  isLoading: boolean;
  error: string | null;
}

export function useSupplyChainPermissions(): UserPermissions {
  const { user, isAuthenticated } = useAuthStore();
  const [permissions, setPermissions] = useState<UserPermissions>({
    roles: [],
    permissions: [],
    departmentRoles: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (!user || !isAuthenticated) {
        setPermissions({
          roles: [],
          permissions: [],
          departmentRoles: [],
          isLoading: false,
          error: null,
        });
        return;
      }

      try {
        setPermissions(prev => ({ ...prev, isLoading: true, error: null }));

        // Fetch user's department roles and permissions
        const response = await apiFetch('/auth/user/permissions');

        if (!response.ok) {
          throw new Error('Failed to fetch user permissions');
        }

        const userData = await response.json();
        
        // Map user's department roles to supply chain roles
        const supplyChainRoles = mapDepartmentRolesToSupplyChain(userData.departmentRoles || []);
        
        // Map user's permissions to supply chain permissions
        const supplyChainPermissions = mapGenericToSupplyChainPermissions(userData.permissions || []);

        setPermissions({
          roles: supplyChainRoles,
          permissions: supplyChainPermissions,
          departmentRoles: userData.departmentRoles || [],
          isLoading: false,
          error: null,
        });

      } catch (err) {
        console.error('Failed to fetch user permissions:', err);
        
        // Fallback: Use basic role mapping from auth store
        const fallbackRoles = mapUserRolesToSupplyChain(user.roles || []);
        const fallbackPermissions = getDefaultPermissionsForRoles(fallbackRoles);

        setPermissions({
          roles: fallbackRoles,
          permissions: fallbackPermissions,
          departmentRoles: user.roles || [],
          isLoading: false,
          error: 'Failed to fetch detailed permissions, using fallback',
        });
      }
    };

    fetchUserPermissions();
  }, [user, isAuthenticated]);

  return permissions;
}

// Map department roles to supply chain specific roles
function mapDepartmentRolesToSupplyChain(departmentRoles: string[]): SupplyChainRole[] {
  const roles: SupplyChainRole[] = [];

  for (const role of departmentRoles) {
    const roleName = role.toLowerCase();
    
    if (roleName.includes('manager') || roleName.includes('admin')) {
      if (roleName.includes('procurement') || roleName.includes('purchasing')) {
        roles.push(SupplyChainRole.PROCUREMENT_MANAGER);
      } else if (roleName.includes('warehouse') || roleName.includes('inventory')) {
        roles.push(SupplyChainRole.WAREHOUSE_MANAGER);
      } else if (roleName.includes('finance')) {
        roles.push(SupplyChainRole.FINANCE_APPROVER);
      } else {
        roles.push(SupplyChainRole.PROCUREMENT_MANAGER); // Default manager role
      }
    } else if (roleName.includes('officer') || roleName.includes('contributor')) {
      if (roleName.includes('procurement') || roleName.includes('purchasing')) {
        roles.push(SupplyChainRole.PROCUREMENT_OFFICER);
      } else if (roleName.includes('warehouse') || roleName.includes('inventory')) {
        roles.push(SupplyChainRole.WAREHOUSE_CLERK);
      } else {
        roles.push(SupplyChainRole.PROCUREMENT_OFFICER); // Default officer role
      }
    } else if (roleName.includes('warehouse') || roleName.includes('clerk')) {
      roles.push(SupplyChainRole.WAREHOUSE_CLERK);
    } else if (roleName.includes('finance') || roleName.includes('approver')) {
      roles.push(SupplyChainRole.FINANCE_APPROVER);
    } else {
      roles.push(SupplyChainRole.INVENTORY_VIEWER); // Default viewer role
    }
  }

  return Array.from(new Set(roles)); // Remove duplicates
}

// Map generic permissions to supply chain specific permissions
function mapGenericToSupplyChainPermissions(genericPermissions: string[]): SupplyChainPermission[] {
  const mapped: SupplyChainPermission[] = [];

  for (const permission of genericPermissions) {
    switch (permission) {
      case 'create_products':
        mapped.push(SupplyChainPermission.CREATE_PRODUCT);
        break;
      case 'read_products':
        mapped.push(SupplyChainPermission.READ_PRODUCT);
        break;
      case 'update_products':
        mapped.push(SupplyChainPermission.UPDATE_PRODUCT);
        break;
      case 'delete_products':
        mapped.push(SupplyChainPermission.DELETE_PRODUCT);
        break;
      case 'create_suppliers':
        mapped.push(SupplyChainPermission.CREATE_SUPPLIER);
        break;
      case 'read_suppliers':
        mapped.push(SupplyChainPermission.READ_SUPPLIER);
        break;
      case 'update_suppliers':
        mapped.push(SupplyChainPermission.UPDATE_SUPPLIER);
        break;
      case 'delete_suppliers':
        mapped.push(SupplyChainPermission.DELETE_SUPPLIER);
        break;
      case 'manage_inventory':
        mapped.push(
          SupplyChainPermission.READ_INVENTORY,
          SupplyChainPermission.ADJUST_INVENTORY,
          SupplyChainPermission.TRANSFER_INVENTORY,
          SupplyChainPermission.RECEIVE_INVENTORY,
          SupplyChainPermission.FULFILL_INVENTORY,
        );
        break;
      case 'read_inventory':
        mapped.push(SupplyChainPermission.READ_INVENTORY);
        break;
      case 'manage_documents':
        mapped.push(
          SupplyChainPermission.UPLOAD_DOCUMENTS,
          SupplyChainPermission.READ_DOCUMENTS,
          SupplyChainPermission.DELETE_DOCUMENTS,
        );
        break;
      case 'read_analytics':
        mapped.push(SupplyChainPermission.VIEW_REPORTS);
        break;
      case 'export_data':
        mapped.push(SupplyChainPermission.EXPORT_DATA);
        break;
      case 'audit_system':
      case 'manage_audit':
        mapped.push(SupplyChainPermission.AUDIT_LEDGER);
        break;
      case 'approve_purchases':
        mapped.push(
          SupplyChainPermission.APPROVE_PR_L1,
          SupplyChainPermission.APPROVE_PO,
        );
        break;
      case 'approve_high_value':
        mapped.push(SupplyChainPermission.APPROVE_PR_L2);
        break;
    }
  }

  return Array.from(new Set(mapped)); // Remove duplicates
}

// Fallback: Map basic user roles to supply chain roles
function mapUserRolesToSupplyChain(userRoles: string[]): SupplyChainRole[] {
  const roles: SupplyChainRole[] = [];

  for (const role of userRoles) {
    const roleName = role.toLowerCase();
    
    if (roleName.includes('admin') || roleName.includes('manager')) {
      roles.push(SupplyChainRole.PROCUREMENT_MANAGER);
    } else if (roleName.includes('user') || roleName.includes('member')) {
      roles.push(SupplyChainRole.PROCUREMENT_OFFICER);
    } else {
      roles.push(SupplyChainRole.INVENTORY_VIEWER);
    }
  }

  return roles.length > 0 ? roles : [SupplyChainRole.INVENTORY_VIEWER];
}

// Get default permissions for roles (fallback)
function getDefaultPermissionsForRoles(roles: SupplyChainRole[]): SupplyChainPermission[] {
  const permissions: SupplyChainPermission[] = [];

  for (const role of roles) {
    switch (role) {
      case SupplyChainRole.PROCUREMENT_MANAGER:
        permissions.push(
          // Full product management
          SupplyChainPermission.CREATE_PRODUCT,
          SupplyChainPermission.READ_PRODUCT,
          SupplyChainPermission.UPDATE_PRODUCT,
          SupplyChainPermission.DELETE_PRODUCT,
          // Full supplier management
          SupplyChainPermission.CREATE_SUPPLIER,
          SupplyChainPermission.READ_SUPPLIER,
          SupplyChainPermission.UPDATE_SUPPLIER,
          SupplyChainPermission.DELETE_SUPPLIER,
          SupplyChainPermission.MANAGE_SUPPLIER_STATUS,
          // Full inventory management
          SupplyChainPermission.READ_INVENTORY,
          SupplyChainPermission.ADJUST_INVENTORY,
          SupplyChainPermission.TRANSFER_INVENTORY,
          SupplyChainPermission.RECEIVE_INVENTORY,
          SupplyChainPermission.FULFILL_INVENTORY,
          // Full PO management
          SupplyChainPermission.CREATE_PO,
          SupplyChainPermission.READ_PO,
          SupplyChainPermission.UPDATE_PO,
          SupplyChainPermission.DELETE_PO,
          SupplyChainPermission.APPROVE_PO,
          // Full PR management
          SupplyChainPermission.CREATE_PR,
          SupplyChainPermission.READ_PR,
          SupplyChainPermission.UPDATE_PR,
          SupplyChainPermission.DELETE_PR,
          SupplyChainPermission.APPROVE_PR_L1,
          SupplyChainPermission.APPROVE_PR_L2,
          // Documents and reporting
          SupplyChainPermission.UPLOAD_DOCUMENTS,
          SupplyChainPermission.READ_DOCUMENTS,
          SupplyChainPermission.DELETE_DOCUMENTS,
          SupplyChainPermission.VIEW_REPORTS,
          SupplyChainPermission.EXPORT_DATA,
          SupplyChainPermission.AUDIT_LEDGER,
        );
        break;

      case SupplyChainRole.PROCUREMENT_OFFICER:
        permissions.push(
          // Product management (limited)
          SupplyChainPermission.READ_PRODUCT,
          SupplyChainPermission.UPDATE_PRODUCT,
          // Supplier management (limited)
          SupplyChainPermission.READ_SUPPLIER,
          SupplyChainPermission.UPDATE_SUPPLIER,
          // Inventory operations
          SupplyChainPermission.READ_INVENTORY,
          SupplyChainPermission.ADJUST_INVENTORY,
          SupplyChainPermission.TRANSFER_INVENTORY,
          SupplyChainPermission.RECEIVE_INVENTORY,
          // PO management (limited)
          SupplyChainPermission.CREATE_PO,
          SupplyChainPermission.READ_PO,
          SupplyChainPermission.UPDATE_PO,
          // PR management
          SupplyChainPermission.CREATE_PR,
          SupplyChainPermission.READ_PR,
          SupplyChainPermission.UPDATE_PR,
          // Documents
          SupplyChainPermission.UPLOAD_DOCUMENTS,
          SupplyChainPermission.READ_DOCUMENTS,
          SupplyChainPermission.VIEW_REPORTS,
        );
        break;

      case SupplyChainRole.WAREHOUSE_MANAGER:
        permissions.push(
          // Product read access
          SupplyChainPermission.READ_PRODUCT,
          // Supplier read access
          SupplyChainPermission.READ_SUPPLIER,
          // Full inventory management
          SupplyChainPermission.READ_INVENTORY,
          SupplyChainPermission.ADJUST_INVENTORY,
          SupplyChainPermission.TRANSFER_INVENTORY,
          SupplyChainPermission.RECEIVE_INVENTORY,
          SupplyChainPermission.FULFILL_INVENTORY,
          // PO read access
          SupplyChainPermission.READ_PO,
          // PR read access
          SupplyChainPermission.READ_PR,
          // Documents
          SupplyChainPermission.READ_DOCUMENTS,
          SupplyChainPermission.VIEW_REPORTS,
        );
        break;

      case SupplyChainRole.WAREHOUSE_CLERK:
        permissions.push(
          // Product read access
          SupplyChainPermission.READ_PRODUCT,
          // Inventory operations (limited)
          SupplyChainPermission.READ_INVENTORY,
          SupplyChainPermission.RECEIVE_INVENTORY,
          SupplyChainPermission.FULFILL_INVENTORY,
          // PO read access
          SupplyChainPermission.READ_PO,
          // Documents read
          SupplyChainPermission.READ_DOCUMENTS,
        );
        break;

      case SupplyChainRole.FINANCE_APPROVER:
        permissions.push(
          // Read access for approval decisions
          SupplyChainPermission.READ_PRODUCT,
          SupplyChainPermission.READ_SUPPLIER,
          SupplyChainPermission.READ_INVENTORY,
          SupplyChainPermission.READ_PO,
          SupplyChainPermission.READ_PR,
          // Approval permissions
          SupplyChainPermission.APPROVE_PO,
          SupplyChainPermission.APPROVE_PR_L1,
          SupplyChainPermission.APPROVE_PR_L2,
          // Reporting
          SupplyChainPermission.VIEW_REPORTS,
          SupplyChainPermission.EXPORT_DATA,
        );
        break;

      case SupplyChainRole.INVENTORY_VIEWER:
        permissions.push(
          // Read-only access
          SupplyChainPermission.READ_PRODUCT,
          SupplyChainPermission.READ_SUPPLIER,
          SupplyChainPermission.READ_INVENTORY,
          SupplyChainPermission.READ_PO,
          SupplyChainPermission.READ_PR,
          SupplyChainPermission.READ_DOCUMENTS,
        );
        break;
    }
  }

  return Array.from(new Set(permissions)); // Remove duplicates
}

// Helper functions for permission checking
export function hasSupplyChainRole(userRoles: SupplyChainRole[], requiredRole: SupplyChainRole): boolean {
  return userRoles.includes(requiredRole);
}

export function hasSupplyChainPermission(userPermissions: SupplyChainPermission[], requiredPermission: SupplyChainPermission): boolean {
  return userPermissions.includes(requiredPermission);
}

export function hasAnySupplyChainPermission(userPermissions: SupplyChainPermission[], requiredPermissions: SupplyChainPermission[]): boolean {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

export function hasAllSupplyChainPermissions(userPermissions: SupplyChainPermission[], requiredPermissions: SupplyChainPermission[]): boolean {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}
