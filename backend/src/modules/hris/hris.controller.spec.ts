import { Test, TestingModule } from '@nestjs/testing';
import { HrisController } from './hris.controller';
import { HrisService } from './hris.service';

describe('HrisController', () => {
  let controller: HrisController;
  let service: {
    createEmployee: jest.Mock;
    getEmployees: jest.Mock;
    getEmployeeById: jest.Mock;
    updateEmployee: jest.Mock;
    getPositions: jest.Mock;
    createPosition: jest.Mock;
    getOrgChart: jest.Mock;
    uploadDocument: jest.Mock;
    getHeadcountReport: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      createEmployee: jest.fn(),
      getEmployees: jest.fn(),
      getEmployeeById: jest.fn(),
      updateEmployee: jest.fn(),
      getPositions: jest.fn(),
      createPosition: jest.fn(),
      getOrgChart: jest.fn(),
      uploadDocument: jest.fn(),
      getHeadcountReport: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HrisController],
      providers: [
        {
          provide: HrisService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<HrisController>(HrisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes company context to employee detail, update, and document upload', async () => {
    const req = { user: { companyId: 'company-1' } };

    await controller.getEmployee(req, 'emp-1');
    await controller.updateEmployee(req, 'emp-1', { first_name: 'Alex' });
    await controller.uploadDocument(req, 'emp-1', {
      file_name: 'contract.pdf',
      file_url: 'https://files/contract.pdf',
      document_type: 'contract',
    });

    expect(service.getEmployeeById).toHaveBeenCalledWith('company-1', 'emp-1');
    expect(service.updateEmployee).toHaveBeenCalledWith('company-1', 'emp-1', {
      first_name: 'Alex',
    });
    expect(service.uploadDocument).toHaveBeenCalledWith('company-1', 'emp-1', {
      file_name: 'contract.pdf',
      file_url: 'https://files/contract.pdf',
      document_type: 'contract',
    });
  });
});
