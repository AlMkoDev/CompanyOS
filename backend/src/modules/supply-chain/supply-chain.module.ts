import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ProductService } from './product.service';
import { SupplierService } from './supplier.service';
import { InventoryService } from './inventory.service';
import { PODocumentService } from './po-document.service';
import { POPDFGeneratorService } from './po-pdf-generator.service';
import { SupplyChainNotificationService } from './supply-chain-notification.service';
import { LedgerAuditService } from './services/ledger-audit.service';
import { ReorderAlertService } from './reorder-alert.service';
import { ProcurementWorkflowService } from './procurement-workflow.service';
import { GoodsReceiptService } from './goods-receipt.service';
import { SupplierPerformanceService } from './supplier-performance.service';
import { SupplyChainAuditService } from './services/supply-chain-audit.service';
import { POAmendmentService } from './services/po-amendment.service';
import { FinancialDataMaskingService } from './services/financial-data-masking.service';
import { SupplierBankSecurityService } from './services/supplier-bank-security.service';
import { AuditIntegrityService } from './services/audit-integrity.service';
import { ProductController } from './product.controller';
import { SupplierController } from './supplier.controller';
import { InventoryController } from './inventory.controller';
import { PODocumentController } from './po-document.controller';
import { LedgerAuditController } from './ledger-audit.controller';
import { ReorderAlertController } from './reorder-alert.controller';
import { ProcurementWorkflowController } from './procurement-workflow.controller';
import { GoodsReceiptController } from './goods-receipt.controller';
import { SupplierPerformanceController } from './supplier-performance.controller';
import { SupplyChainAuditController } from './controllers/supply-chain-audit.controller';
import { POAmendmentController } from './controllers/po-amendment.controller';
import { SupplierBankSecurityController } from './controllers/supplier-bank-security.controller';
import { AuditIntegrityController } from './controllers/audit-integrity.controller';
import { LedgerImmutabilityGuard } from './guards/ledger-immutability.guard';
import { POModificationLockGuard } from './guards/po-modification-lock.guard';
import { BankDetailProtectionGuard } from './guards/bank-detail-protection.guard';
import { SupplyChainAuditInterceptor } from './interceptors/supply-chain-audit.interceptor';
import { FinancialMaskingInterceptor } from './interceptors/financial-masking.interceptor';
import { BankDetailAuditInterceptor } from './interceptors/bank-detail-audit.interceptor';
import { AuditIntegrityInterceptor } from './interceptors/audit-integrity.interceptor';
import { AuditImmutabilityGuard } from './guards/audit-immutability.guard';
import { LedgerAuditMiddleware } from './middleware/ledger-audit.middleware';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [
    ProductService, 
    SupplierService, 
    InventoryService, 
    PODocumentService,
    POPDFGeneratorService,
    SupplyChainNotificationService,
    LedgerAuditService,
    ReorderAlertService,
    ProcurementWorkflowService,
    GoodsReceiptService,
    SupplierPerformanceService,
    SupplyChainAuditService,
    POAmendmentService,
    FinancialDataMaskingService,
    SupplierBankSecurityService,
    AuditIntegrityService,
    LedgerImmutabilityGuard,
    POModificationLockGuard,
    BankDetailProtectionGuard,
    AuditImmutabilityGuard,
    SupplyChainAuditInterceptor,
    FinancialMaskingInterceptor,
    BankDetailAuditInterceptor,
    AuditIntegrityInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: SupplyChainAuditInterceptor,
    }
  ],
  controllers: [
    ProductController, 
    SupplierController, 
    InventoryController, 
    PODocumentController,
    LedgerAuditController,
    ReorderAlertController,
    ProcurementWorkflowController,
    GoodsReceiptController,
    SupplierPerformanceController,
    SupplyChainAuditController,
    POAmendmentController,
    SupplierBankSecurityController,
    AuditIntegrityController
  ],
  exports: [
    ProductService, 
    SupplierService, 
    InventoryService, 
    PODocumentService,
    POPDFGeneratorService,
    SupplyChainNotificationService,
    LedgerAuditService,
    ReorderAlertService,
    ProcurementWorkflowService,
    GoodsReceiptService,
    SupplierPerformanceService,
    SupplyChainAuditService,
    POAmendmentService,
    FinancialDataMaskingService,
    SupplierBankSecurityService,
    AuditIntegrityService
  ],
})
export class SupplyChainModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LedgerAuditMiddleware)
      .forRoutes(
        { path: 'supply-chain/inventory/ledger', method: RequestMethod.ALL },
        { path: 'supply-chain/inventory/ledger/*path', method: RequestMethod.ALL },
        { path: 'supply-chain/inventory/movements', method: RequestMethod.ALL },
        { path: 'supply-chain/inventory/movements/*path', method: RequestMethod.ALL },
        { path: 'supply-chain/ledger-audit', method: RequestMethod.ALL },
        { path: 'supply-chain/ledger-audit/*path', method: RequestMethod.ALL },
      );
  }
}
