import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LedgerAuditService } from '../services/ledger-audit.service';

@Injectable()
export class LedgerAuditMiddleware implements NestMiddleware {
  constructor(private readonly ledgerAuditService: LedgerAuditService) {}

  async use(req: Request & { user?: any }, res: Response, next: NextFunction) {
    const originalSend = res.send;
    const startTime = Date.now();

    // Only audit ledger-related operations
    const isLedgerOperation = req.url.includes('/ledger') || 
                             req.url.includes('/stock-ledger') ||
                             req.url.includes('/movements/');

    if (!isLedgerOperation) {
      return next();
    }

    // Capture request details
    const requestData = {
      method: req.method,
      url: req.url,
      body: req.body,
      query: req.query,
      params: req.params,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date(),
    };

    // Override res.send to capture response
    res.send = function(body: any) {
      const responseTime = Date.now() - startTime;
      
      // Log the operation after response is sent
      setImmediate(async () => {
        try {
          if (req.user?.companyId) {
            let action: 'CREATE' | 'READ' | 'ATTEMPTED_UPDATE' | 'ATTEMPTED_DELETE' = 'READ';
            
            switch (req.method) {
              case 'POST':
                action = 'CREATE';
                break;
              case 'GET':
                action = 'READ';
                break;
              case 'PUT':
              case 'PATCH':
                action = 'ATTEMPTED_UPDATE';
                break;
              case 'DELETE':
                action = 'ATTEMPTED_DELETE';
                break;
            }

            await this.ledgerAuditService.logLedgerOperation(
              req.user.companyId,
              action,
              undefined, // ledgerEntryId will be extracted from response if available
              req.user.userId,
              {
                ip_address: req.ip,
                user_agent: req.get('User-Agent'),
                request_data: {
                  ...requestData,
                  response_status: res.statusCode,
                  response_time_ms: responseTime,
                },
              },
            );
          }
        } catch (error) {
          console.error('Failed to log ledger audit entry:', error);
        }
      });

      return originalSend.call(this, body);
    }.bind(res);

    next();
  }
}