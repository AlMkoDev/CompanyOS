export interface PayrollCalculationResult {
  grossPay: number;
  netPay: number;
  deductions: { type: string; amount: number }[];
}

import { JurisdictionConfig } from '@prisma/client';

export interface IPayrollEngine {
  calculatePayslip(
    grossSalary: number,
    allowances: Record<string, any>,
    config: JurisdictionConfig
  ): PayrollCalculationResult;
}
