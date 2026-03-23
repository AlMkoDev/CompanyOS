import { Module } from '@nestjs/common';
import { ApService } from './ap.service';
import { ApController } from './ap.controller';

@Module({
  providers: [ApService],
  controllers: [ApController]
})
export class ApModule {}
