import { Injectable } from '@nestjs/common';
import { NotificationService } from '../../common/services/notification.service';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SupplyChainNotificationService {
  constructor(
    private notificationService: NotificationService,
    private prisma: PrismaService,
  ) {}

  // --- Purchase Requisition Notifications ---

  async notifyPRApprovalRequired(companyId: string, prId: string, approverEmail: string) {
    const pr = await this.prisma.purchaseRequisition.findUnique({
      where: { id: prId, company_id: companyId },
      include: { 
        lines: { include: { product: true } },
        requester: true 
      },
    });

    if (!pr) return;

    const subject = `Purchase Requisition ${pr.pr_number} - Approval Required`;
    const text = `
      A new purchase requisition requires your approval:
      
      PR Number: ${pr.pr_number}
      Requester: ${pr.requester?.first_name} ${pr.requester?.last_name}
      Status: ${pr.status}
      
      Items:
      ${pr.lines.map(line => `- ${line.product.name}: ${line.quantity} units`).join('\n')}
      
      Please review and approve in the CompanyOS system.
    `;

    await this.notificationService.sendEmail(approverEmail, subject, text);
  }

  async notifyPRStatusChange(companyId: string, prId: string, newStatus: string) {
    const pr = await this.prisma.purchaseRequisition.findUnique({
      where: { id: prId, company_id: companyId },
      include: { requester: true },
    });

    if (!pr || !pr.requester) return;

    const subject = `Purchase Requisition ${pr.pr_number} - Status Updated`;
    const text = `
      Your purchase requisition status has been updated:
      
      PR Number: ${pr.pr_number}
      New Status: ${newStatus}
      
      You can view the details in the CompanyOS system.
    `;

    await this.notificationService.sendEmail(pr.requester.email, subject, text);
  }

  // --- Purchase Order Notifications ---

  async notifyPOCreated(companyId: string, poId: string) {
    const po = await this.prisma.opsPurchaseOrder.findUnique({
      where: { id: poId, company_id: companyId },
      include: { 
        supplier: true,
        lines: { include: { product: true } }
      },
    });

    if (!po) return;

    // Notify supplier if they have email
    const contactInfo = po.supplier.contact_info as any;
    const supplierEmail = contactInfo?.email;
    if (supplierEmail) {
      const subject = `New Purchase Order ${po.po_number}`;
      const text = `
        You have received a new purchase order:
        
        PO Number: ${po.po_number}
        Total Value: R${po.total_value}
        Status: ${po.status}
        
        Items:
        ${po.lines.map(line => `- ${line.product.name}: ${line.quantity} units @ R${line.unit_price}`).join('\n')}
        
        Please confirm receipt and provide delivery timeline.
      `;

      await this.notificationService.sendEmail(supplierEmail, subject, text);
    }
  }

  async notifyPOStatusChange(companyId: string, poId: string, newStatus: string) {
    const po = await this.prisma.opsPurchaseOrder.findUnique({
      where: { id: poId, company_id: companyId },
      include: { supplier: true },
    });

    if (!po) return;

    const contactInfo = po.supplier.contact_info as any;
    const supplierEmail = contactInfo?.email;
    if (supplierEmail) {
      const subject = `Purchase Order ${po.po_number} - Status Updated`;
      const text = `
        Purchase Order status has been updated:
        
        PO Number: ${po.po_number}
        New Status: ${newStatus}
        Total Value: R${po.total_value}
        
        Please check your system for any required actions.
      `;

      await this.notificationService.sendEmail(supplierEmail, subject, text);
    }
  }

  // --- Stock Level Notifications ---

  async notifyLowStock(companyId: string, productId: string, locationId: string) {
    const stockLevel = await this.prisma.stockLevel.findUnique({
      where: {
        company_id_product_id_location_id: {
          company_id: companyId,
          product_id: productId,
          location_id: locationId,
        },
      },
      include: {
        product: true,
        location: true,
      },
    });

    if (!stockLevel) return;

    // Get procurement team emails (simplified - in real implementation, get from roles/departments)
    const procurementEmails = await this.getProcurementTeamEmails(companyId);

    const subject = `Low Stock Alert - ${stockLevel.product.sku}`;
    const text = `
      Stock level is below reorder point:
      
      Product: ${stockLevel.product.name} (${stockLevel.product.sku})
      Location: ${stockLevel.location.name}
      Current Stock: ${stockLevel.quantity}
      Reorder Point: ${stockLevel.reorder_point}
      EOQ: ${stockLevel.eoq}
      
      Please consider creating a purchase requisition.
    `;

    for (const email of procurementEmails) {
      await this.notificationService.sendEmail(email, subject, text);
    }
  }

  async notifyStockOut(companyId: string, productId: string, locationId: string) {
    const stockLevel = await this.prisma.stockLevel.findUnique({
      where: {
        company_id_product_id_location_id: {
          company_id: companyId,
          product_id: productId,
          location_id: locationId,
        },
      },
      include: {
        product: true,
        location: true,
      },
    });

    if (!stockLevel) return;

    const procurementEmails = await this.getProcurementTeamEmails(companyId);

    const subject = `URGENT: Stock Out - ${stockLevel.product.sku}`;
    const text = `
      URGENT: Product is out of stock!
      
      Product: ${stockLevel.product.name} (${stockLevel.product.sku})
      Location: ${stockLevel.location.name}
      Current Stock: ${stockLevel.quantity}
      
      Immediate action required to replenish stock.
    `;

    for (const email of procurementEmails) {
      await this.notificationService.sendEmail(email, subject, text);
    }
  }

  // --- Goods Receipt Notifications ---

  async notifyGoodsReceived(companyId: string, grId: string) {
    const gr = await this.prisma.opsGoodsReceipt.findUnique({
      where: { id: grId, company_id: companyId },
      include: {
        po: { include: { supplier: true } },
        lines: { include: { product: true } },
        receiver: true,
      },
    });

    if (!gr) return;

    // Notify supplier
    const contactInfo = gr.po.supplier.contact_info as any;
    const supplierEmail = contactInfo?.email;
    if (supplierEmail) {
      const subject = `Goods Receipt Confirmation - PO ${gr.po.po_number}`;
      const text = `
        Your delivery has been received:
        
        GR Number: ${gr.gr_number}
        PO Number: ${gr.po.po_number}
        Received By: ${gr.receiver?.first_name} ${gr.receiver?.last_name}
        Status: ${gr.status}
        
        Items Received:
        ${gr.lines.map(line => `- ${line.product.name}: ${line.received_qty} units`).join('\n')}
        
        Thank you for your delivery.
      `;

      await this.notificationService.sendEmail(supplierEmail, subject, text);
    }
  }

  async notifyDiscrepancy(companyId: string, grId: string) {
    const gr = await this.prisma.opsGoodsReceipt.findUnique({
      where: { id: grId, company_id: companyId },
      include: {
        po: { include: { supplier: true } },
        lines: { include: { product: true } },
      },
    });

    if (!gr) return;

    const discrepancies = gr.lines.filter(line => Number(line.rejected_qty) > 0);
    if (discrepancies.length === 0) return;

    const contactInfo = gr.po.supplier.contact_info as any;
    const supplierEmail = contactInfo?.email;
    if (supplierEmail) {
      const subject = `Delivery Discrepancy - PO ${gr.po.po_number}`;
      const text = `
        Discrepancies found in your delivery:
        
        GR Number: ${gr.gr_number}
        PO Number: ${gr.po.po_number}
        
        Rejected Items:
        ${discrepancies.map(line => 
          `- ${line.product.name}: ${line.rejected_qty} units rejected (${line.rejection_reason})`
        ).join('\n')}
        
        Please contact us to resolve these discrepancies.
      `;

      await this.notificationService.sendEmail(supplierEmail, subject, text);
    }
  }

  // --- Supplier Performance Notifications ---

  async notifySupplierPerformanceIssue(companyId: string, supplierId: string, issue: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId, company_id: companyId },
    });

    if (!supplier) return;

    const contactInfo = supplier.contact_info as any;
    const supplierEmail = contactInfo?.email;
    if (supplierEmail) {
      const subject = `Performance Issue Notification`;
      const text = `
        We have identified a performance issue that requires attention:
        
        Supplier: ${supplier.name}
        Issue: ${issue}
        
        Please contact our procurement team to discuss improvement measures.
      `;

      await this.notificationService.sendEmail(supplierEmail, subject, text);
    }
  }

  // --- Helper Methods ---

  private async getProcurementTeamEmails(companyId: string): Promise<string[]> {
    // Simplified implementation - get users from Operations department
    const opsMembers = await this.prisma.departmentMember.findMany({
      where: {
        department: {
          company_id: companyId,
          template_key: 'ops', // Operations department
        },
      },
      include: { user: true },
    });

    return opsMembers.map(member => member.user.email);
  }

  // --- Batch Notifications ---

  async sendDailyLowStockReport(companyId: string) {
    const lowStockItems = await this.prisma.stockLevel.findMany({
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
    });

    if (lowStockItems.length === 0) return;

    const procurementEmails = await this.getProcurementTeamEmails(companyId);

    const subject = `Daily Low Stock Report - ${lowStockItems.length} items`;
    const text = `
      Daily Low Stock Report
      
      The following items are below their reorder points:
      
      ${lowStockItems.map(item => 
        `- ${item.product.sku} at ${item.location.name}: ${item.quantity} (Reorder: ${item.reorder_point})`
      ).join('\n')}
      
      Please review and create purchase requisitions as needed.
    `;

    for (const email of procurementEmails) {
      await this.notificationService.sendEmail(email, subject, text);
    }
  }
}