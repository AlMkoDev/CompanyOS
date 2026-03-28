-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BankReconciliationMatch_line_id_key" ON "BankReconciliationMatch"("line_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BankReconciliationMatch_company_statement_idx" ON "BankReconciliationMatch"("company_id", "statement_id");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'BankReconciliationMatch_company_id_fkey'
          AND table_name = 'BankReconciliationMatch'
    ) THEN
        ALTER TABLE "BankReconciliationMatch"
        ADD CONSTRAINT "BankReconciliationMatch_company_id_fkey"
        FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'BankReconciliationMatch_statement_id_fkey'
          AND table_name = 'BankReconciliationMatch'
    ) THEN
        ALTER TABLE "BankReconciliationMatch"
        ADD CONSTRAINT "BankReconciliationMatch_statement_id_fkey"
        FOREIGN KEY ("statement_id") REFERENCES "BankStatement"("id") ON DELETE CASCADE;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'BankReconciliationMatch_line_id_fkey'
          AND table_name = 'BankReconciliationMatch'
    ) THEN
        ALTER TABLE "BankReconciliationMatch"
        ADD CONSTRAINT "BankReconciliationMatch_line_id_fkey"
        FOREIGN KEY ("line_id") REFERENCES "BankStatementLine"("id") ON DELETE CASCADE;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'BankReconciliationMatch_journal_entry_id_fkey'
          AND table_name = 'BankReconciliationMatch'
    ) THEN
        ALTER TABLE "BankReconciliationMatch"
        ADD CONSTRAINT "BankReconciliationMatch_journal_entry_id_fkey"
        FOREIGN KEY ("journal_entry_id") REFERENCES "JournalEntry"("id") ON DELETE CASCADE;
    END IF;
END$$;

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
        FOREIGN KEY ("matched_by") REFERENCES "User"("id") ON DELETE SET NULL;
    END IF;
END$$;
