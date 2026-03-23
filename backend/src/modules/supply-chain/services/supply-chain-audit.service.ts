import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export interface AuditReport {
  company_id: string;
  report_type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  period: {
    from: Date;
    to: Date;
  };
  summary: {
    total_operations: number;
    successful_operations: number;
    failed_operations: number;
    unique_users: number;
    most_active_user: string;
    peak_activity_hour: number;
  };
  operations_by_type: {
    [key: string]: number;
  };
  security_events: {
    failed_authentications: number;
    suspicious_activities: number;
    policy_violations: number;
  };
  compliance_metrics: {
    data_retention_compliance: boolean;
    audit_trail_completeness: number;
    segregation_of_duties_violations: number;
  };
  recommendations: string[];
}

export interface SecurityAlert {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: string;
  description: string;
  user_id?: string;
  ip_address?: string;
  detected_at: Date;
  resolved: boolean;
  false_positive: boolean;
}

@Injectable()
export class SupplyChainAuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate comprehensive audit report
   */
  async generateAuditReport(
    companyId: string,
    period: { from: Date; to: Date },
    reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM' = 'CUSTOM'
  ): Promise<AuditReport> {
    const whereClause = {
      company_id: companyId,
      created_at: {
        gte: period.from,
        lte: period.to,
      },
      action: {
        startsWith: 'SUPPLY_CHAIN_',
      },
    };

    // Get all audit entries for the period
    const auditEntries = await this.prisma.activityLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    // Calculate summary metrics
    const totalOperations = auditEntries.length;
    const successfulOperations = auditEntries.filter(entry => {
      const details = entry.details as any;
      return details?.status_code >= 200 && details?.status_code < 300;
    }).length;
    const failedOperations = totalOperations - successfulOperations;

    const uniqueUsers = new Set(auditEntries.map(entry => entry.user_id).filter(Boolean)).size;

    // Find most active user
    const userActivity = new Map<string, number>();
    auditEntries.forEach(entry => {
      if (entry.user_id) {
        userActivity.set(entry.user_id, (userActivity.get(entry.user_id) || 0) + 1);
      }
    });

    const mostActiveUserId = Array.from(userActivity.entries())
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    const mostActiveUser = mostActiveUserId ? 
      auditEntries.find(e => e.user_id === mostActiveUserId)?.user : null;

    // Calculate peak activity hour
    const hourlyActivity = new Map<number, number>();
    auditEntries.forEach(entry => {
      const hour = entry.created_at.getHours();
      hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1);
    });

    const peakActivityHour = Array.from(hourlyActivity.entries())
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 0;

    // Operations by type
    const operationsByType: { [key: string]: number } = {};
    auditEntries.forEach(entry => {
      const resourceType = entry.resource_type || 'unknown';
      operationsByType[resourceType] = (operationsByType[resourceType] || 0) + 1;
    });

    // Security events analysis
    const securityEvents = await this.analyzeSecurityEvents(companyId, period);

    // Compliance metrics
    const complianceMetrics = await this.calculateComplianceMetrics(companyId, period);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      auditEntries,
      securityEvents,
      complianceMetrics
    );

    return {
      company_id: companyId,
      report_type: reportType,
      period,
      summary: {
        total_operations: totalOperations,
        successful_operations: successfulOperations,
        failed_operations: failedOperations,
        unique_users: uniqueUsers,
        most_active_user: mostActiveUser ? 
          `${mostActiveUser.first_name} ${mostActiveUser.last_name}` : 'Unknown',
        peak_activity_hour: peakActivityHour,
      },
      operations_by_type: operationsByType,
      security_events: securityEvents,
      compliance_metrics: complianceMetrics,
      recommendations,
    };
  }

  /**
   * Analyze security events and suspicious activities
   */
  private async analyzeSecurityEvents(
    companyId: string,
    period: { from: Date; to: Date }
  ) {
    const auditEntries = await this.prisma.activityLog.findMany({
      where: {
        company_id: companyId,
        created_at: {
          gte: period.from,
          lte: period.to,
        },
      },
    });

    let failedAuthentications = 0;
    let suspiciousActivities = 0;
    let policyViolations = 0;

    // Analyze entries for security events
    auditEntries.forEach(entry => {
      const details = entry.details as any;
      
      // Failed authentications (status codes 401, 403)
      if (details?.status_code === 401 || details?.status_code === 403) {
        failedAuthentications++;
      }

      // Suspicious activities (multiple rapid requests, unusual hours)
      const hour = entry.created_at.getHours();
      if (hour < 6 || hour > 22) { // Outside business hours
        suspiciousActivities++;
      }

      // Policy violations (attempts to modify immutable records)
      if (entry.action.includes('ATTEMPTED_UPDATE') && entry.resource_type === 'stock_ledger') {
        policyViolations++;
      }
    });

    return {
      failed_authentications: failedAuthentications,
      suspicious_activities: suspiciousActivities,
      policy_violations: policyViolations,
    };
  }

  /**
   * Calculate compliance metrics
   */
  private async calculateComplianceMetrics(
    companyId: string,
    period: { from: Date; to: Date }
  ) {
    // Check data retention compliance (audit logs should be retained)
    const oldestEntry = await this.prisma.activityLog.findFirst({
      where: { company_id: companyId },
      orderBy: { created_at: 'asc' },
    });

    const dataRetentionCompliance = oldestEntry ? 
      (Date.now() - oldestEntry.created_at.getTime()) <= (7 * 365 * 24 * 60 * 60 * 1000) : true; // 7 years

    // Calculate audit trail completeness
    const totalSupplyChainOperations = await this.prisma.activityLog.count({
      where: {
        company_id: companyId,
        created_at: {
          gte: period.from,
          lte: period.to,
        },
        action: {
          startsWith: 'SUPPLY_CHAIN_',
        },
      },
    });

    const expectedOperations = await this.estimateExpectedOperations(companyId, period);
    const auditTrailCompleteness = expectedOperations > 0 ? 
      Math.min(100, (totalSupplyChainOperations / expectedOperations) * 100) : 100;

    // Check for segregation of duties violations
    const segregationViolations = await this.detectSegregationViolations(companyId, period);

    return {
      data_retention_compliance: dataRetentionCompliance,
      audit_trail_completeness: Math.round(auditTrailCompleteness),
      segregation_of_duties_violations: segregationViolations,
    };
  }

  /**
   * Estimate expected operations based on business activity
   */
  private async estimateExpectedOperations(
    companyId: string,
    period: { from: Date; to: Date }
  ): Promise<number> {
    // Count actual business operations that should generate audit logs
    const pos = await this.prisma.opsPurchaseOrder.count({
      where: {
        company_id: companyId,
        created_at: {
          gte: period.from,
          lte: period.to,
        },
      },
    });

    const grs = await this.prisma.opsGoodsReceipt.count({
      where: {
        company_id: companyId,
        created_at: {
          gte: period.from,
          lte: period.to,
        },
      },
    });

    const stockMovements = await this.prisma.stockLedger.count({
      where: {
        company_id: companyId,
        created_at: {
          gte: period.from,
          lte: period.to,
        },
      },
    });

    // Estimate: each PO should have ~3 audit entries, each GR ~2, each stock movement ~1
    return (pos * 3) + (grs * 2) + stockMovements;
  }

  /**
   * Detect segregation of duties violations
   */
  private async detectSegregationViolations(
    companyId: string,
    period: { from: Date; to: Date }
  ): Promise<number> {
    // Find users who both created and approved the same documents
    const violations = await this.prisma.$queryRaw<Array<{ user_id: string; violations: number }>>`
      SELECT 
        user_id,
        COUNT(*) as violations
      FROM (
        SELECT DISTINCT 
          user_id,
          (details->>'po_id')::text as po_id
        FROM "ActivityLog"
        WHERE company_id = ${companyId}
          AND created_at >= ${period.from}
          AND created_at <= ${period.to}
          AND action LIKE '%SUPPLY_CHAIN%'
          AND (action LIKE '%CREATE%' OR action LIKE '%APPROVE%')
          AND details->>'po_id' IS NOT NULL
        GROUP BY user_id, (details->>'po_id')::text
        HAVING COUNT(DISTINCT action) > 1
      ) violations_by_user
      GROUP BY user_id
    `;

    return violations.reduce((sum, v) => sum + Number(v.violations), 0);
  }

  /**
   * Generate audit recommendations
   */
  private generateRecommendations(
    auditEntries: any[],
    securityEvents: any,
    complianceMetrics: any
  ): string[] {
    const recommendations = [];

    // Security recommendations
    if (securityEvents.failed_authentications > 10) {
      recommendations.push('High number of failed authentications detected - consider implementing account lockout policies');
    }

    if (securityEvents.suspicious_activities > 5) {
      recommendations.push('Suspicious activities detected outside business hours - review access controls');
    }

    if (securityEvents.policy_violations > 0) {
      recommendations.push('Policy violations detected - review user permissions and training');
    }

    // Compliance recommendations
    if (!complianceMetrics.data_retention_compliance) {
      recommendations.push('Data retention policy violation - implement automated archival system');
    }

    if (complianceMetrics.audit_trail_completeness < 95) {
      recommendations.push('Audit trail gaps detected - review logging configuration');
    }

    if (complianceMetrics.segregation_of_duties_violations > 0) {
      recommendations.push('Segregation of duties violations found - implement approval workflows');
    }

    // Performance recommendations
    const avgExecutionTime = auditEntries.reduce((sum, entry) => {
      const details = entry.details as any;
      return sum + (details?.execution_time_ms || 0);
    }, 0) / auditEntries.length;

    if (avgExecutionTime > 5000) { // 5 seconds
      recommendations.push('High average response times detected - optimize system performance');
    }

    // Usage pattern recommendations
    const errorRate = auditEntries.filter(entry => {
      const details = entry.details as any;
      return details?.status_code >= 400;
    }).length / auditEntries.length;

    if (errorRate > 0.1) { // 10% error rate
      recommendations.push('High error rate detected - review system stability and user training');
    }

    if (recommendations.length === 0) {
      recommendations.push('No significant issues detected - maintain current security and compliance practices');
    }

    return recommendations;
  }

  /**
   * Get audit trail for specific resource
   */
  async getResourceAuditTrail(
    companyId: string,
    resourceType: string,
    resourceId: string,
    limit: number = 100
  ) {
    const auditEntries = await this.prisma.activityLog.findMany({
      where: {
        company_id: companyId,
        resource_type: resourceType,
        resource_id: resourceId,
      },
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
      take: limit,
    });

    return auditEntries.map(entry => ({
      id: entry.id,
      action: entry.action,
      user: entry.user ? {
        name: `${entry.user.first_name} ${entry.user.last_name}`,
        email: entry.user.email,
      } : null,
      timestamp: entry.created_at,
      ip_address: entry.ip_address,
      details: entry.details,
    }));
  }

  /**
   * Detect and alert on suspicious patterns
   */
  async detectSuspiciousPatterns(companyId: string): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Pattern 1: Rapid successive operations by same user
    const rapidOperations = await this.prisma.$queryRaw<Array<{
      user_id: string;
      operation_count: number;
      first_name: string;
      last_name: string;
    }>>`
      SELECT 
        al.user_id,
        COUNT(*) as operation_count,
        u.first_name,
        u.last_name
      FROM "ActivityLog" al
      LEFT JOIN "User" u ON al.user_id = u.id
      WHERE al.company_id = ${companyId}
        AND al.created_at >= ${last24Hours}
        AND al.action LIKE '%SUPPLY_CHAIN%'
      GROUP BY al.user_id, u.first_name, u.last_name
      HAVING COUNT(*) > 100
      ORDER BY operation_count DESC
    `;

    rapidOperations.forEach(op => {
      alerts.push({
        id: `rapid_ops_${op.user_id}_${Date.now()}`,
        severity: 'MEDIUM',
        type: 'RAPID_OPERATIONS',
        description: `User ${op.first_name} ${op.last_name} performed ${op.operation_count} operations in 24 hours`,
        user_id: op.user_id,
        detected_at: new Date(),
        resolved: false,
        false_positive: false,
      });
    });

    // Pattern 2: Operations from unusual IP addresses
    const unusualIPs = await this.prisma.$queryRaw<Array<{
      ip_address: string;
      operation_count: number;
      user_count: number;
    }>>`
      SELECT 
        ip_address,
        COUNT(*) as operation_count,
        COUNT(DISTINCT user_id) as user_count
      FROM "ActivityLog"
      WHERE company_id = ${companyId}
        AND created_at >= ${last24Hours}
        AND action LIKE '%SUPPLY_CHAIN%'
        AND ip_address IS NOT NULL
      GROUP BY ip_address
      HAVING COUNT(*) > 50 OR COUNT(DISTINCT user_id) > 5
      ORDER BY operation_count DESC
    `;

    unusualIPs.forEach(ip => {
      alerts.push({
        id: `unusual_ip_${ip.ip_address}_${Date.now()}`,
        severity: ip.user_count > 5 ? 'HIGH' : 'MEDIUM',
        type: 'UNUSUAL_IP_ACTIVITY',
        description: `Unusual activity from IP ${ip.ip_address}: ${ip.operation_count} operations, ${ip.user_count} users`,
        ip_address: ip.ip_address,
        detected_at: new Date(),
        resolved: false,
        false_positive: false,
      });
    });

    return alerts;
  }
}