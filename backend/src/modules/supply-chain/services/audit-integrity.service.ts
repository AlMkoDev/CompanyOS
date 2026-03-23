import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import * as crypto from 'crypto';

export interface AuditIntegrityCheck {
  log_id: string;
  is_valid: boolean;
  hash_verified: boolean;
  chain_verified: boolean;
  timestamp_verified: boolean;
  issues: string[];
}

export interface IntegrityReport {
  company_id: string;
  total_logs: number;
  verified_logs: number;
  compromised_logs: number;
  integrity_percentage: number;
  last_verified_at: Date;
  issues: {
    log_id: string;
    issue_type: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }[];
}

@Injectable()
export class AuditIntegrityService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate cryptographic hash for audit log entry
   */
  private generateLogHash(logData: any): string {
    const hashInput = JSON.stringify({
      id: logData.id,
      company_id: logData.company_id,
      user_id: logData.user_id,
      action: logData.action,
      resource_type: logData.resource_type,
      resource_id: logData.resource_id,
      details: logData.details,
      ip_address: logData.ip_address,
      user_agent: logData.user_agent,
      created_at: logData.created_at?.toISOString(),
    });
    
    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }

  /**
   * Generate chain hash linking to previous log entry
   */
  private generateChainHash(currentHash: string, previousHash: string): string {
    return crypto.createHash('sha256')
      .update(currentHash + previousHash)
      .digest('hex');
  }
  /**
   * Add integrity metadata to a new audit log entry
   */
  async addIntegrityMetadata(logId: string, companyId: string): Promise<void> {
    const log = await this.prisma.activityLog.findUnique({
      where: { id: logId },
    });

    if (!log) {
      throw new BadRequestException('Audit log not found');
    }

    // Generate hash for this log entry
    const logHash = this.generateLogHash(log);

    // Get the previous log entry for chain verification
    const previousLog = await this.prisma.activityLog.findFirst({
      where: {
        company_id: companyId,
        created_at: { lt: log.created_at },
      },
      orderBy: { created_at: 'desc' },
    });

    let chainHash = logHash;
    if (previousLog) {
      // Get previous log's hash from metadata
      const previousMetadata = previousLog.details as any;
      const previousHash = previousMetadata?._integrity?.log_hash || '';
      chainHash = this.generateChainHash(logHash, previousHash);
    }

    // Add integrity metadata to the log details
    const updatedDetails = {
      ...(log.details as any),
      _integrity: {
        log_hash: logHash,
        chain_hash: chainHash,
        previous_log_id: previousLog?.id || null,
        integrity_version: '1.0',
        created_at: new Date().toISOString(),
      },
    };

    await this.prisma.activityLog.update({
      where: { id: logId },
      data: { details: updatedDetails },
    });
  }

  /**
   * Verify integrity of a single audit log entry
   */
  async verifyLogIntegrity(logId: string): Promise<AuditIntegrityCheck> {
    const log = await this.prisma.activityLog.findUnique({
      where: { id: logId },
    });

    if (!log) {
      return {
        log_id: logId,
        is_valid: false,
        hash_verified: false,
        chain_verified: false,
        timestamp_verified: false,
        issues: ['Log not found'],
      };
    }

    const issues: string[] = [];
    const metadata = (log.details as any)?._integrity;

    if (!metadata) {
      return {
        log_id: logId,
        is_valid: false,
        hash_verified: false,
        chain_verified: false,
        timestamp_verified: false,
        issues: ['No integrity metadata found'],
      };
    }

    // Verify log hash
    const expectedHash = this.generateLogHash({
      ...log,
      details: this.removeIntegrityMetadata(log.details as any),
    });
    const hashVerified = expectedHash === metadata.log_hash;
    if (!hashVerified) {
      issues.push('Log hash verification failed - content may have been tampered with');
    }

    // Verify chain hash if there's a previous log
    let chainVerified = true;
    if (metadata.previous_log_id) {
      const previousLog = await this.prisma.activityLog.findUnique({
        where: { id: metadata.previous_log_id },
      });

      if (previousLog) {
        const previousMetadata = (previousLog.details as any)?._integrity;
        const previousHash = previousMetadata?.log_hash || '';
        const expectedChainHash = this.generateChainHash(metadata.log_hash, previousHash);
        chainVerified = expectedChainHash === metadata.chain_hash;
        if (!chainVerified) {
          issues.push('Chain hash verification failed - audit trail may be broken');
        }
      } else {
        chainVerified = false;
        issues.push('Previous log in chain not found');
      }
    }

    // Verify timestamp consistency
    const timestampVerified = this.verifyTimestamp(log, metadata);
    if (!timestampVerified) {
      issues.push('Timestamp verification failed - creation time inconsistency detected');
    }

    const isValid = hashVerified && chainVerified && timestampVerified;

    return {
      log_id: logId,
      is_valid: isValid,
      hash_verified: hashVerified,
      chain_verified: chainVerified,
      timestamp_verified: timestampVerified,
      issues,
    };
  }
  /**
   * Verify integrity of all audit logs for a company
   */
  async verifyCompanyAuditIntegrity(companyId: string): Promise<IntegrityReport> {
    const logs = await this.prisma.activityLog.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'asc' },
    });

    const totalLogs = logs.length;
    let verifiedLogs = 0;
    const issues: IntegrityReport['issues'] = [];

    for (const log of logs) {
      const check = await this.verifyLogIntegrity(log.id);
      
      if (check.is_valid) {
        verifiedLogs++;
      } else {
        // Determine severity based on issue types
        let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
        
        if (check.issues.some(issue => issue.includes('tampered'))) {
          severity = 'CRITICAL';
        } else if (check.issues.some(issue => issue.includes('chain'))) {
          severity = 'HIGH';
        } else if (check.issues.some(issue => issue.includes('timestamp'))) {
          severity = 'MEDIUM';
        }

        check.issues.forEach(issue => {
          issues.push({
            log_id: log.id,
            issue_type: this.categorizeIssue(issue),
            description: issue,
            severity,
          });
        });
      }
    }

    const compromisedLogs = totalLogs - verifiedLogs;
    const integrityPercentage = totalLogs > 0 ? (verifiedLogs / totalLogs) * 100 : 100;

    return {
      company_id: companyId,
      total_logs: totalLogs,
      verified_logs: verifiedLogs,
      compromised_logs: compromisedLogs,
      integrity_percentage: Math.round(integrityPercentage * 100) / 100,
      last_verified_at: new Date(),
      issues,
    };
  }

  /**
   * Detect potential tampering patterns
   */
  async detectTamperingPatterns(companyId: string): Promise<{
    suspicious_activities: Array<{
      pattern: string;
      description: string;
      affected_logs: string[];
      risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    }>;
  }> {
    const logs = await this.prisma.activityLog.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      take: 1000, // Analyze last 1000 logs
    });

    const suspiciousActivities = [];

    // Pattern 1: Gaps in audit trail
    const timeGaps = this.detectTimeGaps(logs);
    if (timeGaps.length > 0) {
      suspiciousActivities.push({
        pattern: 'AUDIT_TRAIL_GAPS',
        description: 'Unusual time gaps detected in audit trail that may indicate log deletion',
        affected_logs: timeGaps,
        risk_level: 'HIGH' as const,
      });
    }

    // Pattern 2: Bulk modifications
    const bulkModifications = this.detectBulkModifications(logs);
    if (bulkModifications.length > 0) {
      suspiciousActivities.push({
        pattern: 'BULK_MODIFICATIONS',
        description: 'Unusual bulk modification patterns detected',
        affected_logs: bulkModifications,
        risk_level: 'MEDIUM' as const,
      });
    }

    // Pattern 3: Out-of-sequence timestamps
    const sequenceIssues = this.detectSequenceIssues(logs);
    if (sequenceIssues.length > 0) {
      suspiciousActivities.push({
        pattern: 'TIMESTAMP_ANOMALIES',
        description: 'Timestamp sequence anomalies that may indicate tampering',
        affected_logs: sequenceIssues,
        risk_level: 'HIGH' as const,
      });
    }

    return { suspicious_activities: suspiciousActivities };
  }

  /**
   * Generate integrity seal for audit logs
   */
  async generateIntegritySeal(companyId: string, fromDate: Date, toDate: Date): Promise<{
    seal_id: string;
    company_id: string;
    period: { from: Date; to: Date };
    log_count: number;
    merkle_root: string;
    seal_hash: string;
    created_at: Date;
  }> {
    const logs = await this.prisma.activityLog.findMany({
      where: {
        company_id: companyId,
        created_at: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { created_at: 'asc' },
    });

    // Generate Merkle tree root for all logs in period
    const logHashes = logs.map(log => this.generateLogHash(log));
    const merkleRoot = this.generateMerkleRoot(logHashes);

    // Generate seal hash
    const sealData = {
      company_id: companyId,
      from_date: fromDate.toISOString(),
      to_date: toDate.toISOString(),
      log_count: logs.length,
      merkle_root: merkleRoot,
    };
    const sealHash = crypto.createHash('sha256')
      .update(JSON.stringify(sealData))
      .digest('hex');

    const sealId = crypto.randomUUID();

    // Store the seal (you might want to add a separate table for this)
    // For now, we'll return the seal data
    return {
      seal_id: sealId,
      company_id: companyId,
      period: { from: fromDate, to: toDate },
      log_count: logs.length,
      merkle_root: merkleRoot,
      seal_hash: sealHash,
      created_at: new Date(),
    };
  }
  // Helper methods

  private removeIntegrityMetadata(details: any): any {
    if (!details || typeof details !== 'object') return details;
    const { _integrity, ...cleanDetails } = details;
    return cleanDetails;
  }

  private verifyTimestamp(log: any, metadata: any): boolean {
    const logTime = new Date(log.created_at).getTime();
    const metadataTime = new Date(metadata.created_at).getTime();
    
    // Allow 5 minute tolerance for timestamp differences
    const tolerance = 5 * 60 * 1000; // 5 minutes in milliseconds
    return Math.abs(logTime - metadataTime) <= tolerance;
  }

  private categorizeIssue(issue: string): string {
    if (issue.includes('hash')) return 'HASH_VERIFICATION';
    if (issue.includes('chain')) return 'CHAIN_VERIFICATION';
    if (issue.includes('timestamp')) return 'TIMESTAMP_VERIFICATION';
    if (issue.includes('metadata')) return 'METADATA_MISSING';
    return 'UNKNOWN';
  }

  private detectTimeGaps(logs: any[]): string[] {
    const suspiciousLogs: string[] = [];
    const sortedLogs = logs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    for (let i = 1; i < sortedLogs.length; i++) {
      const currentTime = new Date(sortedLogs[i].created_at).getTime();
      const previousTime = new Date(sortedLogs[i - 1].created_at).getTime();
      const gap = currentTime - previousTime;

      // Flag gaps larger than 1 hour during business hours
      if (gap > 60 * 60 * 1000) { // 1 hour
        const gapHour = new Date(previousTime).getHours();
        if (gapHour >= 8 && gapHour <= 18) { // Business hours
          suspiciousLogs.push(sortedLogs[i].id);
        }
      }
    }

    return suspiciousLogs;
  }

  private detectBulkModifications(logs: any[]): string[] {
    const suspiciousLogs: string[] = [];
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    
    // Group logs by time windows
    const timeGroups: { [key: string]: any[] } = {};
    
    logs.forEach(log => {
      const timeKey = Math.floor(new Date(log.created_at).getTime() / timeWindow);
      if (!timeGroups[timeKey]) timeGroups[timeKey] = [];
      timeGroups[timeKey].push(log);
    });

    // Flag groups with unusually high activity
    Object.values(timeGroups).forEach(group => {
      if (group.length > 50) { // More than 50 operations in 5 minutes
        suspiciousLogs.push(...group.map(log => log.id));
      }
    });

    return suspiciousLogs;
  }

  private detectSequenceIssues(logs: any[]): string[] {
    const suspiciousLogs: string[] = [];
    const sortedLogs = logs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    for (let i = 1; i < sortedLogs.length; i++) {
      const currentTime = new Date(sortedLogs[i].created_at).getTime();
      const previousTime = new Date(sortedLogs[i - 1].created_at).getTime();

      // Check for logs with timestamps in the past relative to previous logs
      if (currentTime < previousTime) {
        suspiciousLogs.push(sortedLogs[i].id);
      }
    }

    return suspiciousLogs;
  }

  private generateMerkleRoot(hashes: string[]): string {
    if (hashes.length === 0) return '';
    if (hashes.length === 1) return hashes[0];

    const nextLevel: string[] = [];
    
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = i + 1 < hashes.length ? hashes[i + 1] : left;
      const combined = crypto.createHash('sha256').update(left + right).digest('hex');
      nextLevel.push(combined);
    }

    return this.generateMerkleRoot(nextLevel);
  }
}