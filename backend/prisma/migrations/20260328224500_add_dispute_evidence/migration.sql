ALTER TABLE "DisputeCase"
  ADD COLUMN IF NOT EXISTS "evidence_due_date" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "DisputeAttachment" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "dispute_id" UUID NOT NULL,
  "file_name" TEXT NOT NULL,
  "file_type" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "file_url" TEXT,
  "notes" TEXT,
  "uploaded_by" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DisputeAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DisputeAttachment_company_id_idx" ON "DisputeAttachment"("company_id");
CREATE INDEX IF NOT EXISTS "DisputeAttachment_dispute_id_idx" ON "DisputeAttachment"("dispute_id");
CREATE INDEX IF NOT EXISTS "DisputeAttachment_category_idx" ON "DisputeAttachment"("category");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DisputeAttachment_company_id_fkey'
    ) THEN
      ALTER TABLE "DisputeAttachment"
        ADD CONSTRAINT "DisputeAttachment_company_id_fkey"
        FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DisputeAttachment_dispute_id_fkey'
    ) THEN
      ALTER TABLE "DisputeAttachment"
        ADD CONSTRAINT "DisputeAttachment_dispute_id_fkey"
        FOREIGN KEY ("dispute_id") REFERENCES "DisputeCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DisputeAttachment_uploaded_by_fkey'
    ) THEN
      ALTER TABLE "DisputeAttachment"
        ADD CONSTRAINT "DisputeAttachment_uploaded_by_fkey"
        FOREIGN KEY ("uploaded_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
