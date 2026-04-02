CREATE TABLE "ReportCertification" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL,
  "period_id" UUID NOT NULL,
  "report_type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "certified_by" UUID,
  "certified_at" TIMESTAMPTZ,
  "revoked_at" TIMESTAMPTZ,
  "notes" TEXT,
  "coverage_percent" INTEGER NOT NULL DEFAULT 0,
  "blocker_count" INTEGER NOT NULL DEFAULT 0,
  "owner_gap_count" INTEGER NOT NULL DEFAULT 0,
  "restricted_gap_count" INTEGER NOT NULL DEFAULT 0,
  "posture_snapshot" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ReportCertification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReportCertification_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReportCertification_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "AccountingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReportCertification_certified_by_fkey" FOREIGN KEY ("certified_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ReportCertification_company_id_period_id_report_type_key"
ON "ReportCertification" ("company_id", "period_id", "report_type");

CREATE INDEX "ReportCertification_company_id_report_type_status_idx"
ON "ReportCertification" ("company_id", "report_type", "status");

CREATE TABLE "ReportCertificationAudit" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL,
  "certification_id" UUID NOT NULL,
  "actor_user_id" UUID,
  "action" TEXT NOT NULL,
  "notes" TEXT,
  "posture_snapshot" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ReportCertificationAudit_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReportCertificationAudit_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReportCertificationAudit_certification_id_fkey" FOREIGN KEY ("certification_id") REFERENCES "ReportCertification"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReportCertificationAudit_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "ReportCertificationAudit_company_id_created_at_idx"
ON "ReportCertificationAudit" ("company_id", "created_at");

CREATE INDEX "ReportCertificationAudit_certification_id_created_at_idx"
ON "ReportCertificationAudit" ("certification_id", "created_at");
