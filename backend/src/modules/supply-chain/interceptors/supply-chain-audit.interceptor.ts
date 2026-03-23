import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { PrismaService } from '../../../database/prisma.service';

export interface SupplyChainAuditLog {
  company_id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  method: string;
  endpoint: string;
  request_data?: any;
  response_data?: any;
  status_code: number;
  execution_time_ms: number;
  ip_address?: string;
  user_agent?: string;
  error_message?: string;
  business_context?: {
    supplier_id?: string;
    product_id?: string;
    location_id?: string;
    po_id?: string;
    gr_id?: string;
    pr_id?: string;
    financial_impact?: number;
    approval_level?: string;
  };
}

@Injectable()
export class SupplyChainAuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    // Extract request information
    const {
      method,
      url,
      body,
      query,
      params,
      ip,
      user,
    } = request;

    const userAgent = request.get('User-Agent');
    const companyId = user?.company_id;
    const userId = user?.sub;

    // Determine if this is a supply chain operation that needs auditing
    const shouldAudit = this.shouldAuditOperation(method, url);

    if (!shouldAudit || !companyId) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (responseData) => {
        const executionTime = Date.now() - startTime;
        
        try {
          await this.logSupplyChainOperation({
            company_id: companyId,
            user_id: userId,
            action: this.determineAction(method, url),
            resource_type: this.extractResourceType(url),
            resource_id: this.extractResourceId(params, responseData),
            method,
            endpoint: url,
            request_data: this.sanitizeRequestData(body, query, params),
            response_data: this.sanitizeResponseData(responseData),
            status_code: response.statusCode,
            execution_time_ms: executionTime,
            ip_address: ip,
            user_agent: userAgent,
            business_context: this.extractBusinessContext(url, body, params, responseData),
          });
        } catch (error) {
          console.error('Supply chain audit logging failed:', error);
        }
      }),
      catchError(async (error) => {
        const executionTime = Date.now() - startTime;
        
        try {
          await this.logSupplyChainOperation({
            company_id: companyId,
            user_id: userId,
            action: this.determineAction(method, url),
            resource_type: this.extractResourceType(url),
            method,
            endpoint: url,
            request_data: this.sanitizeRequestData(body, query, params),
            status_code: error.status || 500,
            execution_time_ms: executionTime,
            ip_address: ip,
            user_agent: userAgent,
            error_message: error.message,
            business_context: this.extractBusinessContext(url, body, params),
          });
        } catch (auditError) {
          console.error('Supply chain audit logging failed:', auditError);
        }
        
        throw error;
      }),
    );
  }

  private shouldAuditOperation(method: string, url: string): boolean {
    // Audit all state-changing operations
    const statefulMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    
    // Also audit critical read operations
    const criticalReadPaths = [
      '/supplier-performance',
      '/goods-receipt',
      '/procurement-workflow',
      '/inventory/ledger',
      '/inventory/movements',
    ];

    return statefulMethods.includes(method) || 
           (method === 'GET' && criticalReadPaths.some(path => url.includes(path)));
  }

  private determineAction(method: string, url: string): string {
    const baseAction = method.toLowerCase();
    
    // Add specific action context based on URL
    if (url.includes('/approve')) return `${baseAction}_approve`;
    if (url.includes('/reject')) return `${baseAction}_reject`;
    if (url.includes('/complete')) return `${baseAction}_complete`;
    if (url.includes('/cancel')) return `${baseAction}_cancel`;
    if (url.includes('/amend')) return `${baseAction}_amend`;
    if (url.includes('/resolve')) return `${baseAction}_resolve`;
    
    return baseAction;
  }

  private extractResourceType(url: string): string {
    // Extract resource type from URL path
    const pathSegments = url.split('/').filter(segment => segment);
    
    if (url.includes('purchase-order') || url.includes('po-document')) return 'purchase_order';
    if (url.includes('goods-receipt')) return 'goods_receipt';
    if (url.includes('purchase-requisition') || url.includes('procurement-workflow')) return 'purchase_requisition';
    if (url.includes('supplier')) return 'supplier';
    if (url.includes('product')) return 'product';
    if (url.includes('inventory')) return 'inventory';
    if (url.includes('stock-ledger')) return 'stock_ledger';
    if (url.includes('reorder-alert')) return 'reorder_alert';
    if (url.includes('supplier-performance')) return 'supplier_performance';
    
    return pathSegments[pathSegments.length - 1] || 'unknown';
  }

  private extractResourceId(params: any, responseData?: any): string | undefined {
    // Try to extract ID from URL parameters
    if (params?.id) return params.id;
    if (params?.supplierId) return params.supplierId;
    if (params?.productId) return params.productId;
    if (params?.poId) return params.poId;
    if (params?.grId) return params.grId;
    if (params?.prId) return params.prId;
    
    // Try to extract ID from response data
    if (responseData?.id) return responseData.id;
    
    return undefined;
  }

  private sanitizeRequestData(body: any, query: any, params: any): any {
    const sanitized: any = {};
    
    if (body && Object.keys(body).length > 0) {
      sanitized.body = this.sanitizeSensitiveData(body);
    }
    
    if (query && Object.keys(query).length > 0) {
      sanitized.query = query;
    }
    
    if (params && Object.keys(params).length > 0) {
      sanitized.params = params;
    }
    
    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }

  private sanitizeResponseData(responseData: any): any {
    if (!responseData) return undefined;
    
    // For large responses, only capture key metadata
    if (Array.isArray(responseData)) {
      return {
        type: 'array',
        count: responseData.length,
        sample: responseData.slice(0, 2).map(item => this.extractKeyFields(item)),
      };
    }
    
    if (typeof responseData === 'object') {
      return this.extractKeyFields(responseData);
    }
    
    return responseData;
  }

  private extractKeyFields(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    const keyFields = [
      'id', 'status', 'total_amount', 'quantity', 'supplier_id', 
      'product_id', 'location_id', 'po_number', 'gr_number', 'pr_number',
      'created_at', 'updated_at'
    ];
    
    const extracted: any = {};
    keyFields.forEach(field => {
      if (obj[field] !== undefined) {
        extracted[field] = obj[field];
      }
    });
    
    return extracted;
  }

  private sanitizeSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'bank_details', 
      'account_number', 'routing_number', 'ssn', 'tax_id'
    ];
    
    const sanitized = { ...data };
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  private extractBusinessContext(
    url: string, 
    body?: any, 
    params?: any, 
    responseData?: any
  ): any {
    const context: any = {};
    
    // Extract business context from different sources
    const sources = [body, params, responseData].filter(Boolean);
    
    sources.forEach(source => {
      if (source.supplier_id || source.supplierId) {
        context.supplier_id = source.supplier_id || source.supplierId;
      }
      if (source.product_id || source.productId) {
        context.product_id = source.product_id || source.productId;
      }
      if (source.location_id || source.locationId) {
        context.location_id = source.location_id || source.locationId;
      }
      if (source.po_id || source.poId) {
        context.po_id = source.po_id || source.poId;
      }
      if (source.gr_id || source.grId) {
        context.gr_id = source.gr_id || source.grId;
      }
      if (source.pr_id || source.prId) {
        context.pr_id = source.pr_id || source.prId;
      }
      if (source.total_amount || source.totalAmount) {
        context.financial_impact = source.total_amount || source.totalAmount;
      }
      if (source.approval_level || source.approvalLevel) {
        context.approval_level = source.approval_level || source.approvalLevel;
      }
    });
    
    return Object.keys(context).length > 0 ? context : undefined;
  }

  private async logSupplyChainOperation(auditData: SupplyChainAuditLog): Promise<void> {
    await this.prisma.activityLog.create({
      data: {
        company_id: auditData.company_id,
        user_id: auditData.user_id,
        action: `SUPPLY_CHAIN_${auditData.action.toUpperCase()}`,
        resource_type: auditData.resource_type,
        resource_id: auditData.resource_id,
        details: {
          method: auditData.method,
          endpoint: auditData.endpoint,
          request_data: auditData.request_data,
          response_data: auditData.response_data,
          status_code: auditData.status_code,
          execution_time_ms: auditData.execution_time_ms,
          error_message: auditData.error_message,
          business_context: auditData.business_context,
        },
        ip_address: auditData.ip_address,
        user_agent: auditData.user_agent,
      },
    });
  }
}