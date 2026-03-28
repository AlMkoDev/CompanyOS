CREATE TABLE IF NOT EXISTS "DisputeCase" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "invoice_id" UUID NOT NULL,
  "customer_id" UUID NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  "dispute_type" TEXT NOT NULL,
  "reason_code" TEXT,
  "disputed_amount" DECIMAL(15,2) NOT NULL,
  "resolved_amount" DECIMAL(15,2),
  "raised_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "due_date" TIMESTAMP(3) NOT NULL,
  "resolved_date" TIMESTAMP(3),
  "root_cause_code" TEXT,
  "resolution_notes" TEXT,
  "assigned_to" UUID,
  "created_by" UUID,
  "affects_revenue" BOOLEAN NOT NULL DEFAULT true,
  "blocks_payment" BOOLEAN NOT NULL DEFAULT false,
  "product_code" TEXT,
  "evidence_required" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DisputeCase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DisputeActivity" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "dispute_id" UUID NOT NULL,
  "activity_type" TEXT NOT NULL,
  "notes" TEXT,
  "actor_user_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DisputeActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DisputeCase_company_id_idx" ON "DisputeCase"("company_id");
CREATE INDEX IF NOT EXISTS "DisputeCase_status_priority_idx" ON "DisputeCase"("status", "priority");
CREATE INDEX IF NOT EXISTS "DisputeCase_invoice_id_idx" ON "DisputeCase"("invoice_id");
CREATE INDEX IF NOT EXISTS "DisputeCase_customer_id_idx" ON "DisputeCase"("customer_id", "raised_date");
CREATE INDEX IF NOT EXISTS "DisputeActivity_dispute_id_idx" ON "DisputeActivity"("dispute_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DisputeCase_company_id_fkey'
    ) THEN
      ALTER TABLE "DisputeCase"
        ADD CONSTRAINT "DisputeCase_company_id_fkey"
        FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DisputeCase_invoice_id_fkey'
    ) THEN
      ALTER TABLE "DisputeCase"
        ADD CONSTRAINT "DisputeCase_invoice_id_fkey"
        FOREIGN KEY ("invoice_id") REFERENCES "ARInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DisputeCase_customer_id_fkey'
    ) THEN
      ALTER TABLE "DisputeCase"
        ADD CONSTRAINT "DisputeCase_customer_id_fkey"
        FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DisputeCase_assigned_to_fkey'
    ) THEN
      ALTER TABLE "DisputeCase"
        ADD CONSTRAINT "DisputeCase_assigned_to_fkey"
        FOREIGN KEY ("assigned_to") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DisputeCase_created_by_fkey'
    ) THEN
      ALTER TABLE "DisputeCase"
        ADD CONSTRAINT "DisputeCase_created_by_fkey"
        FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DisputeActivity_company_id_fkey'
    ) THEN
      ALTER TABLE "DisputeActivity"
        ADD CONSTRAINT "DisputeActivity_company_id_fkey"
        FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DisputeActivity_dispute_id_fkey'
    ) THEN
      ALTER TABLE "DisputeActivity"
        ADD CONSTRAINT "DisputeActivity_dispute_id_fkey"
        FOREIGN KEY ("dispute_id") REFERENCES "DisputeCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DisputeActivity_actor_user_id_fkey'
    ) THEN
      ALTER TABLE "DisputeActivity"
        ADD CONSTRAINT "DisputeActivity_actor_user_id_fkey"
        FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
