import { Module } from '@nestjs/common';
import { AtsService } from './ats.service';
import { AtsController } from './ats.controller';

@Module({
  providers: [AtsService],
  controllers: [AtsController]
})
export class AtsModule {}
