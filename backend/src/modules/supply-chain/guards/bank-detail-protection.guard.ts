import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Guard to prevent direct modification of supplier bank details
 * All bank detail changes must go through the approval workflow
 */
@Injectable()
export class BankDetailProtectionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { method, body, params } = request;

    // Only check PUT/PATCH requests to supplier endpoints
    if (!['PUT', 'PATCH'].includes(method)) {
      return true;
    }

    // Check if this is a supplier update request
    const isSupplierUpdate = request.url.includes('/suppliers/') && params.id;

    if (!isSupplierUpdate) {
      return true;
    }

    // Check if the request body contains bank_details
    if (body && body.bank_details !== undefined) {
      // Allow system-level updates (from the bank security service)
      const isSystemUpdate = this.reflector.get<boolean>('allow-bank-update', context.getHandler());
      
      if (!isSystemUpdate) {
        throw new ForbiddenException(
          'Direct modification of bank details is not allowed. Please use the bank detail change request workflow.'
        );
      }
    }

    return true;
  }
}

/**
 * Decorator to allow system-level bank detail updates
 * Used by the bank security service for approved changes
 */
export const AllowBankUpdate = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflector.createDecorator<boolean>()('allow-bank-update')(target, propertyKey, descriptor);
  };
};