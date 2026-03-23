/**
 * Comprehensive Test Suite for PO Amendment System
 * Tests the complete PO modification lock and amendment enforcement system
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/database/prisma.service';
import { POAmendmentService } from '../src/modules/supply-chain/services/po-amendment.service';
import { POModificationLockGuard } from '../src/modules/supply-chain/guards/po-modification-lock.guard';
import { POAmendmentController } from '../src/modules/supply-chain/controllers/po-amendment.controller';
import { POStatus, POAmendmentStatus, POAmendmentType } from '@prisma/cli