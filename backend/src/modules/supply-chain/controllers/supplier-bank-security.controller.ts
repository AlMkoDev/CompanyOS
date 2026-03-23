import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/jwt.strategy';
import { SupplyChainRolesGuard } from '../guards/supply-chain-roles.guard';
import { SupplierBankSecurityService, BankDetails } from '../services/supplier-bank-security.service';

class RequestBankChangeDto {
  supplier_id: string;
  proposed_bank_details: BankDetails;
  justification: string;
}

class ApproveBankChangeDto {
  comments: string;
}

class RejectBankChangeDto {
  comments: string;
}

@ApiTags('Supplier Bank Security')
@ApiBearerAuth()
@Controller('supply-chain/supplier-bank-security')
@UseGuards(JwtAuthGuard, SupplyChainRolesGuard)
export class SupplierBankSecurityController {
  constructor(
    private readonly supplierBankSecurityService: SupplierBankSecurityService,
  ) {}

  @Post('request-change')
  @ApiOperation({ summary: 'Request a change to supplier bank details' })
  @ApiResponse({ status: 201, description: 'Bank detail change request created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @HttpCode(HttpStatus.CREATED)
  async requestBankDetailChange(
    @Body() requestDto: RequestBankChangeDto,
    @Request() req: any,
  ) {
    const changeRequest = await this.supplierBankSecurityService.requestBankDetailChange(
      requestDto.supplier_id,
      requestDto.proposed_bank_details,
      req.user.id,
      requestDto.justification,
      req.user.companyId,
    );

    return {
      success: true,
      message: 'Bank detail change request submitted successfully',
      data: {
        change_request_id: changeRequest.id,
        status: changeRequest.status,
        created_at: changeRequest.created_at,
      },
    };
  }

  @Put('approve/:requestId')
  @ApiOperation({ summary: 'Approve a bank detail change request' })
  @ApiResponse({ status: 200, description: 'Bank detail change approved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or already processed' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async approveBankDetailChange(
    @Param('requestId') requestId: string,
    @Body() approveDto: ApproveBankChangeDto,
    @Request() req: any,
  ) {
    await this.supplierBankSecurityService.approveBankDetailChange(
      requestId,
      req.user.id,
      approveDto.comments,
      req.user.companyId,
    );

    return {
      success: true,
      message: 'Bank detail change approved successfully',
    };
  }

  @Put('reject/:requestId')
  @ApiOperation({ summary: 'Reject a bank detail change request' })
  @ApiResponse({ status: 200, description: 'Bank detail change rejected successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or already processed' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async rejectBankDetailChange(
    @Param('requestId') requestId: string,
    @Body() rejectDto: RejectBankChangeDto,
    @Request() req: any,
  ) {
    await this.supplierBankSecurityService.rejectBankDetailChange(
      requestId,
      req.user.id,
      rejectDto.comments,
      req.user.companyId,
    );

    return {
      success: true,
      message: 'Bank detail change rejected successfully',
    };
  }

  @Get('pending-requests')
  @ApiOperation({ summary: 'Get all pending bank detail change requests' })
  @ApiResponse({ status: 200, description: 'Pending requests retrieved successfully' })
  async getPendingBankChangeRequests(@Request() req: any) {
    const requests = await this.supplierBankSecurityService.getPendingBankChangeRequests(
      req.user.companyId,
    );

    return {
      success: true,
      data: requests,
      count: requests.length,
    };
  }

  @Get('history/:supplierId')
  @ApiOperation({ summary: 'Get bank detail change history for a supplier' })
  @ApiResponse({ status: 200, description: 'Change history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async getBankChangeHistory(
    @Param('supplierId') supplierId: string,
    @Request() req: any,
  ) {
    const history = await this.supplierBankSecurityService.getBankChangeHistory(
      supplierId,
      req.user.companyId,
    );

    return {
      success: true,
      data: history,
      count: history.length,
    };
  }

  @Get('security-status/:supplierId')
  @ApiOperation({ summary: 'Get security status for supplier bank details' })
  @ApiResponse({ status: 200, description: 'Security status retrieved successfully' })
  async getSupplierBankSecurityStatus(
    @Param('supplierId') supplierId: string,
    @Request() req: any,
  ) {
    // Get pending requests for this supplier
    const pendingRequests = await this.supplierBankSecurityService.getPendingBankChangeRequests(
      req.user.companyId,
    );
    
    const supplierPendingRequests = pendingRequests.filter(
      request => request.supplier_id === supplierId
    );

    // Get recent change history
    const recentHistory = await this.supplierBankSecurityService.getBankChangeHistory(
      supplierId,
      req.user.companyId,
    );

    const recentChanges = recentHistory.slice(0, 5); // Last 5 changes

    return {
      success: true,
      data: {
        supplier_id: supplierId,
        has_pending_requests: supplierPendingRequests.length > 0,
        pending_requests_count: supplierPendingRequests.length,
        recent_changes_count: recentChanges.length,
        last_change_date: recentChanges.length > 0 ? recentChanges[0].created_at : null,
        security_controls_active: true,
        approval_required: true,
      },
    };
  }
}
