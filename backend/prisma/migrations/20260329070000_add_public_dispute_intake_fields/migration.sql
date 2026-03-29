ALTER TABLE "DisputeCase"
  ADD COLUMN IF NOT EXISTS "case_number" TEXT,
  ADD COLUMN IF NOT EXISTS "intake_channel" TEXT DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS "submitter_name" TEXT,
  ADD COLUMN IF NOT EXISTS "submitter_email" TEXT,
  ADD COLUMN IF NOT EXISTS "submitter_phone" TEXT;

UPDATE "DisputeCase"
SET "case_number" = COALESCE("case_number", 'DSP-' || TO_CHAR(COALESCE("raised_date", NOW()), 'YYYY') || '-' || UPPER(SUBSTRING(REPLACE("id"::text, '-', '') FROM 1 FOR 8)))
WHERE "case_number" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "DisputeCase_case_number_key" ON "DisputeCase"("case_number");
