import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCashItemDto } from './dto/cashflow.dto';

@Injectable()
export class CashFlowService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyForecast(companyId: string, forecastId: string) {
    const forecast = await this.prisma.cashForecast.findFirst({
      where: { id: forecastId, company_id: companyId },
      include: { weeks: true },
    });
    if (!forecast) throw new NotFoundException('Forecast not found');
    return forecast;
  }

  private async getCompanyWeek(companyId: string, weekId: string) {
    const week = await this.prisma.forecastWeek.findFirst({
      where: {
        id: weekId,
        forecast: {
          company_id: companyId,
        },
      },
    });
    if (!week) throw new NotFoundException('Forecast week not found');
    return week;
  }

  async createForecast(companyId: string, startDate: Date, creatorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const forecast = await tx.cashForecast.create({
        data: {
          company_id: companyId,
          period_start: startDate,
          created_by: creatorId,
          status: 'draft',
        },
      });

      // Create 13 weeks
      const weekPromises: Promise<any>[] = [];
      for (let i = 0; i < 13; i++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + i * 7);

        weekPromises.push(
          tx.forecastWeek.create({
            data: {
              forecast_id: forecast.id,
              week_no: i + 1,
              week_start: weekStart,
              opening_balance: 0,
              closing_balance: 0,
            },
          }),
        );
      }
      await Promise.all(weekPromises);

      return tx.cashForecast.findUnique({
        where: { id: forecast.id },
        include: { weeks: true },
      });
    });
  }

  async getForecasts(companyId: string) {
    return this.prisma.cashForecast.findMany({
      where: { company_id: companyId },
      orderBy: { period_start: 'desc' },
    });
  }

  async getForecastDetail(companyId: string, id: string) {
    const forecast = await this.prisma.cashForecast.findFirst({
      where: { id, company_id: companyId },
      include: {
        weeks: {
          include: { items: true },
          orderBy: { week_no: 'asc' },
        },
      },
    });

    if (!forecast) throw new NotFoundException('Forecast not found');
    return forecast;
  }

  async addCashItem(companyId: string, weekId: string, data: CreateCashItemDto) {
    await this.getCompanyWeek(companyId, weekId);

    return this.prisma.cashItem.create({
      data: {
        ...data,
        week_id: weekId,
      },
    });
  }

  async populateFromErp(companyId: string, forecastId: string) {
    const forecast = await this.getCompanyForecast(companyId, forecastId);

    const startDate = new Date(forecast.period_start);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 13 * 7);

    // 1. Fetch AR Invoices (Expected Inflows)
    const arInvoices = await this.prisma.aRInvoice.findMany({
      where: {
        company_id: companyId,
        status: { notIn: ['paid', 'draft'] },
        due_date: { gte: startDate, lt: endDate },
      },
      include: { customer: true },
    });

    // 2. Fetch AP Invoices (Expected Outflows)
    const apInvoices = await this.prisma.invoice.findMany({
      where: {
        company_id: companyId,
        status: { notIn: ['paid', 'draft'] },
        due_date: { gte: startDate, lt: endDate },
      },
      include: { vendor: true },
    });

    // 3. Map to Weeks
    return this.prisma.$transaction(async (tx) => {
      // Clear previous auto-generated items
      const weekIds = forecast.weeks.map((w) => w.id);
      await tx.cashItem.deleteMany({
        where: { week_id: { in: weekIds }, source: 'auto' },
      });

      const itemPromises: Promise<any>[] = [];

      // Add AR Items
      arInvoices.forEach((inv) => {
        const diffDays = Math.floor((new Date(inv.due_date).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const weekIdx = Math.floor(diffDays / 7);
        if (weekIdx >= 0 && weekIdx < 13) {
          itemPromises.push(
            tx.cashItem.create({
              data: {
                week_id: forecast.weeks[weekIdx].id,
                category: 'AR Inflow',
                description: `Invoice ${inv.invoice_no} (${inv.customer?.name})`,
                amount: Number(inv.amount) - Number(inv.paid_amount),
                source: 'auto',
                scenario: 'base',
              },
            }),
          );
        }
      });

      // Add AP Items
      apInvoices.forEach((inv) => {
        const diffDays = Math.floor((new Date(inv.due_date).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const weekIdx = Math.floor(diffDays / 7);
        if (weekIdx >= 0 && weekIdx < 13) {
          itemPromises.push(
            tx.cashItem.create({
              data: {
                week_id: forecast.weeks[weekIdx].id,
                category: 'AP Outflow',
                description: `Vendor Inv ${inv.invoice_no} (${inv.vendor?.name})`,
                amount: -Math.abs(Number(inv.amount)), // Negative for outflow
                source: 'auto',
                scenario: 'base',
              },
            }),
          );
        }
      });

      await Promise.all(itemPromises);

      // 4. Recalculate Week Balances
      const updatedWeeks = await tx.forecastWeek.findMany({
        where: { forecast_id: forecastId },
        include: { items: true },
        orderBy: { week_no: 'asc' },
      });

      let currentBalance = 0; // In a real system, pull actual bank balance here
      for (const week of updatedWeeks) {
        const netChange = week.items.reduce((sum, item) => sum + Number(item.amount), 0);
        // Add payroll mock outflow for demonstration (W4, W8, W12)
        const payrollMock = (week.week_no % 4 === 0) ? -850000 : 0;
        
        const opening = currentBalance;
        const totalNet = netChange + payrollMock;
        const closing = opening + totalNet;

        await tx.forecastWeek.update({
          where: { id: week.id },
          data: {
            opening_balance: opening,
            closing_balance: closing,
          },
        });

        currentBalance = closing;
      }

      return tx.cashForecast.findUnique({
        where: { id: forecastId },
        include: { weeks: { include: { items: true }, orderBy: { week_no: 'asc' } } },
      });
    });
  }

  async signOffForecast(companyId: string, id: string, userId: string) {
    await this.getCompanyForecast(companyId, id);

    return this.prisma.cashForecast.update({
      where: { id },
      data: {
        status: 'signed_off',
        signed_off_by: userId,
        signed_off_at: new Date(),
      },
    });
  }
}
