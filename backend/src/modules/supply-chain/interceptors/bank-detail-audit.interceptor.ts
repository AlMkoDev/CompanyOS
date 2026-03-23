import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SupplyChainAuditService } from '../services/supply-chain-audit.service';

/**
 * Interceptor to audit all access to supplier bank details
 */
@Injectable()
export class BankDetailAuditInterceptor implements NestInterceptor {
  constructor(private auditService: SupplyChainAuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, params, query } = request;

    // Check if this request involves bank details
    const isBankDetailAccess = this.isBankDetailAccess(url, body, query);

    if (!isBankDetailAccess || !user) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (response) => {
          this.logBankDetailAccess(
            user,
            method,
            url,
            params,
            body,
            response,
            'SUCCESS',
            Date.now() - startTime,
            request.ip,
            request.get('User-Agent'),
          );
        },
        error: (error) => {
          this.logBankDetailAccess(
            user,
            method,
            url,
            params,
            body,
            null,
            'ERROR',
            Date.now() - startTime,
            request.ip,
            request.get('User-Agent'),
            error.message,
          );
        },
      }),
    );
  }

  private isBankDetailAccess(url: string, body: any, query: any): boolean {
    // Check URL patterns that involve bank details
    const bankDetailUrls = [
      '/supplier-bank-security',
      '/suppliers/',
    ];

    const urlMatch = bankDetailUrls.some(pattern => url.includes(pattern));

    // Check if request body contains bank details
    const bodyContainsBankDetails = body && (
      body.bank_details !== undefined ||
      body.proposed_bank_details !== undefined
    );

    // Check if query parameters request bank details
    const queryRequestsBankDetails = query && (
      query.include_bank_details === 'true' ||
      query.fields?.includes('bank_details')
    );

    return urlMatch || bodyContainsBankDetails || queryRequestsBankDetails;
  }

  private async logBankDetailAccess(
    user: any,
    method: string,
    url: string,
    params: any,
    body: any,
    response: any,
    status: 'SUCCESS' | 'ERROR',
    duration: number,
    ipAddress: string,
    userAgent: string,
    errorMessage?: string,
  ): Promise<void> {
    try {
      const action = this.determineAction(method, url, body);
      const entityId = params?.id || params?.supplierId || params?.requestId;

      await this.auditService.logActivity({
        user_id: user.id,
        action,
        entity_type: 'supplier_bank_details',
        entity_id,
        details: {
          method,
          url,
          status,
          duration_ms: duration,
          error_message: errorMessage,
          // Mask sensitive data in logs
          request_summary: this.maskSensitiveData(body),
          response_summary: response ? this.maskSensitiveData(response) : null,
        },
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    } catch (error) {
      console.error('Failed to log bank detail access:', error);
    }
  }

  private determineAction(method: string, url: string, body: any): string {
    if (url.includes('/request-change')) {
      return 'BANK_DETAIL_CHANGE_REQUESTED';
    }
    if (url.includes('/approve/')) {
      return 'BANK_DETAIL_CHANGE_APPROVED';
    }
    if (url.includes('/reject/')) {
      return 'BANK_DETAIL_CHANGE_REJECTED';
    }
    if (url.includes('/pending-requests')) {
      return 'BANK_DETAIL_PENDING_REQUESTS_VIEWED';
    }
    if (url.includes('/history/')) {
      return 'BANK_DETAIL_HISTORY_VIEWED';
    }
    if (url.includes('/security-status/')) {
      return 'BANK_DETAIL_SECURITY_STATUS_VIEWED';
    }
    if (method === 'GET' && url.includes('/suppliers/')) {
      return 'SUPPLIER_BANK_DETAILS_VIEWED';
    }
    if (['PUT', 'PATCH'].includes(method) && body?.bank_details) {
      return 'SUPPLIER_BANK_DETAILS_MODIFIED';
    }

    return 'BANK_DETAIL_ACCESS';
  }

  private maskSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const masked = { ...data };

    // Mask bank details
    if (masked.bank_details) {
      masked.bank_details = this.maskBankDetails(masked.bank_details);
    }

    if (masked.proposed_bank_details) {
      masked.proposed_bank_details = this.maskBankDetails(masked.proposed_bank_details);
    }

    if (masked.current_bank_details) {
      masked.current_bank_details = this.maskBankDetails(masked.current_bank_details);
    }

    // Mask arrays of data
    if (Array.isArray(masked.data)) {
      masked.data = masked.data.map((item: any) => this.maskSensitiveData(item));
    }

    return masked;
  }

  private maskBankDetails(bankDetails: any): any {
    if (!bankDetails || typeof bankDetails !== 'object') {
      return bankDetails;
    }

    return {
      ...bankDetails,
      account_number: bankDetails.account_number ? 
        this.maskAccountNumber(bankDetails.account_number) : undefined,
      // Keep other fields for audit purposes but mask sensitive ones
    };
  }

  private maskAccountNumber(accountNumber: string): string {
    if (!accountNumber || accountNumber.length < 4) {
      return '****';
    }
    return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
  }
}