import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditIntegrityService } from '../services/audit-integrity.service';

@Injectable()
export class AuditIntegrityInterceptor implements NestInterceptor {
  constructor(private auditIntegrityService: AuditIntegrityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const companyId = request.user?.companyId;

    return next.handle().pipe(
      tap(async (response) => {
        // If this is an audit log creation, add integrity metadata
        if (this.isAuditLogCreation(context, response)) {
          try {
            const logId = this.extractLogId(response);
            if (logId && companyId) {
              // Add integrity metadata asynchronously to avoid blocking the response
              setImmediate(async () => {
                try {
                  await this.auditIntegrityService.addIntegrityMetadata(logId, companyId);
                } catch (error) {
                  console.error('Failed to add audit integrity metadata:', error);
                }
              });
            }
          } catch (error) {
            console.error('Error in audit integrity interceptor:', error);
          }
        }
      }),
    );
  }

  private isAuditLogCreation(context: ExecutionContext, response: any): boolean {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    // Check if this is a supply chain operation that would create audit logs
    const isSupplyChainOperation = url.includes('/supply-chain/');
    const isModifyingOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    return isSupplyChainOperation && isModifyingOperation;
  }

  private extractLogId(response: any): string | null {
    // This would need to be adapted based on how your audit logs are created
    // For now, we'll assume the log ID might be in the response or we'll need
    // to query for the most recent log entry
    return null; // Placeholder - implement based on your audit log creation pattern
  }
}