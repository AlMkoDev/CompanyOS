import { IPayrollEngine, PayrollCalculationResult } from './payroll-engine.interface';
import { JurisdictionConfig } from '@prisma/client';

export class KenyaPayrollEngine implements IPayrollEngine {
  calculatePayslip(grossSalary: number, allowances: Record<string, any>, config: JurisdictionConfig): PayrollCalculationResult {
    const totalGross = grossSalary + Object.values(allowances || {}).reduce((sum, val) => sum + Number(val), 0);
    
    // NSSF Calculation (Tier 1 & Tier 2) - Simplified for example
    const nssfDeduction = Math.min(totalGross * 0.06, 1080); // Max 1080 for employee

    // NHIF Calculation - based on bands
    let nhifDeduction = 500;
    if (totalGross >= 100000) nhifDeduction = 1700;
    else if (totalGross >= 90000) nhifDeduction = 1600;
    else if (totalGross >= 80000) nhifDeduction = 1500;
    
    // PAYE Calculation - simplified taxable pay
    const taxablePay = totalGross - nssfDeduction;
    let paye = 0;
    if (taxablePay > 24000) {
      paye += (24000 * 0.1);
      if (taxablePay > 32333) {
        paye += ((32333 - 24000) * 0.25);
        paye += ((taxablePay - 32333) * 0.3); // Simplified top band
      } else {
        paye += ((taxablePay - 24000) * 0.25);
      }
    }
    
    // Personal Relief
    const personalRelief = 2400;
    paye = Math.max(0, paye - personalRelief);

    const deductions = [
      { type: 'nssf', amount: nssfDeduction },
      { type: 'nhif', amount: nhifDeduction },
      { type: 'paye', amount: paye }
    ];

    // HELB - Optional Allowance based
    if (allowances && allowances['helb']) {
      deductions.push({ type: 'helb', amount: Number(allowances['helb']) });
    }

    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

    return {
      grossPay: totalGross,
      deductions,
      netPay: totalGross - totalDeductions
    };
  }
}
