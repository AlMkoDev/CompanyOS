import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { AuditModule } from './modules/audit/audit.module';
import { SopModule } from './modules/sop/sop.module';
import { KpiModule } from './modules/kpi/kpi.module';
import { AuditLogMiddleware } from './common/middleware/audit-log.middleware';
import { CommonModule } from './common/common.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { ApModule } from './modules/ap/ap.module';
import { ArModule } from './modules/ar/ar.module';
import { AssetsModule } from './modules/assets/assets.module';
import { CashFlowModule } from './modules/cashflow/cashflow.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { HrisModule } from './modules/hris/hris.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { LmsModule } from './modules/lms/lms.module';
import { ErEngagementModule } from './modules/er-engagement/er-engagement.module';
import { CrmModule } from './modules/crm/crm.module';
import { DmsModule } from './modules/dms/dms.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { QaModule } from './modules/qa/qa.module';
import { ClmModule } from './modules/clm/clm.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { ItsmModule } from './modules/itsm/itsm.module';
import { OkrModule } from './modules/okr/okr.module';
import { AtsModule } from './modules/ats/ats.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SupplyChainModule } from './modules/supply-chain/supply-chain.module';

@Module({
  imports: [
    DatabaseModule,
    ScheduleModule.forRoot(),
    AuthModule,
    CompanyModule,
    DepartmentsModule,
    TasksModule,
    CommonModule,
    SopModule,
    KpiModule,
    AccountingModule,
    ApModule,
    ArModule,
    AssetsModule,
    CashFlowModule,
    PayrollModule,
    HrisModule,
    OnboardingModule,
    PerformanceModule,
    LmsModule,
    ErEngagementModule,
    CrmModule,
    DmsModule,
    ProjectsModule,
    QaModule,
    ClmModule,
    ComplianceModule,
    ItsmModule,
    OkrModule,
    AtsModule,
    SupplyChainModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditLogMiddleware).forRoutes('*');
  }
}
