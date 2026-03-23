import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SupplyChainAuditService } from './supply-chain-audit.service';
import { SupplyChainNotificationService } from '../supply-chain-notification.service';

export interface BankDetails {
  bank_name: string;
  account_number: string;
  routing_number: string;
  account_holder_name: string;
  swift_code?: string;
  iban?: string;
  branch_address?: string;
}

export interface BankChangeRequest {
  id: string;
  supplier_id: string;
  current_bank_details: BankDetails | null;
  proposed_bank_details: BankDetails;
  requester_id: string;
  justification: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approver_id?: string;
  approval_comments?: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class SupplierBankSecurityService {
  constructor(
    private prisma: PrismaService,
    private auditService: SupplyChainAuditService,
    private notificationService: SupplyChainNotificationService,
  ) {}

  /**
   * Request a change to supplier bank details
   * Requires approval workflow for security
   */
  async requestBankDetailChange(
    supplierId: string,
    proposedBankDetails: BankDetails,
    requesterId: string,
    justification: string,
    companyId: string,
  ): Promise<BankChangeRequest> {
    // Validate the supplier exists and user has access
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        id: supplierId,
        company_id: companyId,
      },
    });

    if (!supplier) {
      throw new BadRequestException('Supplier not found');
    }

    // Validate bank details format
    this.validateBankDetails(proposedBankDetails);

    // Check for duplicate pending requests - CRITICAL SECURITY CHECK
    const existingRequest = await this.prisma.bankChangeRequest.findFirst({
      where: {
        supplier_id: supplierId,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      throw new BadRequestException('A pending bank detail change request already exists for this supplier. Please wait for the current request to be processed or contact an administrator.');
    }

    // Create the change request
    const changeRequest = await this.prisma.bankChangeRequest.create({
      data: {
        supplier_id: supplierId,
        current_bank_details: supplier.bank_details as any,
        proposed_bank_details: proposedBankDetails as any,
        requester_id: requesterId,
        justification,
        status: 'PENDING',
      },
    });

    // Log the request
    await this.auditService.logActivity({
      user_id: requesterId,
      action: 'BANK_DETAIL_CHANGE_REQUESTED',
      entity_type: 'supplier',
      entity_id: supplierId,
      details: {
        change_request_id: changeRequest.id,
        justification,
        proposed_changes: this.maskSensitiveBankData(proposedBankDetails),
      },
      ip_address: null,
      user_agent: null,
    });

    // Send notification to approvers
    await this.notifyApprovers(changeRequest, companyId);

    return changeRequest as BankChangeRequest;
  }

  /**
   * Approve a bank detail change request
   */
  async approveBankDetailChange(
    requestId: string,
    approverId: string,
    comments: string,
    companyId: string,
  ): Promise<void> {
    const changeRequest = await this.prisma.bankChangeRequest.findFirst({
      where: {
        id: requestId,
        status: 'PENDING',
      },
      include: {
        supplier: true,
      },
    });

    if (!changeRequest) {
      throw new BadRequestException('Change request not found or already processed');
    }

    if (changeRequest.supplier.company_id !== companyId) {
      throw new ForbiddenException('Access denied');
    }

    // Verify approver has the right permissions
    await this.verifyApprovalPermissions(approverId, companyId);

    // Update the supplier's bank details
    await this.prisma.supplier.update({
      where: { id: changeRequest.supplier_id },
      data: {
        bank_details: changeRequest.proposed_bank_details,
        updated_at: new Date(),
      },
    });

    // Update the change request
    await this.prisma.bankChangeRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approver_id: approverId,
        approval_comments: comments,
        updated_at: new Date(),
      },
    });

    // Log the approval
    await this.auditService.logActivity({
      user_id: approverId,
      action: 'BANK_DETAIL_CHANGE_APPROVED',
      entity_type: 'supplier',
      entity_id: changeRequest.supplier_id,
      details: {
        change_request_id: requestId,
        comments,
        approved_changes: this.maskSensitiveBankData(changeRequest.proposed_bank_details as any),
      },
      ip_address: null,
      user_agent: null,
    });

    // Send notifications
    await this.notifyChangeApproved(changeRequest, approverId, comments);
  }

  /**
   * Reject a bank detail change request
   */
  async rejectBankDetailChange(
    requestId: string,
    approverId: string,
    comments: string,
    companyId: string,
  ): Promise<void> {
    const changeRequest = await this.prisma.bankChangeRequest.findFirst({
      where: {
        id: requestId,
        status: 'PENDING',
      },
      include: {
        supplier: true,
      },
    });

    if (!changeRequest) {
      throw new BadRequestException('Change request not found or already processed');
    }

    if (changeRequest.supplier.company_id !== companyId) {
      throw new ForbiddenException('Access denied');
    }

    // Verify approver has the right permissions
    await this.verifyApprovalPermissions(approverId, companyId);

    // Update the change request
    await this.prisma.bankChangeRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        approver_id: approverId,
        approval_comments: comments,
        updated_at: new Date(),
      },
    });

    // Log the rejection
    await this.auditService.logActivity({
      user_id: approverId,
      action: 'BANK_DETAIL_CHANGE_REJECTED',
      entity_type: 'supplier',
      entity_id: changeRequest.supplier_id,
      details: {
        change_request_id: requestId,
        comments,
        rejected_changes: this.maskSensitiveBankData(changeRequest.proposed_bank_details as any),
      },
      ip_address: null,
      user_agent: null,
    });

    // Send notifications
    await this.notifyChangeRejected(changeRequest, approverId, comments);
  }

  /**
   * Get pending bank detail change requests
   */
  async getPendingBankChangeRequests(companyId: string): Promise<BankChangeRequest[]> {
    const requests = await this.prisma.bankChangeRequest.findMany({
      where: {
        supplier: {
          company_id: companyId,
        },
        status: 'PENDING',
      },
      include: {
        supplier: {
          select: {
            name: true,
            supplier_code: true,
          },
        },
        requester: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return requests.map(request => ({
      ...request,
      current_bank_details: request.current_bank_details ? 
        this.maskSensitiveBankData(request.current_bank_details as any) : null,
      proposed_bank_details: this.maskSensitiveBankData(request.proposed_bank_details as any),
    })) as BankChangeRequest[];
  }

  /**
   * Get bank detail change history for a supplier
   */
  async getBankChangeHistory(supplierId: string, companyId: string): Promise<BankChangeRequest[]> {
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        id: supplierId,
        company_id: companyId,
      },
    });

    if (!supplier) {
      throw new BadRequestException('Supplier not found');
    }

    const history = await this.prisma.bankChangeRequest.findMany({
      where: {
        supplier_id: supplierId,
      },
      include: {
        requester: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approver: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return history.map(request => ({
      ...request,
      current_bank_details: request.current_bank_details ? 
        this.maskSensitiveBankData(request.current_bank_details as any) : null,
      proposed_bank_details: this.maskSensitiveBankData(request.proposed_bank_details as any),
    })) as BankChangeRequest[];
  }

  /**
   * Validate bank details format and completeness
   */
  private validateBankDetails(bankDetails: BankDetails): void {
    const required = ['bank_name', 'account_number', 'routing_number', 'account_holder_name'];
    
    for (const field of required) {
      if (!bankDetails[field as keyof BankDetails]) {
        throw new BadRequestException(`${field} is required`);
      }
    }

    // Validate account number format (basic validation)
    if (!/^[0-9]{8,20}$/.test(bankDetails.account_number.replace(/[\s-]/g, ''))) {
      throw new BadRequestException('Invalid account number format');
    }

    // Validate routing number format (basic validation)
    if (!/^[0-9]{9}$/.test(bankDetails.routing_number.replace(/[\s-]/g, ''))) {
      throw new BadRequestException('Invalid routing number format');
    }

    // Validate SWIFT code if provided
    if (bankDetails.swift_code && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bankDetails.swift_code)) {
      throw new BadRequestException('Invalid SWIFT code format');
    }
  }

  /**
   * Verify that the user has permission to approve bank detail changes
   */
  private async verifyApprovalPermissions(userId: string, companyId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        companyId: companyId,
      },
      include: {
        roles: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Check if user has finance or procurement manager role
    const hasApprovalRole = user.roles.some(role => 
      ['finance_manager', 'procurement_manager', 'admin'].includes(role.name.toLowerCase())
    );

    if (!hasApprovalRole) {
      throw new ForbiddenException('Insufficient permissions to approve bank detail changes');
    }
  }

  /**
   * Mask sensitive bank data for logging and display
   */
  private maskSensitiveBankData(bankDetails: BankDetails): Partial<BankDetails> {
    if (!bankDetails) return {};

    return {
      bank_name: bankDetails.bank_name,
      account_number: this.maskAccountNumber(bankDetails.account_number),
      routing_number: bankDetails.routing_number,
      account_holder_name: bankDetails.account_holder_name,
      swift_code: bankDetails.swift_code,
      branch_address: bankDetails.branch_address,
    };
  }

  /**
   * Mask account number for security
   */
  private maskAccountNumber(accountNumber: string): string {
    if (!accountNumber || accountNumber.length < 4) return '****';
    return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
  }

  /**
   * Send notifications to approvers about new change requests
   */
  private async notifyApprovers(changeRequest: BankChangeRequest, companyId: string): Promise<void> {
    try {
      await this.notificationService.sendNotification({
        type: 'BANK_DETAIL_CHANGE_REQUESTED',
        title: 'Bank Detail Change Request',
        message: `A new bank detail change request has been submitted for supplier and requires approval.`,
        recipients: ['finance_manager', 'procurement_manager'],
        data: {
          change_request_id: changeRequest.id,
          supplier_id: changeRequest.supplier_id,
          requester_id: changeRequest.requester_id,
        },
        company_id: companyId,
      });
    } catch (error) {
      console.error('Failed to send bank change notification:', error);
    }
  }

  /**
   * Send notification when change is approved
   */
  private async notifyChangeApproved(
    changeRequest: BankChangeRequest, 
    approverId: string, 
    comments: string
  ): Promise<void> {
    try {
      await this.notificationService.sendNotification({
        type: 'BANK_DETAIL_CHANGE_APPROVED',
        title: 'Bank Detail Change Approved',
        message: `Your bank detail change request has been approved.`,
        recipients: [changeRequest.requester_id],
        data: {
          change_request_id: changeRequest.id,
          supplier_id: changeRequest.supplier_id,
          approver_id: approverId,
          comments,
        },
        company_id: null,
      });
    } catch (error) {
      console.error('Failed to send approval notification:', error);
    }
  }

  /**
   * Send notification when change is rejected
   */
  private async notifyChangeRejected(
    changeRequest: BankChangeRequest, 
    approverId: string, 
    comments: string
  ): Promise<void> {
    try {
      await this.notificationService.sendNotification({
        type: 'BANK_DETAIL_CHANGE_REJECTED',
        title: 'Bank Detail Change Rejected',
        message: `Your bank detail change request has been rejected.`,
        recipients: [changeRequest.requester_id],
        data: {
          change_request_id: changeRequest.id,
          supplier_id: changeRequest.supplier_id,
          approver_id: approverId,
          comments,
        },
        company_id: null,
      });
    } catch (error) {
      console.error('Failed to send rejection notification:', error);
    }
  }
}
