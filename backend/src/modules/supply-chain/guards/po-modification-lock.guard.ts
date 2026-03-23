import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../database/prisma.service';
import { POStatus } from '@prisma/client';

export interface POModificationContext {
  poId: string;
  operation: 'UPDATE' | 'DELETE' | 'AMEND' | 'APPROVE' | 'SEND';
  allowedStatuses?: POStatus[];
  requiresAmendment?: boolean;
}

@Injectable()
export class POModificationLockGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { poId, operation } = this.extractPOContext(request);

    if (!poId) {
      throw new BadRequestException('PO ID is required for modification operations');
    }

    // Get PO details
    const po = await this.prisma.opsPurchaseOrder.findUnique({
      where: { id: poId },
      select: {
        id: true,
        po_number: true,
        status: true,
        total_value: true,
        created_at: true,
        updated_at: true,
        company_id: true,
      },
    });

    if (!po) {
      throw new BadRequestException('Purchase Order not found');
    }

    // Check if operation is allowed based on PO status
    const isAllowed = await this.checkOperationAllowed(po, operation);
    
    if (!isAllowed.allowed) {
      throw new ForbiddenException(
        `Cannot ${operation.toLowerCase()} PO ${po.po_number}: ${isAllowed.reason}`
      );
    }

    // Add PO context to request for use in controllers
    request.poContext = {
      po,
      operation,
      requiresAmendment: isAllowed.requiresAmendment,
    };

    return true;
  }

  private extractPOContext(request: any): { poId: string; operation: string } {
    // Extract PO ID from various sources
    const poId = request.params?.poId || 
                 request.params?.id || 
                 request.body?.poId || 
                 request.query?.poId;

    // Determine operation from HTTP method and route
    let operation = 'UPDATE';
    
    if (request.method === 'DELETE') {
      operation = 'DELETE';
    } else if (request.route?.path?.includes('/amend')) {
      operation = 'AMEND';
    } else if (request.route?.path?.includes('/approve')) {
      operation = 'APPROVE';
    } else if (request.route?.path?.includes('/send')) {
      operation = 'SEND';
    }

    return { poId, operation };
  }

  private async checkOperationAllowed(
    po: any,
    operation: string,
  ): Promise<{ allowed: boolean; reason?: string; requiresAmendment?: boolean }> {
    const status = po.status as POStatus;

    switch (operation) {
      case 'UPDATE':
        return this.checkUpdateAllowed(status);
      
      case 'DELETE':
        return this.checkDeleteAllowed(status);
      
      case 'AMEND':
        return this.checkAmendAllowed(status);
      
      case 'APPROVE':
        return this.checkApproveAllowed(status);
      
      case 'SEND':
        return this.checkSendAllowed(status);
      
      default:
        return { allowed: false, reason: 'Unknown operation' };
    }
  }

  private checkUpdateAllowed(status: POStatus): { allowed: boolean; reason?: string; requiresAmendment?: boolean } {
    switch (status) {
      case POStatus.DRAFT:
        return { allowed: true };
      
      case POStatus.PENDING_APPROVAL:
        return { allowed: false, reason: 'PO is pending approval and cannot be modified' };
      
      case POStatus.APPROVED:
        return { 
          allowed: false, 
          reason: 'Approved PO cannot be directly modified. Use amendment process instead.',
          requiresAmendment: true,
        };
      
      case POStatus.SENT:
        return { 
          allowed: false, 
          reason: 'Sent PO cannot be directly modified. Use amendment process instead.',
          requiresAmendment: true,
        };
      
      case POStatus.CONFIRMED:
        return { 
          allowed: false, 
          reason: 'Confirmed PO cannot be directly modified. Use amendment process instead.',
          requiresAmendment: true,
        };
      
      case POStatus.PARTIAL:
      case POStatus.FULLY_RECEIVED:
        return { 
          allowed: false, 
          reason: 'Received PO cannot be modified. Contact procurement team for assistance.',
        };
      
      case POStatus.CANCELLED:
        return { allowed: false, reason: 'Cancelled PO cannot be modified' };
      
      default:
        return { allowed: false, reason: 'Invalid PO status' };
    }
  }

  private checkDeleteAllowed(status: POStatus): { allowed: boolean; reason?: string } {
    switch (status) {
      case POStatus.DRAFT:
        return { allowed: true };
      
      case POStatus.PENDING_APPROVAL:
        return { allowed: false, reason: 'PO pending approval cannot be deleted. Reject it instead.' };
      
      default:
        return { allowed: false, reason: 'Only draft POs can be deleted' };
    }
  }

  private checkAmendAllowed(status: POStatus): { allowed: boolean; reason?: string } {
    switch (status) {
      case POStatus.DRAFT:
        return { allowed: false, reason: 'Draft PO should be updated directly, not amended' };
      
      case POStatus.PENDING_APPROVAL:
        return { allowed: false, reason: 'PO pending approval cannot be amended. Reject and recreate instead.' };
      
      case POStatus.APPROVED:
      case POStatus.SENT:
      case POStatus.CONFIRMED:
        return { allowed: true };
      
      case POStatus.PARTIAL:
        return { allowed: true }; // Allow amendments for partially received POs
      
      case POStatus.FULLY_RECEIVED:
        return { allowed: false, reason: 'Fully received PO cannot be amended' };
      
      case POStatus.CANCELLED:
        return { allowed: false, reason: 'Cancelled PO cannot be amended' };
      
      default:
        return { allowed: false, reason: 'Invalid PO status for amendment' };
    }
  }

  private checkApproveAllowed(status: POStatus): { allowed: boolean; reason?: string } {
    switch (status) {
      case POStatus.PENDING_APPROVAL:
        return { allowed: true };
      
      case POStatus.DRAFT:
        return { allowed: false, reason: 'PO must be submitted for approval first' };
      
      case POStatus.APPROVED:
        return { allowed: false, reason: 'PO is already approved' };
      
      default:
        return { allowed: false, reason: 'PO cannot be approved in current status' };
    }
  }

  private checkSendAllowed(status: POStatus): { allowed: boolean; reason?: string } {
    switch (status) {
      case POStatus.APPROVED:
        return { allowed: true };
      
      case POStatus.DRAFT:
        return { allowed: false, reason: 'PO must be approved before sending' };
      
      case POStatus.PENDING_APPROVAL:
        return { allowed: false, reason: 'PO must be approved before sending' };
      
      case POStatus.SENT:
        return { allowed: false, reason: 'PO has already been sent' };
      
      default:
        return { allowed: false, reason: 'PO cannot be sent in current status' };
    }
  }
}