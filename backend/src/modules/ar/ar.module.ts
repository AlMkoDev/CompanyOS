import { Module } from '@nestjs/common';
import { ArService } from './ar.service';
import { ArController } from './ar.controller';

@Module({
  providers: [ArService],
  controllers: [ArController]
})
export class ArModule {}
