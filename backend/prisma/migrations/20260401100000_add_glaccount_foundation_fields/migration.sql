ALTER TABLE "GLAccount"
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "category" TEXT,
  ADD COLUMN IF NOT EXISTS "subtype" TEXT,
  ADD COLUMN IF NOT EXISTS "is_header" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "is_contra" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "normal_balance" TEXT,
  ADD COLUMN IF NOT EXISTS "sensitivity_tier" TEXT DEFAULT 'T3',
  ADD COLUMN IF NOT EXISTS "fs_placement" TEXT,
  ADD COLUMN IF NOT EXISTS "account_owner_id" UUID,
  ADD COLUMN IF NOT EXISTS "budget_enabled" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "tax_treatment" TEXT,
  ADD COLUMN IF NOT EXISTS "level" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "full_path" TEXT,
  ADD COLUMN IF NOT EXISTS "dormant_since" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "sunset_candidate" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "created_by" UUID,
  ADD COLUMN IF NOT EXISTS "modified_by" UUID;

UPDATE "GLAccount"
SET
  "category" = COALESCE("category", INITCAP("type")),
  "normal_balance" = COALESCE(
    "normal_balance",
    CASE
      WHEN "type" IN ('asset', 'expense') THEN 'DR'
      ELSE 'CR'
    END
  ),
  "sensitivity_tier" = COALESCE("sensitivity_tier", 'T3'),
  "full_path" = COALESCE("full_path", "code");

ALTER TABLE "GLAccount"
  DROP CONSTRAINT IF EXISTS "GLAccount_account_owner_id_fkey";

ALTER TABLE "GLAccount"
  ADD CONSTRAINT "GLAccount_account_owner_id_fkey"
  FOREIGN KEY ("account_owner_id") REFERENCES "Employee"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "GLAccount_company_id_code_key"
ON "GLAccount" ("company_id", "code");
