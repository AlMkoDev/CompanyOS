import { Global, Module } from '@nestjs/common';
import { HrisSchemaBootstrapService } from './hris-schema.bootstrap';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, HrisSchemaBootstrapService],
  exports: [PrismaService],
})
export class DatabaseModule {}
