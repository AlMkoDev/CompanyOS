import { IPayrollEngine, PayrollCalculationResult } from './payroll-engine.interface';
import { JurisdictionConfig } from '@prisma/client';

export class ZimbabwePayrollEngine implements IPayrollEngine {
  calculatePayslip(grossSalary: number, allowances: Record<string, any>, config: JurisdictionConfig): PayrollCalculationResult {
    const totalGross = grossSalary + Object.values(allowances || {}).reduce((sum, val) => sum + Number(val), 0);
    
    // NSSA Calculation - 4.5% of basic salary capped at 700 USD (simplified ZWL equivalent)
    const nssaDeduction = Math.min(totalGross * 0.045, 700 * 0.045);

    // AIDS Levy - 3% of PAYE (not basic)
    // PAYE Calculation - Simplified Tax Brackets
    const taxablePay = totalGross - nssaDeduction;
    let paye = 0;
    
    if (taxablePay > 1000000) { // arbitrary ZWL brackets for example
      paye = 1000000 * 0.2 + ((taxablePay - 1000000) * 0.4);
    } else if (taxablePay > 500000) {
      paye = (taxablePay - 500000) * 0.2;
    }

    const aidsLevy = paye * 0.03;

    const deductions = [
      { type: 'nssa', amount: nssaDeduction },
      { type: 'paye', amount: paye },
      { type: 'aids_levy', amount: aidsLevy }
    ];

    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

    return {
      grossPay: totalGross,
      netPay: totalGross - totalDeductions,
      deductions
    };
  }
}
