import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export interface LedgerAuditEntry {
  id: string;
  company_id: string;
  ledger_entry_id: string;
  action: 'CREATE' | 'READ' | 'ATTEMPTED_UPDATE' | 'ATTEMPTED_DELETE';
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  request_data?: any;
  created_at: Date;
}

@Injectable()
export class LedgerAuditService {
  constructor(private prisma: PrismaService) {}

  async logLedgerOperation(
    companyId: string,
    action: 'CREATE' | 'READ' | 'ATTEMPTED_UPDATE' | 'ATTEMPTED_DELETE',
    ledgerEntryId?: string,
    userId?: string,
    metadata?: {
      ip_address?: string;
      user_agent?: string;
      request_data?: any;
    }
  ) {
    // Log to activity log table
    await this.prisma.activityLog.create({
      data: {
        company_id: companyId,
        user_id: userId,
        action: `LEDGER_${action}`,
        resource_type: 'stock_ledger',
        resource_id: ledgerEntryId,
        details: {
          action,
          ledger_entry_id: ledgerEntryId,
          ...metadata,
        },
        ip_address: metadata?.ip_address,
        user_agent: metadata?.user_agent,
      },
    });
  }

  async validateLedgerIntegrity(companyId: string, productId?: string, locationId?: string) {
    const where: any = { company_id: companyId };
    if (productId) where.product_id = productId;
    if (locationId) where.location_id = locationId;

    // Get all ledger entries
    const ledgerEntries = await this.prisma.stockLedger.findMany({
      where,
      orderBy: { created_at: 'asc' },
      include: {
        product: { select: { sku: true, name: true } },
        location: { select: { name: true } },
      },
    });

    // Group by product-location combinations
    const combinations = new Map<string, any[]>();
    
    for (const entry of ledgerEntries) {
      const key = `${entry.product_id}-${entry.location_id}`;
      if (!combinations.has(key)) {
        combinations.set(key, []);
      }
      combinations.get(key)!.push(entry);
    }

    const integrityReport = [];

    // Validate each combination
    for (const [key, entries] of combinations) {
      const [productId, locationId] = key.split('-');
      
      // Calculate running balance
      let runningBalance = 0;
      const entryValidation = [];

      for (const entry of entries) {
        const previousBalance = runningBalance;
        runningBalance += Number(entry.quantity_change);

        entryValidation.push({
          id: entry.id,
          created_at: entry.created_at,
          entry_type: entry.entry_type,
          quantity_change: entry.quantity_change,
          previous_balance: previousBalance,
          new_balance: runningBalance,
          is_valid: true, // All entries are valid since they're immutable
        });
      }

      // Get current stock level from cache
      const stockLevel = await this.prisma.stockLevel.findUnique({
        where: {
          company_id_product_id_location_id: {
            company_id: companyId,
            product_id: productId,
            location_id: locationId,
          },
        },
      });

      const product = entries[0]?.product;
      const location = entries[0]?.location;

      integrityReport.push({
        product_id: productId,
        location_id: locationId,
        product_sku: product?.sku,
        product_name: product?.name,
        location_name: location?.name,
        calculated_balance: runningBalance,
        cached_balance: stockLevel?.quantity || 0,
        balance_matches: Number(stockLevel?.quantity || 0) === runningBalance,
        entry_count: entries.length,
        entries: entryValidation,
      });
    }

    return {
      company_id: companyId,
      validation_timestamp: new Date(),
      total_combinations: integrityReport.length,
      integrity_violations: integrityReport.filter(r => !r.balance_matches).length,
      report: integrityReport,
    };
  }

  async getLedgerAuditTrail(
    companyId: string,
    filters?: {
      product_id?: string;
      location_id?: string;
      user_id?: string;
      start_date?: Date;
      end_date?: Date;
      action?: string;
    }
  ) {
    const where: any = {
      company_id: companyId,
      resource_type: 'stock_ledger',
    };

    if (filters?.user_id) where.user_id = filters.user_id;
    if (filters?.action) where.action = { contains: filters.action };
    if (filters?.start_date || filters?.end_date) {
      where.created_at = {};
      if (filters.start_date) where.created_at.gte = filters.start_date;
      if (filters.end_date) where.created_at.lte = filters.end_date;
    }

    const auditEntries = await this.prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 1000, // Limit to prevent large responses
    });

    // Filter by product/location if specified
    let filteredEntries = auditEntries;
    if (filters?.product_id || filters?.location_id) {
      filteredEntries = auditEntries.filter(entry => {
        const details = entry.details as any;
        if (filters.product_id && details?.product_id !== filters.product_id) return false;
        if (filters.location_id && details?.location_id !== filters.location_id) return false;
        return true;
      });
    }

    return {
      total_entries: filteredEntries.length,
      entries: filteredEntries.map(entry => ({
        id: entry.id,
        action: entry.action,
        resource_id: entry.resource_id,
        user: entry.user ? {
          name: `${entry.user.first_name} ${entry.user.last_name}`,
          email: entry.user.email,
        } : null,
        ip_address: entry.ip_address,
        details: entry.details,
        created_at: entry.created_at,
      })),
    };
  }

  async detectAnomalies(companyId: string) {
    // Detect potential anomalies in ledger entries
    const anomalies = [];

    // 1. Check for unusually large quantity changes
    const largeQuantityChanges = await this.prisma.stockLedger.findMany({
      where: {
        company_id: companyId,
        OR: [
          { quantity_change: { gt: 10000 } },
          { quantity_change: { lt: -10000 } },
        ],
      },
      include: {
        product: { select: { sku: true, name: true } },
        location: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    if (largeQuantityChanges.length > 0) {
      anomalies.push({
        type: 'LARGE_QUANTITY_CHANGES',
        description: 'Unusually large quantity changes detected',
        count: largeQuantityChanges.length,
        entries: largeQuantityChanges,
      });
    }

    // 2. Check for rapid successive entries (potential data entry errors)
    const rapidEntries = await this.prisma.$queryRaw`
      SELECT 
        product_id,
        location_id,
        COUNT(*) as entry_count,
        MIN(created_at) as first_entry,
        MAX(created_at) as last_entry
      FROM "StockLedger"
      WHERE company_id = ${companyId}
        AND created_at >= NOW() - INTERVAL '1 hour'
      GROUP BY product_id, location_id
      HAVING COUNT(*) > 10
      ORDER BY entry_count DESC
    `;

    if (Array.isArray(rapidEntries) && rapidEntries.length > 0) {
      anomalies.push({
        type: 'RAPID_ENTRIES',
        description: 'Multiple entries for same product-location within short time',
        count: rapidEntries.length,
        entries: rapidEntries,
      });
    }

    // 3. Check for negative stock levels
    const negativeStock = await this.prisma.stockLevel.findMany({
      where: {
        company_id: companyId,
        quantity: { lt: 0 },
      },
      include: {
        product: { select: { sku: true, name: true } },
        location: { select: { name: true } },
      },
    });

    if (negativeStock.length > 0) {
      anomalies.push({
        type: 'NEGATIVE_STOCK',
        description: 'Products with negative stock levels detected',
        count: negativeStock.length,
        entries: negativeStock,
      });
    }

    return {
      company_id: companyId,
      scan_timestamp: new Date(),
      anomaly_count: anomalies.length,
      anomalies,
    };
  }
}