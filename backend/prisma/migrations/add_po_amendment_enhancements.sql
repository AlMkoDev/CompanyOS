-- Add AmendmentStatus enum
CREATE TYPE "AmendmentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'APPLIED', 'CANCELLED');

-- Drop existing PurchaseOrderAmendment table to recreate with enhanced structure
DROP TABLE IF EXISTS "PurchaseOrderAmendment";

-- Create enhanced PO Amendment table
CREATE TABLE "POAmendment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "amendment_number" TEXT NOT NULL,
    "original_po_id" UUID NOT NULL,
    "requested_by" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" "AmendmentStatus" NOT NULL DEFAULT 'PENDING',
    "original_total" DECIMAL(15,2) NOT NULL,
    "amended_total" DECIMAL(15,2) NOT NULL,
    "changes" JSONB NOT NULL,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "approval_comments" TEXT,
    "applied_by" TEXT,
    "applied_at" TIMESTAMP(3),
    "cancelled_by" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "POAmendment_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "POAmendment" ADD CONSTRAINT "POAmendment_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "POAmendment" ADD CONSTRAINT "POAmendment_original_po_id_fkey" FOREIGN KEY ("original_po_id") REFERENCES "OpsPurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add indexes for performance
CREATE INDEX "POAmendment_company_id_idx" ON "POAmendment"("company_id");
CREATE INDEX "POAmendment_original_po_id_idx" ON "POAmendment"("original_po_id");
CREATE INDEX "POAmendment_status_idx" ON "POAmendment"("status");
CREATE UNIQUE INDEX "POAmendment_amendment_number_key" ON "POAmendment"("amendment_number");

-- Add amendment tracking to OpsPurchaseOrder
ALTER TABLE "OpsPurchaseOrder" ADD COLUMN IF NOT EXISTS "amendment_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "OpsPurchaseOrder" ADD COLUMN IF NOT EXISTS "last_amended_at" TIMESTAMP(3);
ALTER TABLE "OpsPurchaseOrder" ADD COLUMN IF NOT EXISTS "is_amended" BOOLEAN NOT NULL DEFAULT false;

-- Create amendment audit log table
CREATE TABLE "POAmendmentAudit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "amendment_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "POAmendmentAudit_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints for audit table
ALTER TABLE "POAmendmentAudit" ADD CONSTRAINT "POAmendmentAudit_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "POAmendmentAudit" ADD CONSTRAINT "POAmendmentAudit_amendment_id_fkey" FOREIGN KEY ("amendment_id") REFERENCES "POAmendment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add indexes for audit table
CREATE INDEX "POAmendmentAudit_company_id_idx" ON "POAmendmentAudit"("company_id");
CREATE INDEX "POAmendmentAudit_amendment_id_idx" ON "POAmendmentAudit"("amendment_id");
CREATE INDEX "POAmendmentAudit_created_at_idx" ON "POAmendmentAudit"("created_at");