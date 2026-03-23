import { Module } from '@nestjs/common';
import { ItsmService } from './itsm.service';
import { ItsmController } from './itsm.controller';

@Module({
  providers: [ItsmService],
  controllers: [ItsmController]
})
export class ItsmModule {}
