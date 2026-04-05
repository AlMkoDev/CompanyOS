-- CreateTable
CREATE TABLE "CompanyAccountingProfileAudit" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "profile_id" UUID,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "change_summary" TEXT,
    "previous_snapshot" JSONB,
    "next_snapshot" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyAccountingProfileAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyAccountingProfileAudit_company_id_created_at_idx" ON "CompanyAccountingProfileAudit"("company_id", "created_at");

-- AddForeignKey
ALTER TABLE "CompanyAccountingProfileAudit" ADD CONSTRAINT "CompanyAccountingProfileAudit_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAccountingProfileAudit" ADD CONSTRAINT "CompanyAccountingProfileAudit_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "CompanyAccountingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAccountingProfileAudit" ADD CONSTRAINT "CompanyAccountingProfileAudit_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
