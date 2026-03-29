import { Module } from '@nestjs/common';
import { ArService } from './ar.service';
import { ArController } from './ar.controller';
import { ArPublicController } from './ar.public.controller';

@Module({
  providers: [ArService],
  controllers: [ArController, ArPublicController]
})
export class ArModule {}
