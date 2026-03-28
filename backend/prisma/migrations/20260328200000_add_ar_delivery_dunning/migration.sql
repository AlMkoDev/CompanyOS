ALTER TABLE "ARInvoice"
  ADD COLUMN IF NOT EXISTS "sent_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "delivered_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "delivery_method" TEXT,
  ADD COLUMN IF NOT EXISTS "last_reminder_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reminder_count" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "ARDunningEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "stage" INTEGER,
    "channel" TEXT,
    "performed_by" UUID,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ARDunningEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ARDunningEvent_company_id_idx" ON "ARDunningEvent"("company_id");
CREATE INDEX IF NOT EXISTS "ARDunningEvent_invoice_id_idx" ON "ARDunningEvent"("invoice_id");
CREATE INDEX IF NOT EXISTS "ARDunningEvent_event_type_idx" ON "ARDunningEvent"("event_type");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'ARDunningEvent_invoice_id_fkey'
          AND table_name = 'ARDunningEvent'
    ) THEN
        ALTER TABLE "ARDunningEvent"
        ADD CONSTRAINT "ARDunningEvent_invoice_id_fkey"
        FOREIGN KEY ("invoice_id") REFERENCES "ARInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END$$;
