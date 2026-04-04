CREATE TABLE "CompanyAccountingProfile" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL,
  "primary_jurisdiction" TEXT NOT NULL DEFAULT 'ZA',
  "operating_jurisdictions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "reporting_framework" TEXT NOT NULL DEFAULT 'IFRS_FULL',
  "functional_currency" TEXT NOT NULL DEFAULT 'ZAR',
  "presentation_currency" TEXT NOT NULL DEFAULT 'ZAR',
  "functional_currency_justification" TEXT,
  "zw_ias29_applicable" BOOLEAN NOT NULL DEFAULT false,
  "zw_prior_ias29_application" BOOLEAN NOT NULL DEFAULT false,
  "cross_border_operations" BOOLEAN NOT NULL DEFAULT false,
  "consolidates_subsidiaries" BOOLEAN NOT NULL DEFAULT false,
  "vat_registered" BOOLEAN NOT NULL DEFAULT false,
  "pfma_entity" BOOLEAN NOT NULL DEFAULT false,
  "sdl_exempt" BOOLEAN NOT NULL DEFAULT false,
  "annual_payroll_estimate" DECIMAL(15,2),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompanyAccountingProfile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CompanyAccountingProfile_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CompanyAccountingProfile_company_id_key"
  ON "CompanyAccountingProfile"("company_id");

CREATE OR REPLACE FUNCTION set_company_accounting_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_company_accounting_profile_updated_at
BEFORE UPDATE ON "CompanyAccountingProfile"
FOR EACH ROW
EXECUTE FUNCTION set_company_accounting_profile_updated_at();
