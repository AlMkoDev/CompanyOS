import { Test, TestingModule } from '@nestjs/testing';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';

describe('CompanyController', () => {
  let controller: CompanyController;
  const companyService = {
    findOne: jest.fn(),
    updateCompany: jest.fn(),
    updateSetupProgress: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        {
          provide: CompanyService,
          useValue: companyService,
        },
      ],
    }).compile();

    controller = module.get<CompanyController>(CompanyController);
  });

  it('passes company context through company routes', async () => {
    await controller.findOne('company-1');
    await controller.update('company-1', { tagline: 'Tag' } as any);
    await controller.updateSetup('company-1', { step: 2, config: {}, isComplete: false } as any);

    expect(companyService.findOne).toHaveBeenCalledWith('company-1');
    expect(companyService.updateCompany).toHaveBeenCalledWith('company-1', { tagline: 'Tag' });
    expect(companyService.updateSetupProgress).toHaveBeenCalledWith('company-1', {
      step: 2,
      config: {},
      isComplete: false,
    });
  });
});
