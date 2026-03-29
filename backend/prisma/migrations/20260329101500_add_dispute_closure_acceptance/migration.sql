ALTER TABLE "DisputeCase"
  ADD COLUMN IF NOT EXISTS "acceptance_required" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "acceptance_status" TEXT,
  ADD COLUMN IF NOT EXISTS "accepted_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "acceptance_text" TEXT,
  ADD COLUMN IF NOT EXISTS "closure_locked_until" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reopen_request_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "last_reopen_requested_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "closure_survey_score" INTEGER;
