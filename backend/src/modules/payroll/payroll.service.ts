import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PayrollEngineFactory } from './engines/factory';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyRun(companyId: string, runId: string) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: runId, company_id: companyId },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    return run;
  }

  async getJurisdictions() {
    return this.prisma.jurisdictionConfig.findMany({
      where: { active: true }
    });
  }

  async getRuns(companyId: string) {
    return this.prisma.payrollRun.findMany({
      where: { company_id: companyId },
      orderBy: [{ period_year: 'desc' }, { period_month: 'desc' }]
    });
  }

  async createRun(companyId: string, month: number, year: number, jurisdiction: string) {
    // Check if run already exists
    const existing = await this.prisma.payrollRun.findFirst({
      where: { company_id: companyId, period_month: month, period_year: year, jurisdiction },
    });
    if (existing) throw new BadRequestException('Payroll run for this period and jurisdiction already exists');

    return this.prisma.payrollRun.create({
      data: {
        company_id: companyId,
        period_month: month,
        period_year: year,
        jurisdiction,
        status: 'draft',
      },
    });
  }

  async calculateRun(companyId: string, runId: string) {
    // 1. Fetch the Run
    const run = await this.getCompanyRun(companyId, runId);
    if (run.status === 'approved' || run.status === 'paid') {
      throw new BadRequestException('Cannot recalculate an approved or paid run');
    }

    // 2. Fetch Jurisdiction Config
    const config = await this.prisma.jurisdictionConfig.findUnique({
      where: { country_code: run.jurisdiction }
    });
    if (!config) throw new NotFoundException(`Jurisdiction config for ${run.jurisdiction} not found`);

    // 3. Get the correct Engine
    const engine = PayrollEngineFactory.getEngine(run.jurisdiction);

    // 4. Clear any existing payslips/deductions for this run (re-calculate)
    await this.prisma.statutoryDeduction.deleteMany({
      where: { payslip: { run_id: runId } }
    });
    await this.prisma.payslip.deleteMany({
      where: { run_id: runId }
    });

    // 5. Fetch all active employees with salary records for this Jurisdiction
    // Note: In a real app we would map employee location to jurisdiction
    const employees = await this.prisma.employee.findMany({
      where: { company_id: companyId, status: 'active' }, // Assume all employees fallback to this for now
    });

    const salaryRecords = await this.prisma.salaryRecord.findMany({
      where: {
        employee_id: { in: employees.map(e => e.id) },
        // effective_date logic omitted for simplicity
      }
    });

    // 6. Calculate for each employee
    const payslipPromises = employees.map(async (employee) => {
      const salary = salaryRecords.find(s => s.employee_id === employee.id);
      if (!salary) return null; // Skip employees without a salary record

      const allowances = (salary.allowances as Record<string, any>) || {};
      const gross = Number(salary.basic_salary);

      // --- RUN THE CALCULATION ENGINE ---
      const result = engine.calculatePayslip(gross, allowances, config);

      // Save Payslip
      const payslip = await this.prisma.payslip.create({
        data: {
          run_id: runId,
          employee_id: employee.id,
          gross_pay: result.grossPay,
          net_pay: result.netPay,
        }
      });

      // Save Deductions
      if (result.deductions.length > 0) {
        await this.prisma.statutoryDeduction.createMany({
          data: result.deductions.map(d => ({
            payslip_id: payslip.id,
            type: d.type,
            amount: d.amount
          }))
        });
      }
      return payslip;
    });

    await Promise.all(payslipPromises);

    // 7. Update Run Status
    return this.prisma.payrollRun.update({
      where: { id: runId },
      data: { status: 'calculated' },
    });
  }

  async getPayslips(companyId: string, runId: string) {
    await this.getCompanyRun(companyId, runId);

    return this.prisma.payslip.findMany({
      where: { run_id: runId },
      include: { deductions: true }
    });
  }

  async approveRun(companyId: string, runId: string, approverId: string) {
    await this.getCompanyRun(companyId, runId);

    return this.prisma.payrollRun.update({
      where: { id: runId },
      data: {
        status: 'approved',
        approved_by: approverId,
        run_date: new Date(),
      },
    });
  }

  async exportBankFile(companyId: string, runId: string) {
    const run = await this.getCompanyRun(companyId, runId);
    if (run.status !== 'approved') {
      throw new BadRequestException('Run must be approved to export Bank File');
    }

    const payslips = await this.prisma.payslip.findMany({
      where: { run_id: runId }
    });

    const totalAmount = payslips.reduce((sum, p) => sum + Number(p.net_pay), 0);
    const count = payslips.length;

    const fileUrl = `/storage/bank-files/run-${runId}.csv`; // mock

    return this.prisma.bankPaymentFile.create({
      data: {
        company_id: companyId,
        run_id: runId,
        record_count: count,
        total_amount: totalAmount,
        file_url: fileUrl
      }
    });
  }
}
