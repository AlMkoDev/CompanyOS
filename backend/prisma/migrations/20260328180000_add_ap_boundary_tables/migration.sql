-- AP boundary tables: requisitions, manual entries, exceptions, and immutable audit trail
CREATE TABLE IF NOT EXISTS "APRequisition" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "requisition_no" TEXT NOT NULL,
    "requester_id" UUID NOT NULL,
    "approver_id" UUID,
    "vendor_id" UUID,
    "department_id" UUID,
    "title" TEXT NOT NULL,
    "justification" TEXT,
    "amount_estimate" DECIMAL(15,2),
    "status" TEXT NOT NULL DEFAULT 'pending_approval',
    "requires_secondary_approval" BOOLEAN NOT NULL DEFAULT false,
    "line_items" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "APRequisition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "APManualEntry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "entry_no" TEXT NOT NULL,
    "requester_id" UUID NOT NULL,
    "approver_id" UUID,
    "vendor_id" UUID,
    "department_id" UUID,
    "description" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "tax_amount" DECIMAL(15,2),
    "status" TEXT NOT NULL DEFAULT 'pending_secondary_approval',
    "requires_secondary_approval" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "APManualEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "APMatchException" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "reason_code" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "raised_by_id" UUID,
    "resolved_by_id" UUID,
    "resolved_at" TIMESTAMP(3),
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "APMatchException_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "APAuditTrail" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before_state" JSONB,
    "after_state" JSONB,
    "details" TEXT,
    "actor_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "APAuditTrail_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "APRequisition_company_id_requisition_no_key" ON "APRequisition"("company_id", "requisition_no");
CREATE INDEX IF NOT EXISTS "APRequisition_company_id_idx" ON "APRequisition"("company_id");
CREATE INDEX IF NOT EXISTS "APRequisition_requester_id_idx" ON "APRequisition"("requester_id");
CREATE INDEX IF NOT EXISTS "APRequisition_vendor_id_idx" ON "APRequisition"("vendor_id");
CREATE INDEX IF NOT EXISTS "APRequisition_status_idx" ON "APRequisition"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "APManualEntry_company_id_entry_no_key" ON "APManualEntry"("company_id", "entry_no");
CREATE INDEX IF NOT EXISTS "APManualEntry_company_id_idx" ON "APManualEntry"("company_id");
CREATE INDEX IF NOT EXISTS "APManualEntry_requester_id_idx" ON "APManualEntry"("requester_id");
CREATE INDEX IF NOT EXISTS "APManualEntry_vendor_id_idx" ON "APManualEntry"("vendor_id");
CREATE INDEX IF NOT EXISTS "APManualEntry_status_idx" ON "APManualEntry"("status");

CREATE INDEX IF NOT EXISTS "APMatchException_company_id_idx" ON "APMatchException"("company_id");
CREATE INDEX IF NOT EXISTS "APMatchException_invoice_id_idx" ON "APMatchException"("invoice_id");
CREATE INDEX IF NOT EXISTS "APMatchException_status_idx" ON "APMatchException"("status");

CREATE INDEX IF NOT EXISTS "APAuditTrail_company_id_idx" ON "APAuditTrail"("company_id");
CREATE INDEX IF NOT EXISTS "APAuditTrail_entity_idx" ON "APAuditTrail"("company_id", "entity_type", "entity_id");

ALTER TABLE "APRequisition"
  ADD CONSTRAINT "APRequisition_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "APRequisition"
  ADD CONSTRAINT "APRequisition_requester_id_fkey"
  FOREIGN KEY ("requester_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'APRequisition_approver_id_fkey'
          AND table_name = 'APRequisition'
    ) THEN
        ALTER TABLE "APRequisition"
        ADD CONSTRAINT "APRequisition_approver_id_fkey"
        FOREIGN KEY ("approver_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'APRequisition_vendor_id_fkey'
          AND table_name = 'APRequisition'
    ) THEN
        ALTER TABLE "APRequisition"
        ADD CONSTRAINT "APRequisition_vendor_id_fkey"
        FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END$$;

ALTER TABLE "APManualEntry"
  ADD CONSTRAINT "APManualEntry_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "APManualEntry"
  ADD CONSTRAINT "APManualEntry_requester_id_fkey"
  FOREIGN KEY ("requester_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'APManualEntry_approver_id_fkey'
          AND table_name = 'APManualEntry'
    ) THEN
        ALTER TABLE "APManualEntry"
        ADD CONSTRAINT "APManualEntry_approver_id_fkey"
        FOREIGN KEY ("approver_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'APManualEntry_vendor_id_fkey'
          AND table_name = 'APManualEntry'
    ) THEN
        ALTER TABLE "APManualEntry"
        ADD CONSTRAINT "APManualEntry_vendor_id_fkey"
        FOREIGN KEY ("vendor_id") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END$$;

ALTER TABLE "APMatchException"
  ADD CONSTRAINT "APMatchException_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "APMatchException"
  ADD CONSTRAINT "APMatchException_invoice_id_fkey"
  FOREIGN KEY ("invoice_id") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'APMatchException_raised_by_id_fkey'
          AND table_name = 'APMatchException'
    ) THEN
        ALTER TABLE "APMatchException"
        ADD CONSTRAINT "APMatchException_raised_by_id_fkey"
        FOREIGN KEY ("raised_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'APMatchException_resolved_by_id_fkey'
          AND table_name = 'APMatchException'
    ) THEN
        ALTER TABLE "APMatchException"
        ADD CONSTRAINT "APMatchException_resolved_by_id_fkey"
        FOREIGN KEY ("resolved_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END$$;

ALTER TABLE "APAuditTrail"
  ADD CONSTRAINT "APAuditTrail_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'APAuditTrail_actor_user_id_fkey'
          AND table_name = 'APAuditTrail'
    ) THEN
        ALTER TABLE "APAuditTrail"
        ADD CONSTRAINT "APAuditTrail_actor_user_id_fkey"
        FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END$$;
