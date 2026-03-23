import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyProduct(companyId: string, productId: string, include?: any) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, company_id: companyId },
      include,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  private async getCompanySupplier(companyId: string, supplierId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, company_id: companyId },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return supplier;
  }

  // --- Product CRUD ---

  async createProduct(companyId: string, data: any) {
    const { sku, name, description, category, unit_of_measure, abc_class, xyz_class } = data;

    // Check if SKU already exists
    const existing = await this.prisma.product.findUnique({
      where: { company_id_sku: { company_id: companyId, sku } }
    });

    if (existing) {
      throw new BadRequestException(`Product with SKU ${sku} already exists`);
    }

    return this.prisma.product.create({
      data: {
        company_id: companyId,
        sku,
        name,
        description,
        category,
        unit_of_measure,
        abc_class,
        xyz_class,
      },
    });
  }

  async getProducts(companyId: string, filters?: any) {
    const { category, abc_class, xyz_class, search } = filters || {};

    const where: any = { company_id: companyId };

    if (category) where.category = category;
    if (abc_class) where.abc_class = abc_class;
    if (xyz_class) where.xyz_class = xyz_class;
    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.product.findMany({
      where,
      include: {
        suppliers: {
          include: { supplier: true }
        },
        stock_levels: {
          include: { location: true }
        }
      },
      orderBy: { sku: 'asc' },
    });
  }

  async getProduct(companyId: string, productId: string) {
    return this.getCompanyProduct(companyId, productId, {
      suppliers: {
        include: { supplier: true }
      },
      stock_levels: {
        include: { location: true }
      },
      stock_ledger: {
        include: { location: true },
        orderBy: { created_at: 'desc' },
        take: 50 // Last 50 transactions
      }
    });
  }

  async updateProduct(companyId: string, productId: string, data: any) {
    const product = await this.getCompanyProduct(companyId, productId);

    // If SKU is being changed, check for conflicts
    if (data.sku && data.sku !== product.sku) {
      const existing = await this.prisma.product.findUnique({
        where: { company_id_sku: { company_id: companyId, sku: data.sku } }
      });

      if (existing) {
        throw new BadRequestException(`Product with SKU ${data.sku} already exists`);
      }
    }

    return this.prisma.product.update({
      where: { id: productId },
      data,
    });
  }

  async deleteProduct(companyId: string, productId: string) {
    const product = await this.getCompanyProduct(companyId, productId, {
      stock_levels: true,
      stock_ledger: true,
      suppliers: true
    });

    // Check if product has stock or transactions
    const hasStock = product.stock_levels.some(sl => Number(sl.quantity) > 0);
    const hasTransactions = product.stock_ledger.length > 0;

    if (hasStock || hasTransactions) {
      throw new BadRequestException('Cannot delete product with existing stock or transaction history');
    }

    return this.prisma.product.delete({
      where: { id: productId }
    });
  }

  // --- Product Categories ---

  async getCategories(companyId: string) {
    const categories = await this.prisma.product.findMany({
      where: { company_id: companyId },
      select: { category: true },
      distinct: ['category'],
    });

    return categories.map(c => c.category).filter(Boolean);
  }

  // --- ABC/XYZ Classification ---

  async updateClassification(companyId: string, productId: string, abc_class?: string, xyz_class?: string) {
    const product = await this.getCompanyProduct(companyId, productId);

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        abc_class: abc_class || product.abc_class,
        xyz_class: xyz_class || product.xyz_class,
      },
    });
  }

  // --- Supplier-Product Relations ---

  async addSupplier(companyId: string, productId: string, supplierData: any) {
    const { supplier_id, unit_cost, lead_time_days, is_preferred } = supplierData;

    // Verify product and supplier exist
    await this.getCompanyProduct(companyId, productId);
    await this.getCompanySupplier(companyId, supplier_id);

    // Check if relation already exists
    const existing = await this.prisma.supplierProduct.findUnique({
      where: { supplier_id_product_id: { supplier_id, product_id: productId } }
    });

    if (existing) {
      throw new BadRequestException('Supplier-Product relation already exists');
    }

    return this.prisma.supplierProduct.create({
      data: {
        supplier_id,
        product_id: productId,
        unit_cost,
        lead_time_days,
        is_preferred: is_preferred || false,
      },
      include: { supplier: true }
    });
  }

  async updateSupplierProduct(companyId: string, productId: string, supplierId: string, data: any) {
    const relation = await this.prisma.supplierProduct.findUnique({
      where: { supplier_id_product_id: { supplier_id: supplierId, product_id: productId } },
      include: { 
        supplier: true,
        product: true
      }
    });

    if (!relation || relation.product.company_id !== companyId) {
      throw new NotFoundException('Supplier-Product relation not found');
    }

    return this.prisma.supplierProduct.update({
      where: { supplier_id_product_id: { supplier_id: supplierId, product_id: productId } },
      data,
      include: { supplier: true }
    });
  }

  async removeSupplier(companyId: string, productId: string, supplierId: string) {
    const relation = await this.prisma.supplierProduct.findUnique({
      where: { supplier_id_product_id: { supplier_id: supplierId, product_id: productId } },
      include: { product: true }
    });

    if (!relation || relation.product.company_id !== companyId) {
      throw new NotFoundException('Supplier-Product relation not found');
    }

    return this.prisma.supplierProduct.delete({
      where: { supplier_id_product_id: { supplier_id: supplierId, product_id: productId } }
    });
  }
}
