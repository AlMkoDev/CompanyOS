import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';

describe('CompanyController integration', () => {
  let app: INestApplication;
  let guardSpy: jest.SpyInstance;
  let companyService: {
    findOne: jest.Mock;
    updateCompany: jest.Mock;
    updateSetupProgress: jest.Mock;
  };

  beforeEach(async () => {
    companyService = {
      findOne: jest.fn(),
      updateCompany: jest.fn(),
      updateSetupProgress: jest.fn(),
    };

    guardSpy = jest
      .spyOn(JwtAuthGuard.prototype, 'canActivate')
      .mockImplementation((context) => {
        const req = context.switchToHttp().getRequest();
        req.user = { companyId: 'company-1', userId: 'user-1' };
        return true;
      });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        {
          provide: CompanyService,
          useValue: companyService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    guardSpy.mockRestore();
  });

  it('loads the current company through company-scoped context', async () => {
    companyService.findOne.mockResolvedValue({ id: 'company-1', name: 'CompanyOS' });

    const response = await request(app.getHttpServer()).get('/company').expect(200);

    expect(companyService.findOne).toHaveBeenCalledWith('company-1');
    expect(response.body).toEqual({ id: 'company-1', name: 'CompanyOS' });
  });

  it('updates company profile through company-scoped context', async () => {
    companyService.updateCompany.mockResolvedValue({ id: 'company-1', tagline: 'Run everything' });

    const response = await request(app.getHttpServer())
      .patch('/company')
      .send({ tagline: 'Run everything' })
      .expect(200);

    expect(companyService.updateCompany).toHaveBeenCalledWith('company-1', { tagline: 'Run everything' });
    expect(response.body).toEqual({ id: 'company-1', tagline: 'Run everything' });
  });

  it('updates setup progress through company-scoped context', async () => {
    companyService.updateSetupProgress.mockResolvedValue({ current_step: 3 });

    const response = await request(app.getHttpServer())
      .patch('/company/setup')
      .send({ step: 3, config: { access: true }, isComplete: false })
      .expect(200);

    expect(companyService.updateSetupProgress).toHaveBeenCalledWith('company-1', {
      step: 3,
      config: { access: true },
      isComplete: false,
    });
    expect(response.body).toEqual({ current_step: 3 });
  });
});
