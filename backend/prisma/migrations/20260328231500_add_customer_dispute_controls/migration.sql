ALTER TABLE "Customer"
  ADD COLUMN IF NOT EXISTS "credit_on_hold" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "credit_hold_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "last_dispute_review_at" TIMESTAMP(3);
