-- CreateTable
CREATE TABLE "GLAccountRemediationState" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "issue_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" UUID,
    "cleared_at" TIMESTAMP(3),
    "cleared_by" UUID,
    "review_notes" TEXT,
    "cleared_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GLAccountRemediationState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GLAccountRemediationState_company_id_account_id_issue_type_key" ON "GLAccountRemediationState"("company_id", "account_id", "issue_type");

-- CreateIndex
CREATE INDEX "GLAccountRemediationState_company_id_status_idx" ON "GLAccountRemediationState"("company_id", "status");

-- CreateIndex
CREATE INDEX "GLAccountRemediationState_account_id_issue_type_idx" ON "GLAccountRemediationState"("account_id", "issue_type");

-- AddForeignKey
ALTER TABLE "GLAccountRemediationState" ADD CONSTRAINT "GLAccountRemediationState_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GLAccountRemediationState" ADD CONSTRAINT "GLAccountRemediationState_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "GLAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GLAccountRemediationState" ADD CONSTRAINT "GLAccountRemediationState_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GLAccountRemediationState" ADD CONSTRAINT "GLAccountRemediationState_cleared_by_fkey" FOREIGN KEY ("cleared_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
