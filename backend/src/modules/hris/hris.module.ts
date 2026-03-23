import { Module } from '@nestjs/common';
import { HrisService } from './hris.service';
import { HrisController } from './hris.controller';

@Module({
  providers: [HrisService],
  controllers: [HrisController]
})
export class HrisModule {}
