import { Test, TestingModule } from '@nestjs/testing';
import { ArService } from './ar.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ArService', () => {
  let service: ArService;
  const prisma: any = {
    aRInvoice: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ArService>(ArService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects cross-company invoice send', async () => {
    prisma.aRInvoice.findFirst.mockResolvedValue(null);

    await expect(service.sendInvoice('company-1', 'invoice-1')).rejects.toThrow(NotFoundException);
  });
});
