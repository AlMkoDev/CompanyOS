import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SupplierStatus } from '@prisma/client';

@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService) {}

  private async getCompanySupplier(companyId: string, supplierId: string, include?: any) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, company_id: companyId },
      include,
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return supplier;
  }

  // --- Supplier CRUD ---

  async createSupplier(companyId: string, data: any) {
    const { supplier_code, name, status, contact_info, bank_details } = data;

    // Check if supplier code already exists
    const existing = await this.prisma.supplier.findUnique({
      where: { company_id_supplier_code: { company_id: companyId, supplier_code } }
    });

    if (existing) {
      throw new BadRequestException(`Supplier with code ${supplier_code} already exists`);
    }

    return this.prisma.supplier.create({
      data: {
        company_id: companyId,
        supplier_code,
        name,
        status: status || SupplierStatus.ACTIVE,
        contact_info,
        bank_details,
      },
    });
  }

  async getSuppliers(companyId: string, filters?: any) {
    const { status, search } = filters || {};

    const where: any = { company_id: companyId };

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { supplier_code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.supplier.findMany({
      where,
      include: {
        products: {
          include: { product: true }
        },
        risks: true,
        _count: {
          select: { 
            products: true,
            purchase_orders: true 
          }
        }
      },
      orderBy: { supplier_code: 'asc' },
    });
  }

  async getSupplier(companyId: string, supplierId: string) {
    return this.getCompanySupplier(companyId, supplierId, {
      products: {
        include: { product: true }
      },
      risks: true,
      purchase_orders: {
        orderBy: { created_at: 'desc' },
        take: 10 // Last 10 POs
      }
    });
  }

  async updateSupplier(companyId: string, supplierId: string, data: any) {
    const supplier = await this.getCompanySupplier(companyId, supplierId);

    // If supplier code is being changed, check for conflicts
    if (data.supplier_code && data.supplier_code !== supplier.supplier_code) {
      const existing = await this.prisma.supplier.findUnique({
        where: { company_id_supplier_code: { company_id: companyId, supplier_code: data.supplier_code } }
      });

      if (existing) {
        throw new BadRequestException(`Supplier with code ${data.supplier_code} already exists`);
      }
    }

    return this.prisma.supplier.update({
      where: { id: supplierId },
      data,
    });
  }

  async deleteSupplier(companyId: string, supplierId: string) {
    const supplier = await this.getCompanySupplier(companyId, supplierId, {
      products: true,
      purchase_orders: true
    });

    // Check if supplier has active relationships
    if (supplier.products.length > 0) {
      throw new BadRequestException('Cannot delete supplier with associated products');
    }

    if (supplier.purchase_orders.length > 0) {
      throw new BadRequestException('Cannot delete supplier with purchase order history');
    }

    return this.prisma.supplier.delete({
      where: { id: supplierId }
    });
  }

  // --- Supplier Status Management ---

  async updateStatus(companyId: string, supplierId: string, status: SupplierStatus) {
    await this.getCompanySupplier(companyId, supplierId);

    return this.prisma.supplier.update({
      where: { id: supplierId },
      data: { status },
    });
  }

  async suspendSupplier(companyId: string, supplierId: string, reason?: string) {
    return this.updateStatus(companyId, supplierId, SupplierStatus.SUSPENDED);
  }

  async activateSupplier(companyId: string, supplierId: string) {
    return this.updateStatus(companyId, supplierId, SupplierStatus.ACTIVE);
  }

  async blacklistSupplier(companyId: string, supplierId: string, reason?: string) {
    return this.updateStatus(companyId, supplierId, SupplierStatus.BLACKLISTED);
  }

  // --- Supplier Risk Management ---

  async addRisk(companyId: string, supplierId: string, riskData: any) {
    const { risk_score, category, details } = riskData;

    await this.getCompanySupplier(companyId, supplierId);

    return this.prisma.supplierRisk.create({
      data: {
        supplier_id: supplierId,
        risk_score,
        category,
        details,
      },
    });
  }

  async updateRisk(companyId: string, riskId: string, data: any) {
    const risk = await this.prisma.supplierRisk.findUnique({
      where: { id: riskId },
      include: { supplier: true }
    });

    if (!risk || risk.supplier.company_id !== companyId) {
      throw new NotFoundException('Risk record not found');
    }

    return this.prisma.supplierRisk.update({
      where: { id: riskId },
      data,
    });
  }

  async deleteRisk(companyId: string, riskId: string) {
    const risk = await this.prisma.supplierRisk.findUnique({
      where: { id: riskId },
      include: { supplier: true }
    });

    if (!risk || risk.supplier.company_id !== companyId) {
      throw new NotFoundException('Risk record not found');
    }

    return this.prisma.supplierRisk.delete({
      where: { id: riskId }
    });
  }

  // --- Supplier Performance ---

  async getPerformanceMetrics(companyId: string, supplierId: string) {
    await this.getCompanySupplier(companyId, supplierId);

    // Get PO statistics
    const poStats = await this.prisma.opsPurchaseOrder.groupBy({
      by: ['status'],
      where: { 
        supplier_id: supplierId,
        company_id: companyId 
      },
      _count: true,
    });

    // Get average lead time (this would need more complex calculation in real implementation)
    const avgLeadTime = await this.prisma.supplierProduct.aggregate({
      where: { supplier_id: supplierId },
      _avg: { lead_time_days: true }
    });

    return {
      purchase_orders: poStats,
      average_lead_time: avgLeadTime._avg.lead_time_days,
      // Add more metrics as needed
    };
  }

  // --- Supplier Products ---

  async getSupplierProducts(companyId: string, supplierId: string) {
    await this.getCompanySupplier(companyId, supplierId);

    return this.prisma.supplierProduct.findMany({
      where: { supplier_id: supplierId },
      include: { product: true },
      orderBy: { product: { sku: 'asc' } }
    });
  }
}
