import { Module } from '@nestjs/common';
import { ApprovalPolicyController } from './approval-policy/approval-policy.controller';
import { ApprovalPolicyService } from './approval-policy/approval-policy.service';

@Module({
  controllers: [ApprovalPolicyController],
  providers: [ApprovalPolicyService]
})
export class SupplyChainModule {}
