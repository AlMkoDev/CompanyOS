# CompanyOS COA Jurisdiction Architecture Addendum

**Document Type:** Architecture Addendum  
**Version:** 1.0  
**Status:** Draft for Review  
**Prepared:** April 2026  
**Authority:** Supplements the COA Detailed Implementation Specification and the South Africa / Zimbabwe Jurisdictional Addendum

---

## 1. Purpose

This addendum defines how jurisdictional awareness fits into the CompanyOS Chart of Accounts architecture.

It clarifies that jurisdiction handling is **not** a tax-code patch or a reporting afterthought. It is a first-class configuration layer that sits between:

- the global accounting / control framework
- and company-specific COA instantiation

This addendum is the design bridge between:

- [C:\Users\gsfencing\.codex\worktrees\ecd5\CompanyOS\COA_DETAILED_IMPLEMENTATION_SPEC.md](C:\Users\gsfencing\.codex\worktrees\ecd5\CompanyOS\COA_DETAILED_IMPLEMENTATION_SPEC.md)
- [C:\Users\gsfencing\.codex\worktrees\ecd5\CompanyOS\COA_SA_ZW_JURISDICTIONAL_ADDENDUM.docx](C:\Users\gsfencing\.codex\worktrees\ecd5\CompanyOS\COA_SA_ZW_JURISDICTIONAL_ADDENDUM.docx)

It establishes the architecture required for CompanyOS to support:

- South Africa (`ZA`)
- Zimbabwe (`ZW`)

while remaining extensible for future jurisdictions.

---

## 2. Architecture Position

### 2.1 Design Principle

CompanyOS must treat jurisdiction as a governed accounting configuration domain.

Jurisdiction drives:

- reporting framework availability
- company profile requirements
- tax code seed data
- mandatory account activation
- wizard warnings and validation
- currency rules
- audit / retention requirements
- close and certification control expectations

### 2.2 Layer Model

The COA platform should now be understood as five layers:

1. **Global accounting and control layer**
2. **Jurisdiction layer**
3. **Company business-profile layer**
4. **Template recommendation and activation layer**
5. **Company COA and reporting operations layer**

This means CompanyOS should no longer move directly from:

- global template catalog

to:

- company chart creation

without first resolving jurisdictional rules.

---

## 3. Layer Responsibilities

### 3.1 Global Accounting and Control Layer

This layer remains the policy spine of the platform.

It holds:

- IFRS / IFRS for SMEs concepts
- IAS 1 statement structure expectations
- IAS 21 functional and presentation currency rules
- COSO-based control posture
- IIA-style audit evidence expectations
- global COA governance workflow
- global sensitivity-tier model
- global signoff / close / audit architecture

This layer is jurisdiction-neutral.

### 3.2 Jurisdiction Layer

This is the new required layer.

It holds:

- jurisdiction code and metadata
- jurisdiction-specific reporting framework variants
- tax regimes and default tax-code packages
- required company-profile fields
- mandatory and optional account extensions
- wizard warnings and activation rules
- retention and regulatory overrides
- currency and restatement rules where applicable

This layer is where `ZA` and `ZW` diverge.

### 3.3 Company Business-Profile Layer

This layer captures the company’s real operating context.

It should include:

- entity type
- industry
- branch / cost-centre complexity
- VAT / tax registration
- payroll characteristics
- public-entity status
- consolidation status
- intercompany status
- jurisdiction
- functional currency
- additional reporting currencies

For Zimbabwe, this layer also includes:

- `functional_currency_justification`
- `zw_ias29_applicable`
- `prior_ias29_application`

### 3.4 Template Recommendation and Activation Layer

This layer takes:

- global rules
- jurisdiction rules
- business profile

and determines:

- recommended chart template
- mandatory modules
- mandatory regulatory accounts
- optional extension packs
- warnings and pre-commit validations

### 3.5 Company COA and Reporting Operations Layer

This is the live company accounting environment.

It includes:

- instantiated company chart
- account governance
- tax treatment
- reporting structure
- reconciliation
- period close
- report certification
- remediation backlog

This layer must reflect the resolved choices from the earlier layers and must not be left to user interpretation after setup.

---

## 4. Jurisdiction Model

### 4.1 Required Core Object

CompanyOS should introduce a first-class jurisdiction configuration model.

Suggested object:

```text
JurisdictionProfile
```

Suggested minimum fields:

- `code` (`ZA`, `ZW`)
- `name`
- `default_reporting_framework`
- `allowed_reporting_frameworks`
- `default_functional_currency`
- `allowed_functional_currencies`
- `requires_functional_currency_justification`
- `supports_hyperinflationary_accounting`
- `requires_multi_currency_module`
- `default_tax_package_code`
- `retention_period_years`
- `annual_regulatory_review_month`
- `wizard_warning_rules`

### 4.2 Relationship to Company

Each company should carry:

- one primary jurisdiction
- optional secondary operating jurisdictions for cross-border entities

Suggested minimum company-level fields:

- `primary_jurisdiction`
- `operating_jurisdictions`
- `reporting_framework`
- `functional_currency`
- `presentation_currency`
- `consolidates_subsidiaries`
- `cross_border_operations`

---

## 5. South Africa Architecture Implications

South Africa mainly changes:

- regulatory and tax configuration
- reporting-category determination
- payroll and statutory account activation
- industry / public-sector variants

### 5.1 South Africa Company Profile Extensions

The company profile should support at least:

- `za_vat_registered`
- `za_income_tax_registered`
- `za_paye_registered`
- `za_uif_registered`
- `za_sdl_registered`
- `za_sdl_exempt`
- `za_annual_payroll_estimate`
- `za_public_interest_score`
- `za_reporting_category`
- `za_pfma_entity`
- `za_fsca_regulated`
- `za_b_bbbee_tracking_required`
- `za_mining_rehabilitation_required`

### 5.2 South Africa Template / Wizard Effects

The setup flow should:

- default ZA companies toward SA-aligned integrated templates
- activate SA tax module by default
- activate payroll tax accounts where employer payroll is present
- warn when PIS indicates IFRS Full is more appropriate than IFRS for SMEs
- warn when PFMA is selected and SCOA alignment is required
- confirm SDL threshold posture

### 5.3 South Africa Catalog / COA Effects

The master catalog should include a South Africa extension pack covering at least:

- VAT input / output / control accounts
- provisional tax payable
- assessed loss memorandum accounts
- dividends tax payable
- transfer pricing adjustment accounts
- PAYE / UIF / SDL liabilities
- retirement fund and bargaining council liabilities
- B-BBEE tracking structures where enabled
- mining rehabilitation provision accounts where enabled

### 5.4 South Africa Reporting Effects

The platform should retain global IFRS behavior for most ZA entities, but must support:

- reporting-category awareness
- public-sector flags
- regulator-specific notes or controls where required

---

## 6. Zimbabwe Architecture Implications

Zimbabwe changes the architecture more deeply than South Africa.

It affects:

- currency handling
- functional currency governance
- IAS 29 applicability
- multi-currency tax treatment
- reporting framework behavior
- cross-border group logic

### 6.1 Zimbabwe Company Profile Extensions

The company profile should support at least:

- `zw_vat_registered`
- `zw_income_tax_registered`
- `zw_paye_registered`
- `zw_nssa_registered`
- `zw_functional_currency`
- `zw_functional_currency_justification`
- `zw_presentation_currency`
- `zw_ias29_applicable`
- `zw_ias29_last_review_date`
- `zw_prior_ias29_application`
- `zw_multi_currency_operations`
- `zw_primary_bank_currency`
- `zw_has_usd_accounts`

### 6.2 Zimbabwe Template / Wizard Effects

The setup flow should:

- default ZW companies toward a Zimbabwe-specific integrated template
- require explicit functional currency declaration
- require justification capture for functional currency
- make multi-currency module mandatory
- activate IAS 29 module when applicable
- warn when USD is used as functional currency and governance evidence is needed
- warn when cross-border ZA/ZW operations require DTA setup

### 6.3 Zimbabwe Catalog / COA Effects

The master catalog should include a Zimbabwe extension pack covering at least:

- IAS 29 restatement accounts
- monetary gain / loss accounts
- restatement reserve accounts
- multi-currency bank structures
- VAT accounts suitable for interbank-rate conversion needs
- corporate tax and additional levy accounts
- withholding tax structures
- payroll tax and NSSA-related accounts

### 6.4 Zimbabwe Reporting Effects

Zimbabwe requires explicit framework variation.

Suggested framework variants:

- `ZW_IFRS_FULL`
- `ZW_IFRS29`

The reporting layer must support:

- IAS 29 restatement accounts
- inflation-adjusted financial statements
- comparative restatement logic
- monetary gain/loss presentation
- restatement reserve presentation in equity

### 6.5 Zimbabwe Currency Control Effects

This should be treated as architecture, not configuration.

The platform should support:

- multiple bank accounts in different currencies
- posting with transaction currency and functional currency context
- exchange-rate validation against authoritative reference data
- warning or block logic for materially deviant rates
- currency-aware tax and payroll handling

---

## 7. Cross-Border ZA/ZW Design Position

For groups spanning South Africa and Zimbabwe, CompanyOS should assume future need for:

- intercompany accounting
- withholding-tax treaty handling
- consolidation
- functional-to-presentation currency translation
- IAS 29 review on Zimbabwean subsidiaries

### 7.1 Immediate Design Requirements

Even if full consolidation is later-phase, the platform should now support:

- storing DTA treaty-rate configuration between entity pairs
- identifying cross-border intercompany relationships
- storing functional and presentation currency per entity
- flagging Zimbabwean subsidiaries for IAS 29 review
- blocking consolidation or group certification until required restatement checks are satisfied

### 7.2 Treaty / Withholding Position

The system should support treaty-aware withholding logic for ZA/ZW entity pairs.

Suggested configuration object:

```text
IntercompanyTaxTreatyProfile
```

Minimum fields:

- `source_entity_id`
- `target_entity_id`
- `treaty_code`
- `dividend_rate`
- `interest_rate`
- `royalty_rate`
- `management_fee_rate`
- `effective_from`
- `effective_to`

---

## 8. Data Model Additions Required

### 8.1 Company-Level Additions

The current COA plan should be extended with company-level accounting fields for jurisdiction behavior.

Suggested additions:

- `primary_jurisdiction`
- `operating_jurisdictions`
- `reporting_framework`
- `functional_currency`
- `presentation_currency`
- `functional_currency_justification`
- `ias29_applicable`
- `ias29_last_review_date`
- `cross_border_operations`
- `dta_applicable`

### 8.2 Tax Code Model Additions

The addendum explicitly supports extending `tax_codes` with:

- `jurisdiction`
- `is_deductible`

This should be adopted as part of the baseline model, not treated as a local patch.

### 8.3 Catalog / Template Additions

The catalog architecture should support jurisdiction-linked content.

Suggested additions:

- `catalog_account.jurisdiction`
- `catalog_account.regulatory_scope`
- `template.jurisdiction`
- `template_account.is_mandatory_for_jurisdiction`
- `template_account.requires_module`

### 8.4 Journal / Reporting Additions

Zimbabwe requires additional accounting constructs.

Suggested additions:

- journal type `IAS29_RESTATEMENT`
- exchange-rate validation policy support
- per-entity IAS 29 status flag
- per-period restatement confirmation flag

---

## 9. Wizard and Activation Flow Changes

The current recommended activation flow should now be revised to:

1. **Business profile**
2. **Jurisdiction profile resolution**
3. **Framework and currency declaration**
4. **Template recommendation**
5. **Module and regulatory pack activation**
6. **Preview and validation**
7. **Instantiation**

### 9.1 New Mandatory Steps

Before template recommendation, the wizard must now resolve:

- jurisdiction
- reporting framework
- functional currency
- multi-currency requirement
- IAS 29 applicability where relevant

### 9.2 New Validation Rules

Instantiation should validate:

- all jurisdiction-required accounts are present
- required tax packages are attached
- all jurisdiction-required company fields are complete
- unsupported framework / currency combinations are blocked
- IAS 29-required accounts are active before first close when applicable

---

## 10. Master Catalog Loading Strategy

The 600+ spec accounts should be loaded as a layered catalog, not as one undifferentiated list.

Recommended catalog composition:

1. **Global core catalog**
2. **South Africa extension pack**
3. **Zimbabwe extension pack**
4. **Industry packs**
5. **Regulatory packs**

Each catalog account should be classifiable by:

- global vs jurisdiction-specific
- mandatory vs recommended vs optional
- operational vs tax vs reporting vs regulatory

This allows CompanyOS to instantiate a relevant company chart quickly without forcing the user to manually choose among hundreds of low-relevance accounts.

---

## 11. Immediate Changes to the Build Plan

Before loading the full 600+ account catalog into a live activation wizard, CompanyOS should add the following explicit build slice:

### New Pre-Catalog Slice

**Jurisdiction and business-profile foundation**

Deliverables:

- jurisdiction profile model
- company accounting profile extensions
- jurisdiction-aware reporting-framework selection
- jurisdiction-aware tax-code model extension
- jurisdiction-aware wizard rules
- ZA and ZW template recommendation rules

### Revised Activation Order

1. Global framework and control layer
2. Jurisdiction layer
3. Business profile layer
4. Catalog/template schema
5. ZA/ZW catalog extension packs
6. Activation wizard with jurisdiction resolution
7. Company COA instantiation

---

## 12. Implementation Recommendation

The safest approach is:

- keep the existing governance-heavy COA work
- do not throw it away
- but insert the jurisdiction architecture layer before the full catalog rollout

This means the next major platform move should be:

**build jurisdiction-aware accounting setup and catalog resolution first**

not:

**seed all 600+ accounts into a flat selection flow**

---

## 13. Definition of Done Extension

Jurisdiction-aware COA setup should not be considered complete until:

- ZA companies can complete setup with SA tax and compliance defaults
- ZW companies can complete setup with currency and IAS 29-aware defaults
- cross-border ZA/ZW entities can declare treaty and intercompany posture
- required jurisdiction-specific accounts are activated automatically
- unsupported framework / currency combinations are blocked before instantiation
- period close and reporting certification can respect jurisdiction-driven controls where relevant

---

## 14. Closing Position

South Africa and Zimbabwe should not be implemented as:

- extra tax rows
- ad hoc warnings
- or manual accountant knowledge

They should be implemented as a formal jurisdiction layer in the COA platform.

That design choice will make:

- the catalog cleaner
- the wizard smarter
- the reporting layer more trustworthy
- and future jurisdiction rollout far easier.
