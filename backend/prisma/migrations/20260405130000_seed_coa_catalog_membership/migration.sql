INSERT INTO "CoaCatalogAccount" ("code", "name", "description", "jurisdiction", "reporting_frameworks", "module_tags", "is_core", "is_regulatory", "is_optional")
VALUES
  ('1000', 'Cash and Cash Equivalents', 'Primary cash control account.', NULL, ARRAY['IFRS_FULL', 'IFRS_SME', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY[]::TEXT[], true, false, false),
  ('1010', 'Main Bank Account', 'Operational bank account for daily settlements.', NULL, ARRAY['IFRS_FULL', 'IFRS_SME', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY[]::TEXT[], true, false, false),
  ('1020', 'Petty Cash', 'Petty cash float for minor expenditures.', NULL, ARRAY['IFRS_FULL', 'IFRS_SME', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY[]::TEXT[], false, false, true),
  ('1100', 'Accounts Receivable Control', 'Trade receivables control account.', NULL, ARRAY['IFRS_FULL', 'IFRS_SME', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY[]::TEXT[], true, false, false),
  ('1200', 'Inventory Control', 'Inventory on hand valuation account.', NULL, ARRAY['IFRS_FULL', 'IFRS_SME', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY[]::TEXT[], true, false, false),
  ('1300', 'Prepayments', 'Short-term prepayments and advances.', NULL, ARRAY['IFRS_FULL', 'IFRS_SME', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY[]::TEXT[], false, false, true),
  ('1400', 'Property, Plant and Equipment', 'Gross fixed asset control.', NULL, ARRAY['IFRS_FULL', 'IFRS_SME', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY[]::TEXT[], true, false, false),
  ('1500', 'Accumulated Depreciation', 'Contra account for depreciation reserves.', NULL, ARRAY['IFRS_FULL', 'IFRS_SME', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY[]::TEXT[], true, false, false),
  ('2000', 'Accounts Payable Control', 'Trade payables control account.', NULL, ARRAY['IFRS_FULL', 'IFRS_SME', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY[]::TEXT[], true, false, false),
  ('2100', 'Accrued Expenses', 'Routine month-end accruals.', NULL, ARRAY['IFRS_FULL', 'IFRS_SME', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY[]::TEXT[], true, false, false),
  ('2200', 'Payroll Liabilities', 'Net payroll and statutory payroll liabilities.', NULL, ARRAY['IFRS_FULL', 'IFRS_SME', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY[]::TEXT[], true, false, false),
  ('2300', 'VAT Control', 'Net VAT clearing and liability account.', NULL, ARRAY['IFRS_FULL', 'IFRS_SME', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY['SA_TAX', 'ZW_TAX'], true, true, false),
  ('2400', 'Income Tax Payable', 'Current income tax payable account.', NULL, ARRAY['IFRS_FULL', 'IFRS_SME', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY['SA_TAX', 'ZW_TAX'], true, true, false),
  ('2500', 'Deferred Tax', 'Deferred tax asset and liability control.', NULL, ARRAY['IFRS_FULL', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY['SA_TAX', 'ZW_TAX'], false, true, true),
  ('3000', 'Share Capital', 'Issued share capital.', NULL, ARRAY['IFRS_FULL', 'IFRS_SME', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY[]::TEXT[], true, false, false),
  ('3100', 'Retained Earnings', 'Accumulated retained earnings reserve.', NULL, ARRAY['IFRS_FULL', 'IFRS_SME', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY[]::TEXT[], true, false, false),
  ('4000', 'Sales Revenue', 'Primary operating revenue account.', NULL, ARRAY['IFRS_FULL', 'IFRS_SME', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY[]::TEXT[], true, false, false),
  ('4100', 'Other Operating Income', 'Incidental income streams.', NULL, ARRAY['IFRS_FULL', 'IFRS_SME', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY[]::TEXT[], false, false, true),
  ('5000', 'Cost of Sales', 'Direct cost of goods sold.', NULL, ARRAY['IFRS_FULL', 'IFRS_SME', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY[]::TEXT[], true, false, false),
  ('6000', 'Salaries and Wages', 'Payroll expense account.', NULL, ARRAY['IFRS_FULL', 'IFRS_SME', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY[]::TEXT[], true, false, false),
  ('6100', 'Rent and Occupancy', 'Office and facilities rent.', NULL, ARRAY['IFRS_FULL', 'IFRS_SME', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY[]::TEXT[], false, false, true),
  ('6200', 'Utilities Expense', 'Utilities and communications expense.', NULL, ARRAY['IFRS_FULL', 'IFRS_SME', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY[]::TEXT[], false, false, true),
  ('6300', 'Depreciation Expense', 'Periodic depreciation expense.', NULL, ARRAY['IFRS_FULL', 'IFRS_SME', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY[]::TEXT[], true, false, false),
  ('7000', 'Foreign Exchange Gain or Loss', 'Exchange difference account.', NULL, ARRAY['IFRS_FULL', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY['MULTI_CURRENCY'], false, true, true),
  ('7100', 'Hyperinflation Restatement Reserve', 'IAS 29 restatement reserve account.', 'ZW', ARRAY['ZW_IFRS29'], ARRAY['IAS29'], false, true, false),
  ('7110', 'Monetary Loss on Net Monetary Position', 'IAS 29 monetary position gain/loss account.', 'ZW', ARRAY['ZW_IFRS29'], ARRAY['IAS29'], false, true, false),
  ('7200', 'Intercompany Clearing', 'Cross-border intercompany settlement account.', NULL, ARRAY['IFRS_FULL', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY['CROSS_BORDER_INTERCOMPANY'], false, true, false),
  ('7300', 'Withholding Tax Control', 'Cross-border withholding and treaty-rate control.', NULL, ARRAY['IFRS_FULL', 'ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY['SA_TAX', 'ZW_TAX', 'CROSS_BORDER_INTERCOMPANY'], false, true, false),
  ('2310', 'SARS VAT Output', 'South Africa VAT output tax.', 'ZA', ARRAY['IFRS_FULL', 'IFRS_SME'], ARRAY['SA_TAX'], true, true, false),
  ('2320', 'SARS VAT Input', 'South Africa VAT input tax.', 'ZA', ARRAY['IFRS_FULL', 'IFRS_SME'], ARRAY['SA_TAX'], true, true, false),
  ('2330', 'PAYE Liability', 'South Africa PAYE payroll tax liability.', 'ZA', ARRAY['IFRS_FULL', 'IFRS_SME'], ARRAY['SA_TAX'], true, true, false),
  ('2340', 'UIF Liability', 'South Africa UIF payroll tax liability.', 'ZA', ARRAY['IFRS_FULL', 'IFRS_SME'], ARRAY['SA_TAX'], true, true, false),
  ('2350', 'SDL Liability', 'South Africa SDL payroll tax liability.', 'ZA', ARRAY['IFRS_FULL', 'IFRS_SME'], ARRAY['SA_TAX'], false, true, true),
  ('2360', 'Dividends Tax Liability', 'South Africa dividends tax control.', 'ZA', ARRAY['IFRS_FULL'], ARRAY['SA_TAX'], false, true, true),
  ('2370', 'PFMA Compliance Clearing', 'Public-sector review and suspense clearing.', 'ZA', ARRAY['IFRS_FULL'], ARRAY['PFMA_SCOA_REVIEW'], false, true, false),
  ('2380', 'SCOA Mapping Review Suspense', 'Temporary suspense pending SCOA alignment.', 'ZA', ARRAY['IFRS_FULL'], ARRAY['PFMA_SCOA_REVIEW'], false, true, false),
  ('2390', 'Assessed Loss Memorandum', 'South Africa assessed loss memorandum account.', 'ZA', ARRAY['IFRS_FULL'], ARRAY['SA_TAX'], false, true, true),
  ('2311', 'ZIMRA VAT Output', 'Zimbabwe VAT output tax.', 'ZW', ARRAY['ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY['ZW_TAX'], true, true, false),
  ('2321', 'ZIMRA VAT Input', 'Zimbabwe VAT input tax.', 'ZW', ARRAY['ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY['ZW_TAX'], true, true, false),
  ('2331', 'PAYE Liability ZW', 'Zimbabwe PAYE liability.', 'ZW', ARRAY['ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY['ZW_TAX'], true, true, false),
  ('2341', 'NSSA Liability', 'Zimbabwe NSSA liability.', 'ZW', ARRAY['ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY['ZW_TAX'], true, true, false),
  ('2351', 'AIDS Levy Liability', 'Zimbabwe AIDS levy liability.', 'ZW', ARRAY['ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY['ZW_TAX'], false, true, false),
  ('2361', 'IMTT Control', 'Zimbabwe IMTT transaction tax control.', 'ZW', ARRAY['ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY['ZW_TAX'], false, true, false),
  ('2371', 'Exchange Control Clearing', 'Zimbabwe exchange-control monitoring account.', 'ZW', ARRAY['ZW_IFRS_FULL', 'ZW_IFRS29'], ARRAY['ZW_TAX', 'MULTI_CURRENCY'], false, true, false);

INSERT INTO "CoaTemplateAccount" ("template_id", "catalog_account_id", "inclusion_reason", "module_dependency", "sort_order")
SELECT t.id, a.id, 'Core integrated chart baseline.', NULL, ROW_NUMBER() OVER (ORDER BY a.code)
FROM "CoaTemplate" t
CROSS JOIN "CoaCatalogAccount" a
WHERE t.code = 'FULL_INTEGRATED'
  AND a.code IN ('1000','1010','1020','1100','1200','1300','1400','1500','2000','2100','2200','2300','2400','2500','3000','3100','4000','4100','5000','6000','6100','6200','6300','7000','7200','7300','2310','2320','2330','2340','2350','2360','2390');

INSERT INTO "CoaTemplateAccount" ("template_id", "catalog_account_id", "inclusion_reason", "module_dependency", "sort_order")
SELECT t.id, a.id, 'Lean SME baseline chart.', NULL, ROW_NUMBER() OVER (ORDER BY a.code)
FROM "CoaTemplate" t
CROSS JOIN "CoaCatalogAccount" a
WHERE t.code = 'SME_LITE'
  AND a.code IN ('1000','1010','1100','1200','1300','1400','1500','2000','2100','2200','2300','2400','3000','3100','4000','5000','6000','6100','6200','6300','2310','2320','2330','2340');

INSERT INTO "CoaTemplateAccount" ("template_id", "catalog_account_id", "inclusion_reason", "module_dependency", "sort_order")
SELECT t.id, a.id,
  CASE
    WHEN a.code IN ('2370','2380') THEN 'Public-sector review pack pending SCOA/PFMA alignment.'
    ELSE 'Public-sector review baseline chart.'
  END,
  CASE
    WHEN a.code IN ('2370','2380') THEN 'PFMA_SCOA_REVIEW'
    ELSE NULL
  END,
  ROW_NUMBER() OVER (ORDER BY a.code)
FROM "CoaTemplate" t
CROSS JOIN "CoaCatalogAccount" a
WHERE t.code = 'ZA_PUBLIC_SECTOR_REVIEW'
  AND a.code IN ('1000','1010','1100','1200','1400','1500','2000','2100','2200','2300','2400','3000','3100','4000','5000','6000','6300','2310','2320','2330','2340','2350','2370','2380','2390');

INSERT INTO "CoaTemplateAccount" ("template_id", "catalog_account_id", "inclusion_reason", "module_dependency", "sort_order")
SELECT t.id, a.id,
  CASE
    WHEN a.code IN ('7100','7110') THEN 'Zimbabwe IAS 29 restatement support.'
    WHEN a.code IN ('7200','7300') THEN 'Cross-border and treaty handling support.'
    ELSE 'Zimbabwe integrated baseline chart.'
  END,
  CASE
    WHEN a.code IN ('7100','7110') THEN 'IAS29'
    WHEN a.code = '7000' THEN 'MULTI_CURRENCY'
    WHEN a.code IN ('7200','7300') THEN 'CROSS_BORDER_INTERCOMPANY'
    WHEN a.code IN ('2311','2321','2331','2341','2351','2361','2371') THEN 'ZW_TAX'
    ELSE NULL
  END,
  ROW_NUMBER() OVER (ORDER BY a.code)
FROM "CoaTemplate" t
CROSS JOIN "CoaCatalogAccount" a
WHERE t.code = 'ZW_FULL_INTEGRATED'
  AND a.code IN ('1000','1010','1020','1100','1200','1300','1400','1500','2000','2100','2200','2300','2400','2500','3000','3100','4000','4100','5000','6000','6100','6200','6300','7000','7100','7110','7200','7300','2311','2321','2331','2341','2351','2361','2371');
