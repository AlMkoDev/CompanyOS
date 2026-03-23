import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentStorageService } from './services/storage.service';
import { NotificationService } from './services/notification.service';
import { FeatureFlagService } from './services/feature-flag.service';
import { FeatureFlagGuard } from './guards/feature-flag.guard';
import { FeatureFlagController } from './controllers/feature-flag.controller';
import { AuditModule } from '../modules/audit/audit.module';

@Global()
@Module({
  imports: [AuditModule, ConfigModule],
  providers: [
    DocumentStorageService, 
    NotificationService, 
    FeatureFlagService,
    FeatureFlagGuard
  ],
  controllers: [FeatureFlagController],
  exports: [
    DocumentStorageService, 
    NotificationService, 
    FeatureFlagService,
    FeatureFlagGuard
  ],
})
export class CommonModule {}
