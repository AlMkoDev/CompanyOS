import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { 
  SupplyChainRolesGuard, 
  RequireSupplyChainPermissions, 
  SupplyChainPermission 
} from './guards/supply-chain-roles.guard';
import { FeatureFlagGuard, RequireFeatureFlags } from '../../common/guards/feature-flag.guard';
import { FeatureFlag } from '../../common/services/feature-flag.service';
import { FinancialMaskingInterceptor } from './interceptors/financial-masking.interceptor';
import { MaskFinancialData } from './decorators/mask-financial-data.decorator';
import {
  AddProductSupplierDto,
  CreateProductDto,
  UpdateProductClassificationDto,
  UpdateProductDto,
  UpdateProductSupplierDto,
} from './dto/product.dto';

@ApiTags('products')
@ApiBearerAuth('JWT-auth')
@Controller('supply-chain/products')
@UseGuards(JwtAuthGuard, FeatureFlagGuard, SupplyChainRolesGuard)
@UseInterceptors(FinancialMaskingInterceptor)
@RequireFeatureFlags(FeatureFlag.ENABLE_SUPPLY_CHAIN)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @RequireSupplyChainPermissions(SupplyChainPermission.CREATE_PRODUCT)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - SKU already exists' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async createProduct(@Req() req: any, @Body() data: CreateProductDto) {
    return this.productService.createProduct(req.user.companyId, data);
  }

  @Get()
  @RequireSupplyChainPermissions(SupplyChainPermission.READ_PRODUCT)
  @MaskFinancialData({ 
    enabled: true,
    fieldMappings: { 
      unit_cost: 'cost',
      last_cost: 'cost',
      average_cost: 'cost'
    }
  })
  @ApiOperation({ summary: 'Get all products with optional filters' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by product category' })
  @ApiQuery({ name: 'abc_class', required: false, description: 'Filter by ABC classification' })
  @ApiQuery({ name: 'xyz_class', required: false, description: 'Filter by XYZ classification' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in SKU, name, or description' })
  @ApiResponse({ status: 200, description: 'List of products' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getProducts(
    @Req() req: any,
    @Query('category') category?: string,
    @Query('abc_class') abc_class?: string,
    @Query('xyz_class') xyz_class?: string,
    @Query('search') search?: string,
  ) {
    return this.productService.getProducts(req.user.companyId, {
      category,
      abc_class,
      xyz_class,
      search,
    });
  }

  @Get('categories')
  @RequireSupplyChainPermissions(SupplyChainPermission.READ_PRODUCT)
  @ApiOperation({ summary: 'Get all product categories' })
  @ApiResponse({ status: 200, description: 'List of product categories' })
  async getCategories(@Req() req: any) {
    return this.productService.getCategories(req.user.companyId);
  }

  @Get(':id')
  @RequireSupplyChainPermissions(SupplyChainPermission.READ_PRODUCT)
  @MaskFinancialData({ 
    enabled: true,
    fieldMappings: { 
      unit_cost: 'cost',
      last_cost: 'cost',
      average_cost: 'cost'
    },
    arrayField: 'suppliers'
  })
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getProduct(@Req() req: any, @Param('id') id: string) {
    return this.productService.getProduct(req.user.companyId, id);
  }

  @Put(':id')
  @RequireSupplyChainPermissions(SupplyChainPermission.UPDATE_PRODUCT)
  @ApiOperation({ summary: 'Update product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async updateProduct(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: UpdateProductDto,
  ) {
    return this.productService.updateProduct(req.user.companyId, id, data);
  }

  @Delete(':id')
  @RequireSupplyChainPermissions(SupplyChainPermission.DELETE_PRODUCT)
  @ApiOperation({ summary: 'Delete product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete product with stock or transactions' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async deleteProduct(@Req() req: any, @Param('id') id: string) {
    return this.productService.deleteProduct(req.user.companyId, id);
  }

  @Put(':id/classification')
  @RequireSupplyChainPermissions(SupplyChainPermission.UPDATE_PRODUCT)
  @ApiOperation({ summary: 'Update product ABC/XYZ classification' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Classification updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async updateClassification(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: UpdateProductClassificationDto,
  ) {
    return this.productService.updateClassification(
      req.user.companyId,
      id,
      data.abc_class,
      data.xyz_class,
    );
  }

  // --- Supplier Relations ---

  @Post(':id/suppliers')
  @RequireSupplyChainPermissions(SupplyChainPermission.UPDATE_PRODUCT, SupplyChainPermission.UPDATE_SUPPLIER)
  @ApiOperation({ summary: 'Add supplier to product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 201, description: 'Supplier added to product' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async addSupplier(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: AddProductSupplierDto,
  ) {
    return this.productService.addSupplier(req.user.companyId, id, data);
  }

  @Put(':id/suppliers/:supplierId')
  @RequireSupplyChainPermissions(SupplyChainPermission.UPDATE_PRODUCT, SupplyChainPermission.UPDATE_SUPPLIER)
  @ApiOperation({ summary: 'Update supplier-product relationship' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiParam({ name: 'supplierId', description: 'Supplier ID' })
  @ApiResponse({ status: 200, description: 'Supplier-product relationship updated' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async updateSupplierProduct(
    @Req() req: any,
    @Param('id') id: string,
    @Param('supplierId') supplierId: string,
    @Body() data: UpdateProductSupplierDto,
  ) {
    return this.productService.updateSupplierProduct(req.user.companyId, id, supplierId, data);
  }

  @Delete(':id/suppliers/:supplierId')
  @RequireSupplyChainPermissions(SupplyChainPermission.UPDATE_PRODUCT, SupplyChainPermission.UPDATE_SUPPLIER)
  @ApiOperation({ summary: 'Remove supplier from product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiParam({ name: 'supplierId', description: 'Supplier ID' })
  @ApiResponse({ status: 200, description: 'Supplier removed from product' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async removeSupplier(
    @Req() req: any,
    @Param('id') id: string,
    @Param('supplierId') supplierId: string,
  ) {
    return this.productService.removeSupplier(req.user.companyId, id, supplierId);
  }
}
