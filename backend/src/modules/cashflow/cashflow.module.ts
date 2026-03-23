import { Module } from '@nestjs/common';
import { CashFlowService } from './cashflow.service';
import { CashFlowController } from './cashflow.controller';

@Module({
  providers: [CashFlowService],
  controllers: [CashFlowController]
})
export class CashFlowModule {}
