import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SupplyChainNotificationService } from './supply-chain-notification.service';

export interface SupplierPerformanceMetrics {
  supplierId: string;
  supplierName: string;
  period: {
    from: Date;
    to: Date;
  };
  deliveryPerformance: {
    onTimeDeliveryRate: number;
    averageDeliveryDelay: number;
    totalDeliveries: number;
    lateDeliveries: number;
  };
  qualityPerformance: {
    qualityScore: number;
    defectRate: number;
    totalReceipts: number;
    rejectedItems: number;
  };
  pricePerformance: {
    priceVarianceRate: number;
    averagePriceVariance: number;
    totalOrders: number;
  };
  overallScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendations: string[];
}

export interface SupplierScorecard {
  supplierId: string;
  supplierName: string;
  currentScore: number;
  previousScore?: number;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  lastUpdated: Date;
  metrics: SupplierPerformanceMetrics;
  alerts: {
    type: string;
    message: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
  }[];
}

@Injectable()
export class SupplierPerformanceService {
  private readonly logger = new Logger(SupplierPerformanceService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: SupplyChainNotificationService,
  ) {}

  /**
   * Calculate supplier performance metrics for a given period
   */
  async calculateSupplierPerformance(
    companyId: string,
    supplierId: string,
    period: { from: Date; to: Date },
  ): Promise<SupplierPerformanceMetrics> {
    this.logger.log(`Calculating performance for supplier ${supplierId}`);

    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId, company_id: companyId },
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    // Get all POs for this supplier in the period
    const pos = await this.prisma.opsPurchaseOrder.findMany({
      where: {
        company_id: companyId,
        supplier_id: supplierId,
        created_at: {
          gte: period.from,
          lte: period.to,
        },
      },
      include: {
        lines: true,
      },
    });

    // Get all goods receipts for this supplier in the period
    const goodsReceipts = await this.prisma.opsGoodsReceipt.findMany({
      where: {
        company_id: companyId,
        po: {
          supplier_id: supplierId,
        },
        created_at: {
          gte: period.from,
          lte: period.to,
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
            lines: true,
          },
        },
      },
    });

    // Calculate delivery performance
    const deliveryPerformance = this.calculateDeliveryPerformance(pos, goodsReceipts);
    
    // Calculate quality performance
    const qualityPerformance = this.calculateQualityPerformance(goodsReceipts);
    
    // Calculate price performance
    const pricePerformance = this.calculatePricePerformance(pos);

    // Calculate overall score (weighted average)
    const overallScore = this.calculateOverallScore(
      deliveryPerformance,
      qualityPerformance,
      pricePerformance,
    );

    // Determine risk level
    const riskLevel = this.determineRiskLevel(overallScore, deliveryPerformance, qualityPerformance);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      deliveryPerformance,
      qualityPerformance,
      pricePerformance,
      riskLevel,
    );

    return {
      supplierId,
      supplierName: supplier.name,
      period,
      deliveryPerformance,
      qualityPerformance,
      pricePerformance,
      overallScore,
      riskLevel,
      recommendations,
    };
  }

  /**
   * Calculate delivery performance metrics
   */
  private calculateDeliveryPerformance(pos: any[], goodsReceipts: any[]) {
    let totalDeliveries = 0;
    let lateDeliveries = 0;
    let totalDelayDays = 0;

    goodsReceipts.forEach(gr => {
      const po = gr.po;
      if (po.expected_delivery_date && gr.created_at) {
        totalDeliveries++;
        
        const expectedDate = new Date(po.expected_delivery_date);
        const actualDate = new Date(gr.created_at);
        
        if (actualDate > expectedDate) {
          lateDeliveries++;
          const delayDays = Math.ceil(
            (actualDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          totalDelayDays += delayDays;
        }
      }
    });

    const onTimeDeliveryRate = totalDeliveries > 0 ? 
      ((totalDeliveries - lateDeliveries) / totalDeliveries) * 100 : 100;
    
    const averageDeliveryDelay = lateDeliveries > 0 ? 
      totalDelayDays / lateDeliveries : 0;

    return {
      onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100) / 100,
      averageDeliveryDelay: Math.round(averageDeliveryDelay * 100) / 100,
      totalDeliveries,
      lateDeliveries,
    };
  }

  /**
   * Calculate quality performance metrics
   */
  private calculateQualityPerformance(goodsReceipts: any[]) {
    let totalReceipts = goodsReceipts.length;
    let totalItemsReceived = 0;
    let totalItemsRejected = 0;
    let receiptsWithDefects = 0;

    goodsReceipts.forEach(gr => {
      let hasDefects = false;
      
      gr.lines.forEach((line: any) => {
        const receivedQty = Number(line.received_qty);
        const rejectedQty = Number(line.rejected_qty);
        
        totalItemsReceived += receivedQty;
        totalItemsRejected += rejectedQty;
        
        if (rejectedQty > 0) {
          hasDefects = true;
        }
      });
      
      if (hasDefects) {
        receiptsWithDefects++;
      }
    });

    const defectRate = totalItemsReceived > 0 ? 
      (totalItemsRejected / (totalItemsReceived + totalItemsRejected)) * 100 : 0;
    
    const qualityScore = Math.max(0, 100 - defectRate);

    return {
      qualityScore: Math.round(qualityScore * 100) / 100,
      defectRate: Math.round(defectRate * 100) / 100,
      totalReceipts,
      rejectedItems: totalItemsRejected,
    };
  }

  /**
   * Calculate price performance metrics
   */
  private calculatePricePerformance(pos: any[]) {
    let totalOrders = pos.length;
    let totalVariance = 0;
    let ordersWithVariance = 0;

    // For now, we'll assume price variance is 0 since we don't have historical pricing
    // In a real implementation, you'd compare against market prices or historical averages
    
    const priceVarianceRate = 0; // Placeholder
    const averagePriceVariance = 0; // Placeholder

    return {
      priceVarianceRate,
      averagePriceVariance,
      totalOrders,
    };
  }

  /**
   * Calculate overall weighted score
   */
  private calculateOverallScore(
    delivery: any,
    quality: any,
    price: any,
  ): number {
    // Weighted scoring: Delivery 40%, Quality 40%, Price 20%
    const deliveryScore = delivery.onTimeDeliveryRate;
    const qualityScore = quality.qualityScore;
    const priceScore = 100 - Math.abs(price.priceVarianceRate); // Assuming lower variance is better

    const overallScore = (deliveryScore * 0.4) + (qualityScore * 0.4) + (priceScore * 0.2);
    
    return Math.round(overallScore * 100) / 100;
  }

  /**
   * Determine risk level based on performance
   */
  private determineRiskLevel(
    overallScore: number,
    delivery: any,
    quality: any,
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // Critical risk factors
    if (delivery.onTimeDeliveryRate < 50 || quality.defectRate > 20) {
      return 'CRITICAL';
    }
    
    // High risk
    if (overallScore < 60 || delivery.onTimeDeliveryRate < 70 || quality.defectRate > 10) {
      return 'HIGH';
    }
    
    // Medium risk
    if (overallScore < 80 || delivery.onTimeDeliveryRate < 85 || quality.defectRate > 5) {
      return 'MEDIUM';
    }
    
    // Low risk
    return 'LOW';
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    delivery: any,
    quality: any,
    price: any,
    riskLevel: string,
  ): string[] {
    const recommendations = [];

    // Delivery recommendations
    if (delivery.onTimeDeliveryRate < 85) {
      recommendations.push('Improve delivery schedule adherence');
      recommendations.push('Review and update delivery commitments');
    }
    
    if (delivery.averageDeliveryDelay > 3) {
      recommendations.push('Address chronic delivery delays');
      recommendations.push('Consider backup suppliers for critical items');
    }

    // Quality recommendations
    if (quality.defectRate > 5) {
      recommendations.push('Implement quality improvement program');
      recommendations.push('Increase incoming inspection frequency');
    }
    
    if (quality.defectRate > 15) {
      recommendations.push('Consider supplier audit or certification review');
      recommendations.push('Evaluate alternative suppliers');
    }

    // Risk-based recommendations
    if (riskLevel === 'CRITICAL') {
      recommendations.push('URGENT: Review supplier relationship immediately');
      recommendations.push('Activate contingency suppliers');
      recommendations.push('Escalate to procurement management');
    } else if (riskLevel === 'HIGH') {
      recommendations.push('Schedule supplier performance review meeting');
      recommendations.push('Implement corrective action plan');
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Maintain current performance standards');
      recommendations.push('Continue regular performance monitoring');
    }

    return recommendations;
  }
  /**
   * Get supplier scorecard with trend analysis
   */
  async getSupplierScorecard(
    companyId: string,
    supplierId: string,
  ): Promise<SupplierScorecard> {
    const currentPeriod = {
      from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
      to: new Date(),
    };

    const previousPeriod = {
      from: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 90-180 days ago
      to: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    };

    const currentMetrics = await this.calculateSupplierPerformance(
      companyId,
      supplierId,
      currentPeriod,
    );

    let previousScore: number | undefined;
    let trend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 'STABLE';

    try {
      const previousMetrics = await this.calculateSupplierPerformance(
        companyId,
        supplierId,
        previousPeriod,
      );
      
      previousScore = previousMetrics.overallScore;
      
      const scoreDifference = currentMetrics.overallScore - previousScore;
      
      if (scoreDifference > 5) {
        trend = 'IMPROVING';
      } else if (scoreDifference < -5) {
        trend = 'DECLINING';
      }
    } catch (error) {
      this.logger.warn(`Could not calculate previous period metrics: ${error.message}`);
    }

    // Generate alerts
    const alerts = this.generateAlerts(currentMetrics);

    return {
      supplierId,
      supplierName: currentMetrics.supplierName,
      currentScore: currentMetrics.overallScore,
      previousScore,
      trend,
      lastUpdated: new Date(),
      metrics: currentMetrics,
      alerts,
    };
  }

  /**
   * Generate performance alerts
   */
  private generateAlerts(metrics: SupplierPerformanceMetrics) {
    const alerts = [];

    // Delivery alerts
    if (metrics.deliveryPerformance.onTimeDeliveryRate < 70) {
      alerts.push({
        type: 'DELIVERY_PERFORMANCE',
        message: `On-time delivery rate is ${metrics.deliveryPerformance.onTimeDeliveryRate}% (below 70% threshold)`,
        severity: 'CRITICAL' as const,
      });
    } else if (metrics.deliveryPerformance.onTimeDeliveryRate < 85) {
      alerts.push({
        type: 'DELIVERY_PERFORMANCE',
        message: `On-time delivery rate is ${metrics.deliveryPerformance.onTimeDeliveryRate}% (below 85% target)`,
        severity: 'WARNING' as const,
      });
    }

    // Quality alerts
    if (metrics.qualityPerformance.defectRate > 10) {
      alerts.push({
        type: 'QUALITY_PERFORMANCE',
        message: `Defect rate is ${metrics.qualityPerformance.defectRate}% (above 10% threshold)`,
        severity: 'CRITICAL' as const,
      });
    } else if (metrics.qualityPerformance.defectRate > 5) {
      alerts.push({
        type: 'QUALITY_PERFORMANCE',
        message: `Defect rate is ${metrics.qualityPerformance.defectRate}% (above 5% target)`,
        severity: 'WARNING' as const,
      });
    }

    // Risk level alerts
    if (metrics.riskLevel === 'CRITICAL') {
      alerts.push({
        type: 'RISK_LEVEL',
        message: 'Supplier risk level is CRITICAL - immediate action required',
        severity: 'CRITICAL' as const,
      });
    } else if (metrics.riskLevel === 'HIGH') {
      alerts.push({
        type: 'RISK_LEVEL',
        message: 'Supplier risk level is HIGH - review recommended',
        severity: 'WARNING' as const,
      });
    }

    return alerts;
  }

  /**
   * Get all supplier scorecards for company
   */
  async getAllSupplierScorecards(companyId: string): Promise<SupplierScorecard[]> {
    const suppliers = await this.prisma.supplier.findMany({
      where: { company_id: companyId, status: 'ACTIVE' },
    });

    const scorecards = await Promise.all(
      suppliers.map(supplier => 
        this.getSupplierScorecard(companyId, supplier.id)
      )
    );

    // Sort by overall score (lowest first to highlight issues)
    return scorecards.sort((a, b) => a.currentScore - b.currentScore);
  }

  /**
   * Get suppliers by risk level
   */
  async getSuppliersByRiskLevel(
    companyId: string,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  ) {
    const scorecards = await this.getAllSupplierScorecards(companyId);
    return scorecards.filter(scorecard => scorecard.metrics.riskLevel === riskLevel);
  }

  /**
   * Send performance alerts for critical suppliers
   */
  async sendPerformanceAlerts(companyId: string) {
    const criticalSuppliers = await this.getSuppliersByRiskLevel(companyId, 'CRITICAL');
    const highRiskSuppliers = await this.getSuppliersByRiskLevel(companyId, 'HIGH');

    // Send alerts for critical suppliers
    for (const supplier of criticalSuppliers) {
      await this.notificationService.notifySupplierPerformanceIssue(
        companyId,
        supplier.supplierId,
        `CRITICAL performance issues detected: Score ${supplier.currentScore}/100`
      );
    }

    // Send summary for high risk suppliers
    if (highRiskSuppliers.length > 0) {
      const supplierNames = highRiskSuppliers.map(s => s.supplierName).join(', ');
      await this.notificationService.notifySupplierPerformanceIssue(
        companyId,
        'MULTIPLE',
        `${highRiskSuppliers.length} suppliers at HIGH risk: ${supplierNames}`
      );
    }

    this.logger.log(`Sent performance alerts for ${criticalSuppliers.length} critical and ${highRiskSuppliers.length} high-risk suppliers`);
  }

  /**
   * Get performance dashboard summary
   */
  async getPerformanceDashboard(companyId: string) {
    const scorecards = await this.getAllSupplierScorecards(companyId);
    
    const totalSuppliers = scorecards.length;
    const averageScore = totalSuppliers > 0 ? 
      scorecards.reduce((sum, s) => sum + s.currentScore, 0) / totalSuppliers : 0;

    const riskDistribution = {
      LOW: scorecards.filter(s => s.metrics.riskLevel === 'LOW').length,
      MEDIUM: scorecards.filter(s => s.metrics.riskLevel === 'MEDIUM').length,
      HIGH: scorecards.filter(s => s.metrics.riskLevel === 'HIGH').length,
      CRITICAL: scorecards.filter(s => s.metrics.riskLevel === 'CRITICAL').length,
    };

    const trendDistribution = {
      IMPROVING: scorecards.filter(s => s.trend === 'IMPROVING').length,
      STABLE: scorecards.filter(s => s.trend === 'STABLE').length,
      DECLINING: scorecards.filter(s => s.trend === 'DECLINING').length,
    };

    const topPerformers = scorecards
      .sort((a, b) => b.currentScore - a.currentScore)
      .slice(0, 5);

    const bottomPerformers = scorecards
      .sort((a, b) => a.currentScore - b.currentScore)
      .slice(0, 5);

    return {
      summary: {
        totalSuppliers,
        averageScore: Math.round(averageScore * 100) / 100,
        riskDistribution,
        trendDistribution,
      },
      topPerformers,
      bottomPerformers,
      lastUpdated: new Date(),
    };
  }
}