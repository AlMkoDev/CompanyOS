import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../database/prisma.service';

// Supply Chain specific roles
export enum SupplyChainRole {
  PROCUREMENT_MANAGER = 'procurement_manager',
  PROCUREMENT_OFFICER = 'procurement_officer',
  WAREHOUSE_MANAGER = 'warehouse_manager',
  WAREHOUSE_CLERK = 'warehouse_clerk',
  FINANCE_APPROVER = 'finance_approver',
  INVENTORY_VIEWER = 'inventory_viewer',
}

// Supply Chain permissions
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

export const SUPPLY_CHAIN_ROLES_KEY = 'supply_chain_roles';
export const SUPPLY_CHAIN_PERMISSIONS_KEY = 'supply_chain_permissions';

export const RequireSupplyChainRoles = (...roles: SupplyChainRole[]) =>
  SetMetadata(SUPPLY_CHAIN_ROLES_KEY, roles);

export const RequireSupplyChainPermissions = (...permissions: SupplyChainPermission[]) =>
  SetMetadata(SUPPLY_CHAIN_PERMISSIONS_KEY, permissions);

@Injectable()
export class SupplyChainRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<SupplyChainRole[]>(
      SUPPLY_CHAIN_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<SupplyChainPermission[]>(
      SUPPLY_CHAIN_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles or permissions required, allow access
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user's department and role information
    const userWithRoles = await this.prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        department_members: {
          include: {
            department: true,
            role: {
              include: {
                permissions: {
                  include: { permission: true }
                }
              }
            }
          }
        }
      }
    });

    if (!userWithRoles) {
      throw new ForbiddenException('User not found');
    }

    // Check if user has required roles
    if (requiredRoles) {
      const hasRequiredRole = await this.checkSupplyChainRoles(
        userWithRoles,
        requiredRoles,
      );
      if (!hasRequiredRole) {
        throw new ForbiddenException('Insufficient role permissions for supply chain operations');
      }
    }

    // Check if user has required permissions
    if (requiredPermissions) {
      const hasRequiredPermissions = await this.checkSupplyChainPermissions(
        userWithRoles,
        requiredPermissions,
      );
      if (!hasRequiredPermissions) {
        throw new ForbiddenException('Insufficient permissions for this supply chain operation');
      }
    }

    return true;
  }

  private async checkSupplyChainRoles(
    user: any,
    requiredRoles: SupplyChainRole[],
  ): Promise<boolean> {
    // Check if user is in Operations department (supply chain operations)
    const opsMembers = user.department_members.filter(
      (member: any) => member.department.template_key === 'ops'
    );

    if (opsMembers.length === 0) {
      return false; // Not in operations department
    }

    // For now, map department roles to supply chain roles
    // In a real implementation, you'd have a more sophisticated mapping
    const userRoles = opsMembers.map((member: any) => {
      const roleName = member.role?.name?.toLowerCase();
      
      // Map department roles to supply chain roles
      if (roleName?.includes('manager')) {
        return SupplyChainRole.PROCUREMENT_MANAGER;
      } else if (roleName?.includes('officer') || roleName?.includes('contributor')) {
        return SupplyChainRole.PROCUREMENT_OFFICER;
      } else if (roleName?.includes('warehouse')) {
        return SupplyChainRole.WAREHOUSE_CLERK;
      } else if (roleName?.includes('finance')) {
        return SupplyChainRole.FINANCE_APPROVER;
      }
      
      return SupplyChainRole.INVENTORY_VIEWER; // Default role
    });

    return requiredRoles.some(role => userRoles.includes(role));
  }

  private async checkSupplyChainPermissions(
    user: any,
    requiredPermissions: SupplyChainPermission[],
  ): Promise<boolean> {
    // Get all user permissions from their roles
    const userPermissions: string[] = [];
    
    for (const member of user.department_members) {
      if (member.role?.permissions) {
        for (const rolePermission of member.role.permissions) {
          const permission = rolePermission.permission;
          userPermissions.push(`${permission.action}_${permission.resource}`);
        }
      }
    }

    // Map generic permissions to supply chain permissions
    const mappedPermissions = this.mapGenericToSupplyChainPermissions(userPermissions);

    return requiredPermissions.some(permission => 
      mappedPermissions.includes(permission)
    );
  }

  private mapGenericToSupplyChainPermissions(
    genericPermissions: string[]
  ): SupplyChainPermission[] {
    const mapped: SupplyChainPermission[] = [];

    for (const permission of genericPermissions) {
      // Map generic permissions to supply chain specific ones
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
        case 'audit_system':
        case 'manage_audit':
          mapped.push(SupplyChainPermission.AUDIT_LEDGER);
          break;
      }
    }

    return mapped;
  }
}