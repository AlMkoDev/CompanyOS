import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateActivityDto,
  CreateCrmAccountDto,
  CreateCrmContactDto,
  CreateDealDto,
  CreateHealthScoreDto,
  CreateRenewalOpportunityDto,
} from './dto/crm.dto';

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyDeal(companyId: string, dealId: string) {
    const deal = await this.prisma.deal.findFirst({
      where: {
        id: dealId,
        company_id: companyId,
      },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    return deal;
  }

  private async getCompanyAccount(companyId: string, accountId: string) {
    const account = await this.prisma.cRMAccount.findFirst({
      where: {
        id: accountId,
        company_id: companyId,
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  // --- Accounts ---

  async createAccount(companyId: string, data: CreateCrmAccountDto) {
    return this.prisma.cRMAccount.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });
  }

  async getAccounts(companyId: string) {
    return this.prisma.cRMAccount.findMany({
      where: { company_id: companyId },
      include: { contacts: true, deals: true },
    });
  }

  // --- Contacts ---

  async createContact(companyId: string, data: CreateCrmContactDto) {
    return this.prisma.cRMContact.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });
  }

  // --- Deals ---

  async createDeal(companyId: string, data: CreateDealDto) {
    return this.prisma.deal.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });
  }

  async updateDealStage(companyId: string, dealId: string, stage: string, probability?: number) {
    await this.getCompanyDeal(companyId, dealId);

    const data: any = { stage };
    if (probability !== undefined) {
      data.probability = probability;
    }

    return this.prisma.deal.update({
      where: { id: dealId },
      data,
    });
  }

  async getPipeline(companyId: string) {
    const deals = await this.prisma.deal.findMany({
      where: { company_id: companyId },
      include: { account: true, contact: true, activities: true },
    });

    return deals.map(deal => ({
      ...deal,
      value: Number(deal.value),
    }));
  }

  async getDeal(companyId: string, dealId: string) {
    const deal = await this.prisma.deal.findFirst({
      where: {
        id: dealId,
        company_id: companyId,
      },
      include: { 
        account: true, 
        contact: true, 
        activities: {
          orderBy: { due_date: 'desc' },
          include: { contact: true }
        } 
      },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    return {
      ...deal,
      value: Number(deal.value),
    };
  }

  // --- Activities ---

  async createActivity(companyId: string, data: CreateActivityDto) {
    return this.prisma.activity.create({
      data: {
        ...data,
        company_id: companyId,
      },
    });
  }

  async getActivities(companyId: string, dealId?: string, contactId?: string) {
    const where: any = { company_id: companyId };
    if (dealId) where.deal_id = dealId;
    if (contactId) where.contact_id = contactId;

    const activities = await this.prisma.activity.findMany({
      where,
      orderBy: { due_date: 'desc' },
      include: { deal: true, contact: true },
    });

    return activities.map(activity => ({
      ...activity,
      deal: activity.deal ? { ...activity.deal, value: Number(activity.deal.value) } : null,
    }));
  }

  // --- Forecasting & Intelligence ---

  async getForecast(companyId: string) {
    const deals = await this.prisma.deal.findMany({
      where: { company_id: companyId },
    });

    const totalValue = deals.reduce((sum, deal) => sum + Number(deal.value), 0);
    const weightedValue = deals.reduce((sum, deal) => {
      const weight = (deal.probability || 0) / 100;
      return sum + (Number(deal.value) * weight);
    }, 0);

    const forecast = {
      total_pipeline: totalValue,
      weighted_pipeline: weightedValue,
      deal_count: deals.length,
      monthly_distribution: [
        { month: 'Mar', value: weightedValue * 0.4 },
        { month: 'Apr', value: weightedValue * 0.3 },
        { month: 'May', value: weightedValue * 0.3 },
      ],
    };

    return forecast;
  }

  async getDataQuality(companyId: string) {
    const [contacts, accounts] = await Promise.all([
      this.prisma.cRMContact.findMany({ where: { company_id: companyId } }),
      this.prisma.cRMAccount.findMany({ where: { company_id: companyId } }),
    ]);

    const calculateScore = (items: any[], fields: string[]) => {
      if (items.length === 0) return 100;
      const totalPossible = items.length * fields.length;
      let present = 0;
      items.forEach(item => {
        fields.forEach(field => {
          if (item[field]) present++;
        });
      });
      return Math.round((present / totalPossible) * 100);
    };

    return {
      contact_completeness: calculateScore(contacts, ['email', 'phone', 'job_title']),
      account_completeness: calculateScore(accounts, ['industry', 'website']),
      contacts_count: contacts.length,
      accounts_count: accounts.length,
    };
  }

  // --- Account Management (VF-SAL-003) ---

  async createHealthScore(companyId: string, accountId: string, data: CreateHealthScoreDto) {
    await this.getCompanyAccount(companyId, accountId);

    return this.prisma.accountHealth.create({
      data: {
        ...data,
        account_id: accountId,
      },
    });
  }

  async getAccountHealthHistory(companyId: string, accountId: string) {
    await this.getCompanyAccount(companyId, accountId);

    return this.prisma.accountHealth.findMany({
      where: { account_id: accountId },
      orderBy: { measured_at: 'desc' },
    });
  }

  async createRenewalOpportunity(
    companyId: string,
    accountId: string,
    data: CreateRenewalOpportunityDto,
  ) {
    await this.getCompanyAccount(companyId, accountId);

    return this.prisma.renewalOpportunity.create({
      data: {
        ...data,
        account_id: accountId,
      },
    });
  }

  async getUpcomingRenewals(companyId: string) {
    return this.prisma.renewalOpportunity.findMany({
      where: {
        account: {
          company_id: companyId,
        },
      },
      include: { account: true },
      orderBy: { renewal_date: 'asc' },
    });
  }
}
