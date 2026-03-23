import { Test, TestingModule } from '@nestjs/testing';
import { CashFlowService } from './cashflow.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CashFlowService', () => {
  let service: CashFlowService;
  const prisma: any = {
    cashForecast: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    forecastWeek: {
      findFirst: jest.fn(),
    },
    cashItem: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashFlowService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<CashFlowService>(CashFlowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects cross-company forecast detail lookup', async () => {
    prisma.cashForecast.findFirst.mockResolvedValue(null);

    await expect(service.getForecastDetail('company-1', 'forecast-1')).rejects.toThrow(NotFoundException);
  });

  it('rejects adding an item to another company week', async () => {
    prisma.forecastWeek.findFirst.mockResolvedValue(null);

    await expect(
      service.addCashItem('company-1', 'week-1', { category: 'Manual', amount: 100 } as any),
    ).rejects.toThrow(NotFoundException);
  });
});
