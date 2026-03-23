import { IPayrollEngine, PayrollCalculationResult } from './payroll-engine.interface';
import { JurisdictionConfig } from '@prisma/client';

export class SouthAfricaPayrollEngine implements IPayrollEngine {
  calculatePayslip(grossSalary: number, allowances: Record<string, any>, config: JurisdictionConfig): PayrollCalculationResult {
    const totalGross = grossSalary + Object.values(allowances || {}).reduce((sum, val) => sum + Number(val), 0);
    
    // UIF Calculation - 1% of gross, capped at R177.12
    const uifDeduction = Math.min(totalGross * 0.01, 177.12);

    // PAYE Calculation - Simplified Tax Brackets for Under 65
    // 2024/2025 Tax Rates (Simplified for Example)
    let paye = 0;
    
    if (totalGross > 0) { // Should use annualised calculation but keeping it monthly for simplicity
      const annualGross = totalGross * 12;
      
      let annualPaye = 0;
      if (annualGross <= 237100) {
        annualPaye = annualGross * 0.18;
      } else if (annualGross <= 370500) {
        annualPaye = 42678 + ((annualGross - 237100) * 0.26);
      } else if (annualGross <= 512800) {
        annualPaye = 77362 + ((annualGross - 370500) * 0.31);
      } else {
        annualPaye = 121475 + ((annualGross - 512800) * 0.36); // simplified top bracket
      }

      // Primary Rebate
      const primaryRebate = 17224; 
      
      // Calculate monthly PAYE
      if (annualPaye > primaryRebate) {
        paye = (annualPaye - primaryRebate) / 12;
      }
    }

    const deductions = [
      { type: 'uif', amount: uifDeduction },
      { type: 'paye', amount: paye }
    ];

    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

    return {
      grossPay: totalGross,
      netPay: totalGross - totalDeductions,
      deductions
    };
  }
}
