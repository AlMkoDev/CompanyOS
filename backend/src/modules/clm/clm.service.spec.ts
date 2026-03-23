import { Test, TestingModule } from '@nestjs/testing';
import { ClmService } from './clm.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ClmService', () => {
  let service: ClmService;
  const prisma: any = {
    contractTemplate: {
      findFirst: jest.fn(),
    },
    contract: {
      findFirst: jest.fn(),
    },
    contractApproval: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClmService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ClmService>(ClmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects cross-company template lookup', async () => {
    prisma.contractTemplate.findFirst.mockResolvedValue(null);

    await expect(service.getTemplate('company-1', 'template-1')).rejects.toThrow(NotFoundException);
  });

  it('rejects cross-company contract lookup', async () => {
    prisma.contract.findFirst.mockResolvedValue(null);

    await expect(service.getContract('company-1', 'contract-1')).rejects.toThrow(NotFoundException);
  });
});
