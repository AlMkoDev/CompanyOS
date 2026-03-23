import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SupplyChainNotificationService } from './supply-chain-notification.service';
import { PRStatus, POStatus, LedgerEntryType } from '@prisma/client';

export interface CreatePRDto {
  requesterNote?: string;
  justification?: string;
  departmentId?: string;
  items: {
    productId: string;
    quantity: number;
    estimatedCost?: number;
    urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    businessJustification?: string;
  }[];
}

export interface ApprovePRDto {
  approved: boolean;
  comments?: string;
  conditions?: string[];
}

export interface CreatePOFromPRDto {
  prId: string;
  supplierId: string;
  items: {
    prLineId: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }[];
  deliveryDate?: Date;
  paymentTerms?: string;
  specialInstructions?: string;
}

@Injectable()
export class ProcurementWorkflowService {
  private readonly logger = new Logger(ProcurementWorkflowService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: SupplyChainNotificationService,
  ) {}

  /**
   * Create a new Purchase Requisition (PR)
   */
  async createPurchaseRequisition(
    companyId: string,
    requesterId: string,
    createPRDto: CreatePRDto,
  ) {
    this.logger.log(`Creating PR for requester ${requesterId}`);

    // Generate PR number
    const prCount = await this.prisma.purchaseRequisition.count({
      where: { company_id: companyId },
    });
    const prNumber = `PR-${new Date().getFullYear()}-${String(prCount + 1).padStart(4, '0')}`;

    // Calculate total estimated cost
    let totalEstimatedCost = 0;
    for (const item of createPRDto.items) {
      if (item.estimatedCost) {
        totalEstimatedCost += item.estimatedCost * item.quantity;
      } else {
        // Get estimated cost from preferred supplier
        const supplierProduct = await this.prisma.supplierProduct.findFirst({
          where: {
            product_id: item.productId,
            is_preferred: true,
          },
        });
        if (supplierProduct) {
          totalEstimatedCost += Number(supplierProduct.unit_cost) * item.quantity;
        }
      }
    }

    // Determine approval requirements based on total cost and approval policies
    const approvalLevel = await this.determineApprovalLevel(companyId, createPRDto.items, totalEstimatedCost);

    const pr = await this.prisma.purchaseRequisition.create({
      data: {
        company_id: companyId,
        pr_number: prNumber,
        requester_id: requesterId,
        status: approvalLevel.autoApprove ? PRStatus.APPROVED : PRStatus.PENDING_L1,
        justification: createPRDto.justification,
        department_id: createPRDto.departmentId,
        lines: {
          create: createPRDto.items.map(item => ({
            product_id: item.productId,
            quantity: item.quantity,
            estimated_cost: item.estimatedCost,
          })),
        },
      },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    // Send notifications based on approval level
    if (approvalLevel.autoApprove) {
      this.logger.log(`PR ${prNumber} auto-approved (under threshold)`);
      await this.notificationService.sendNotification({
        type: 'PR_AUTO_APPROVED',
        title: 'Purchase Requisition Auto-Approved',
        message: `PR ${prNumber} has been automatically approved and is ready for PO creation.`,
        data: { prId: pr.id, prNumber, totalCost: totalEstimatedCost },
        channels: ['email'],
      });
    } else {
      await this.sendApprovalNotification(pr, approvalLevel.level);
    }

    return {
      ...pr,
      totalEstimatedCost,
      approvalLevel: approvalLevel.level,
      autoApproved: approvalLevel.autoApprove,
    };
  }

  /**
   * Approve or reject a Purchase Requisition
   */
  async approvePurchaseRequisition(
    prId: string,
    approverId: string,
    approveDto: ApprovePRDto,
  ) {
    const pr = await this.prisma.purchaseRequisition.findUnique({
      where: { id: prId },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!pr) {
      throw new BadRequestException('Purchase Requisition not found');
    }

    if (pr.status === PRStatus.APPROVED || pr.status === PRStatus.REJECTED) {
      throw new BadRequestException('Purchase Requisition has already been processed');
    }

    // Determine next status based on current status and approval decision
    let nextStatus: PRStatus;
    let notificationType: string;

    if (!approveDto.approved) {
      nextStatus = PRStatus.REJECTED;
      notificationType = 'PR_REJECTED';
    } else {
      // Check if this is L1 or L2 approval
      if (pr.status === PRStatus.PENDING_L1) {
        // Check if L2 approval is needed
        const totalCost = pr.lines.reduce((sum, line) => 
          sum + (Number(line.estimated_cost) || 0) * Number(line.quantity), 0
        );
        
        const needsL2 = await this.needsL2Approval(pr.company_id, pr.lines, totalCost);
        
        if (needsL2) {
          nextStatus = PRStatus.PENDING_L2;
          notificationType = 'PR_L1_APPROVED';
        } else {
          nextStatus = PRStatus.APPROVED;
          notificationType = 'PR_APPROVED';
        }
      } else if (pr.status === PRStatus.PENDING_L2) {
        nextStatus = PRStatus.APPROVED;
        notificationType = 'PR_APPROVED';
      } else {
        throw new BadRequestException('Invalid PR status for approval');
      }
    }

    // Update PR status
    const updatedPR = await this.prisma.purchaseRequisition.update({
      where: { id: prId },
      data: { status: nextStatus },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    // Log approval action
    this.logger.log(`PR ${pr.pr_number} ${approveDto.approved ? 'approved' : 'rejected'} by ${approverId}`);

    // Send notifications
    await this.notificationService.sendNotification({
      type: notificationType,
      title: `Purchase Requisition ${approveDto.approved ? 'Approved' : 'Rejected'}`,
      message: `PR ${pr.pr_number} has been ${approveDto.approved ? 'approved' : 'rejected'}.${approveDto.comments ? ` Comments: ${approveDto.comments}` : ''}`,
      data: { 
        prId: pr.id, 
        prNumber: pr.pr_number, 
        status: nextStatus,
        comments: approveDto.comments,
        conditions: approveDto.conditions,
      },
      channels: ['email'],
    });

    // If approved and ready for PO, send notification to procurement team
    if (nextStatus === PRStatus.APPROVED) {
      await this.notificationService.sendNotification({
        type: 'PR_READY_FOR_PO',
        title: 'PR Ready for Purchase Order',
        message: `PR ${pr.pr_number} is approved and ready for PO creation.`,
        data: { prId: pr.id, prNumber: pr.pr_number },
        channels: ['email'],
      });
    }

    return updatedPR;
  }

  /**
   * Create Purchase Order from approved PR
   */
  async createPurchaseOrderFromPR(
    companyId: string,
    userId: string,
    createPODto: CreatePOFromPRDto,
  ) {
    const pr = await this.prisma.purchaseRequisition.findUnique({
      where: { id: createPODto.prId },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!pr) {
      throw new BadRequestException('Purchase Requisition not found');
    }

    if (pr.status !== PRStatus.APPROVED) {
      throw new BadRequestException('Purchase Requisition must be approved before creating PO');
    }

    // Generate PO number
    const poCount = await this.prisma.opsPurchaseOrder.count({
      where: { company_id: companyId },
    });
    const poNumber = `PO-${new Date().getFullYear()}-${String(poCount + 1).padStart(4, '0')}`;

    // Calculate total value
    const totalValue = createPODto.items.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0
    );

    // Create PO
    const po = await this.prisma.opsPurchaseOrder.create({
      data: {
        company_id: companyId,
        po_number: poNumber,
        supplier_id: createPODto.supplierId,
        pr_id: createPODto.prId,
        status: POStatus.DRAFT,
        total_value: totalValue,
        lines: {
          create: createPODto.items.map(item => {
            const prLine = pr.lines.find(line => line.id === item.prLineId);
            return {
              product_id: prLine!.product_id,
              quantity: item.quantity,
              unit_price: item.unitPrice,
            };
          }),
        },
      },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
        supplier: true,
      },
    });

    this.logger.log(`Created PO ${poNumber} from PR ${pr.pr_number}`);

    // Send notification
    await this.notificationService.sendNotification({
      type: 'PO_CREATED',
      title: 'Purchase Order Created',
      message: `PO ${poNumber} has been created from PR ${pr.pr_number} for supplier ${po.supplier.name}.`,
      data: { 
        poId: po.id, 
        poNumber, 
        prNumber: pr.pr_number,
        supplierName: po.supplier.name,
        totalValue,
      },
      channels: ['email'],
    });

    return po;
  }

  /**
   * Get PR approval queue for a user
   */
  async getApprovalQueue(companyId: string, userId: string, level: 'L1' | 'L2') {
    const status = level === 'L1' ? PRStatus.PENDING_L1 : PRStatus.PENDING_L2;

    return this.prisma.purchaseRequisition.findMany({
      where: {
        company_id: companyId,
        status,
      },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });
  }

  /**
   * Get PR status and history
   */
  async getPRStatus(prId: string) {
    const pr = await this.prisma.purchaseRequisition.findUnique({
      where: { id: prId },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!pr) {
      throw new BadRequestException('Purchase Requisition not found');
    }

    // Calculate total estimated cost
    const totalEstimatedCost = pr.lines.reduce((sum, line) => 
      sum + (Number(line.estimated_cost) || 0) * Number(line.quantity), 0
    );

    return {
      ...pr,
      totalEstimatedCost,
      statusHistory: await this.getPRStatusHistory(prId),
    };
  }

  /**
   * Determine approval level required based on cost and product categories
   */
  private async determineApprovalLevel(
    companyId: string,
    items: CreatePRDto['items'],
    totalCost: number,
  ): Promise<{ level: 'AUTO' | 'L1' | 'L2'; autoApprove: boolean }> {
    // Get approval policies for each product category
    const productIds = items.map(item => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    // Check each item against approval policies
    let maxApprovalLevel: 'AUTO' | 'L1' | 'L2' = 'AUTO';
    
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) continue;

      const policy = await this.prisma.approvalPolicy.findUnique({
        where: {
          company_id_product_category: {
            company_id: companyId,
            product_category: product.category || 'General',
          },
        },
      });

      if (!policy) continue;

      const itemCost = (item.estimatedCost || 0) * item.quantity;
      
      if (itemCost > Number(policy.l2_threshold)) {
        maxApprovalLevel = 'L2';
      } else if (itemCost > Number(policy.l1_threshold) && maxApprovalLevel !== 'L2') {
        maxApprovalLevel = 'L1';
      } else if (itemCost > Number(policy.auto_approve_limit) && maxApprovalLevel === 'AUTO') {
        maxApprovalLevel = 'L1';
      }
    }

    return {
      level: maxApprovalLevel,
      autoApprove: maxApprovalLevel === 'AUTO',
    };
  }

  /**
   * Check if L2 approval is needed
   */
  private async needsL2Approval(
    companyId: string,
    prLines: any[],
    totalCost: number,
  ): Promise<boolean> {
    for (const line of prLines) {
      const policy = await this.prisma.approvalPolicy.findUnique({
        where: {
          company_id_product_category: {
            company_id: companyId,
            product_category: line.product.category || 'General',
          },
        },
      });

      if (policy) {
        const lineCost = (Number(line.estimated_cost) || 0) * Number(line.quantity);
        if (lineCost > Number(policy.l2_threshold)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Send approval notification to appropriate approvers
   */
  private async sendApprovalNotification(pr: any, level: 'L1' | 'L2') {
    const approverRole = level === 'L1' ? 'Manager' : 'Dept Admin';
    
    await this.notificationService.sendNotification({
      type: 'PR_APPROVAL_REQUIRED',
      title: `Purchase Requisition Approval Required (${level})`,
      message: `PR ${pr.pr_number} requires ${level} approval. Please review and approve/reject.`,
      data: { 
        prId: pr.id, 
        prNumber: pr.pr_number,
        approvalLevel: level,
        requiredRole: approverRole,
      },
      channels: ['email'],
    });
  }

  /**
   * Get Purchase Requisitions with filtering
   */
  async getPurchaseRequisitions(
    companyId: string,
    filters: {
      status?: string;
      requesterId?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { company_id: companyId };
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.requesterId) {
      where.requester_id = filters.requesterId;
    }

    const [prs, total] = await Promise.all([
      this.prisma.purchaseRequisition.findMany({
        where,
        include: {
          lines: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.prisma.purchaseRequisition.count({ where }),
    ]);

    // Calculate total estimated cost for each PR
    const prsWithTotals = prs.map(pr => ({
      ...pr,
      totalEstimatedCost: pr.lines.reduce((sum, line) => 
        sum + (Number(line.estimated_cost) || 0) * Number(line.quantity), 0
      ),
    }));

    return {
      data: prsWithTotals,
      total,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    };
  }

  /**
   * Get Purchase Orders with filtering
   */
  async getPurchaseOrders(
    companyId: string,
    filters: {
      status?: string;
      supplierId?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { company_id: companyId };
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.supplierId) {
      where.supplier_id = filters.supplierId;
    }

    const [pos, total] = await Promise.all([
      this.prisma.opsPurchaseOrder.findMany({
        where,
        include: {
          lines: {
            include: {
              product: true,
            },
          },
          supplier: true,
          purchase_requisition: true,
        },
        orderBy: { created_at: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.prisma.opsPurchaseOrder.count({ where }),
    ]);

    return {
      data: pos,
      total,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    };
  }

  /**
   * Get procurement dashboard statistics
   */
  async getProcurementDashboard(companyId: string) {
    const [
      totalPRs,
      pendingL1PRs,
      pendingL2PRs,
      approvedPRs,
      activePOs,
      monthlySpend,
    ] = await Promise.all([
      this.prisma.purchaseRequisition.count({
        where: { company_id: companyId },
      }),
      this.prisma.purchaseRequisition.count({
        where: { company_id: companyId, status: PRStatus.PENDING_L1 },
      }),
      this.prisma.purchaseRequisition.count({
        where: { company_id: companyId, status: PRStatus.PENDING_L2 },
      }),
      this.prisma.purchaseRequisition.count({
        where: { company_id: companyId, status: PRStatus.APPROVED },
      }),
      this.prisma.opsPurchaseOrder.count({
        where: { 
          company_id: companyId,
          status: { in: [POStatus.DRAFT, POStatus.SENT, POStatus.CONFIRMED] },
        },
      }),
      this.prisma.opsPurchaseOrder.aggregate({
        where: {
          company_id: companyId,
          created_at: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { total_value: true },
      }),
    ]);

    // Calculate average processing time (simplified)
    const avgProcessingTime = 3.5; // days - would calculate from actual data

    return {
      totalPRs,
      pendingApprovals: pendingL1PRs + pendingL2PRs,
      pendingL1: pendingL1PRs,
      pendingL2: pendingL2PRs,
      approvedPRs,
      activePOs,
      monthlySpend: Number(monthlySpend._sum.total_value) || 0,
      avgProcessingTime,
      recentPRs: await this.getRecentPRs(companyId, 5),
      recentPOs: await this.getRecentPOs(companyId, 5),
    };
  }

  /**
   * Get recent PRs for dashboard
   */
  private async getRecentPRs(companyId: string, limit: number) {
    return this.prisma.purchaseRequisition.findMany({
      where: { company_id: companyId },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  /**
   * Get recent POs for dashboard
   */
  private async getRecentPOs(companyId: string, limit: number) {
    return this.prisma.opsPurchaseOrder.findMany({
      where: { company_id: companyId },
      include: {
        supplier: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }
}