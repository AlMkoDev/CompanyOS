CREATE TABLE "CoaTemplate" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "jurisdiction" TEXT,
  "reporting_frameworks" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CoaTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CoaTemplate_code_key" ON "CoaTemplate"("code");

CREATE TABLE "CoaTemplateModule" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "template_id" UUID NOT NULL,
  "module_code" TEXT NOT NULL,
  "module_name" TEXT NOT NULL,
  "is_required" BOOLEAN NOT NULL DEFAULT false,
  "default_enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CoaTemplateModule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CoaTemplateModule_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "CoaTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CoaTemplateModule_template_id_module_code_key"
  ON "CoaTemplateModule"("template_id", "module_code");

CREATE TABLE "CoaCatalogAccount" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "jurisdiction" TEXT,
  "reporting_frameworks" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "module_tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "is_core" BOOLEAN NOT NULL DEFAULT false,
  "is_regulatory" BOOLEAN NOT NULL DEFAULT false,
  "is_optional" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CoaCatalogAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CoaCatalogAccount_code_key" ON "CoaCatalogAccount"("code");

CREATE TABLE "CoaTemplateAccount" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "template_id" UUID NOT NULL,
  "catalog_account_id" UUID NOT NULL,
  "inclusion_reason" TEXT NOT NULL,
  "module_dependency" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CoaTemplateAccount_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CoaTemplateAccount_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "CoaTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CoaTemplateAccount_catalog_account_id_fkey" FOREIGN KEY ("catalog_account_id") REFERENCES "CoaCatalogAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CoaTemplateAccount_template_id_catalog_account_id_key"
  ON "CoaTemplateAccount"("template_id", "catalog_account_id");

INSERT INTO "CoaTemplate" ("code", "name", "description", "jurisdiction", "reporting_frameworks", "sort_order")
VALUES
  ('FULL_INTEGRATED', 'Full Integrated Chart', 'Recommended integrated chart for South African entities needing a broad operational footprint.', 'ZA', ARRAY['IFRS_FULL'], 10),
  ('SME_LITE', 'SME Lean Chart', 'Lean chart for South African private entities with simpler reporting and control needs.', 'ZA', ARRAY['IFRS_SME'], 20),
  ('ZA_PUBLIC_SECTOR_REVIEW', 'Public Sector Review Chart', 'South African public-sector starting point requiring SCOA and PFMA review before go-live.', 'ZA', ARRAY['IFRS_FULL'], 30),
  ('ZW_FULL_INTEGRATED', 'Zimbabwe Full Integrated Chart', 'Zimbabwe chart with multi-currency and local tax readiness.', 'ZW', ARRAY['ZW_IFRS_FULL', 'ZW_IFRS29'], 40);

INSERT INTO "CoaTemplateModule" ("template_id", "module_code", "module_name", "is_required", "default_enabled")
SELECT id, 'SA_TAX', 'South Africa Tax Pack', true, true
FROM "CoaTemplate"
WHERE "code" IN ('FULL_INTEGRATED', 'SME_LITE', 'ZA_PUBLIC_SECTOR_REVIEW');

INSERT INTO "CoaTemplateModule" ("template_id", "module_code", "module_name", "is_required", "default_enabled")
SELECT id, 'ZW_TAX', 'Zimbabwe Tax Pack', true, true
FROM "CoaTemplate"
WHERE "code" = 'ZW_FULL_INTEGRATED';

INSERT INTO "CoaTemplateModule" ("template_id", "module_code", "module_name", "is_required", "default_enabled")
SELECT id, 'MULTI_CURRENCY', 'Multi-currency Accounting', true, true
FROM "CoaTemplate"
WHERE "code" = 'ZW_FULL_INTEGRATED';

INSERT INTO "CoaTemplateModule" ("template_id", "module_code", "module_name", "is_required", "default_enabled")
SELECT id, 'IAS29', 'IAS 29 Restatement', false, false
FROM "CoaTemplate"
WHERE "code" = 'ZW_FULL_INTEGRATED';

INSERT INTO "CoaTemplateModule" ("template_id", "module_code", "module_name", "is_required", "default_enabled")
SELECT id, 'CROSS_BORDER_INTERCOMPANY', 'Cross-border Intercompany', false, false
FROM "CoaTemplate"
WHERE "code" IN ('FULL_INTEGRATED', 'ZW_FULL_INTEGRATED');

INSERT INTO "CoaTemplateModule" ("template_id", "module_code", "module_name", "is_required", "default_enabled")
SELECT id, 'PFMA_SCOA_REVIEW', 'PFMA and SCOA Review', true, true
FROM "CoaTemplate"
WHERE "code" = 'ZA_PUBLIC_SECTOR_REVIEW';
