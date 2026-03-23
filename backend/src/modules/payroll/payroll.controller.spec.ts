import { Test, TestingModule } from '@nestjs/testing';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';

describe('PayrollController', () => {
  let controller: PayrollController;
  const payrollService = {
    getPayslips: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayrollController],
      providers: [
        {
          provide: PayrollService,
          useValue: payrollService,
        },
      ],
    }).compile();

    controller = module.get<PayrollController>(PayrollController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes company context to getPayslips', async () => {
    const req = { user: { companyId: 'company-1' } };
    await controller.getPayslips(req, 'run-1');
    expect(payrollService.getPayslips).toHaveBeenCalledWith('company-1', 'run-1');
  });
});
