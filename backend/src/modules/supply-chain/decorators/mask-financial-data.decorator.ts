import { SetMetadata } from '@nestjs/common';

export const FINANCIAL_MASKING_KEY = 'financial_masking';

export interface FinancialMaskingConfig {
  enabled: boolean;
  fieldMappings?: Record<string, 'cost' | 'price' | 'total' | 'bankDetails' | 'paymentTerms'>;
  arrayField?: string; // For responses that contain arrays of objects
}

/**
 * Decorator to enable financial data masking for controller endpoints
 * 
 * @param config Configuration for masking behavior
 * 
 * @example
 * @MaskFinancialData({ enabled: true })
 * @Get('products')
 * async getProducts() { ... }
 * 
 * @example
 * @MaskFinancialData({ 
 *   enabled: true, 
 *   fieldMappings: { supplier_cost: 'cost', retail_price: 'price' }
 * })
 * @Get('product/:id')
 * async getProduct() { ... }
 * 
 * @example
 * @MaskFinancialData({ 
 *   enabled: true, 
 *   arrayField: 'lines',
 *   fieldMappings: { line_total: 'total' }
 * })
 * @Get('purchase-orders')
 * async getPurchaseOrders() { ... }
 */
export const MaskFinancialData = (config: FinancialMaskingConfig = { enabled: true }) =>
  SetMetadata(FINANCIAL_MASKING_KEY, config);