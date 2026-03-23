import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuditImmutabilityGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    // Block any attempts to modify audit logs directly
    if (this.isAuditLogModification(method, url)) {
      const user = request.user;
      
      // Only allow system-level operations or specific admin roles
      const allowedRoles = ['system_admin', 'audit_system'];
      const hasSystemRole = user?.roles?.some((role: any) => 
        allowedRoles.includes(role.name?.toLowerCase())
      );

      if (!hasSystemRole) {
        throw new ForbiddenException(
          'Direct modification of audit logs is not permitted. Audit logs are immutable for security and compliance reasons.'
        );
      }
    }

    return true;
  }

  private isAuditLogModification(method: string, url: string): boolean {
    // Block direct modifications to activity logs
    const isActivityLogUrl = url.includes('/activity-log') || url.includes('/audit-log');
    const isModifyingMethod = ['PUT', 'PATCH', 'DELETE'].includes(method);

    return isActivityLogUrl && isModifyingMethod;
  }
}