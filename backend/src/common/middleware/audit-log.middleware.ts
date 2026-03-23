import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../../modules/audit/audit.service';

@Injectable()
export class AuditLogMiddleware implements NestMiddleware {
  constructor(private readonly auditService: AuditService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, path, body, ip, user } = req as any;

    // Only log state-changing requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      // Intercept the finish event to log the action
      res.on('finish', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const companyId = user?.companyId;
          const userId = user?.sub;

          if (companyId) {
            this.auditService.log({
              companyId,
              userId,
              action: method,
              resourceType: path.split('/')[1] || 'unknown',
              resourceId: path.split('/')[2],
              details: {
                body,
                statusCode: res.statusCode,
              },
              ipAddress: ip,
              userAgent: req.get('user-agent'),
            }).catch(err => console.error('Audit logging failed:', err));
          }
        }
      });
    }

    next();
  }
}
