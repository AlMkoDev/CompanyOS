import { Injectable } from '@nestjs/common';

export interface MaskingOptions {
  maskCosts?: boolean;
  maskPrices?: boolean;
  maskTotals?: boolean;
  maskBankDetails?: boolean;
  maskPaymentTerms?: boolean;
  showPartialData?: boolean;
}

export interface UserPermissions {
  canViewFinancialData: boolean;
  canViewCosts: boolean;
  canViewPrices: boolean;
  canViewTotals: boolean;
  canViewBankDetails: boolean;
  canViewPaymentTerms: boolean;
  role: string;
}

@Injectable()
export class FinancialDataMaskingService {
  
  /**
   * Determine masking options based on user permissions
   */
  getMaskingOptions(userPermissions: UserPermissions): MaskingOptions {
    return {
      maskCosts: !userPermissions.canViewCosts,
      maskPrices: !userPermissions.canViewPrices,
      maskTotals: !userPermissions.canViewTotals,
      maskBankDetails: !userPermissions.canViewBankDetails,
      maskPaymentTerms: !userPermissions.canViewPaymentTerms,
      showPartialData: userPermissions.canViewFinancialData,
    };
  }

  /**
   * Mask financial values based on options
   */
  maskFinancialValue(
    value: number | null | undefined,
    options: MaskingOptions,
    fieldType: 'cost' | 'price' | 'total' = 'cost'
  ): string | number | null {
    if (value === null || value === undefined) {
      return null;
    }

    const shouldMask = 
      (fieldType === 'cost' && options.maskCosts) ||
      (fieldType === 'price' && options.maskPrices) ||
      (fieldType === 'total' && options.maskTotals);

    if (!shouldMask) {
      return value;
    }

    if (options.showPartialData) {
      // Show partial data (e.g., "R1,2**.**")
      const valueStr = value.toFixed(2);
      const parts = valueStr.split('.');
      const integerPart = parts[0];
      const decimalPart = parts[1];
      
      if (integerPart.length <= 2) {
        return `R${integerPart}.***`;
      } else {
        const visibleDigits = Math.min(2, integerPart.length - 1);
        const maskedPart = '*'.repeat(integerPart.length - visibleDigits);
        return `R${integerPart.substring(0, visibleDigits)}${maskedPart}.***`;
      }
    }

    // Complete masking
    return 'R***.**';
  }

  /**
   * Mask currency string values
   */
  maskCurrencyString(
    value: string | null | undefined,
    options: MaskingOptions,
    fieldType: 'cost' | 'price' | 'total' = 'cost'
  ): string | null {
    if (!value) return null;

    const shouldMask = 
      (fieldType === 'cost' && options.maskCosts) ||
      (fieldType === 'price' && options.maskPrices) ||
      (fieldType === 'total' && options.maskTotals);

    if (!shouldMask) {
      return value;
    }

    if (options.showPartialData) {
      // Extract numeric part and mask it
      const numericMatch = value.match(/[\d,]+\.?\d*/);
      if (numericMatch) {
        const numericPart = numericMatch[0];
        const beforeNumeric = value.substring(0, numericMatch.index);
        const afterNumeric = value.substring(numericMatch.index! + numericPart.length);
        
        if (numericPart.length <= 3) {
          return `${beforeNumeric}***${afterNumeric}`;
        } else {
          const visiblePart = numericPart.substring(0, 2);
          const maskedPart = '*'.repeat(numericPart.length - 2);
          return `${beforeNumeric}${visiblePart}${maskedPart}${afterNumeric}`;
        }
      }
    }

    return 'R***.**';
  }

  /**
   * Mask bank account details
   */
  maskBankDetails(
    bankDetails: any,
    options: MaskingOptions
  ): any {
    if (!bankDetails || !options.maskBankDetails) {
      return bankDetails;
    }

    const masked = { ...bankDetails };

    // Mask account number
    if (masked.account_number) {
      if (options.showPartialData && masked.account_number.length > 4) {
        const visible = masked.account_number.substring(0, 2);
        const lastVisible = masked.account_number.substring(masked.account_number.length - 2);
        const maskedMiddle = '*'.repeat(masked.account_number.length - 4);
        masked.account_number = `${visible}${maskedMiddle}${lastVisible}`;
      } else {
        masked.account_number = '****';
      }
    }

    // Mask routing/sort code
    if (masked.routing_number) {
      if (options.showPartialData && masked.routing_number.length > 2) {
        const visible = masked.routing_number.substring(0, 2);
        const maskedPart = '*'.repeat(masked.routing_number.length - 2);
        masked.routing_number = `${visible}${maskedPart}`;
      } else {
        masked.routing_number = '****';
      }
    }

    // Mask IBAN
    if (masked.iban) {
      if (options.showPartialData && masked.iban.length > 8) {
        const countryCode = masked.iban.substring(0, 2);
        const checkDigits = masked.iban.substring(2, 4);
        const maskedPart = '*'.repeat(masked.iban.length - 8);
        const lastFour = masked.iban.substring(masked.iban.length - 4);
        masked.iban = `${countryCode}${checkDigits}${maskedPart}${lastFour}`;
      } else {
        masked.iban = 'XX**************';
      }
    }

    return masked;
  }

  /**
   * Mask payment terms if they contain financial information
   */
  maskPaymentTerms(
    paymentTerms: string | null | undefined,
    options: MaskingOptions
  ): string | null {
    if (!paymentTerms || !options.maskPaymentTerms) {
      return paymentTerms;
    }

    if (options.showPartialData) {
      // Mask specific financial details but keep general terms
      return paymentTerms
        .replace(/\d+%/g, '**%')
        .replace(/\$[\d,]+\.?\d*/g, '$***.**')
        .replace(/R[\d,]+\.?\d*/g, 'R***.**')
        .replace(/\d+\.\d+%/g, '**.**%');
    }

    return '[Payment terms hidden]';
  }

  /**
   * Mask an entire object based on field mappings
   */
  maskObject<T extends Record<string, any>>(
    obj: T,
    userPermissions: UserPermissions,
    fieldMappings?: Record<string, 'cost' | 'price' | 'total' | 'bankDetails' | 'paymentTerms'>
  ): T {
    if (!obj) return obj;

    const options = this.getMaskingOptions(userPermissions);
    const masked = { ...obj };

    // Default field mappings
    const defaultMappings: Record<string, 'cost' | 'price' | 'total' | 'bankDetails' | 'paymentTerms'> = {
      unit_cost: 'cost',
      total_cost: 'cost',
      estimated_cost: 'cost',
      cost: 'cost',
      unit_price: 'price',
      total_price: 'price',
      price: 'price',
      total_amount: 'total',
      total_value: 'total',
      subtotal: 'total',
      grand_total: 'total',
      bank_details: 'bankDetails',
      payment_terms: 'paymentTerms',
      ...fieldMappings
    };

    Object.keys(masked).forEach(key => {
      const fieldType = defaultMappings[key];
      const value = masked[key];

      if (fieldType === 'bankDetails') {
        masked[key] = this.maskBankDetails(value, options);
      } else if (fieldType === 'paymentTerms') {
        masked[key] = this.maskPaymentTerms(value, options);
      } else if (fieldType && typeof value === 'number') {
        masked[key] = this.maskFinancialValue(value, options, fieldType);
      } else if (fieldType && typeof value === 'string') {
        masked[key] = this.maskCurrencyString(value, options, fieldType);
      }
    });

    return masked;
  }

  /**
   * Mask an array of objects
   */
  maskArray<T extends Record<string, any>>(
    array: T[],
    userPermissions: UserPermissions,
    fieldMappings?: Record<string, 'cost' | 'price' | 'total' | 'bankDetails' | 'paymentTerms'>
  ): T[] {
    if (!Array.isArray(array)) return array;

    return array.map(item => this.maskObject(item, userPermissions, fieldMappings));
  }

  /**
   * Check if user has permission to view specific financial data
   */
  canViewFinancialField(
    fieldName: string,
    userPermissions: UserPermissions
  ): boolean {
    const costFields = ['unit_cost', 'total_cost', 'estimated_cost', 'cost'];
    const priceFields = ['unit_price', 'total_price', 'price'];
    const totalFields = ['total_amount', 'total_value', 'subtotal', 'grand_total'];
    const bankFields = ['bank_details', 'account_number', 'routing_number', 'iban'];
    const paymentFields = ['payment_terms'];

    if (costFields.includes(fieldName)) {
      return userPermissions.canViewCosts;
    }
    if (priceFields.includes(fieldName)) {
      return userPermissions.canViewPrices;
    }
    if (totalFields.includes(fieldName)) {
      return userPermissions.canViewTotals;
    }
    if (bankFields.includes(fieldName)) {
      return userPermissions.canViewBankDetails;
    }
    if (paymentFields.includes(fieldName)) {
      return userPermissions.canViewPaymentTerms;
    }

    return true; // Non-financial fields are visible by default
  }

  /**
   * Get user permissions based on role and specific permissions
   */
  getUserPermissions(
    userRole: string,
    specificPermissions: string[] = []
  ): UserPermissions {
    const hasPermission = (permission: string) => 
      specificPermissions.includes(permission);

    // Role-based default permissions
    const rolePermissions: Record<string, Partial<UserPermissions>> = {
      'procurement_manager': {
        canViewFinancialData: true,
        canViewCosts: true,
        canViewPrices: true,
        canViewTotals: true,
        canViewBankDetails: true,
        canViewPaymentTerms: true,
      },
      'finance_manager': {
        canViewFinancialData: true,
        canViewCosts: true,
        canViewPrices: true,
        canViewTotals: true,
        canViewBankDetails: true,
        canViewPaymentTerms: true,
      },
      'finance_approver': {
        canViewFinancialData: true,
        canViewCosts: true,
        canViewPrices: true,
        canViewTotals: true,
        canViewBankDetails: false,
        canViewPaymentTerms: true,
      },
      'procurement_officer': {
        canViewFinancialData: true,
        canViewCosts: true,
        canViewPrices: true,
        canViewTotals: false,
        canViewBankDetails: false,
        canViewPaymentTerms: false,
      },
      'warehouse_manager': {
        canViewFinancialData: false,
        canViewCosts: false,
        canViewPrices: false,
        canViewTotals: false,
        canViewBankDetails: false,
        canViewPaymentTerms: false,
      },
      'warehouse_clerk': {
        canViewFinancialData: false,
        canViewCosts: false,
        canViewPrices: false,
        canViewTotals: false,
        canViewBankDetails: false,
        canViewPaymentTerms: false,
      },
      'inventory_viewer': {
        canViewFinancialData: false,
        canViewCosts: false,
        canViewPrices: false,
        canViewTotals: false,
        canViewBankDetails: false,
        canViewPaymentTerms: false,
      },
    };

    const basePermissions = rolePermissions[userRole.toLowerCase()] || {
      canViewFinancialData: false,
      canViewCosts: false,
      canViewPrices: false,
      canViewTotals: false,
      canViewBankDetails: false,
      canViewPaymentTerms: false,
    };

    // Override with specific permissions
    return {
      role: userRole,
      canViewFinancialData: basePermissions.canViewFinancialData || hasPermission('view_financial_data'),
      canViewCosts: basePermissions.canViewCosts || hasPermission('view_costs'),
      canViewPrices: basePermissions.canViewPrices || hasPermission('view_prices'),
      canViewTotals: basePermissions.canViewTotals || hasPermission('view_totals'),
      canViewBankDetails: basePermissions.canViewBankDetails || hasPermission('view_bank_details'),
      canViewPaymentTerms: basePermissions.canViewPaymentTerms || hasPermission('view_payment_terms'),
    };
  }
}