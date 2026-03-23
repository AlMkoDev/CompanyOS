import { Test, TestingModule } from '@nestjs/testing';
import { CrmService } from './crm.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CrmService', () => {
  let service: CrmService;
  let prisma: {
    cRMAccount: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
    };
    cRMContact: {
      create: jest.Mock;
      findMany: jest.Mock;
    };
    deal: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    activity: {
      create: jest.Mock;
      findMany: jest.Mock;
    };
    accountHealth: {
      create: jest.Mock;
      findMany: jest.Mock;
    };
    renewalOpportunity: {
      create: jest.Mock;
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      cRMAccount: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      cRMContact: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      deal: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      activity: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      accountHealth: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      renewalOpportunity: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<CrmService>(CrmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects deal access outside the caller company', async () => {
    prisma.deal.findFirst.mockResolvedValue(null);

    await expect(service.getDeal('company-1', 'deal-1')).rejects.toThrow(NotFoundException);
    await expect(
      service.updateDealStage('company-1', 'deal-1', 'proposal', 70),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects account-specific CRM actions outside the caller company', async () => {
    prisma.cRMAccount.findFirst.mockResolvedValue(null);

    await expect(
      service.createHealthScore('company-1', 'account-1', { score: 85 } as any),
    ).rejects.toThrow(NotFoundException);
    await expect(
      service.getAccountHealthHistory('company-1', 'account-1'),
    ).rejects.toThrow(NotFoundException);
    await expect(
      service.createRenewalOpportunity('company-1', 'account-1', {
        title: 'Renewal',
      } as any),
    ).rejects.toThrow(NotFoundException);
  });
});
