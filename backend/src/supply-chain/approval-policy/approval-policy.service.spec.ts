import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalPolicyService } from './approval-policy.service';
import { PrismaService } from '../../database/prisma.service';

describe('ApprovalPolicyService', () => {
  let service: ApprovalPolicyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalPolicyService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ApprovalPolicyService>(ApprovalPolicyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
