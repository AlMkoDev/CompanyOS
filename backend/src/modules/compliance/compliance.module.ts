import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { ComplianceReminderService } from './compliance-reminder.service';

@Module({
  controllers: [ComplianceController],
  providers: [ComplianceService, ComplianceReminderService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
