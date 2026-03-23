import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LedgerEntryType } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // --- Stock Ledger Engine (Immutable) ---

  async createLedgerEntry(companyId: string, data: any) {
    const { 
      product_id, 
      location_id, 
      entry_type, 
      quantity_change, 
      reference_id, 
      reason_code, 
      user_id 
    } = data;

    // Validate product and location exist
    const product = await this.prisma.product.findUnique({
      where: { id: product_id, company_id: companyId }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const location = await this.prisma.location.findUnique({
      where: { id: location_id, company_id: companyId }
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Validate quantity change based on entry type
    if (this.isOutboundEntry(entry_type) && quantity_change > 0) {
      throw new BadRequestException('Outbound entries must have negative quantity change');
    }

    if (this.isInboundEntry(entry_type) && quantity_change < 0) {
      throw new BadRequestException('Inbound entries must have positive quantity change');
    }

    // Create ledger entry (immutable - no updates allowed)
    const ledgerEntry = await this.prisma.stockLedger.create({
      data: {
        company_id: companyId,
        product_id,
        location_id,
        entry_type,
        quantity_change,
        reference_id,
        reason_code,
        user_id,
      },
    });

    // Update stock level cache
    await this.updateStockLevel(companyId, product_id, location_id);

    return ledgerEntry;
  }

  private isInboundEntry(entryType: LedgerEntryType): boolean {
    const inboundTypes: LedgerEntryType[] = [
      LedgerEntryType.OPENING_BALANCE,
      LedgerEntryType.PO_RECEIPT,
      LedgerEntryType.STOCK_ADJUSTMENT_UP,
      LedgerEntryType.TRANSFER_IN,
    ];
    return inboundTypes.includes(entryType);
  }

  private isOutboundEntry(entryType: LedgerEntryType): boolean {
    const outboundTypes: LedgerEntryType[] = [
      LedgerEntryType.RETURN_TO_SUPPLIER,
      LedgerEntryType.STOCK_ADJUSTMENT_DOWN,
      LedgerEntryType.TRANSFER_OUT,
      LedgerEntryType.FULFILLMENT,
      LedgerEntryType.SCRAP,
    ];
    return outboundTypes.includes(entryType);
  }

  // --- Stock Level Aggregation & Caching ---

  async updateStockLevel(companyId: string, productId: string, locationId: string) {
    // Calculate current stock from ledger entries
    const result = await this.prisma.stockLedger.aggregate({
      where: {
        company_id: companyId,
        product_id: productId,
        location_id: locationId,
      },
      _sum: {
        quantity_change: true,
      },
    });

    const currentQuantity = result._sum.quantity_change || 0;

    // Update or create stock level record
    await this.prisma.stockLevel.upsert({
      where: {
        company_id_product_id_location_id: {
          company_id: companyId,
          product_id: productId,
          location_id: locationId,
        },
      },
      update: {
        quantity: currentQuantity,
        cache_updated_at: new Date(),
      },
      create: {
        company_id: companyId,
        product_id: productId,
        location_id: locationId,
        quantity: currentQuantity,
        cache_updated_at: new Date(),
      },
    });

    return currentQuantity;
  }

  async recalculateAllStockLevels(companyId: string) {
    // Get all unique product-location combinations
    const combinations = await this.prisma.stockLedger.findMany({
      where: { company_id: companyId },
      select: {
        product_id: true,
        location_id: true,
      },
      distinct: ['product_id', 'location_id'],
    });

    const results = [];
    for (const combo of combinations) {
      const quantity = await this.updateStockLevel(
        companyId,
        combo.product_id,
        combo.location_id,
      );
      results.push({
        product_id: combo.product_id,
        location_id: combo.location_id,
        quantity,
      });
    }

    return results;
  }

  // --- Stock Queries ---

  async getStockLevels(companyId: string, filters?: any) {
    const { product_id, location_id, low_stock_only } = filters || {};

    const where: any = { company_id: companyId };

    if (product_id) where.product_id = product_id;
    if (location_id) where.location_id = location_id;

    let stockLevels = await this.prisma.stockLevel.findMany({
      where,
      include: {
        product: true,
        location: true,
      },
      orderBy: [
        { product: { sku: 'asc' } },
        { location: { name: 'asc' } },
      ],
    });

    // Filter for low stock if requested
    if (low_stock_only) {
      stockLevels = stockLevels.filter(sl => 
        sl.reorder_point && Number(sl.quantity) <= Number(sl.reorder_point)
      );
    }

    return stockLevels;
  }

  async getStockHistory(companyId: string, productId: string, locationId?: string, limit = 100) {
    const where: any = {
      company_id: companyId,
      product_id: productId,
    };

    if (locationId) where.location_id = locationId;

    return this.prisma.stockLedger.findMany({
      where,
      include: {
        product: true,
        location: true,
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  // --- Stock Movements ---

  async receiveStock(companyId: string, data: any, userId?: string) {
    const { product_id, location_id, quantity, reference_id, reason_code } = data;

    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be positive for stock receipt');
    }

    return this.createLedgerEntry(companyId, {
      product_id,
      location_id,
      entry_type: LedgerEntryType.PO_RECEIPT,
      quantity_change: quantity,
      reference_id,
      reason_code: reason_code || 'GOODS_RECEIPT',
      user_id: userId,
    });
  }

  async adjustStock(companyId: string, data: any, userId?: string) {
    const { product_id, location_id, quantity_change, reason_code } = data;

    if (quantity_change === 0) {
      throw new BadRequestException('Quantity change cannot be zero');
    }

    const entry_type = quantity_change > 0 
      ? LedgerEntryType.STOCK_ADJUSTMENT_UP 
      : LedgerEntryType.STOCK_ADJUSTMENT_DOWN;

    return this.createLedgerEntry(companyId, {
      product_id,
      location_id,
      entry_type,
      quantity_change: Math.abs(quantity_change) * (quantity_change > 0 ? 1 : -1),
      reason_code: reason_code || 'MANUAL_ADJUSTMENT',
      user_id: userId,
    });
  }

  async transferStock(companyId: string, data: any, userId?: string) {
    const { product_id, from_location_id, to_location_id, quantity, reference_id } = data;

    if (quantity <= 0) {
      throw new BadRequestException('Transfer quantity must be positive');
    }

    // Check if source has enough stock
    const sourceStock = await this.prisma.stockLevel.findUnique({
      where: {
        company_id_product_id_location_id: {
          company_id: companyId,
          product_id,
          location_id: from_location_id,
        },
      },
    });

    if (!sourceStock || Number(sourceStock.quantity) < quantity) {
      throw new BadRequestException('Insufficient stock at source location');
    }

    // Create both entries in a transaction
    return this.prisma.$transaction(async (tx) => {
      // Outbound from source
      const outbound = await tx.stockLedger.create({
        data: {
          company_id: companyId,
          product_id,
          location_id: from_location_id,
          entry_type: LedgerEntryType.TRANSFER_OUT,
          quantity_change: -quantity,
          reference_id,
          reason_code: 'STOCK_TRANSFER',
          user_id: userId,
        },
      });

      // Inbound to destination
      const inbound = await tx.stockLedger.create({
        data: {
          company_id: companyId,
          product_id,
          location_id: to_location_id,
          entry_type: LedgerEntryType.TRANSFER_IN,
          quantity_change: quantity,
          reference_id,
          reason_code: 'STOCK_TRANSFER',
          user_id: userId,
        },
      });

      return { outbound, inbound };
    });
  }

  async fulfillStock(companyId: string, data: any, userId?: string) {
    const { product_id, location_id, quantity, reference_id } = data;

    if (quantity <= 0) {
      throw new BadRequestException('Fulfillment quantity must be positive');
    }

    // Check stock availability
    const stockLevel = await this.prisma.stockLevel.findUnique({
      where: {
        company_id_product_id_location_id: {
          company_id: companyId,
          product_id,
          location_id,
        },
      },
    });

    if (!stockLevel || Number(stockLevel.quantity) < quantity) {
      throw new BadRequestException('Insufficient stock for fulfillment');
    }

    return this.createLedgerEntry(companyId, {
      product_id,
      location_id,
      entry_type: LedgerEntryType.FULFILLMENT,
      quantity_change: -quantity,
      reference_id,
      reason_code: 'ORDER_FULFILLMENT',
      user_id: userId,
    });
  }

  // --- Reorder Point Management ---

  async updateReorderPoint(companyId: string, productId: string, locationId: string, reorderPoint: number, eoq?: number) {
    const stockLevel = await this.prisma.stockLevel.findUnique({
      where: {
        company_id_product_id_location_id: {
          company_id: companyId,
          product_id: productId,
          location_id: locationId,
        },
      },
    });

    if (!stockLevel) {
      throw new NotFoundException('Stock level record not found');
    }

    return this.prisma.stockLevel.update({
      where: {
        company_id_product_id_location_id: {
          company_id: companyId,
          product_id: productId,
          location_id: locationId,
        },
      },
      data: {
        reorder_point: reorderPoint,
        eoq: eoq || stockLevel.eoq,
      },
    });
  }

  async getLowStockAlerts(companyId: string) {
    return this.prisma.stockLevel.findMany({
      where: {
        company_id: companyId,
        AND: [
          { reorder_point: { not: null } },
          { 
            quantity: {
              lte: this.prisma.stockLevel.fields.reorder_point
            }
          }
        ]
      },
      include: {
        product: true,
        location: true,
      },
      orderBy: [
        { product: { sku: 'asc' } },
        { location: { name: 'asc' } },
      ],
    });
  }
}