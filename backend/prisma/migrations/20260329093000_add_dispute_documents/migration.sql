CREATE TABLE IF NOT EXISTS "DisputeDocument" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL,
  "dispute_id" UUID NOT NULL,
  "document_type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "file_url" TEXT,
  "template_version" TEXT,
  "customer_visible" BOOLEAN NOT NULL DEFAULT true,
  "generated_by" UUID,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DisputeDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DisputeDocument_dispute_id_idx" ON "DisputeDocument"("dispute_id");
CREATE INDEX IF NOT EXISTS "DisputeDocument_company_id_idx" ON "DisputeDocument"("company_id");

ALTER TABLE "DisputeDocument"
  ADD CONSTRAINT "DisputeDocument_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DisputeDocument"
  ADD CONSTRAINT "DisputeDocument_dispute_id_fkey"
  FOREIGN KEY ("dispute_id") REFERENCES "DisputeCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DisputeDocument"
  ADD CONSTRAINT "DisputeDocument_generated_by_fkey"
  FOREIGN KEY ("generated_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
