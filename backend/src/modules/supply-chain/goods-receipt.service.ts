import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SupplyChainNotificationService } from './supply-chain-notification.service';
import { InventoryService } from './inventory.service';
import { GRStatus, LedgerEntryType, POStatus } from '@prisma/client';
import { ResolveGoodsReceiptDto } from './dto/goods-receipt.dto';

export interface CreateGoodsReceiptDto {
  poId: string;
  locationId: string;
  receivedBy?: string;
  items: {
    productId: string;
    receivedQty: number;
    rejectedQty?: number;
    rejectionReason?: string;
    qualityNotes?: string;
    batchNumber?: string;
    expiryDate?: Date;
  }[];
  deliveryNote?: string;
  supplierReference?: string;
  notes?: string;
}

export interface DiscrepancyReport {
  grId: string;
  grNumber: string;
  poNumber: string;
  supplierName: string;
  totalDiscrepancies: number;
  items: {
    productSku: string;
    productName: string;
    orderedQty: number;
    receivedQty: number;
    rejectedQty: number;
    discrepancyType: 'QUANTITY_SHORT' | 'QUANTITY_OVER' | 'QUALITY_ISSUE' | 'DAMAGED' | 'WRONG_ITEM';
    discrepancyValue: number;
    rejectionReason?: string;
  }[];
  financialImpact: {
    expectedValue: number;
    receivedValue: number;
    lossValue: number;
  };
  recommendedActions: string[];
}

@Injectable()
export class GoodsReceiptService {
  private readonly logger = new Logger(GoodsReceiptService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: SupplyChainNotificationService,
    private inventoryService: InventoryService,
  ) {}

  private async getCompanyPO(companyId: string, poId: string, include?: any) {
    const po = await this.prisma.opsPurchaseOrder.findFirst({
      where: { id: poId, company_id: companyId },
      include,
    });

    if (!po) {
      throw new BadRequestException('Purchase Order not found');
    }

    return po;
  }

  private async getCompanyGR(companyId: string, grId: string, include?: any) {
    const gr = await this.prisma.opsGoodsReceipt.findFirst({
      where: { id: grId, company_id: companyId },
      include,
    });

    if (!gr) {
      throw new BadRequestException('Goods Receipt not found');
    }

    return gr;
  }

  /**
   * Create a new Goods Receipt
   */
  async createGoodsReceipt(
    companyId: string,
    userId: string,
    createGRDto: CreateGoodsReceiptDto,
  ) {
    this.logger.log(`Creating goods receipt for PO ${createGRDto.poId}`);

    // Validate PO exists and is in correct status
    const po = await this.getCompanyPO(companyId, createGRDto.poId, {
      supplier: true,
      lines: {
        include: {
          product: true,
        },
      },
    });

    if (![POStatus.SENT, POStatus.PARTIAL, POStatus.APPROVED].includes(po.status)) {
      throw new BadRequestException('PO must be sent to supplier before goods can be received');
    }

    // Generate GR number
    const grCount = await this.prisma.opsGoodsReceipt.count({
      where: { company_id: companyId },
    });
    const grNumber = `GR-${new Date().getFullYear()}-${String(grCount + 1).padStart(4, '0')}`;

    // Validate all items exist in PO
    for (const item of createGRDto.items) {
      const poLine = po.lines.find(line => line.product_id === item.productId);
      if (!poLine) {
        throw new BadRequestException(`Product ${item.productId} not found in PO`);
      }

      // Check if receiving more than ordered
      const totalReceived = Number(poLine.received_qty) + item.receivedQty;
      if (totalReceived > Number(poLine.quantity)) {
        throw new BadRequestException(
          `Cannot receive ${item.receivedQty} of ${poLine.product.sku}. ` +
          `Ordered: ${poLine.quantity}, Already received: ${poLine.received_qty}, ` +
          `Remaining: ${Number(poLine.quantity) - Number(poLine.received_qty)}`
        );
      }
    }

    // Create goods receipt
    const gr = await this.prisma.opsGoodsReceipt.create({
      data: {
        company_id: companyId,
        gr_number: grNumber,
        po_id: createGRDto.poId,
        location_id: createGRDto.locationId,
        received_by: userId,
        status: GRStatus.DRAFT,
        lines: {
          create: createGRDto.items.map(item => ({
            product_id: item.productId,
            received_qty: item.receivedQty,
            rejected_qty: item.rejectedQty || 0,
            rejection_reason: item.rejectionReason,
          })),
        },
      },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
        po: {
          include: {
            supplier: true,
          },
        },
        location: true,
      },
    });

    // Check for discrepancies
    const discrepancies = await this.analyzeDiscrepancies(gr);

    // Set status based on discrepancies
    const finalStatus = discrepancies.totalDiscrepancies > 0 ? GRStatus.DISCREPANCY : GRStatus.SUBMITTED;
    
    const updatedGR = await this.prisma.opsGoodsReceipt.update({
      where: { id: gr.id },
      data: { status: finalStatus },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
        po: {
          include: {
            supplier: true,
          },
        },
        location: true,
      },
    });

    this.logger.log(`Created GR ${grNumber} with status ${finalStatus}`);

    // Send notifications based on status
    if (finalStatus === GRStatus.DISCREPANCY) {
      await this.notifyDiscrepancy(updatedGR, discrepancies);
    } else {
      await this.notificationService.notifyGoodsReceived(companyId, gr.id);
    }

    return {
      ...updatedGR,
      discrepancies,
      hasDiscrepancies: discrepancies.totalDiscrepancies > 0,
    };
  }

  /**
   * Complete goods receipt (move inventory and update PO status)
   */
  async completeGoodsReceipt(companyId: string, grId: string, userId: string) {
    const gr = await this.getCompanyGR(companyId, grId, {
      lines: {
        include: {
          product: true,
        },
      },
      po: {
        include: {
          lines: true,
        },
      },
      location: true,
    });

    if (gr.status === GRStatus.COMPLETED) {
      throw new BadRequestException('Goods Receipt already completed');
    }

    // Process inventory movements for received items
    for (const grLine of gr.lines) {
      if (Number(grLine.received_qty) > 0) {
        await this.inventoryService.receiveStock(companyId, {
          productId: grLine.product_id,
          locationId: gr.location_id,
          quantity: Number(grLine.received_qty),
          referenceId: gr.id,
          reasonCode: 'GOODS_RECEIPT',
        }, userId);
      }

      // Handle rejections (create return to supplier entry)
      if (Number(grLine.rejected_qty) > 0) {
        await this.inventoryService.createLedgerEntry(companyId, {
          productId: grLine.product_id,
          locationId: gr.location_id,
          entryType: LedgerEntryType.RETURN_TO_SUPPLIER,
          quantityChange: -Number(grLine.rejected_qty),
          referenceId: gr.id,
          reasonCode: 'QUALITY_REJECTION',
          userId,
        });
      }
    }

    // Update PO line received quantities
    for (const grLine of gr.lines) {
      const poLine = gr.po.lines.find(line => line.product_id === grLine.product_id);
      if (poLine) {
        await this.prisma.pOLineItem.update({
          where: { id: poLine.id },
          data: {
            received_qty: Number(poLine.received_qty) + Number(grLine.received_qty),
          },
        });
      }
    }

    // Update GR status
    const completedGR = await this.prisma.opsGoodsReceipt.update({
      where: { id: grId },
      data: { status: GRStatus.COMPLETED },
    });

    // Check if PO is fully received
    const updatedPO = await this.prisma.opsPurchaseOrder.findUnique({
      where: { id: gr.po_id },
      include: { lines: true },
    });

    if (updatedPO) {
      const isFullyReceived = updatedPO.lines.every(line => 
        Number(line.received_qty) >= Number(line.quantity)
      );
      
      const hasPartialReceipts = updatedPO.lines.some(line => 
        Number(line.received_qty) > 0
      );

      let newPOStatus = updatedPO.status;
      if (isFullyReceived) {
        newPOStatus = POStatus.FULLY_RECEIVED;
      } else if (hasPartialReceipts) {
        newPOStatus = POStatus.PARTIAL;
      }

      if (newPOStatus !== updatedPO.status) {
        await this.prisma.opsPurchaseOrder.update({
          where: { id: gr.po_id },
          data: { status: newPOStatus },
        });
      }
    }

    this.logger.log(`Completed GR ${gr.gr_number}`);

    // Send completion notification
    await this.notificationService.notifyGoodsReceived(companyId, grId);

    return completedGR;
  }

  /**
   * Analyze discrepancies between PO and GR
   */
  async analyzeDiscrepancies(gr: any): Promise<DiscrepancyReport> {
    const po = gr.po;
    const discrepancyItems = [];
    let totalDiscrepancies = 0;
    let expectedValue = 0;
    let receivedValue = 0;

    for (const grLine of gr.lines) {
      const poLine = po.lines.find((line: any) => line.product_id === grLine.product_id);
      if (!poLine) continue;

      const orderedQty = Number(poLine.quantity);
      const receivedQty = Number(grLine.received_qty);
      const rejectedQty = Number(grLine.rejected_qty);
      const unitPrice = Number(poLine.unit_price);

      expectedValue += orderedQty * unitPrice;
      receivedValue += receivedQty * unitPrice;

      // Check for discrepancies
      const discrepancies = [];
      
      if (receivedQty + rejectedQty < orderedQty) {
        discrepancies.push('QUANTITY_SHORT');
      }
      
      if (receivedQty + rejectedQty > orderedQty) {
        discrepancies.push('QUANTITY_OVER');
      }
      
      if (rejectedQty > 0) {
        discrepancies.push('QUALITY_ISSUE');
      }

      if (discrepancies.length > 0) {
        totalDiscrepancies++;
        
        discrepancyItems.push({
          productSku: grLine.product.sku,
          productName: grLine.product.name,
          orderedQty,
          receivedQty,
          rejectedQty,
          discrepancyType: discrepancies[0] as any,
          discrepancyValue: Math.abs(orderedQty - receivedQty - rejectedQty),
          rejectionReason: grLine.rejection_reason,
        });
      }
    }

    // Generate recommended actions
    const recommendedActions = [];
    if (totalDiscrepancies > 0) {
      recommendedActions.push('Review discrepancies with supplier');
      
      if (discrepancyItems.some(item => item.discrepancyType === 'QUANTITY_SHORT')) {
        recommendedActions.push('Request delivery of missing items');
      }
      
      if (discrepancyItems.some(item => item.discrepancyType === 'QUALITY_ISSUE')) {
        recommendedActions.push('Initiate quality complaint with supplier');
        recommendedActions.push('Request replacement for rejected items');
      }
      
      if (discrepancyItems.some(item => item.discrepancyType === 'QUANTITY_OVER')) {
        recommendedActions.push('Verify if over-delivery was authorized');
      }
    }

    return {
      grId: gr.id,
      grNumber: gr.gr_number,
      poNumber: po.po_number,
      supplierName: po.supplier.name,
      totalDiscrepancies,
      items: discrepancyItems,
      financialImpact: {
        expectedValue,
        receivedValue,
        lossValue: expectedValue - receivedValue,
      },
      recommendedActions,
    };
  }

  /**
   * Get goods receipt details
   */
  async getGoodsReceipt(companyId: string, grId: string) {
    const gr = await this.getCompanyGR(companyId, grId, {
      lines: {
        include: {
          product: true,
          supplier_rejections: true,
        },
      },
      po: {
        include: {
          supplier: true,
          lines: true,
        },
      },
      location: true,
    });

    const discrepancies = await this.analyzeDiscrepancies(gr);

    return {
      ...gr,
      discrepancies,
      hasDiscrepancies: discrepancies.totalDiscrepancies > 0,
    };
  }

  /**
   * Get goods receipts for a PO
   */
  async getGoodsReceiptsForPO(companyId: string, poId: string) {
    return this.prisma.opsGoodsReceipt.findMany({
      where: { po_id: poId, company_id: companyId },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
        location: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Get pending goods receipts (with discrepancies)
   */
  async getPendingGoodsReceipts(companyId: string) {
    return this.prisma.opsGoodsReceipt.findMany({
      where: { 
        company_id: companyId,
        status: GRStatus.DISCREPANCY,
      },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
        po: {
          include: {
            supplier: true,
          },
        },
        location: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Resolve discrepancy (approve or reject)
   */
  async resolveDiscrepancy(
    companyId: string,
    grId: string,
    userId: string,
    resolution: ResolveGoodsReceiptDto,
  ) {
    const gr = await this.getCompanyGR(companyId, grId, {
      lines: {
        include: {
          product: true,
        },
      },
    });

    if (gr.status !== GRStatus.DISCREPANCY) {
      throw new BadRequestException('Goods Receipt does not have discrepancies to resolve');
    }

    if (resolution.approved) {
      // Apply any adjustments
      if (resolution.adjustments) {
        for (const adjustment of resolution.adjustments) {
          await this.prisma.gRLineItem.updateMany({
            where: {
              gr_id: grId,
              product_id: adjustment.productId,
            },
            data: {
              received_qty: adjustment.adjustedQty,
            },
          });
        }
      }

      // Complete the goods receipt
      return this.completeGoodsReceipt(companyId, grId, userId);
    } else {
      // Reject the goods receipt
      const rejectedGR = await this.prisma.opsGoodsReceipt.update({
        where: { id: grId },
        data: { status: GRStatus.DRAFT }, // Back to draft for re-processing
      });

      // Send rejection notification (using existing notification method)
      await this.notificationService.notifyDiscrepancy(companyId, grId);

      return rejectedGR;
    }
  }

  /**
   * Get discrepancy statistics for dashboard
   */
  async getDiscrepancyStats(companyId: string, dateRange?: { from: Date; to: Date }) {
    const whereClause: any = { company_id: companyId };
    
    if (dateRange) {
      whereClause.created_at = {
        gte: dateRange.from,
        lte: dateRange.to,
      };
    }

    const totalGRs = await this.prisma.opsGoodsReceipt.count({ where: whereClause });
    
    const discrepancyGRs = await this.prisma.opsGoodsReceipt.count({
      where: { ...whereClause, status: GRStatus.DISCREPANCY },
    });

    const completedGRs = await this.prisma.opsGoodsReceipt.count({
      where: { ...whereClause, status: GRStatus.COMPLETED },
    });

    const discrepancyRate = totalGRs > 0 ? (discrepancyGRs / totalGRs) * 100 : 0;

    return {
      totalGoodsReceipts: totalGRs,
      withDiscrepancies: discrepancyGRs,
      completed: completedGRs,
      discrepancyRate: Math.round(discrepancyRate * 100) / 100,
      pendingResolution: discrepancyGRs,
    };
  }

  /**
   * Send discrepancy notification
   */
  private async notifyDiscrepancy(gr: any, discrepancies: DiscrepancyReport) {
    await this.notificationService.notifyDiscrepancy(gr.company_id, gr.id);
  }
}
