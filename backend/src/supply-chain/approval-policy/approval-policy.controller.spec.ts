import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalPolicyController } from './approval-policy.controller';
import { ApprovalPolicyService } from './approval-policy.service';

describe('ApprovalPolicyController', () => {
  let controller: ApprovalPolicyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApprovalPolicyController],
      providers: [
        {
          provide: ApprovalPolicyService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ApprovalPolicyController>(ApprovalPolicyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
