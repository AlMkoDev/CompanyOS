import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { NotificationService } from '../../common/services/notification.service';

export interface ReorderAlert {
  id: string;
  productSku: string;
  productName: string;
  locationName: string;
  currentStock: number;
  reorderPoint: number;
  eoq: number;
  suggestedOrderQty: number;
  preferredSupplier?: {
    name: string;
    leadTimeDays: number;
    unitCost: number;
  };
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  daysUntilStockout?: number;
}

@Injectable()
export class ReorderAlertService {
  private readonly logger = new Logger(ReorderAlertService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  private isSchemaDriftError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2021' || error.code === 'P2022')
    );
  }

  /**
   * Scheduled job to check for reorder alerts every hour during business hours
   */
  @Cron('0 8-17 * * 1-5') // Every hour from 8 AM to 5 PM, Monday to Friday
  async checkReorderAlerts() {
    this.logger.log('Running scheduled reorder alert check...');
    
    try {
      const alerts = await this.generateReorderAlerts();
      
      if (alerts.length > 0) {
        this.logger.log(`Found ${alerts.length} reorder alerts`);
        await this.processAlerts(alerts);
      } else {
        this.logger.log('No reorder alerts found');
      }
    } catch (error) {
      if (this.isSchemaDriftError(error)) {
        this.logger.warn('Skipping reorder alert check because the supply-chain schema is not ready yet.');
        return;
      }

      this.logger.error('Error during reorder alert check:', error);
    }
  }

  /**
   * Generate reorder alerts for all companies
   */
  async generateReorderAlerts(companyId?: string): Promise<ReorderAlert[]> {
    const whereClause = companyId ? { company_id: companyId } : {};

    // Get all stock levels that are at or below reorder point
    let lowStockItems;

    try {
      lowStockItems = await this.prisma.stockLevel.findMany({
        where: {
          ...whereClause,
          AND: [
            {
              reorder_point: {
                not: null,
              },
            },
            {
              OR: [
                {
                  quantity: {
                    lte: this.prisma.stockLevel.fields.reorder_point,
                  },
                },
              ],
            },
          ],
        },
        include: {
          product: {
            include: {
              suppliers: {
                where: {
                  is_preferred: true,
                },
                include: {
                  supplier: true,
                },
                take: 1,
              },
            },
          },
          location: true,
        },
      });
    } catch (error) {
      if (this.isSchemaDriftError(error)) {
        this.logger.warn('Skipping reorder alert generation because supply-chain tables are not ready yet.');
        return [];
      }

      throw error;
    }

    const alerts: ReorderAlert[] = [];

    for (const stockItem of lowStockItems) {
      const currentStock = Number(stockItem.quantity);
      const reorderPoint = Number(stockItem.reorder_point);
      const eoq = Number(stockItem.eoq) || 0;

      // Skip if current stock is above reorder point
      if (currentStock > reorderPoint) {
        continue;
      }

      // Calculate urgency level
      const stockRatio = currentStock / reorderPoint;
      let urgencyLevel: ReorderAlert['urgencyLevel'];
      
      if (stockRatio <= 0) {
        urgencyLevel = 'CRITICAL'; // Out of stock
      } else if (stockRatio <= 0.25) {
        urgencyLevel = 'HIGH'; // 25% or less of reorder point
      } else if (stockRatio <= 0.5) {
        urgencyLevel = 'MEDIUM'; // 50% or less of reorder point
      } else {
        urgencyLevel = 'LOW'; // Above 50% but below reorder point
      }

      // Calculate suggested order quantity
      const shortfall = reorderPoint - currentStock;
      const suggestedOrderQty = Math.max(eoq, shortfall);

      // Get preferred supplier info
      const preferredSupplierProduct = stockItem.product.suppliers[0];
      const preferredSupplier = preferredSupplierProduct ? {
        name: preferredSupplierProduct.supplier.name,
        leadTimeDays: preferredSupplierProduct.lead_time_days,
        unitCost: Number(preferredSupplierProduct.unit_cost),
      } : undefined;

      // Estimate days until stockout (simplified calculation)
      const daysUntilStockout = this.estimateDaysUntilStockout(
        currentStock,
        stockItem.product.sku,
      );

      const alert: ReorderAlert = {
        id: `${stockItem.product.id}-${stockItem.location.id}`,
        productSku: stockItem.product.sku,
        productName: stockItem.product.name,
        locationName: stockItem.location.name,
        currentStock,
        reorderPoint,
        eoq,
        suggestedOrderQty,
        preferredSupplier,
        urgencyLevel,
        daysUntilStockout,
      };

      alerts.push(alert);
    }

    // Sort by urgency level (CRITICAL first)
    const urgencyOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    alerts.sort((a, b) => urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel]);

    return alerts;
  }

  /**
   * Process and send notifications for reorder alerts
   */
  private async processAlerts(alerts: ReorderAlert[]) {
    const criticalAlerts = alerts.filter(a => a.urgencyLevel === 'CRITICAL');
    const highAlerts = alerts.filter(a => a.urgencyLevel === 'HIGH');
    const mediumAlerts = alerts.filter(a => a.urgencyLevel === 'MEDIUM');
    const lowAlerts = alerts.filter(a => a.urgencyLevel === 'LOW');

    // Send immediate notifications for critical alerts
    if (criticalAlerts.length > 0) {
      await this.sendCriticalAlerts(criticalAlerts);
    }

    // Send summary notification for all alerts
    await this.sendAlertSummary({
      critical: criticalAlerts.length,
      high: highAlerts.length,
      medium: mediumAlerts.length,
      low: lowAlerts.length,
      totalAlerts: alerts.length,
      alerts: alerts.slice(0, 10), // Top 10 alerts for summary
    });
  }

  /**
   * Send immediate notifications for critical (out of stock) alerts
   */
  private async sendCriticalAlerts(criticalAlerts: ReorderAlert[]) {
    for (const alert of criticalAlerts) {
      const message = `🚨 CRITICAL: ${alert.productName} (${alert.productSku}) is OUT OF STOCK at ${alert.locationName}. Immediate action required!`;
      
      try {
        await this.notificationService.sendNotification({
          type: 'CRITICAL_STOCK_ALERT',
          title: 'Critical Stock Alert',
          message,
          data: alert,
          channels: ['email', 'slack'], // Send via multiple channels for critical alerts
        });
      } catch (error) {
        this.logger.error(`Failed to send critical alert for ${alert.productSku}:`, error);
      }
    }
  }

  /**
   * Send summary notification with all reorder alerts
   */
  private async sendAlertSummary(summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    totalAlerts: number;
    alerts: ReorderAlert[];
  }) {
    const message = `📊 Reorder Alert Summary:
🔴 Critical: ${summary.critical}
🟠 High: ${summary.high}
🟡 Medium: ${summary.medium}
🟢 Low: ${summary.low}

Total items requiring attention: ${summary.totalAlerts}`;

    try {
      await this.notificationService.sendNotification({
        type: 'REORDER_SUMMARY',
        title: 'Daily Reorder Alert Summary',
        message,
        data: summary,
        channels: ['email'],
      });
    } catch (error) {
      this.logger.error('Failed to send reorder alert summary:', error);
    }
  }

  /**
   * Estimate days until stockout based on historical consumption
   * This is a simplified calculation - in production, you'd use more sophisticated forecasting
   */
  private async estimateDaysUntilStockout(currentStock: number, productSku: string): Promise<number | undefined> {
    if (currentStock <= 0) {
      return 0; // Already out of stock
    }

    try {
      // Get recent consumption data (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentConsumption = await this.prisma.stockLedger.findMany({
        where: {
          product: {
            sku: productSku,
          },
          created_at: {
            gte: thirtyDaysAgo,
          },
          entry_type: {
            in: ['FULFILLMENT', 'TRANSFER_OUT', 'SCRAP'],
          },
        },
        select: {
          quantity_change: true,
        },
      });

      if (recentConsumption.length === 0) {
        return undefined; // No consumption data available
      }

      // Calculate average daily consumption (absolute values)
      const totalConsumption = recentConsumption.reduce(
        (sum, entry) => sum + Math.abs(Number(entry.quantity_change)),
        0,
      );
      const avgDailyConsumption = totalConsumption / 30;

      if (avgDailyConsumption <= 0) {
        return undefined; // No consumption pattern
      }

      return Math.floor(currentStock / avgDailyConsumption);
    } catch (error) {
      this.logger.error(`Error calculating stockout estimate for ${productSku}:`, error);
      return undefined;
    }
  }

  /**
   * Get reorder alerts for a specific company (API endpoint)
   */
  async getReorderAlertsForCompany(companyId: string): Promise<ReorderAlert[]> {
    return this.generateReorderAlerts(companyId);
  }

  /**
   * Get reorder alert statistics for dashboard
   */
  async getReorderAlertStats(companyId: string) {
    const alerts = await this.generateReorderAlerts(companyId);
    
    return {
      total: alerts.length,
      critical: alerts.filter(a => a.urgencyLevel === 'CRITICAL').length,
      high: alerts.filter(a => a.urgencyLevel === 'HIGH').length,
      medium: alerts.filter(a => a.urgencyLevel === 'MEDIUM').length,
      low: alerts.filter(a => a.urgencyLevel === 'LOW').length,
      topAlerts: alerts.slice(0, 5), // Top 5 most urgent
    };
  }

  /**
   * Mark an alert as acknowledged (for tracking purposes)
   */
  async acknowledgeAlert(alertId: string, userId: string) {
    // In a production system, you might want to store acknowledgments
    // For now, we'll just log it
    this.logger.log(`Alert ${alertId} acknowledged by user ${userId}`);
    
    // You could implement a separate AlertAcknowledgment table to track this
    return { success: true, acknowledgedAt: new Date() };
  }
}
