import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class LedgerImmutabilityGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    // Only apply to ledger-related endpoints
    if (!url.includes('/ledger') && !url.includes('/stock-ledger')) {
      return true;
    }

    // Block all UPDATE and DELETE operations on ledger entries
    if (method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
      throw new ForbiddenException(
        'Stock ledger entries are immutable and cannot be modified or deleted'
      );
    }

    // For POST operations, validate the ledger entry data
    if (method === 'POST') {
      const body = request.body;
      
      // Ensure required fields are present
      if (!body.product_id || !body.location_id || !body.entry_type || body.quantity_change === undefined) {
        throw new BadRequestException(
          'Invalid ledger entry: product_id, location_id, entry_type, and quantity_change are required'
        );
      }

      // Validate quantity_change is not zero
      if (body.quantity_change === 0) {
        throw new BadRequestException(
          'Invalid ledger entry: quantity_change cannot be zero'
        );
      }

      // Validate entry_type is valid
      const validEntryTypes = [
        'OPENING_BALANCE',
        'PO_RECEIPT',
        'RETURN_TO_SUPPLIER',
        'STOCK_ADJUSTMENT_UP',
        'STOCK_ADJUSTMENT_DOWN',
        'TRANSFER_IN',
        'TRANSFER_OUT',
        'FULFILLMENT',
        'CYCLE_COUNT',
        'SCRAP',
      ];

      if (!validEntryTypes.includes(body.entry_type)) {
        throw new BadRequestException(
          `Invalid entry_type: ${body.entry_type}. Must be one of: ${validEntryTypes.join(', ')}`
        );
      }

      // Add immutability metadata
      body.created_at = new Date();
      body.immutable = true;
    }

    return true;
  }
}