import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class HrisSchemaBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(HrisSchemaBootstrapService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureHrisSchema();
  }

  private async tableExists(tableName: string) {
    const rows = await this.prisma.$queryRawUnsafe<Array<{ table_name: string | null }>>(
      `SELECT to_regclass('"${tableName}"') AS table_name`,
    );

    return Boolean(rows[0]?.table_name);
  }

  private async createTableIfMissing(tableName: string, statement: string) {
    if (await this.tableExists(tableName)) {
      return false;
    }

    await this.prisma.$executeRawUnsafe(statement);
    return true;
  }

  private async ensureHrisSchema() {
    const tableStatements = [
      [
        'Position',
        `CREATE TABLE "Position" (
        "id" UUID NOT NULL,
        "company_id" UUID NOT NULL,
        "department_id" UUID NOT NULL,
        "title" TEXT NOT NULL,
        "level" INTEGER NOT NULL,
        "reports_to_id" UUID,
        "headcount" INTEGER NOT NULL DEFAULT 1,
        "job_description" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Position_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "Position_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "Position_reports_to_id_fkey" FOREIGN KEY ("reports_to_id") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
      )`,
      ],
      [
        'Employee',
        `CREATE TABLE "Employee" (
        "id" UUID NOT NULL,
        "emp_no" TEXT NOT NULL,
        "first_name" TEXT NOT NULL,
        "last_name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT,
        "national_id" TEXT,
        "kra_pin" TEXT,
        "status" TEXT NOT NULL DEFAULT 'active',
        "hire_date" TIMESTAMP(3) NOT NULL,
        "termination_date" TIMESTAMP(3),
        "company_id" UUID NOT NULL,
        "department_id" UUID,
        "position_id" UUID,
        "manager_id" UUID,
        "employment_type" TEXT NOT NULL DEFAULT 'full-time',
        "salary_grade" TEXT,
        "avatar_url" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Employee_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "Employee_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "Employee_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "Employee_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
      )`,
      ],
      [
        'EmploymentHistory',
        `CREATE TABLE "EmploymentHistory" (
        "id" UUID NOT NULL,
        "employee_id" UUID NOT NULL,
        "department_id" UUID,
        "position_id" UUID,
        "start_date" TIMESTAMP(3) NOT NULL,
        "end_date" TIMESTAMP(3),
        "change_reason" TEXT,
        CONSTRAINT "EmploymentHistory_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "EmploymentHistory_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "EmploymentHistory_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "EmploymentHistory_pkey" PRIMARY KEY ("id")
      )`,
      ],
      [
        'EmployeeDocument',
        `CREATE TABLE "EmployeeDocument" (
        "id" UUID NOT NULL,
        "employee_id" UUID NOT NULL,
        "doc_type" TEXT NOT NULL,
        "file_url" TEXT NOT NULL,
        "file_name" TEXT NOT NULL DEFAULT 'document',
        "expiry_date" TIMESTAMP(3),
        "verified" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "EmployeeDocument_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "EmployeeDocument_pkey" PRIMARY KEY ("id")
      )`,
      ],
      [
        'OnboardingPlan',
        `CREATE TABLE "OnboardingPlan" (
        "id" UUID NOT NULL,
        "employee_id" UUID NOT NULL,
        "start_date" TIMESTAMP(3) NOT NULL,
        "buddy_id" UUID,
        "status" TEXT NOT NULL DEFAULT 'started',
        CONSTRAINT "OnboardingPlan_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "OnboardingPlan_pkey" PRIMARY KEY ("id")
      )`,
      ],
      [
        'OnboardingTask',
        `CREATE TABLE "OnboardingTask" (
        "id" UUID NOT NULL,
        "plan_id" UUID NOT NULL,
        "title" TEXT NOT NULL,
        "assignee_dept" TEXT,
        "assignee_id" UUID,
        "due_date" TIMESTAMP(3),
        "status" TEXT NOT NULL DEFAULT 'pending',
        "category" TEXT,
        CONSTRAINT "OnboardingTask_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "OnboardingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "OnboardingTask_pkey" PRIMARY KEY ("id")
      )`,
      ],
      [
        'Milestone',
        `CREATE TABLE "Milestone" (
        "id" UUID NOT NULL,
        "plan_id" UUID NOT NULL,
        "type" TEXT NOT NULL,
        "due_date" TIMESTAMP(3) NOT NULL,
        "completed_at" TIMESTAMP(3),
        "notes" TEXT,
        CONSTRAINT "Milestone_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "OnboardingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
      )`,
      ],
      [
        'OffboardingPlan',
        `CREATE TABLE "OffboardingPlan" (
        "id" UUID NOT NULL,
        "employee_id" UUID NOT NULL,
        "last_day" TIMESTAMP(3) NOT NULL,
        "it_deprovisioned_at" TIMESTAMP(3),
        "final_payroll_processed_at" TIMESTAMP(3),
        CONSTRAINT "OffboardingPlan_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "OffboardingPlan_pkey" PRIMARY KEY ("id")
      )`,
      ],
      [
        'ExitInterview',
        `CREATE TABLE "ExitInterview" (
        "id" UUID NOT NULL,
        "employee_id" UUID NOT NULL,
        "conducted_by" UUID,
        "interview_date" TIMESTAMP(3) NOT NULL,
        "answers" JSONB NOT NULL,
        "nps_score" INTEGER,
        CONSTRAINT "ExitInterview_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "ExitInterview_conducted_by_fkey" FOREIGN KEY ("conducted_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "ExitInterview_pkey" PRIMARY KEY ("id")
      )`,
      ],
    ] as const;

    const createdTables: string[] = [];
    for (const [tableName, statement] of tableStatements) {
      if (await this.createTableIfMissing(tableName, statement)) {
        createdTables.push(tableName);
      }
    }

    const statements = [
      `CREATE UNIQUE INDEX IF NOT EXISTS "Employee_emp_no_key" ON "Employee"("emp_no")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Employee_email_key" ON "Employee"("email")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "OnboardingPlan_employee_id_key" ON "OnboardingPlan"("employee_id")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "OffboardingPlan_employee_id_key" ON "OffboardingPlan"("employee_id")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "CompanySetup_company_id_key" ON "CompanySetup"("company_id")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "DepartmentMember_user_id_department_id_key" ON "DepartmentMember"("user_id", "department_id")`,
      `CREATE INDEX IF NOT EXISTS "Employee_company_id_idx" ON "Employee"("company_id")`,
      `CREATE INDEX IF NOT EXISTS "Employee_department_id_idx" ON "Employee"("department_id")`,
      `CREATE INDEX IF NOT EXISTS "Employee_position_id_idx" ON "Employee"("position_id")`,
      `CREATE INDEX IF NOT EXISTS "Employee_manager_id_idx" ON "Employee"("manager_id")`,
      `CREATE INDEX IF NOT EXISTS "Position_company_id_idx" ON "Position"("company_id")`,
      `CREATE INDEX IF NOT EXISTS "Position_department_id_idx" ON "Position"("department_id")`,
      `CREATE INDEX IF NOT EXISTS "Position_reports_to_id_idx" ON "Position"("reports_to_id")`,
      `CREATE INDEX IF NOT EXISTS "EmploymentHistory_employee_id_idx" ON "EmploymentHistory"("employee_id")`,
      `CREATE INDEX IF NOT EXISTS "EmploymentHistory_department_id_idx" ON "EmploymentHistory"("department_id")`,
      `CREATE INDEX IF NOT EXISTS "EmploymentHistory_position_id_idx" ON "EmploymentHistory"("position_id")`,
      `CREATE INDEX IF NOT EXISTS "EmployeeDocument_employee_id_idx" ON "EmployeeDocument"("employee_id")`,
      `CREATE INDEX IF NOT EXISTS "OnboardingTask_plan_id_idx" ON "OnboardingTask"("plan_id")`,
      `CREATE INDEX IF NOT EXISTS "Milestone_plan_id_idx" ON "Milestone"("plan_id")`,
      `CREATE INDEX IF NOT EXISTS "OffboardingPlan_employee_id_idx" ON "OffboardingPlan"("employee_id")`,
      `CREATE INDEX IF NOT EXISTS "ExitInterview_employee_id_idx" ON "ExitInterview"("employee_id")`,
      `CREATE INDEX IF NOT EXISTS "ExitInterview_conducted_by_idx" ON "ExitInterview"("conducted_by")`,
    ];

    try {
      for (const statement of statements) {
        await this.prisma.$executeRawUnsafe(statement);
      }

      if (createdTables.length > 0) {
        this.logger.log(`HRIS schema bootstrap created tables: ${createdTables.join(', ')}`);
      }
    } catch (error) {
      this.logger.error(
        'HRIS schema bootstrap failed.',
        error instanceof Error ? error.stack : JSON.stringify(error),
      );
      throw error;
    }
  }
}
