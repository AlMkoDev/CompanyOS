import { Module } from '@nestjs/common';
import { ErEngagementService } from './er-engagement.service';
import { ErEngagementController } from './er-engagement.controller';

@Module({
  providers: [ErEngagementService],
  controllers: [ErEngagementController]
})
export class ErEngagementModule {}
