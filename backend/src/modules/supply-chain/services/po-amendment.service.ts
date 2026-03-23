import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SupplyChainNotificationService } from '../supply-chain-notification.service';
import { POStatus, AmendmentStatus, LedgerEntryType } from '@prisma/client';

export interface CreateAmendmentDto {
  poId: string;
  reason: string;
  changes: {
    lines?: {
      id?: string; // For existing lines
      productId: string;
      quantity: number;
      unitPrice: number;
      action: 'ADD' | 'UPDATE' | 'REMOVE';
    }[];
    deliveryDate?: Date;
    paymentTerms?: string;
    specialInstructions?: string;
    supplierId?: string; // For supplier changes
  };
  justification: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ApproveAmendmentDto {
  approved: boolean;
  comments?: string;
  conditions?: string[];
}

@Injectable()
export class POAmendmentService {
  private readonly logger = new Logger(POAmendmentService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: SupplyChainNotificationService,
  ) {}

  /**
   * Create a new PO amendment request
   */
  async createAmendment(
    companyId: string,
    userId: string,
    createAmendmentDto: CreateAmendmentDto,
  ) {
    this.logger.log(`Creating amendment for PO ${createAmendmentDto.poId} by user ${userId}`);

    // Validate original PO
    const originalPO = await this.prisma.opsPurchaseOrder.findUnique({
      where: { id: createAmendmentDto.poId, company_id: companyId },
      include: {
        lines: { include: { product: true } },
        supplier: true,
        purchase_requisition: true,
      },
    });

    if (!originalPO) {
      throw new BadRequestException('Original Purchase Order not found');
    }

    // Check if PO can be amended
    if (![POStatus.APPROVED, POStatus.SENT, POStatus.CONFIRMED, POStatus.PARTIAL].includes(originalPO.status)) {
      throw new ForbiddenException(`PO ${originalPO.po_number} cannot be amended in status ${originalPO.status}`);
    }

    // Check for existing pending amendments
    const existingAmendment = await this.prisma.poAmendment.findFirst({
      where: {
        original_po_id: createAmendmentDto.poId,
        status: { in: [AmendmentStatus.PENDING, AmendmentStatus.APPROVED] },
      },
    });

    if (existingAmendment) {
      throw new BadRequestException('PO already has a pending or approved amendment');
    }

    // Generate amendment number
    const amendmentCount = await this.prisma.poAmendment.count({
      where: { original_po_id: createAmendmentDto.poId },
    });
    const amendmentNumber = `${originalPO.po_number}-AMD-${amendmentCount + 1}`;

    // Calculate new total value
    const newTotalValue = await this.calculateAmendedTotal(originalPO, createAmendmentDto.changes);

    // Create amendment record
    const amendment = await this.prisma.poAmendment.create({
      data: {
        company_id: companyId,
        amendment_number: amendmentNumber,
        original_po_id: createAmendmentDto.poId,
        requested_by: userId,
        reason: createAmendmentDto.reason,
        justification: createAmendmentDto.justification,
        urgency: createAmendmentDto.urgency,
        status: AmendmentStatus.PENDING,
        original_total: originalPO.total_value,
        amended_total: newTotalValue,
        changes: createAmendmentDto.changes as any, // Store as JSON
      },
    });

    // Create audit log entry
    await this.createAmendmentAuditLog(
      companyId,
      amendment.id,
      'AMENDMENT_CREATED',
      userId,
      `Amendment ${amendmentNumber} created for PO ${originalPO.po_number}`,
      { originalTotal: originalPO.total_value, amendedTotal: newTotalValue }
    );

    // Send notification to approvers
    await this.sendAmendmentNotification(amendment, originalPO, 'AMENDMENT_APPROVAL_REQUIRED');

    this.logger.log(`Amendment ${amendmentNumber} created successfully`);

    return {
      ...amendment,
      originalPO: {
        po_number: originalPO.po_number,
        status: originalPO.status,
        supplier: originalPO.supplier.name,
      },
    };
  }

  /**
   * Approve or reject an amendment
   */
  async approveAmendment(
    companyId: string,
    amendmentId: string,
    approverId: string,
    approveDto: ApproveAmendmentDto,
  ) {
    const amendment = await this.prisma.poAmendment.findUnique({
      where: { id: amendmentId, company_id: companyId },
      include: {
        original_po: {
          include: {
            lines: { include: { product: true } },
            supplier: true,
          },
        },
      },
    });

    if (!amendment) {
      throw new BadRequestException('Amendment not found');
    }

    if (amendment.status !== AmendmentStatus.PENDING) {
      throw new BadRequestException('Amendment has already been processed');
    }

    const newStatus = approveDto.approved ? AmendmentStatus.APPROVED : AmendmentStatus.REJECTED;

    // Update amendment status
    const updatedAmendment = await this.prisma.poAmendment.update({
      where: { id: amendmentId },
      data: {
        status: newStatus,
        approved_by: approverId,
        approved_at: new Date(),
        approval_comments: approveDto.comments,
      },
    });

    // Create audit log
    await this.createAmendmentAuditLog(
      companyId,
      amendmentId,
      approveDto.approved ? 'AMENDMENT_APPROVED' : 'AMENDMENT_REJECTED',
      approverId,
      `Amendment ${amendment.amendment_number} ${approveDto.approved ? 'approved' : 'rejected'}`,
      { comments: approveDto.comments, conditions: approveDto.conditions }
    );

    // If approved, apply the amendment
    if (approveDto.approved) {
      await this.applyAmendment(companyId, amendmentId, approverId);
    }

    // Send notifications
    const notificationType = approveDto.approved ? 'AMENDMENT_APPROVED' : 'AMENDMENT_REJECTED';
    await this.sendAmendmentNotification(updatedAmendment, amendment.original_po, notificationType);

    return updatedAmendment;
  }

  /**
   * Apply an approved amendment to the original PO
   */
  async applyAmendment(companyId: string, amendmentId: string, userId: string) {
    const amendment = await this.prisma.poAmendment.findUnique({
      where: { id: amendmentId, company_id: companyId },
      include: {
        original_po: {
          include: {
            lines: { include: { product: true } },
          },
        },
      },
    });

    if (!amendment || amendment.status !== AmendmentStatus.APPROVED) {
      throw new BadRequestException('Amendment not found or not approved');
    }

    const changes = amendment.changes as any;
    const originalPO = amendment.original_po;

    // Start transaction to apply all changes atomically
    await this.prisma.$transaction(async (tx) => {
      // Update PO header fields
      const updateData: any = {
        total_value: amendment.amended_total,
        updated_at: new Date(),
      };

      if (changes.deliveryDate) {
        updateData.delivery_date = new Date(changes.deliveryDate);
      }
      if (changes.paymentTerms) {
        updateData.payment_terms = changes.paymentTerms;
      }
      if (changes.specialInstructions) {
        updateData.special_instructions = changes.specialInstructions;
      }
      if (changes.supplierId) {
        updateData.supplier_id = changes.supplierId;
      }

      // Update the PO
      await tx.opsPurchaseOrder.update({
        where: { id: originalPO.id },
        data: updateData,
      });

      // Apply line changes
      if (changes.lines) {
        for (const lineChange of changes.lines) {
          switch (lineChange.action) {
            case 'ADD':
              await tx.opsPurchaseOrderLine.create({
                data: {
                  po_id: originalPO.id,
                  product_id: lineChange.productId,
                  quantity: lineChange.quantity,
                  unit_price: lineChange.unitPrice,
                },
              });
              break;

            case 'UPDATE':
              if (lineChange.id) {
                await tx.opsPurchaseOrderLine.update({
                  where: { id: lineChange.id },
                  data: {
                    quantity: lineChange.quantity,
                    unit_price: lineChange.unitPrice,
                  },
                });
              }
              break;

            case 'REMOVE':
              if (lineChange.id) {
                await tx.opsPurchaseOrderLine.delete({
                  where: { id: lineChange.id },
                });
              }
              break;
          }
        }
      }

      // Create inventory ledger entries for quantity changes
      await this.createAmendmentLedgerEntries(tx, companyId, originalPO, changes, userId);

      // Mark amendment as applied
      await tx.poAmendment.update({
        where: { id: amendmentId },
        data: {
          status: AmendmentStatus.APPLIED,
          applied_at: new Date(),
          applied_by: userId,
        },
      });
    });

    // Create audit log
    await this.createAmendmentAuditLog(
      companyId,
      amendmentId,
      'AMENDMENT_APPLIED',
      userId,
      `Amendment ${amendment.amendment_number} applied to PO ${originalPO.po_number}`,
      { appliedChanges: changes }
    );

    // Send notification
    await this.notificationService.sendNotification({
      type: 'AMENDMENT_APPLIED',
      title: 'PO Amendment Applied',
      message: `Amendment ${amendment.amendment_number} has been applied to PO ${originalPO.po_number}.`,
      data: {
        amendmentId,
        amendmentNumber: amendment.amendment_number,
        poNumber: originalPO.po_number,
        newTotal: amendment.amended_total,
      },
      channels: ['email'],
    });

    this.logger.log(`Amendment ${amendment.amendment_number} applied successfully`);

    return { message: 'Amendment applied successfully' };
  }

  /**
   * Get amendment history for a PO
   */
  async getAmendmentHistory(companyId: string, poId: string) {
    const amendments = await this.prisma.poAmendment.findMany({
      where: {
        original_po_id: poId,
        company_id: companyId,
      },
      orderBy: { created_at: 'desc' },
    });

    return amendments.map(amendment => ({
      ...amendment,
      changes: amendment.changes as any,
    }));
  }

  /**
   * Get pending amendments for approval
   */
  async getPendingAmendments(companyId: string) {
    return this.prisma.poAmendment.findMany({
      where: {
        company_id: companyId,
        status: AmendmentStatus.PENDING,
      },
      include: {
        original_po: {
          select: {
            po_number: true,
            status: true,
            total_value: true,
            supplier: { select: { name: true } },
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  /**
   * Cancel a pending amendment
   */
  async cancelAmendment(companyId: string, amendmentId: string, userId: string, reason?: string) {
    const amendment = await this.prisma.poAmendment.findUnique({
      where: { id: amendmentId, company_id: companyId },
    });

    if (!amendment) {
      throw new BadRequestException('Amendment not found');
    }

    if (amendment.status !== AmendmentStatus.PENDING) {
      throw new BadRequestException('Only pending amendments can be cancelled');
    }

    const updatedAmendment = await this.prisma.poAmendment.update({
      where: { id: amendmentId },
      data: {
        status: AmendmentStatus.CANCELLED,
        cancelled_by: userId,
        cancelled_at: new Date(),
        cancellation_reason: reason,
      },
    });

    // Create audit log
    await this.createAmendmentAuditLog(
      companyId,
      amendmentId,
      'AMENDMENT_CANCELLED',
      userId,
      `Amendment ${amendment.amendment_number} cancelled`,
      { reason }
    );

    return updatedAmendment;
  }

  /**
   * Calculate the new total value after applying changes
   */
  private async calculateAmendedTotal(originalPO: any, changes: any): Promise<number> {
    let newTotal = Number(originalPO.total_value);

    if (changes.lines) {
      for (const lineChange of changes.lines) {
        switch (lineChange.action) {
          case 'ADD':
            newTotal += lineChange.quantity * lineChange.unitPrice;
            break;

          case 'UPDATE':
            if (lineChange.id) {
              const originalLine = originalPO.lines.find((l: any) => l.id === lineChange.id);
              if (originalLine) {
                newTotal -= Number(originalLine.quantity) * Number(originalLine.unit_price);
                newTotal += lineChange.quantity * lineChange.unitPrice;
              }
            }
            break;

          case 'REMOVE':
            if (lineChange.id) {
              const originalLine = originalPO.lines.find((l: any) => l.id === lineChange.id);
              if (originalLine) {
                newTotal -= Number(originalLine.quantity) * Number(originalLine.unit_price);
              }
            }
            break;
        }
      }
    }

    return Math.max(0, newTotal); // Ensure non-negative total
  }

  /**
   * Create inventory ledger entries for amendment changes
   */
  private async createAmendmentLedgerEntries(
    tx: any,
    companyId: string,
    originalPO: any,
    changes: any,
    userId: string,
  ) {
    if (!changes.lines) return;

    for (const lineChange of changes.lines) {
      if (lineChange.action === 'UPDATE' && lineChange.id) {
        const originalLine = originalPO.lines.find((l: any) => l.id === lineChange.id);
        if (originalLine) {
          const quantityDiff = lineChange.quantity - Number(originalLine.quantity);
          
          if (quantityDiff !== 0) {
            await tx.inventoryLedger.create({
              data: {
                company_id: companyId,
                product_id: originalLine.product_id,
                location_id: originalLine.location_id || 'default', // Would need proper location handling
                entry_type: LedgerEntryType.PO_AMENDMENT,
                quantity_change: quantityDiff,
                reference_id: originalPO.id,
                reference_type: 'PO_AMENDMENT',
                notes: `PO Amendment: ${originalPO.po_number} line quantity changed from ${originalLine.quantity} to ${lineChange.quantity}`,
                created_by: userId,
              },
            });
          }
        }
      }
    }
  }

  /**
   * Create audit log entry for amendment actions
   */
  private async createAmendmentAuditLog(
    companyId: string,
    amendmentId: string,
    action: string,
    userId: string,
    description: string,
    metadata?: any,
  ) {
    await this.prisma.auditLog.create({
      data: {
        company_id: companyId,
        user_id: userId,
        action,
        resource_type: 'PO_AMENDMENT',
        resource_id: amendmentId,
        description,
        metadata: metadata || {},
        ip_address: '0.0.0.0', // Would be extracted from request
        user_agent: 'System', // Would be extracted from request
      },
    });
  }

  /**
   * Get amendment details
   */
  async getAmendmentDetails(companyId: string, amendmentId: string) {
    return this.prisma.poAmendment.findUnique({
      where: { id: amendmentId, company_id: companyId },
      include: {
        original_po: {
          include: {
            lines: { include: { product: true } },
            supplier: true,
          },
        },
        audit_logs: {
          orderBy: { created_at: 'desc' },
        },
      },
    });
  }

  /**
   * Get PO lock status and available actions
   */
  async getPOLockStatus(companyId: string, poId: string) {
    const po = await this.prisma.opsPurchaseOrder.findUnique({
      where: { id: poId, company_id: companyId },
      select: {
        id: true,
        po_number: true,
        status: true,
        is_amended: true,
        amendment_count: true,
        last_amended_at: true,
      },
    });

    if (!po) {
      throw new BadRequestException('Purchase Order not found');
    }

    // Check for pending amendments
    const pendingAmendment = await this.prisma.poAmendment.findFirst({
      where: {
        original_po_id: poId,
        status: { in: [AmendmentStatus.PENDING, AmendmentStatus.APPROVED] },
      },
    });

    // Determine available actions based on status
    const availableActions = [];
    const restrictions = [];

    switch (po.status) {
      case POStatus.DRAFT:
        availableActions.push('UPDATE', 'DELETE', 'SUBMIT_FOR_APPROVAL');
        break;
      
      case POStatus.PENDING_APPROVAL:
        availableActions.push('APPROVE', 'REJECT');
        restrictions.push('Cannot modify PO while pending approval');
        break;
      
      case POStatus.APPROVED:
        availableActions.push('SEND', 'AMEND');
        restrictions.push('Direct modifications not allowed - use amendment process');
        break;
      
      case POStatus.SENT:
      case POStatus.CONFIRMED:
        availableActions.push('AMEND', 'RECEIVE_GOODS');
        restrictions.push('Direct modifications not allowed - use amendment process');
        break;
      
      case POStatus.PARTIAL:
        availableActions.push('AMEND', 'RECEIVE_GOODS');
        restrictions.push('Limited amendments allowed for partially received PO');
        break;
      
      case POStatus.FULLY_RECEIVED:
        restrictions.push('No modifications allowed for fully received PO');
        break;
      
      case POStatus.CANCELLED:
        restrictions.push('No modifications allowed for cancelled PO');
        break;
    }

    if (pendingAmendment) {
      restrictions.push(`Pending amendment ${pendingAmendment.amendment_number} must be processed first`);
      availableActions.length = 0; // Clear available actions
    }

    return {
      po_id: poId,
      po_number: po.po_number,
      status: po.status,
      is_locked: restrictions.length > 0,
      is_amended: po.is_amended,
      amendment_count: po.amendment_count,
      last_amended_at: po.last_amended_at,
      available_actions: availableActions,
      restrictions,
      pending_amendment: pendingAmendment ? {
        id: pendingAmendment.id,
        amendment_number: pendingAmendment.amendment_number,
        status: pendingAmendment.status,
      } : null,
    };
  }

  /**
   * Get amendments with filtering
   */
  async getAmendments(
    companyId: string,
    filters: {
      status?: string;
      poId?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { company_id: companyId };
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.poId) {
      where.original_po_id = filters.poId;
    }

    const [amendments, total] = await Promise.all([
      this.prisma.poAmendment.findMany({
        where,
        include: {
          original_po: {
            select: {
              po_number: true,
              status: true,
              supplier: { select: { name: true } },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.prisma.poAmendment.count({ where }),
    ]);

    return {
      data: amendments.map(amendment => ({
        ...amendment,
        changes: amendment.changes as any,
      })),
      total,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    };
  }

}
