import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FinancialDataMaskingService, UserPermissions } from '../services/financial-data-masking.service';
import { FINANCIAL_MASKING_KEY, FinancialMaskingConfig } from '../decorators/mask-financial-data.decorator';

@Injectable()
export class FinancialMaskingInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly maskingService: FinancialDataMaskingService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const maskingConfig = this.reflector.get<FinancialMaskingConfig>(
      FINANCIAL_MASKING_KEY,
      context.getHandler(),
    );

    if (!maskingConfig?.enabled) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        try {
          return this.maskResponseData(data, user, maskingConfig);
        } catch (error) {
          console.error('Error in financial masking interceptor:', error);
          // Return original data if masking fails to prevent breaking the response
          return data;
        }
      }),
    );
  }

  private maskResponseData(
    data: any,
    user: any,
    config: FinancialMaskingConfig,
  ): any {
    if (!data) return data;

    const userPermissions = this.getUserPermissionsFromUser(user);

    // Handle different response structures
    if (Array.isArray(data)) {
      return this.maskingService.maskArray(data, userPermissions, config.fieldMappings);
    }

    if (typeof data === 'object') {
      // Handle paginated responses
      if (data.data && Array.isArray(data.data)) {
        return {
          ...data,
          data: this.maskingService.maskArray(data.data, userPermissions, config.fieldMappings),
        };
      }

      // Handle responses with array fields
      if (config.arrayField && data[config.arrayField] && Array.isArray(data[config.arrayField])) {
        return {
          ...this.maskingService.maskObject(data, userPermissions, config.fieldMappings),
          [config.arrayField]: this.maskingService.maskArray(
            data[config.arrayField],
            userPermissions,
            config.fieldMappings,
          ),
        };
      }

      // Handle single object responses
      return this.maskingService.maskObject(data, userPermissions, config.fieldMappings);
    }

    return data;
  }

  private getUserPermissionsFromUser(user: any): UserPermissions {
    // Extract user role and permissions from the authenticated user
    const userRole = user.role || user.roles?.[0] || 'inventory_viewer';
    const userPermissions = user.permissions || [];

    return this.maskingService.getUserPermissions(userRole, userPermissions);
  }
}