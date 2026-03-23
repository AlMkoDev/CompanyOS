import { Module } from '@nestjs/common';
import { ClmService } from './clm.service';
import { ClmController } from './clm.controller';
import { RenewalService } from './renewal.service';

@Module({
  providers: [ClmService, RenewalService],
  controllers: [ClmController],
  exports: [ClmService],
})
export class ClmModule {}
