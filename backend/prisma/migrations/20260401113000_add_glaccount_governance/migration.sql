-- Add COA governance and immutable audit tables
CREATE TABLE "GLAccountChangeRequest" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "account_id" UUID,
    "request_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "title" TEXT NOT NULL,
    "rationale" TEXT,
    "requested_by" UUID,
    "reviewed_by" UUID,
    "requested_payload" JSONB,
    "current_snapshot" JSONB,
    "review_notes" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "implemented_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GLAccountChangeRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GLAccountAuditTrail" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "change_request_id" UUID,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "change_summary" TEXT,
    "before_snapshot" JSONB,
    "after_snapshot" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GLAccountAuditTrail_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GLAccountChangeRequest_company_id_status_idx" ON "GLAccountChangeRequest"("company_id", "status");
CREATE INDEX "GLAccountChangeRequest_company_id_request_type_idx" ON "GLAccountChangeRequest"("company_id", "request_type");
CREATE INDEX "GLAccountChangeRequest_account_id_idx" ON "GLAccountChangeRequest"("account_id");
CREATE INDEX "GLAccountAuditTrail_company_id_created_at_idx" ON "GLAccountAuditTrail"("company_id", "created_at");
CREATE INDEX "GLAccountAuditTrail_account_id_created_at_idx" ON "GLAccountAuditTrail"("account_id", "created_at");

ALTER TABLE "GLAccountChangeRequest"
    ADD CONSTRAINT "GLAccountChangeRequest_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GLAccountChangeRequest"
    ADD CONSTRAINT "GLAccountChangeRequest_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "GLAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GLAccountChangeRequest"
    ADD CONSTRAINT "GLAccountChangeRequest_requested_by_fkey"
    FOREIGN KEY ("requested_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GLAccountChangeRequest"
    ADD CONSTRAINT "GLAccountChangeRequest_reviewed_by_fkey"
    FOREIGN KEY ("reviewed_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GLAccountAuditTrail"
    ADD CONSTRAINT "GLAccountAuditTrail_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GLAccountAuditTrail"
    ADD CONSTRAINT "GLAccountAuditTrail_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "GLAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GLAccountAuditTrail"
    ADD CONSTRAINT "GLAccountAuditTrail_actor_user_id_fkey"
    FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GLAccountAuditTrail"
    ADD CONSTRAINT "GLAccountAuditTrail_change_request_id_fkey"
    FOREIGN KEY ("change_request_id") REFERENCES "GLAccountChangeRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
