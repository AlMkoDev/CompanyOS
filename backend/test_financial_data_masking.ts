import { Test, TestingModule } from '@nestjs/testing';
import { FinancialDataMaskingService, UserPermissions } from './src/modules/supply-chain/services/financial-data-masking.service';

describe('Financial Data Masking System', () => {
  let service: FinancialDataMaskingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinancialDataMaskingService],
    }).compile();

    service = module.get<FinancialDataMaskingService>(FinancialDataMas