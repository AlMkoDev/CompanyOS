import { Test, TestingModule } from '@nestjs/testing';
import { ApService } from './ap.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ApService', () => {
  let service: ApService;
  const prisma: any = {
    purchaseOrder: {
      findFirst: jest.fn(),
    },
    invoice: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ApService>(ApService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects cross-company invoice matching', async () => {
    prisma.invoice.findFirst.mockResolvedValue(null);

    await expect(service.runThreeWayMatch('company-1', 'invoice-1')).rejects.toThrow(NotFoundException);
  });
});
