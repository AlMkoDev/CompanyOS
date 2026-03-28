-- Core accounting tables required by the accounting workspace
CREATE TABLE IF NOT EXISTS "GLAccount" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parent_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GLAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccountingPeriod" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "closed_at" TIMESTAMP(3),
    "closed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountingPeriod_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "JournalEntry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "entry_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "period_id" UUID,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "JournalLine" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entry_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "narration" TEXT,

    CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BankStatement" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "account_id" UUID,
    "statement_date" TIMESTAMP(3) NOT NULL,
    "opening_balance" DECIMAL(15,2) NOT NULL,
    "closing_balance" DECIMAL(15,2) NOT NULL,
    "file_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankStatement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BankStatementLine" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "statement_id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "reference" TEXT,

    CONSTRAINT "BankStatementLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TrialBalance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "period_id" UUID NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSONB NOT NULL,

    CONSTRAINT "TrialBalance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GLAccount_company_id_code_key" ON "GLAccount"("company_id", "code");
CREATE INDEX IF NOT EXISTS "GLAccount_company_id_idx" ON "GLAccount"("company_id");
CREATE INDEX IF NOT EXISTS "JournalEntry_company_id_idx" ON "JournalEntry"("company_id");
CREATE INDEX IF NOT EXISTS "JournalEntry_period_id_idx" ON "JournalEntry"("period_id");
CREATE INDEX IF NOT EXISTS "JournalLine_entry_id_idx" ON "JournalLine"("entry_id");
CREATE INDEX IF NOT EXISTS "JournalLine_account_id_idx" ON "JournalLine"("account_id");
CREATE INDEX IF NOT EXISTS "AccountingPeriod_company_year_month_idx" ON "AccountingPeriod"("company_id", "year", "month");
CREATE UNIQUE INDEX IF NOT EXISTS "AccountingPeriod_company_id_year_month_key" ON "AccountingPeriod"("company_id", "year", "month");
CREATE INDEX IF NOT EXISTS "BankStatement_company_id_idx" ON "BankStatement"("company_id");
CREATE INDEX IF NOT EXISTS "BankStatementLine_statement_id_idx" ON "BankStatementLine"("statement_id");
CREATE INDEX IF NOT EXISTS "TrialBalance_company_id_idx" ON "TrialBalance"("company_id");
CREATE INDEX IF NOT EXISTS "TrialBalance_period_id_idx" ON "TrialBalance"("period_id");

ALTER TABLE "GLAccount"
  ADD CONSTRAINT "GLAccount_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'GLAccount_parent_id_fkey'
          AND table_name = 'GLAccount'
    ) THEN
        ALTER TABLE "GLAccount"
        ADD CONSTRAINT "GLAccount_parent_id_fkey"
        FOREIGN KEY ("parent_id") REFERENCES "GLAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END$$;

ALTER TABLE "AccountingPeriod"
  ADD CONSTRAINT "AccountingPeriod_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'AccountingPeriod_closed_by_fkey'
          AND table_name = 'AccountingPeriod'
    ) THEN
        ALTER TABLE "AccountingPeriod"
        ADD CONSTRAINT "AccountingPeriod_closed_by_fkey"
        FOREIGN KEY ("closed_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END$$;

ALTER TABLE "JournalEntry"
  ADD CONSTRAINT "JournalEntry_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'JournalEntry_period_id_fkey'
          AND table_name = 'JournalEntry'
    ) THEN
        ALTER TABLE "JournalEntry"
        ADD CONSTRAINT "JournalEntry_period_id_fkey"
        FOREIGN KEY ("period_id") REFERENCES "AccountingPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'JournalEntry_created_by_fkey'
          AND table_name = 'JournalEntry'
    ) THEN
        ALTER TABLE "JournalEntry"
        ADD CONSTRAINT "JournalEntry_created_by_fkey"
        FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END$$;

ALTER TABLE "JournalLine"
  ADD CONSTRAINT "JournalLine_entry_id_fkey"
  FOREIGN KEY ("entry_id") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JournalLine"
  ADD CONSTRAINT "JournalLine_account_id_fkey"
  FOREIGN KEY ("account_id") REFERENCES "GLAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BankStatement"
  ADD CONSTRAINT "BankStatement_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BankStatementLine"
  ADD CONSTRAINT "BankStatementLine_statement_id_fkey"
  FOREIGN KEY ("statement_id") REFERENCES "BankStatement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TrialBalance"
  ADD CONSTRAINT "TrialBalance_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "BankReconciliationMatch" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "statement_id" UUID NOT NULL,
    "line_id" UUID NOT NULL,
    "journal_entry_id" UUID NOT NULL,
    "matched_by" UUID,
    "matched_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "BankReconciliationMatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BankReconciliationMatch_line_id_key" ON "BankReconciliationMatch"("line_id");
CREATE INDEX IF NOT EXISTS "BankReconciliationMatch_company_statement_idx" ON "BankReconciliationMatch"("company_id", "statement_id");

ALTER TABLE "BankReconciliationMatch"
  ADD CONSTRAINT "BankReconciliationMatch_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BankReconciliationMatch"
  ADD CONSTRAINT "BankReconciliationMatch_statement_id_fkey"
  FOREIGN KEY ("statement_id") REFERENCES "BankStatement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BankReconciliationMatch"
  ADD CONSTRAINT "BankReconciliationMatch_line_id_fkey"
  FOREIGN KEY ("line_id") REFERENCES "BankStatementLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BankReconciliationMatch"
  ADD CONSTRAINT "BankReconciliationMatch_journal_entry_id_fkey"
  FOREIGN KEY ("journal_entry_id") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'BankReconciliationMatch_matched_by_fkey'
          AND table_name = 'BankReconciliationMatch'
    ) THEN
        ALTER TABLE "BankReconciliationMatch"
        ADD CONSTRAINT "BankReconciliationMatch_matched_by_fkey"
        FOREIGN KEY ("matched_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END$$;
