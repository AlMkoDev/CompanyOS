ALTER TABLE "DisputeActivity"
ADD COLUMN IF NOT EXISTS "internal_only" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "customer_visible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "mentions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "task_title" TEXT,
ADD COLUMN IF NOT EXISTS "task_assignee_id" UUID,
ADD COLUMN IF NOT EXISTS "task_due_date" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "task_priority" TEXT,
ADD COLUMN IF NOT EXISTS "task_status" TEXT,
ADD COLUMN IF NOT EXISTS "notification_channel" TEXT,
ADD COLUMN IF NOT EXISTS "template_key" TEXT,
ADD COLUMN IF NOT EXISTS "metadata" JSONB;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'DisputeActivity_task_assignee_id_fkey'
      AND table_name = 'DisputeActivity'
  ) THEN
    ALTER TABLE "DisputeActivity"
      ADD CONSTRAINT "DisputeActivity_task_assignee_id_fkey"
      FOREIGN KEY ("task_assignee_id") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
