ALTER TABLE "ReportCertification"
ADD COLUMN "secondary_certified_by" UUID,
ADD COLUMN "secondary_certified_at" TIMESTAMPTZ,
ADD COLUMN "signoff_required" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "ReportCertification"
ADD CONSTRAINT "ReportCertification_secondary_certified_by_fkey"
FOREIGN KEY ("secondary_certified_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ReportCertification_secondary_certified_by_idx"
ON "ReportCertification" ("secondary_certified_by");
