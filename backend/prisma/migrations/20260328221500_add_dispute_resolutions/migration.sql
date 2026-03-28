CREATE TABLE IF NOT EXISTS "DisputeResolution" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "dispute_id" UUID NOT NULL,
  "resolution_type" TEXT NOT NULL,
  "credit_amount" DECIMAL(15,2),
  "writeoff_amount" DECIMAL(15,2),
  "approved_by" UUID,
  "approval_chain" JSONB,
  "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
  "posted_to_gl" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DisputeResolution_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DisputeResolution_company_id_idx" ON "DisputeResolution"("company_id");
CREATE INDEX IF NOT EXISTS "DisputeResolution_dispute_id_idx" ON "DisputeResolution"("dispute_id");
CREATE INDEX IF NOT EXISTS "DisputeResolution_status_idx" ON "DisputeResolution"("status");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DisputeResolution_company_id_fkey'
    ) THEN
      ALTER TABLE "DisputeResolution"
        ADD CONSTRAINT "DisputeResolution_company_id_fkey"
        FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DisputeResolution_dispute_id_fkey'
    ) THEN
      ALTER TABLE "DisputeResolution"
        ADD CONSTRAINT "DisputeResolution_dispute_id_fkey"
        FOREIGN KEY ("dispute_id") REFERENCES "DisputeCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DisputeResolution_approved_by_fkey'
    ) THEN
      ALTER TABLE "DisputeResolution"
        ADD CONSTRAINT "DisputeResolution_approved_by_fkey"
        FOREIGN KEY ("approved_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
