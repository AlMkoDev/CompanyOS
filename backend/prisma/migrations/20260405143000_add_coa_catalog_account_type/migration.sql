ALTER TABLE "CoaCatalogAccount"
ADD COLUMN "account_type" TEXT;

UPDATE "CoaCatalogAccount"
SET "account_type" = CASE
  WHEN LEFT("code", 1) = '1' THEN 'asset'
  WHEN LEFT("code", 1) = '2' THEN 'liability'
  WHEN LEFT("code", 1) = '3' THEN 'equity'
  WHEN LEFT("code", 1) = '4' THEN 'revenue'
  ELSE 'expense'
END
WHERE "account_type" IS NULL;
