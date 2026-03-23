import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { AuditIntegrityService } from '../services/audit-integrity.service';
import { SupplyChainRolesGuard } from '../guards/supply-chain-roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@Controller('supply-chain/audit-integrity')
@UseGuards(SupplyChainRolesGuard)
export class AuditIntegrityController {
  constructor(private auditIntegrityService: AuditIntegrityService) {}

  /**
   * Verify integrity of a specific audit log entry
   */
  @Get('verify/:logId')
  @Roles('admin', 'audit_manager', 'compliance_officer')
  async verifyLogIntegrity(@Param('logId') logId: string) {
    return this.auditIntegrityService.verifyLogIntegrity(logId);
  }

  /**
   * Generate comprehensive integrity report for company
   */
  @Get('report')
  @Roles('admin', 'audit_manager', 'compliance_officer')
  async generateIntegrityReport(@Request() req: any) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestException('Company ID not found');
    }

    return this.auditIntegrityService.verifyCompanyAuditIntegrity(companyId);
  }

  /**
   * Detect tampering patterns in audit logs
   */
  @Get('tampering-detection')
  @Roles('admin', 'audit_manager', 'compliance_officer')
  async detectTamperingPatterns(@Request() req: any) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestException('Company ID not found');
    }

    return this.auditIntegrityService.detectTamperingPatterns(companyId);
  }

  /**
   * Generate integrity seal for a specific time period
   */
  @Post('seal')
  @Roles('admin', 'audit_manager')
  async generateIntegritySeal(
    @Request() req: any,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestException('Company ID not found');
    }

    if (!fromDate || !toDate) {
      throw new BadRequestException('fromDate and toDate are required');
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    if (from >= to) {
      throw new BadRequestException('fromDate must be before toDate');
    }

    return this.auditIntegrityService.generateIntegritySeal(companyId, from, to);
  }
}