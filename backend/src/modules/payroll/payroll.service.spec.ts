import { Test, TestingModule } from '@nestjs/testing';
import { PayrollService } from './payroll.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PayrollService', () => {
  let service: PayrollService;
  const prisma: any = {
    payrollRun: {
      findFirst: jest.fn(),
    },
    payslip: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<PayrollService>(PayrollService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects payslip lookup for another company run', async () => {
    prisma.payrollRun.findFirst.mockResolvedValue(null);

    await expect(service.getPayslips('company-1', 'run-1')).rejects.toThrow(NotFoundException);
  });
});
