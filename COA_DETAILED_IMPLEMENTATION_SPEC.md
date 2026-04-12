# CompanyOS — Chart of Accounts
# Detailed Implementation Specification

**Document Type:** Detailed Implementation Specification  
**Version:** 1.0  
**Status:** Draft for Review  
**Prepared:** April 2026  
**Authority:** Derived from COA Implementation Blueprint + COA Improvement Suggestions Review  
**Frameworks Referenced:** IFRS (IAS 1, IAS 21, IAS 8), IFRS for SMEs, COSO 2013 Internal Control Framework, IIA Standards, South African Companies Act No. 71 of 2008, SARS requirements  

---

## Table of Contents

1. [Purpose and Scope](#1-purpose-and-scope)
2. [Conceptual Accounting Framework Declaration](#2-conceptual-accounting-framework-declaration)
3. [Account Code Architecture](#3-account-code-architecture)
4. [Data Model Specification](#4-data-model-specification)
5. [Sensitivity Tier Operational Definitions](#5-sensitivity-tier-operational-definitions)
6. [Accounting Permission Model and SoD Policy](#6-accounting-permission-model-and-sod-policy)
7. [COA Activation Wizard — Full Specification](#7-coa-activation-wizard--full-specification)
8. [Opening Balance Migration Module](#8-opening-balance-migration-module)
9. [Reconciliation Control Object Specification](#9-reconciliation-control-object-specification)
10. [Period Close Architecture](#10-period-close-architecture)
11. [Tax Treatment Data Model](#11-tax-treatment-data-model)
12. [Audit Log — Evidence-Grade Specification](#12-audit-log--evidence-grade-specification)
13. [Multi-Entity and Consolidation Design Position](#13-multi-entity-and-consolidation-design-position)
14. [Governance Workflow Specification](#14-governance-workflow-specification)
15. [API Endpoint Specification](#15-api-endpoint-specification)
16. [Implementation Phases — Detailed Build Plan](#16-implementation-phases--detailed-build-plan)
17. [Documentation Deliverables](#17-documentation-deliverables)
18. [Definition of Done](#18-definition-of-done)
19. [Risk Register](#19-risk-register)

---

## 1. Purpose and Scope

### 1.1 Document Purpose

This specification translates the CompanyOS COA Implementation Blueprint and its accompanying improvement review into a complete, implementation-ready technical and functional specification. It is the authoritative reference for all engineering, finance, and product decisions related to the Chart of Accounts domain in CompanyOS.

Every section in this document corresponds to a gap or improvement identified in the peer review. This is not a high-level plan — it is a build contract.

### 1.2 Scope

This specification covers:

- the conceptual accounting framework underpinning the system
- the account code architecture and its enforcement rules
- the full database schema for all COA-related tables
- the sensitivity tier operational model and enforcement logic
- the accounting permission model and segregation of duties policy
- the COA activation wizard including the business profile pre-step
- the opening balance migration module
- the reconciliation control object model
- the period close architecture and close checklist framework
- the tax treatment data model
- the audit log evidence-grade specification
- the multi-entity and consolidation design position
- the governance workflow specification
- all API endpoints
- phased implementation plan with deliverables per phase
- documentation and training deliverables
- a three-category definition of done

### 1.3 Out of Scope for This Specification

The following are acknowledged as future phases and are not specified here:

- sub-ledger detailed design (AP, AR, payroll, inventory)
- external audit interface and data extract formats
- business intelligence and analytics layer
- mobile application accounting features

---

## 2. Conceptual Accounting Framework Declaration

### 2.1 Primary Accounting Standard

CompanyOS is designed to support entities reporting under **IFRS as adopted in South Africa**, administered by the Financial Reporting Standards Council (FRSC). Where an entity qualifies and elects, the system also supports **IFRS for SMEs** as an alternative framework.

The system must not impose one framework silently. Each company record must carry an explicit `reporting_framework` declaration that governs financial statement structure, account classification, and disclosure behaviour.

### 2.2 Supported Frameworks

| Framework Code | Full Name | Applicable Entities |
|---------------|-----------|-------------------|
| `IFRS_FULL` | International Financial Reporting Standards (Full) | Listed entities, large public interest entities, group reporting |
| `IFRS_SME` | IFRS for SMEs | Qualifying private entities without public accountability |
| `SA_GAAP_LEGACY` | South African GAAP (legacy support only) | Entities with historical records predating IFRS adoption |

### 2.3 Framework Impact on System Behaviour

The declared framework drives the following system behaviours:

**Account classification:** Under IFRS full, Other Comprehensive Income (OCI) is a distinct equity sub-classification. OCI accounts must be separately identifiable in the COA and mapped to the Statement of Changes in Equity, not the income statement.

**Financial statement structure:** IAS 1 prescribes minimum line items. The system's FS placement metadata must align to IAS 1 minimum requirements as the baseline, with additional lines permitted by company configuration.

**Comparative period requirement:** IAS 1 requires at least one comparative period. The system must store and display prior-period figures on all financial statements. This requirement is non-negotiable regardless of company size.

**Reclassification:** IAS 8 governs accounting policy changes and prior-period restatements. The system must support a reclassification journal type that moves balances between accounts with complete audit trail and comparative period restatement.

**Currency translation:** IAS 21 governs entities with foreign currency transactions or foreign operations. The system must support functional currency designation per entity and translation difference capture in equity.

### 2.4 Jurisdictional Requirements

| Requirement | Source | System Implication |
|------------|--------|--------------------|
| Annual financial statements | Companies Act s30 | System must be able to produce AFS-ready output |
| VAT records retention | VAT Act s55 | All tax-relevant journals retained minimum 5 years |
| SARS-compatible account mapping | Income Tax Act | Tax treatment metadata on all accounts |
| PFMA compliance (public entities) | PFMA s40 | Additional controls and reporting for public-entity clients |
| POPIA data governance | POPIA s19 | Audit log access controls and PII handling in account ownership data |

### 2.5 Multi-Framework Handling

Where CompanyOS serves entities across jurisdictions (e.g., a South African parent with a Zimbabwean subsidiary), each company record carries its own framework declaration. Consolidated reporting defaults to the parent entity's declared framework. Translation adjustments between frameworks are flagged for manual review and are never automatically adjusted by the system.

---

## 3. Account Code Architecture

### 3.1 Code Structure Definition

The CompanyOS account code follows a structured segmented format:

```
NNNN[-SS][-DDD]
```

| Segment | Name | Length | Required | Example |
|---------|------|--------|----------|---------|
| `NNNN` | Base account number | 4 digits | Always | `1100` |
| `SS` | Sub-account suffix | 2 digits | Optional | `01` |
| `DDD` | Dimension suffix | 3 characters | Optional | `CPT` |

**Full examples:**

| Code | Meaning |
|------|---------|
| `1100` | Trade debtors control — base account |
| `1100-01` | Trade debtors — sub-account 01 (e.g., domestic) |
| `1100-01-CPT` | Trade debtors, sub-account 01, Cape Town branch |
| `6100` | Salary expense — base account |
| `6100-CPT` | Salary expense — Cape Town cost centre |

### 3.2 Base Range Definitions

| Range | Category | Protected | Notes |
|-------|----------|-----------|-------|
| 1000–1999 | Assets | Partial | 1000–1099 reserved for system header accounts |
| 2000–2999 | Liabilities | Partial | 2000–2099 reserved for system header accounts |
| 3000–3999 | Equity | High | 3000–3099 fully protected; regulatory equity accounts |
| 4000–4999 | Revenue | Standard | 4900–4999 reserved for contra revenue |
| 5000–5999 | Cost of Goods Sold | Standard | Applies to trading and manufacturing entities |
| 6000–6999 | Operating Expenses | Standard | Broadest range; majority of user extensions here |
| 7000–7999 | Other Income / Expenses | Standard | Investment income, finance costs, FX gains/losses |
| 8000–8899 | Income Tax | High | 8000–8099 protected; current and deferred tax |
| 8900–8999 | System Reserved | Fully protected | Internal system accounts; never user-visible |
| 9000–9999 | Memorandum / Statistical | Optional | Off-balance sheet; informational only |

### 3.3 Code Validation Rules

The following rules are enforced at the database constraint and API validation layers:

```
RULE 1: Base code must be numeric, exactly 4 digits.
RULE 2: Base code must fall within a defined major category range.
RULE 3: Base code category must match the account's declared major_category.
  → 1xxx accounts must have major_category = ASSET
  → 2xxx accounts must have major_category = LIABILITY
  → 3xxx accounts must have major_category = EQUITY
  → 4xxx accounts must have major_category = REVENUE
  → 5xxx accounts must have major_category = COGS
  → 6xxx accounts must have major_category = OPEX
  → 7xxx accounts must have major_category = OTHER_INCOME_EXPENSE
  → 8xxx accounts must have major_category = INCOME_TAX
RULE 4: Protected ranges may not be created by user action.
  Protected ranges require system_managed = true.
RULE 5: Sub-account suffix, if present, must be 2 numeric digits (01–99).
RULE 6: Dimension suffix, if present, must match an active dimension value in the company's dimension table.
RULE 7: Full code (NNNN-SS-DDD) must be unique within company scope.
RULE 8: A sub-account code (NNNN-SS) must have a corresponding parent base account (NNNN).
RULE 9: A dimension-suffixed code must have a corresponding parent base or sub-account.
RULE 10: Codes in fully protected ranges may not be modified, renamed, or deactivated by any user action; only by system migration with approval log.
```

### 3.4 Code Generation Rules

| Account Source | Code Assignment Method |
|---------------|----------------------|
| System catalog seed | Pre-assigned in catalog; inherited on instantiation |
| User-created base account | User-specified, validated against rules above |
| User-created sub-account | User-specified suffix; parent must exist |
| Dimension-suffixed account | System-generated from parent code + dimension selection |
| Catalog extension | Must fall in open ranges; cannot conflict with protected ranges |

### 3.5 Dimension Types Supported

| Dimension | Code Format | Example Values |
|-----------|------------|----------------|
| Cost centre | 3-char alpha | CPT, JHB, DBN |
| Branch | 3-char alpha | 001, 002, HO |
| Project | 3-char alphanumeric | P01, MFG, INF |
| Currency | 3-char ISO 4217 | ZAR, USD, EUR |

Dimension values are defined in a `gl_dimensions` table per company. Only active dimension values may be used as suffixes.

---

## 4. Data Model Specification

### 4.1 Core Tables

#### `gl_accounts` — Company Chart of Accounts

```sql
gl_accounts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              UUID NOT NULL REFERENCES companies(id),
  catalog_account_id      UUID REFERENCES coa_catalog_accounts(id),  -- null if user-created

  -- Identity
  code                    VARCHAR(12) NOT NULL,  -- full code NNNN[-SS][-DDD]
  base_code               VARCHAR(4) NOT NULL,   -- always 4-digit base
  sub_code                VARCHAR(2),            -- optional 2-digit sub
  dimension_code          VARCHAR(3),            -- optional dimension suffix
  name                    VARCHAR(200) NOT NULL,
  description             TEXT,

  -- Classification
  major_category          ENUM('ASSET','LIABILITY','EQUITY','REVENUE','COGS','OPEX',
                               'OTHER_INCOME_EXPENSE','INCOME_TAX','MEMORANDUM') NOT NULL,
  account_type_id         UUID NOT NULL REFERENCES account_types(id),
  account_subtype_id      UUID REFERENCES account_subtypes(id),
  normal_balance          ENUM('DEBIT','CREDIT') NOT NULL,
  fs_placement_id         UUID REFERENCES fs_placements(id),

  -- Hierarchy
  parent_id               UUID REFERENCES gl_accounts(id),
  is_header               BOOLEAN NOT NULL DEFAULT FALSE,
  level                   SMALLINT NOT NULL,  -- 1 = root, max 6
  full_path               VARCHAR(500),       -- materialised path e.g. /1000/1100/1110/

  -- Governance
  sensitivity_tier        ENUM('T1','T2','T3') NOT NULL DEFAULT 'T3',
  account_owner_id        UUID REFERENCES users(id),
  system_managed          BOOLEAN NOT NULL DEFAULT FALSE,
  is_regulatory           BOOLEAN NOT NULL DEFAULT FALSE,
  is_contra               BOOLEAN NOT NULL DEFAULT FALSE,
  contra_of_account_id    UUID REFERENCES gl_accounts(id),

  -- Lifecycle
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  is_dormant              BOOLEAN NOT NULL DEFAULT FALSE,
  dormant_since           DATE,
  sunset_candidate        BOOLEAN NOT NULL DEFAULT FALSE,
  sunset_review_date      DATE,

  -- Operational flags
  budget_enabled          BOOLEAN NOT NULL DEFAULT FALSE,
  reconciliation_required BOOLEAN NOT NULL DEFAULT FALSE,
  reconciliation_cadence  ENUM('DAILY','WEEKLY','MONTHLY','QUARTERLY','ANNUALLY'),
  tax_code_id             UUID REFERENCES tax_codes(id),

  -- Reporting framework alignment
  reporting_framework     ENUM('IFRS_FULL','IFRS_SME','SA_GAAP_LEGACY') NOT NULL,
  oci_classification      BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE if OCI account under IFRS

  -- Audit
  created_by              UUID NOT NULL REFERENCES users(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  modified_by             UUID REFERENCES users(id),
  modified_at             TIMESTAMPTZ,

  CONSTRAINT uq_company_code UNIQUE (company_id, code),
  CONSTRAINT chk_header_no_parent_range
    CHECK (is_header = TRUE OR parent_id IS NOT NULL OR level = 1),
  CONSTRAINT chk_level_max
    CHECK (level BETWEEN 1 AND 6),
  CONSTRAINT chk_base_code_numeric
    CHECK (base_code ~ '^\d{4}$')
)
```

#### `coa_catalog_accounts` — Master Reference Catalog (Read-Only)

```sql
coa_catalog_accounts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                    VARCHAR(12) NOT NULL UNIQUE,
  base_code               VARCHAR(4) NOT NULL,
  name                    VARCHAR(200) NOT NULL,
  description             TEXT,

  major_category          ENUM('ASSET','LIABILITY','EQUITY','REVENUE','COGS','OPEX',
                               'OTHER_INCOME_EXPENSE','INCOME_TAX','MEMORANDUM') NOT NULL,
  account_type_id         UUID NOT NULL REFERENCES account_types(id),
  account_subtype_id      UUID REFERENCES account_subtypes(id),
  normal_balance          ENUM('DEBIT','CREDIT') NOT NULL,
  fs_placement_id         UUID REFERENCES fs_placements(id),

  parent_catalog_id       UUID REFERENCES coa_catalog_accounts(id),
  is_header               BOOLEAN NOT NULL DEFAULT FALSE,
  level                   SMALLINT NOT NULL,
  full_path               VARCHAR(500),

  -- Classification flags
  is_core                 BOOLEAN NOT NULL DEFAULT FALSE,
  is_industry_specific    BOOLEAN NOT NULL DEFAULT FALSE,
  is_optional             BOOLEAN NOT NULL DEFAULT FALSE,
  is_regulatory           BOOLEAN NOT NULL DEFAULT FALSE,
  is_system_protected     BOOLEAN NOT NULL DEFAULT FALSE,

  sensitivity_tier        ENUM('T1','T2','T3') NOT NULL DEFAULT 'T3',
  default_reconciliation_cadence ENUM('DAILY','WEEKLY','MONTHLY','QUARTERLY','ANNUALLY'),
  default_owner_role      VARCHAR(100),

  -- Template membership is managed via coa_template_accounts
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  catalog_version         VARCHAR(20) NOT NULL DEFAULT '1.0',

  CONSTRAINT chk_base_code_numeric
    CHECK (base_code ~ '^\d{4}$')
)
```

#### `coa_templates` — Template Definitions

```sql
coa_templates (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                    VARCHAR(50) NOT NULL UNIQUE,
  name                    VARCHAR(200) NOT NULL,
  description             TEXT,
  entity_types            TEXT[],     -- e.g. ['PTY_LTD','TRUST']
  industries              TEXT[],     -- e.g. ['AGRICULTURE','MANUFACTURING']
  reporting_frameworks    TEXT[],     -- e.g. ['IFRS_FULL','IFRS_SME']
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order              SMALLINT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
)
```

#### `coa_template_accounts` — Template Account Membership

```sql
coa_template_accounts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id             UUID NOT NULL REFERENCES coa_templates(id),
  catalog_account_id      UUID NOT NULL REFERENCES coa_catalog_accounts(id),
  inclusion_reason        ENUM('CORE','RECOMMENDED','OPTIONAL','REGULATORY') NOT NULL,
  module_dependency       VARCHAR(50),   -- e.g. 'PAYROLL', 'INVENTORY', 'TAX'
  sort_order              SMALLINT,

  CONSTRAINT uq_template_account UNIQUE (template_id, catalog_account_id)
)
```

#### `account_types` and `account_subtypes` — Lookup Tables

```sql
account_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(50) NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  category    ENUM('ASSET','LIABILITY','EQUITY','REVENUE','COGS','OPEX',
                   'OTHER_INCOME_EXPENSE','INCOME_TAX','MEMORANDUM') NOT NULL,
  sort_order  SMALLINT
)

account_subtypes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_type_id UUID NOT NULL REFERENCES account_types(id),
  code            VARCHAR(50) NOT NULL UNIQUE,
  name            VARCHAR(100) NOT NULL,
  sort_order      SMALLINT
)
```

#### `fs_placements` — Financial Statement Mapping

```sql
fs_placements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                VARCHAR(50) NOT NULL UNIQUE,
  statement           ENUM('BALANCE_SHEET','INCOME_STATEMENT','CASH_FLOW',
                           'CHANGES_IN_EQUITY','NOTES') NOT NULL,
  section             VARCHAR(100) NOT NULL,   -- e.g. 'Current Assets'
  subsection          VARCHAR(100),            -- e.g. 'Trade and Other Receivables'
  ias1_line_item      VARCHAR(200),            -- IAS 1 minimum line item reference
  sort_order          SMALLINT,
  reporting_framework ENUM('IFRS_FULL','IFRS_SME','SA_GAAP_LEGACY') NOT NULL
)
```

#### `gl_account_access_overrides` — Named-User Access for T1

```sql
gl_account_access_overrides (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      UUID NOT NULL REFERENCES gl_accounts(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  access_type     ENUM('POST','VIEW','APPROVE','RECONCILE') NOT NULL,
  granted_by      UUID NOT NULL REFERENCES users(id),
  granted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ,
  justification   TEXT NOT NULL,

  CONSTRAINT uq_account_user_access UNIQUE (account_id, user_id, access_type)
)
```

#### `gl_dimensions` — Dimension Values

```sql
gl_dimensions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id),
  dimension_type  ENUM('COST_CENTRE','BRANCH','PROJECT','CURRENCY') NOT NULL,
  code            VARCHAR(3) NOT NULL,
  name            VARCHAR(100) NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_company_dimension UNIQUE (company_id, dimension_type, code)
)
```

---

## 5. Sensitivity Tier Operational Definitions

### 5.1 Tier Definitions

Sensitivity tiers are not labels — they are control activation triggers. Each tier activates a specific, non-negotiable set of system controls.

#### Tier 1 — Critical Sensitivity

**Definition:** Accounts that directly affect statutory financial reporting, regulatory capital requirements, tax obligations, or external audit sign-off. Errors or unauthorised changes to T1 accounts have material consequence on financial statements and regulatory compliance.

**Examples:** Retained earnings (3500), current tax payable (8100), deferred tax liability (8200), intercompany loan accounts (1800–1899), share capital (3000), statutory reserves (3100–3199).

**System controls activated:**

| Control | Specification |
|---------|---------------|
| Named-user posting restriction | Only users listed in `gl_account_access_overrides` may post to this account. No role-based access is sufficient alone. |
| Dual authorisation on journals | All journals touching T1 accounts require two distinct approvers. Preparer is excluded from approval. |
| Finance Controller sign-off threshold | Any journal above ZAR 50,000 (configurable) touching a T1 account requires Finance Controller approval as a third level. |
| Quarterly balance sign-off | System generates a mandatory sign-off task for the account owner at each quarter end. Not closeable without completion. |
| Audit committee visibility | T1 account balances and journal activity are included in the automatically generated audit committee pack. |
| Change request mandatory | Any structural change to a T1 account requires a formal change request and a minimum two-approver approval chain. |
| Deletion permanently blocked | T1 accounts may be deactivated with approval but never deleted from the system. |

#### Tier 2 — Elevated Sensitivity

**Definition:** Accounts with material balance risk, sub-ledger reconciliation dependencies, or significant operational control requirements. Errors are material but typically detectable within the period.

**Examples:** Trade debtors control (1100), trade creditors control (2100), payroll liabilities (2300–2399), provisions (2600–2699), bank accounts (1010–1099), inventory (1200–1299).

**System controls activated:**

| Control | Specification |
|---------|---------------|
| Owner-only posting | Only the designated account owner or users with explicit override may post. |
| Monthly reconciliation mandatory | System blocks period close for any T2 account with an outstanding reconciliation. |
| Manager-level approval on material entries | Journals above the company's defined materiality threshold (default ZAR 10,000, configurable) require manager approval. |
| Sub-ledger agreement check | T2 control accounts must pass a sub-ledger agreement check before period close is permitted. |
| Dormancy alert at 60 days | Automatically flagged for owner review if no movement in 60 days. |

#### Tier 3 — Standard

**Definition:** All remaining operational accounts. Errors are typically immaterial individually and are caught through normal review processes.

**System controls activated:**

| Control | Specification |
|---------|---------------|
| Standard role-based posting access | Any user with `accounting:journal:post` permission may post to T3 accounts. |
| Reconciliation per declared cadence | Reconciliation required per account's declared cadence but does not block close unless cadence is monthly. |
| Dormancy alert at 90 days | Automatically flagged for owner review if no movement in 90 days. |
| Standard change request | Structural changes may be submitted by any account owner; single approver sufficient. |

### 5.2 Tier Assignment Rules

- All catalog-seeded accounts carry a default tier from the catalog. This is the minimum tier and may only be elevated, never lowered, without Finance Controller approval.
- User-created accounts default to T3 unless the base code falls in a protected range, in which case the system assigns T1 automatically.
- Tier changes are audited as account master changes with full before/after capture.

---

## 6. Accounting Permission Model and SoD Policy

### 6.1 Accounting-Specific Permissions

The following permissions exist in the system as granular, independently assignable rights. They are separate from general application RBAC.

| Permission Code | Description |
|----------------|-------------|
| `accounting:coa:view` | View the chart of accounts and account metadata |
| `accounting:coa:configure` | Run the COA setup wizard; activate accounts from catalog |
| `accounting:account:create` | Create user-defined accounts in open code ranges |
| `accounting:account:modify` | Modify non-protected account metadata |
| `accounting:account:change_request` | Submit a change request for a protected or T1/T2 account |
| `accounting:account:approve_change` | Approve or reject a COA change request |
| `accounting:journal:prepare` | Create and submit draft journals |
| `accounting:journal:approve` | Approve submitted journals within threshold |
| `accounting:journal:approve_override` | Approve journals above standard threshold |
| `accounting:journal:post` | Post approved journals to the ledger |
| `accounting:period:close` | Initiate period close workflow |
| `accounting:period:unlock` | Unlock a closed period (requires justification) |
| `accounting:reconciliation:prepare` | Prepare a reconciliation for an owned account |
| `accounting:reconciliation:review` | Review and approve a prepared reconciliation |
| `accounting:audit:view` | View the account master and journal audit logs |
| `accounting:audit:export` | Export audit log bundles |
| `accounting:sensitivity:assign` | Assign or change sensitivity tiers |
| `accounting:owner:assign` | Assign account ownership |

### 6.2 Standard Role Definitions

| Role | Permissions Assigned | SoD Exclusions |
|------|---------------------|----------------|
| Account Owner | `coa:view`, `journal:prepare`, `reconciliation:prepare`, `account:change_request` | Cannot approve own change requests; cannot approve own journals |
| Journal Preparer | `coa:view`, `journal:prepare` | Cannot approve journals they prepared; cannot post to T1 without named access |
| Journal Approver | `coa:view`, `journal:approve` | Cannot prepare journals they approve; cannot reconcile accounts where they approved journals |
| COA Administrator | `coa:configure`, `account:create`, `account:modify`, `account:change_request`, `account:approve_change`, `owner:assign` | Cannot post operational journals; cannot approve journal entries |
| Finance Manager | All above except `audit:export` and `period:unlock` | Cannot prepare and approve the same journal |
| Finance Controller | All permissions | All actions on T1 accounts are audit-logged with mandatory justification |
| External Auditor | `coa:view`, `audit:view`, `audit:export` | No write access of any kind |
| System Administrator | Technical platform access | Explicitly excluded from all journal posting permissions |

### 6.3 SoD Enforcement Rules

SoD rules are stored as declarative policies in a `sod_rules` table, not as scattered service-layer conditionals.

```sql
sod_rules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code         VARCHAR(100) NOT NULL UNIQUE,
  description       TEXT NOT NULL,
  actor_permission  VARCHAR(100) NOT NULL,   -- permission the actor holds
  blocked_action    VARCHAR(100) NOT NULL,   -- permission they cannot also exercise on same entity
  entity_scope      ENUM('SAME_JOURNAL','SAME_ACCOUNT','SAME_PERIOD','GLOBAL'),
  is_active         BOOLEAN NOT NULL DEFAULT TRUE
)
```

**Mandatory SoD rules loaded at system seed:**

| Rule Code | Description |
|-----------|-------------|
| `SOD-001` | Journal preparer cannot approve the same journal |
| `SOD-002` | Journal approver cannot prepare the same journal |
| `SOD-003` | Account creator cannot post to that account in the same period |
| `SOD-004` | Account modifier cannot approve change requests on the same account |
| `SOD-005` | Reconciliation preparer cannot be the same person as journal approver for the same account-period |
| `SOD-006` | T1 account posting requires named-user override; role alone is insufficient |
| `SOD-007` | Period close initiator cannot be the same person as the Finance Controller approval on close |
| `SOD-008` | COA Administrator cannot post operational journals |
| `SOD-009` | System Administrator is excluded from all journal approval and posting |

### 6.4 Threshold Configuration

| Threshold Name | Default Value | Configurable By | Applies To |
|---------------|--------------|-----------------|------------|
| `journal_standard_approval_threshold` | ZAR 10,000 | Finance Controller | Single-approver journals below this value |
| `journal_elevated_approval_threshold` | ZAR 50,000 | Finance Controller | Requires second approver above this value |
| `journal_controller_approval_threshold` | ZAR 100,000 | Company Administrator | Requires Finance Controller sign-off |
| `t1_journal_threshold` | ZAR 0 | System (not configurable) | All T1 journals require dual approval regardless of amount |

---

## 7. COA Activation Wizard — Full Specification

### 7.1 Wizard Overview

The COA activation wizard is the primary interface through which a company configures its chart of accounts. It is a guided, multi-step flow that produces a governed company COA by selectively instantiating accounts from the master catalog.

The wizard is accessible at: `/accounting/chart-of-accounts/setup`

Access requires: `accounting:coa:configure`

The wizard may only be run once per company without Finance Controller override. Re-runs require an explicit `coa_setup_rerun` permission and produce a versioned re-activation record.

### 7.2 Step 0 — Business Profile Capture

This step is mandatory and precedes all others. Its outputs drive all subsequent step defaults.

**Fields captured:**

| Field | Type | Options | Drives |
|-------|------|---------|--------|
| Entity type | Single select | Sole Trader, Partnership, Pty Ltd, CC, Trust, NPO, Public Entity | Template pre-selection, regulatory account inclusion |
| Primary industry | Single select | Agriculture, Manufacturing, Retail, Services, Construction, Financial Services, Healthcare, Education, Mining, Other | Template pre-selection, industry-specific account inclusion |
| Sub-industry | Conditional single select | Dependent on primary industry | Refines template selection |
| VAT registration | Yes / No | — | VAT account module activation |
| PAYE registered | Yes / No | — | Payroll module activation |
| Functional currency | Currency selector | ISO 4217 list | Multi-currency account activation |
| Additional reporting currencies | Multi-select | ISO 4217 list | Translation account activation |
| Consolidates subsidiaries | Yes / No | — | Intercompany account inclusion |
| Multiple cost centres / branches | Yes / No | — | Dimension setup prompt |
| Regulatory regime | Multi-select | IFRS Full, IFRS for SMEs, PFMA, Other | Regulatory account inclusion, sensitivity tier defaults |
| Accounting framework | Single select | IFRS Full, IFRS for SMEs | Statement structure and OCI classification |

**Template recommendation algorithm:**

```
IF entity_type IN ['PTY_LTD', 'CC'] AND industry = 'MANUFACTURING'
  → recommend template: 'MANUFACTURING_STANDARD'
ELIF entity_type = 'NPO'
  → recommend template: 'NPO_STANDARD'
ELIF entity_type IN ['SOLE_TRADER', 'PARTNERSHIP'] AND employees < 10
  → recommend template: 'SME_LEAN'
ELIF regulatory_regime includes 'PFMA'
  → recommend template: 'PUBLIC_ENTITY_PFMA'
DEFAULT
  → recommend template: 'FULL_INTEGRATED'
```

### 7.3 Step 1 — Base Template Selection

Displays the algorithmically recommended template with a clear explanation of why it was recommended based on Step 0 inputs. User may accept the recommendation or select an alternative.

**Available templates:**

| Template Code | Name | Typical Account Count | Suitable For |
|--------------|------|----------------------|--------------|
| `SME_LEAN` | SME / Lean Chart | ~80 accounts | Small service or trading businesses |
| `FULL_INTEGRATED` | Full Integrated Chart | ~350 accounts | Medium-to-large general entities |
| `MANUFACTURING_STANDARD` | Manufacturing | ~280 accounts | Production and COGS-intensive entities |
| `AGRICULTURE_PRODUCE` | Agriculture / Produce | ~220 accounts | Farming, agri-processing |
| `NPO_STANDARD` | Non-Profit Organisation | ~150 accounts | NPOs, section 21 companies |
| `PUBLIC_ENTITY_PFMA` | Public Entity (PFMA) | ~300 accounts | Government entities, Schedule 3 |
| `FINANCIAL_SERVICES` | Financial Services | ~180 accounts | Banks, insurers, investment entities |

Each template selection displays:
- total accounts in template
- breakdown by inclusion reason (core / recommended / optional / regulatory)
- module dependencies

### 7.4 Step 2 — Activation Mode

**Options:**

| Mode | Description | Recommended For |
|------|-------------|-----------------|
| Core only | Activates only accounts marked `is_core = TRUE` in the template | Minimal viable setup; not recommended for reporting entities |
| Core + Recommended (default) | Activates core plus recommended optional accounts | Most entities; pre-selected by wizard |
| Full reference chart | Activates all accounts in the selected template | Entities with complex operations or multi-module use |
| Custom | User manually controls inclusion via Step 4 refinement | Advanced users only |

### 7.5 Step 3 — Module Toggles

Modules drive additional account inclusion beyond the base template. The system resolves module dependencies automatically.

| Module | Accounts Added | Dependency |
|--------|---------------|------------|
| Accounts Payable | Creditors control, accruals, GRN clearing | None |
| Accounts Receivable | Debtors control, provision for bad debt, deposits | None |
| Payroll | PAYE payable, UIF payable, SDL payable, net pay clearing, pension fund payable | Requires AP |
| VAT | VAT input, VAT output, VAT control, VAT suspense | None |
| Inventory | Stock on hand, WIP, finished goods, stock write-off | Requires COGS range |
| Fixed Assets | Asset cost, accumulated depreciation, disposal accounts | None |
| Treasury | Money market, call accounts, FX forward contracts | Requires bank accounts |
| Intercompany | Intercompany loans, intercompany trading, elimination accounts | None |
| Project Costing | Project cost allocation, project revenue recognition | Requires dimension setup |

**Dependency resolution:** Where toggling a module on would require accounts that are not yet selected, the wizard automatically flags the dependency and offers to add the prerequisite accounts. The user cannot enable a module without its dependencies being resolved.

### 7.6 Step 4 — Preview and Refinement

Before any accounts are created, the wizard displays a full preview:

**Preview displays:**
- total accounts to be created
- breakdown: header accounts vs. posting accounts
- breakdown: core / recommended / optional / regulatory
- accounts with no owner assigned (highlighted)
- accounts that are regulatory-required but currently deselected (warning)
- accounts with unresolved module dependencies (error — blocks proceed)
- accounts that will be T1 sensitivity tier (listed for review)
- estimated hierarchy depth and structure

**User actions at preview:**
- expand/collapse branches to review hierarchy
- exclude optional account branches before commit
- assign preliminary account owners
- accept or reject module dependency resolutions

**Pre-instantiation validation checks run at this step:**
- no duplicate codes in selected set
- all selected accounts have a valid parent in the selected set or in system headers
- no orphaned sub-accounts (sub-account selected without base account)
- all regulatory-required accounts included or explicitly acknowledged as excluded
- no circular parent references
- category vs. code range consistency for all selected accounts

Validation errors block the Proceed button. Warnings allow proceeding with acknowledgement.

### 7.7 Step 5 — Instantiation

Instantiation is a single atomic database transaction. It is all-or-nothing.

**Instantiation sequence:**
1. Begin transaction
2. Create root header accounts in order of level (level 1 before level 2, etc.)
3. Create posting accounts under their parents
4. Set `catalog_account_id` reference on each created account
5. Copy all metadata (type, subtype, normal balance, sensitivity tier, fs_placement, reconciliation cadence)
6. Mark catalog-derived protected accounts as `system_managed = TRUE`
7. Create initial `gl_account_audit_log` entry for each account with actor = `SYSTEM:WIZARD` and event = `INSTANTIATED`
8. Create `coa_setup_event` record capturing: company_id, user_id, template_id, activation_mode, modules_selected, total_accounts_created, timestamp
9. Commit transaction

**On failure:** Full rollback. No partial COA is permitted. The wizard returns to Step 4 with a specific error message identifying the failed account and constraint.

**Post-instantiation integrity check (run after commit):**
- confirm all accounts have resolved parent paths
- confirm no orphaned accounts exist
- confirm account count matches the preview count
- confirm all T1 accounts have been created with correct tier
- generate integrity check report stored in `coa_setup_events`

---

## 8. Opening Balance Migration Module

### 8.1 Purpose

The opening balance migration module provides a structured, auditable process for establishing starting balances when a company migrates to CompanyOS from a prior system or begins using CompanyOS partway through a financial year.

This module is a mandatory gate before the first period can be closed.

### 8.2 Module Components

#### 8.2.1 Trial Balance Import

**Import interface:** `/accounting/opening-balances/import`

**Supported import formats:**
- CSV template (downloadable from the system, pre-mapped to the company's activated COA)
- Direct manual entry via the UI (for small charts)

**CSV template structure:**

```
account_code, account_name, debit_balance, credit_balance, as_at_date
1100, Trade Debtors, 250000.00, , 2025-02-28
2100, Trade Creditors, , 180000.00, 2025-02-28
```

**Validation rules on import:**

| Rule | Description | Error Type |
|------|-------------|------------|
| `OB-V001` | Total debits must equal total credits | Blocking |
| `OB-V002` | All account codes must exist in the company's activated COA | Blocking |
| `OB-V003` | Posting accounts only — no balances on header accounts | Blocking |
| `OB-V004` | Normal balance direction must be consistent with account type | Warning |
| `OB-V005` | T1 accounts with zero opening balance must be explicitly acknowledged | Warning |
| `OB-V006` | Debit/credit column may not both be populated for the same account | Blocking |
| `OB-V007` | as_at_date must be consistent across all rows | Blocking |

#### 8.2.2 Comparative Period Import

For entities with a comparative period requirement (mandatory under IAS 1), a second import captures the prior-year closing trial balance.

The comparative period trial balance uses the same format and validation rules. It is stored separately and is never merged with current-period balances. It is used exclusively for financial statement comparative column rendering.

#### 8.2.3 Opening Balance Journal

After validation, the system generates a system-protected opening balance journal entry:

```
Journal Type:       OPENING_BALANCE
Reference:          OB-{COMPANY_CODE}-{YYYYMM}
Date:               as_at_date from import
Description:        System: Opening balance migration — {as_at_date}
Reversible:         FALSE (permanently locked)
Approval Required:  TRUE (Finance Controller sign-off mandatory)
Audit Lock:         TRUE (cannot be modified after approval)
```

Each imported account with a non-zero balance generates one journal line (debit or credit as appropriate).

**Retained earnings derivation:** If the import includes P&L accounts from a prior period (used for mid-year migrations), the system automatically calculates the net P&L position and posts it as an opening retained earnings adjustment to account 3500, with a system-generated reference and full explanatory description.

#### 8.2.4 Migration Sign-Off Workflow

1. Finance prepares the trial balance import
2. System validates and generates the draft opening balance journal
3. Finance Controller reviews the journal line by line against the source trial balance
4. Finance Controller approves the opening balance journal — this action locks it permanently
5. System records migration completion in `coa_setup_events` as a `MIGRATION_COMPLETE` event
6. The opening balance import interface is disabled for the company from this point forward (re-enable requires `coa_setup_rerun` permission and creates a new versioned event)

---

## 9. Reconciliation Control Object Specification

### 9.1 Reconciliation as a Control Object

Reconciliation is not a report or a dashboard view — it is a structured internal control artifact with its own lifecycle, ownership, and sign-off requirements. Each reconciliation instance is an auditable object that provides evidence that a control was performed.

### 9.2 Reconciliation Instance Schema

```sql
gl_reconciliations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              UUID NOT NULL REFERENCES companies(id),
  account_id              UUID NOT NULL REFERENCES gl_accounts(id),
  period_id               UUID NOT NULL REFERENCES accounting_periods(id),

  -- Balances
  opening_balance         DECIMAL(20,2) NOT NULL,
  closing_balance_gl      DECIMAL(20,2) NOT NULL,
  closing_balance_source  DECIMAL(20,2),   -- sub-ledger, bank statement, or external
  variance                DECIMAL(20,2) GENERATED ALWAYS AS
                          (closing_balance_gl - closing_balance_source) STORED,

  -- Lifecycle
  status                  ENUM('NOT_STARTED','IN_PROGRESS','PREPARED',
                               'UNDER_REVIEW','REVIEWED','SIGNED_OFF') NOT NULL DEFAULT 'NOT_STARTED',
  prepared_by             UUID REFERENCES users(id),
  prepared_at             TIMESTAMPTZ,
  reviewed_by             UUID REFERENCES users(id),
  reviewed_at             TIMESTAMPTZ,
  signed_off_by           UUID REFERENCES users(id),
  signed_off_at           TIMESTAMPTZ,

  -- Notes
  preparer_notes          TEXT,
  reviewer_notes          TEXT,
  unreconciled_items_count INTEGER NOT NULL DEFAULT 0,

  -- Timing
  due_date                DATE NOT NULL,
  overdue                 BOOLEAN GENERATED ALWAYS AS (CURRENT_DATE > due_date AND status != 'SIGNED_OFF') STORED,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_account_period_recon UNIQUE (account_id, period_id)
)
```

### 9.3 Reconciliation Item Schema

```sql
gl_reconciliation_items (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_id       UUID NOT NULL REFERENCES gl_reconciliations(id),
  item_type               ENUM('UNRECONCILED_GL','UNRECONCILED_SOURCE',
                               'TIMING_DIFFERENCE','ERROR','ADJUSTMENT') NOT NULL,
  description             TEXT NOT NULL,
  amount                  DECIMAL(20,2) NOT NULL,
  gl_journal_line_id      UUID REFERENCES journal_lines(id),
  source_reference        VARCHAR(200),
  resolution_status       ENUM('OPEN','RESOLVED','ESCALATED') NOT NULL DEFAULT 'OPEN',
  resolved_by             UUID REFERENCES users(id),
  resolved_at             TIMESTAMPTZ,
  resolution_notes        TEXT
)
```

### 9.4 Reconciliation Types

| Type | Description | Source of Truth | Required For |
|------|-------------|----------------|--------------|
| `BALANCE_RECON` | GL balance vs. sub-ledger or external statement | Sub-ledger or bank statement | All T1 and T2 accounts |
| `TRANSACTION_RECON` | Individual GL entries matched to source documents | Source document register | Bank accounts, intercompany |
| `COMPLETENESS_RECON` | All expected transactions posted and accounted for | Payroll run, accrual schedule | Payroll, tax, accruals |
| `INTERCOMPANY_RECON` | Mirror-account agreement between entities | Partner entity GL | All intercompany accounts |

### 9.5 Reconciliation Lifecycle Rules

- A reconciliation in `NOT_STARTED` status is automatically created by the system at the start of each period for all accounts where `reconciliation_required = TRUE`.
- Preparer and reviewer must be different individuals (SoD rule `SOD-005`).
- A T1 or T2 account reconciliation in status other than `SIGNED_OFF` at period close date blocks period close for that account's owner.
- Unreconciled items older than 60 days (T2) or 30 days (T1) are automatically escalated and visible to the Finance Controller.
- A signed-off reconciliation is immutable. Corrections require a new reconciliation instance for the same period marked as a restatement.

---

## 10. Period Close Architecture

### 10.1 Close Gate Model

CompanyOS implements a four-gate close model aligned with standard finance operations practice:

| Gate | Name | Prerequisite | Unlocks |
|------|------|-------------|---------|
| Gate 1 | Sub-ledger Close | All AP, AR, payroll, and inventory runs posted and reconciled | Ability to proceed to Gate 2 |
| Gate 2 | GL Close | All T2 and T1 reconciliations signed off; all accruals posted; all period journals approved | Ability to generate trial balance and management accounts |
| Gate 3 | Management Reporting Close | Management accounts reviewed and approved by Finance Manager | Ability to proceed to statutory reporting |
| Gate 4 | Statutory Close | External audit or review complete; AFS approved | Period permanently locked |

### 10.2 Close Checklist Schema

```sql
period_close_tasks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id),
  period_id           UUID NOT NULL REFERENCES accounting_periods(id),
  gate                SMALLINT NOT NULL CHECK (gate BETWEEN 1 AND 4),
  task_code           VARCHAR(100) NOT NULL,
  task_name           VARCHAR(200) NOT NULL,
  description         TEXT,
  account_id          UUID REFERENCES gl_accounts(id),     -- if account-specific
  assigned_to         UUID REFERENCES users(id),
  due_date            DATE NOT NULL,
  status              ENUM('PENDING','IN_PROGRESS','COMPLETE','BLOCKED','WAIVED') NOT NULL DEFAULT 'PENDING',
  completed_by        UUID REFERENCES users(id),
  completed_at        TIMESTAMPTZ,
  waived_by           UUID REFERENCES users(id),
  waive_justification TEXT,
  is_mandatory        BOOLEAN NOT NULL DEFAULT TRUE
)
```

### 10.3 Automatically Generated Close Tasks

The system generates close tasks automatically at period start based on account metadata:

| Trigger | Task Generated | Gate | Assigned To |
|---------|---------------|------|-------------|
| Account has `reconciliation_required = TRUE` | Prepare and sign off reconciliation | 2 | Account owner |
| Account is T1 | T1 balance review and owner sign-off | 2 | Account owner |
| Account has accrual pending | Post or reverse accrual | 1 | Journal preparer |
| Module: Payroll active | Confirm payroll journals posted | 1 | Payroll administrator |
| Module: VAT active | Confirm VAT return reconciled | 2 | Tax administrator |
| All accounts | Trial balance review | 3 | Finance Manager |

### 10.4 Accrual Journal Type

Accruals are a distinct journal type with automatic reversal scheduling:

```
Journal Type:           ACCRUAL
Reversal Type:          AUTO_REVERSE
Reversal Date:          First business day of following period
Reversal Reference:     Automatically generated: REV-{original_reference}
Approval Required:      TRUE
Audit Trail:            Full, including reversal linkage
```

Accrual journals that have not reversed before the second following period generate a Finance Controller alert.

### 10.5 Posting Cutoff vs. Approval Cutoff

| Cutoff | Definition | Enforced By |
|--------|------------|-------------|
| Transaction cutoff | Date by which all transactions must be dated within the period | Journal date validation |
| Posting cutoff | Date by which all journals must be posted (approved and in ledger) | Period status check at close |
| Approval cutoff | Date by which all submitted journals must be approved | Close checklist task |
| Close gate deadline | Date by which each gate must be completed | Period close calendar |

---

## 11. Tax Treatment Data Model

### 11.1 Tax Code Table

```sql
tax_codes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID,             -- NULL = system-level code; NOT NULL = company override
  code                VARCHAR(20) NOT NULL,
  name                VARCHAR(100) NOT NULL,
  tax_type            ENUM('VAT','INCOME_TAX','DEFERRED_TAX','WITHHOLDING_TAX',
                           'PAYROLL_TAX','EXEMPT','ZERO_RATED','OUT_OF_SCOPE') NOT NULL,
  rate                DECIMAL(7,4),     -- e.g. 15.0000 for 15% VAT
  authority_reference VARCHAR(100),     -- e.g. 'VAT Act s7(1)(a)'
  effective_from      DATE NOT NULL,
  effective_to        DATE,
  is_input            BOOLEAN,          -- TRUE = input tax; FALSE = output tax (VAT only)
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
)
```

### 11.2 Tax Treatment per Account

Each `gl_account` carries a `tax_code_id` foreign key. The tax code determines:

| Tax Type | Behaviour |
|----------|-----------|
| `VAT` (input) | Journal posting generates a VAT input tax line to account 2400 |
| `VAT` (output) | Journal posting generates a VAT output tax line to account 2410 |
| `ZERO_RATED` | No VAT line generated; coded as zero-rated in VAT return |
| `EXEMPT` | No VAT line generated; coded as exempt in VAT return |
| `OUT_OF_SCOPE` | No VAT line generated; excluded from VAT return entirely |
| `INCOME_TAX` | Account balance feeds into current tax computation |
| `DEFERRED_TAX` | Account balance feeds into deferred tax calculation |
| `WITHHOLDING_TAX` | Triggers withholding tax deduction on payment journal |
| `PAYROLL_TAX` | Account linked to payroll tax computation module |

### 11.3 System-Seeded Tax Codes

The following tax codes are seeded at system level and are available to all companies:

| Code | Name | Type | Rate |
|------|------|------|------|
| `VAT_IN_STD` | VAT Input — Standard Rate | VAT (input) | 15.00% |
| `VAT_OUT_STD` | VAT Output — Standard Rate | VAT (output) | 15.00% |
| `VAT_ZERO` | Zero-Rated Supply | ZERO_RATED | 0.00% |
| `VAT_EXEMPT` | Exempt Supply | EXEMPT | N/A |
| `VAT_OOS` | Out of Scope | OUT_OF_SCOPE | N/A |
| `IT_CURRENT` | Current Income Tax | INCOME_TAX | — |
| `IT_DEFERRED` | Deferred Tax | DEFERRED_TAX | — |
| `WHT_STD` | Withholding Tax — Standard | WITHHOLDING_TAX | 15.00% |
| `PAYE` | PAYE | PAYROLL_TAX | — |

Companies may create additional company-specific tax codes for jurisdictional overrides, special rates, or multiple tax registrations.

---

## 12. Audit Log — Evidence-Grade Specification

### 12.1 Design Principles

The audit log must satisfy the following evidence-grade requirements:

- **Append-only:** No `UPDATE` or `DELETE` is permitted on the log table at any database role, including the application service role.
- **Field-level capture:** Every change record captures the specific field changed, the value before the change, and the value after.
- **System actor attribution:** Automated processes (migrations, wizard instantiation, scheduled tasks) are attributed to a named system actor, never to a human user.
- **Tamper detection:** Each row carries a SHA-256 hash of its own content and a reference to the hash of the prior row, forming a chained integrity structure.
- **Retention:** Log records are retained for a minimum of 7 years. Archive strategy: records older than 3 years are moved to cold storage (separate archive table or object storage) but remain queryable.

### 12.2 Account Master Audit Log Schema

```sql
gl_account_audit_log (
  id                  BIGSERIAL PRIMARY KEY,    -- sequential integer for chain integrity
  company_id          UUID NOT NULL,
  account_id          UUID NOT NULL,            -- no FK — log persists if account deleted
  event_type          ENUM('CREATED','MODIFIED','DEACTIVATED','REACTIVATED',
                           'DELETED','PARENT_REASSIGNED','TIER_CHANGED',
                           'OWNER_CHANGED','INSTANTIATED','MIGRATED') NOT NULL,
  field_name          VARCHAR(100),             -- NULL for CREATED/DELETED events
  value_before        TEXT,                     -- JSON-serialised prior value
  value_after         TEXT,                     -- JSON-serialised new value

  -- Actor
  actor_type          ENUM('USER','SYSTEM','MIGRATION','WIZARD') NOT NULL,
  actor_id            UUID,                     -- user_id or NULL for system
  actor_label         VARCHAR(200) NOT NULL,    -- display name for audit reports
  session_id          UUID,
  ip_address          INET,

  -- Timing
  occurred_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Integrity chain
  row_hash            CHAR(64) NOT NULL,        -- SHA-256 of this row's content
  prior_row_hash      CHAR(64),                 -- SHA-256 of the previous row for this account

  -- Justification (mandatory for T1 changes)
  justification       TEXT,
  change_request_id   UUID                      -- link to formal change request if applicable
)
```

**Database constraint:** A trigger enforces `INSERT ONLY` on this table. Any attempt to execute `UPDATE` or `DELETE` raises an exception and is itself logged to a separate `audit_tamper_attempts` table.

### 12.3 Journal Audit Log Schema

```sql
journal_audit_log (
  id                  BIGSERIAL PRIMARY KEY,
  company_id          UUID NOT NULL,
  journal_entry_id    UUID NOT NULL,
  event_type          ENUM('CREATED','SUBMITTED','APPROVED','REJECTED',
                           'POSTED','REVERSED','VOIDED') NOT NULL,
  actor_type          ENUM('USER','SYSTEM') NOT NULL,
  actor_id            UUID,
  actor_label         VARCHAR(200) NOT NULL,
  session_id          UUID,
  ip_address          INET,
  occurred_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes               TEXT,
  row_hash            CHAR(64) NOT NULL,
  prior_row_hash      CHAR(64)
)
```

### 12.4 Audit Export Bundle

The system provides an audit export endpoint that produces a structured bundle for external audit purposes:

**Contents of export bundle:**
- company metadata (name, registration number, reporting framework, period)
- all active accounts with full metadata as at export date
- all account master changes in the specified period
- all journal entries in the specified period with full line detail
- all reconciliation sign-offs in the specified period
- all period close events
- change request log with approval evidence
- SoD exception log (any SoD rule bypasses, with justification)
- hash chain verification report confirming log integrity

Export format: JSON (machine-readable) + CSV (human-readable) per section, packaged as a signed ZIP archive.

Access: `accounting:audit:export` permission required.

---

## 13. Multi-Entity and Consolidation Design Position

### 13.1 Current Phase Position

In the current implementation phase, CompanyOS supports single-entity accounting per company record. Multi-entity consolidation is a declared future capability. However, the following design decisions are made now to prevent consolidation retrofit costs:

### 13.2 Design Decisions Made Now

**Decision 1: COA catalog is global, not company-scoped.** The master catalog is shared infrastructure. All companies instantiate from the same catalog. This ensures that when consolidation is implemented, account code alignment between entities requires no remapping.

**Decision 2: `company_id` scoping is consistent and complete.** Every operational accounting table carries `company_id`. No data is stored without entity attribution. This is the prerequisite for multi-entity queries.

**Decision 3: Intercompany accounts are seeded as a module.** The `INTERCOMPANY` module in the wizard activates paired intercompany accounts (e.g., 1800 — Intercompany Receivable / 2800 — Intercompany Payable). The pairing is recorded in an `intercompany_account_pairs` table so that future elimination logic can operate without manual configuration.

**Decision 4: Functional currency is captured per company.** The `companies` table carries `functional_currency` and `reporting_currency`. Translation difference accounts (account range 3800–3899) are seeded when the two currencies differ.

**Decision 5: No consolidation entries are permitted in this phase.** Consolidation journals, elimination journals, and group-level adjustments are explicitly blocked at the API layer until the multi-entity module is built. Attempts to post to elimination account codes return a descriptive error.

### 13.3 Future Consolidation Design Hooks

The following tables and fields are created in this phase as stubs for future consolidation use:

```sql
-- Stub table: populated when consolidation module is built
intercompany_account_pairs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id_a        UUID NOT NULL REFERENCES companies(id),
  account_id_a        UUID NOT NULL REFERENCES gl_accounts(id),
  company_id_b        UUID NOT NULL REFERENCES companies(id),
  account_id_b        UUID NOT NULL REFERENCES gl_accounts(id),
  pair_type           ENUM('LOAN','TRADING','DIVIDEND','OTHER') NOT NULL,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE
)
```

---

## 14. Governance Workflow Specification

### 14.1 COA Change Request Lifecycle

```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED / REJECTED → EFFECTIVE / WITHDRAWN
```

### 14.2 Change Request Schema

```sql
coa_change_requests (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              UUID NOT NULL REFERENCES companies(id),
  request_reference       VARCHAR(50) NOT NULL UNIQUE,   -- e.g. COA-CR-2026-0042
  change_type             ENUM('NEW_POSTING_ACCOUNT','NEW_HEADER_ACCOUNT','RENAME',
                               'RECLASSIFY','DEACTIVATE','REACTIVATE','DELETE',
                               'HIERARCHY_REASSIGNMENT','TIER_CHANGE',
                               'OWNER_CHANGE') NOT NULL,
  status                  ENUM('DRAFT','SUBMITTED','UNDER_REVIEW',
                               'APPROVED','REJECTED','EFFECTIVE','WITHDRAWN') NOT NULL DEFAULT 'DRAFT',

  -- Subject
  account_id              UUID REFERENCES gl_accounts(id),      -- for changes to existing
  proposed_code           VARCHAR(12),                          -- for new accounts
  proposed_name           VARCHAR(200),
  proposed_parent_id      UUID REFERENCES gl_accounts(id),

  -- Justification
  requestor_id            UUID NOT NULL REFERENCES users(id),
  sponsor_id              UUID REFERENCES users(id),
  business_justification  TEXT NOT NULL,
  financial_statement_impact TEXT,
  tax_regulatory_impact   TEXT,
  historical_reclass_required BOOLEAN NOT NULL DEFAULT FALSE,
  urgency                 ENUM('ROUTINE','URGENT','CRITICAL') NOT NULL DEFAULT 'ROUTINE',

  -- Effective date
  requested_effective_date DATE,
  actual_effective_date    DATE,
  lead_time_days           SMALLINT,

  -- Approval chain
  required_approver_count  SMALLINT NOT NULL DEFAULT 1,
  approval_reference       VARCHAR(200),

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at            TIMESTAMPTZ,
  decided_at              TIMESTAMPTZ
)
```

### 14.3 Change Approval Schema

```sql
coa_change_approvals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_request_id   UUID NOT NULL REFERENCES coa_change_requests(id),
  approver_id         UUID NOT NULL REFERENCES users(id),
  sequence            SMALLINT NOT NULL,
  decision            ENUM('APPROVED','REJECTED','ABSTAINED'),
  decided_at          TIMESTAMPTZ,
  comments            TEXT,

  CONSTRAINT uq_request_approver UNIQUE (change_request_id, approver_id)
)
```

### 14.4 Approval Chain Rules by Change Type

| Change Type | Min Approvers | Required Role(s) | T1 Account Additional |
|------------|--------------|-----------------|----------------------|
| New posting account (T3) | 1 | COA Administrator | — |
| New posting account (T2) | 1 | COA Administrator + Finance Manager | — |
| New posting account (T1) | 2 | COA Administrator + Finance Controller | Board/audit committee notification |
| Rename (T3) | 1 | COA Administrator | — |
| Rename (T1/T2) | 2 | Finance Manager + Finance Controller | — |
| Reclassify | 2 | Finance Manager + Finance Controller | Auditor notification required |
| Deactivate | 1 | Finance Manager | Must confirm zero balance |
| Delete | 2 | Finance Manager + Finance Controller | Must confirm no historical postings |
| Hierarchy reassignment | 2 | Finance Manager + Finance Controller | Statement impact review mandatory |
| Tier change | 2 | Finance Controller + Company Administrator | — |

---

## 15. API Endpoint Specification

### 15.1 COA Setup and Catalog

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| `GET` | `/api/coa/catalog/templates` | `coa:view` | List available templates |
| `GET` | `/api/coa/catalog/templates/:id/accounts` | `coa:view` | Get template accounts with inclusion reasons |
| `POST` | `/api/coa/setup/business-profile` | `coa:configure` | Save business profile; returns template recommendation |
| `POST` | `/api/coa/setup/dry-run` | `coa:configure` | Preview instantiation; returns validation report and account list without writing |
| `POST` | `/api/coa/setup/instantiate` | `coa:configure` | Execute atomic COA creation |
| `GET` | `/api/coa/setup/status` | `coa:view` | Get current setup state and event history |

### 15.2 Account Management

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| `GET` | `/api/accounts` | `coa:view` | List company accounts with filters |
| `GET` | `/api/accounts/:id` | `coa:view` | Get account detail with full metadata |
| `GET` | `/api/accounts/tree` | `coa:view` | Get hierarchical account tree |
| `POST` | `/api/accounts` | `account:create` | Create user-defined account |
| `PATCH` | `/api/accounts/:id` | `account:modify` | Modify non-protected fields |
| `POST` | `/api/accounts/:id/change-request` | `account:change_request` | Submit change request for protected field |
| `GET` | `/api/accounts/:id/audit-log` | `audit:view` | Get account master audit log |
| `POST` | `/api/accounts/:id/access-override` | `sensitivity:assign` | Grant named-user T1 access |

### 15.3 Opening Balances

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| `GET` | `/api/opening-balances/template` | `coa:configure` | Download CSV import template |
| `POST` | `/api/opening-balances/validate` | `coa:configure` | Validate import file; returns error/warning report |
| `POST` | `/api/opening-balances/import` | `coa:configure` | Import and create draft opening balance journal |
| `POST` | `/api/opening-balances/approve` | `journal:approve_override` | Finance Controller approval of opening balance journal |
| `GET` | `/api/opening-balances/status` | `coa:view` | Migration status and sign-off state |

### 15.4 Reconciliation

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| `GET` | `/api/reconciliations` | `reconciliation:prepare` | List reconciliations for current user's accounts |
| `GET` | `/api/reconciliations/:id` | `reconciliation:prepare` | Get reconciliation detail and items |
| `PATCH` | `/api/reconciliations/:id` | `reconciliation:prepare` | Update reconciliation (add items, notes) |
| `POST` | `/api/reconciliations/:id/submit` | `reconciliation:prepare` | Submit for review |
| `POST` | `/api/reconciliations/:id/review` | `reconciliation:review` | Review decision (approve / return) |
| `POST` | `/api/reconciliations/:id/sign-off` | `reconciliation:review` | Final sign-off |
| `GET` | `/api/reconciliations/dashboard` | `coa:view` | Reconciliation status board across all accounts |

### 15.5 Period Close

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| `GET` | `/api/periods/:id/close-status` | `coa:view` | Get close checklist and gate status |
| `GET` | `/api/periods/:id/close-tasks` | `coa:view` | Get all close tasks for period |
| `PATCH` | `/api/periods/:id/close-tasks/:taskId` | `reconciliation:prepare` | Update task status |
| `POST` | `/api/periods/:id/close/gate/:gate` | `period:close` | Attempt gate advancement |
| `POST` | `/api/periods/:id/unlock` | `period:unlock` | Unlock closed period (with justification) |

### 15.6 Audit

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| `GET` | `/api/audit/accounts` | `audit:view` | Query account master audit log |
| `GET` | `/api/audit/journals` | `audit:view` | Query journal audit log |
| `POST` | `/api/audit/export` | `audit:export` | Generate and download audit bundle |
| `GET` | `/api/audit/integrity` | `audit:view` | Run hash chain integrity verification |

---

## 16. Implementation Phases — Detailed Build Plan

### Phase 1 — Account Master Foundation (Weeks 1–4)

**Objective:** Evolve the existing `GLAccount` model into a governed account master without breaking live journals.

**Schema deliverables:**
- Migrate `GLAccount` to `gl_accounts` with all new fields (additive migration, no breaking changes)
- Create `account_types`, `account_subtypes`, `fs_placements` lookup tables
- Create `gl_account_audit_log` with insert-only trigger
- Create `sod_rules` table and seed mandatory rules
- Create `gl_dimensions` table

**Service deliverables:**
- Upgrade account create/update validation to enforce code rules
- Implement hierarchy validation (circular detection, max depth, category consistency)
- Block posting to header accounts and inactive accounts
- Implement audit log write on every account create/modify operation
- Implement SoD policy enforcement layer

**API deliverables:**
- `GET /api/accounts` with filter support
- `GET /api/accounts/tree`
- `GET /api/accounts/:id`
- `PATCH /api/accounts/:id` (non-protected fields)
- `GET /api/accounts/:id/audit-log`

**Frontend deliverables:**
- Upgrade COA list page to tree hierarchy explorer
- Account inspector panel with full metadata display
- Sensitivity tier and owner display
- Dormancy status indicator

**Definition of done for Phase 1:**
- All existing journal entries post without regression
- New metadata fields are populated for all accounts
- Audit log captures every account create and modify event
- SoD rules block prohibited actions in test scenarios
- Hierarchy validation prevents circular references and category mismatches

---

### Phase 2 — Catalog Seed and Activation Wizard (Weeks 5–9)

**Objective:** Load the master COA catalog and build the activation wizard.

**Schema deliverables:**
- `coa_catalog_accounts` table
- `coa_templates` table
- `coa_template_accounts` table
- `coa_setup_events` table

**Data deliverables:**
- Full catalog seed from the COA specification manual (600+ accounts)
- Template definitions and account membership for all 7 base templates
- Module dependency mapping

**Service deliverables:**
- Template recommendation engine (business profile → template)
- Dry-run instantiation service (validates without writing)
- Atomic instantiation service (transactional, rollback on any failure)
- Post-instantiation integrity check

**API deliverables:**
- All `/api/coa/catalog/` endpoints
- All `/api/coa/setup/` endpoints including dry-run and instantiate

**Frontend deliverables:**
- Full 5-step activation wizard (Step 0 through Step 5)
- Business profile form
- Template selection with recommendation display
- Module toggle UI with dependency resolution
- Preview screen with validation report
- Post-instantiation success screen with integrity report

**Definition of done for Phase 2:**
- Wizard completes for all 7 template types without error
- Dry-run and instantiation produce identical account counts
- Post-instantiation integrity check passes for all templates
- Partial instantiation failure triggers full rollback (verified by deliberate fault injection)

---

### Phase 3 — Opening Balance Migration (Weeks 10–12)

**Objective:** Enable going-concern entities to establish starting balances.

**Deliverables:**
- `gl_opening_balance_imports` and related tables
- CSV import template download
- Validation service (all `OB-V` rules)
- Opening balance journal generation service
- Comparative period import
- Retained earnings derivation
- Finance Controller sign-off workflow
- Migration status API and UI screen

**Definition of done for Phase 3:**
- Trial balance import validates correctly for balanced and unbalanced inputs
- Opening balance journal is permanently locked after FC sign-off
- Comparative period figures appear correctly on financial statements
- Migration completion blocks re-import without override permission

---

### Phase 4 — Governance Workflow (Weeks 13–17)

**Objective:** Make all COA changes request-driven and auditable.

**Deliverables:**
- `coa_change_requests` and `coa_change_approvals` tables
- Change request creation and submission service
- Approval routing engine (change type → approver requirements)
- Approval and rejection service
- Effective date scheduling
- Protected account change enforcement (blocks direct edit; routes to change request)
- Change request queue UI
- Approvals queue UI
- Change history view per account

**Definition of done for Phase 4:**
- Direct edits to protected/T1/T2 accounts are blocked without a change request
- All change types route to correct approver count and roles
- Approved changes take effect on the declared effective date
- Rejected changes are audited with reason

---

### Phase 5 — Sensitivity, SoD, and Permission Enforcement (Weeks 18–22)

**Objective:** Activate all T1/T2/T3 controls and enforce the full permission model.

**Deliverables:**
- `gl_account_access_overrides` table
- Named-user access grant/revoke UI for T1 accounts
- T1 journal dual-authorisation enforcement
- T2 owner-only posting enforcement
- Journal approval threshold routing
- Dormant account monitoring and alerting
- Sensitive account register UI
- Threshold configuration UI for Finance Controllers

**Definition of done for Phase 5:**
- T1 account journals cannot be posted without named-user access and dual approval
- SoD rules block all prohibited action combinations
- Dormant accounts alert at correct day thresholds
- Threshold routing works for all approval levels

---

### Phase 6 — Reconciliation and Period Close (Weeks 23–28)

**Objective:** Build the reconciliation control object and the four-gate close model.

**Deliverables:**
- `gl_reconciliations` and `gl_reconciliation_items` tables
- Automatic reconciliation creation at period start
- Reconciliation lifecycle (prepare / review / sign-off)
- Reconciliation UI
- Reconciliation dashboard
- Period close task auto-generation
- Four-gate close enforcement
- Accrual journal type with auto-reversal
- Close calendar UI

**Definition of done for Phase 6:**
- Period cannot close with outstanding T1/T2 reconciliations
- Close gate advancement blocked if prerequisite gate is incomplete
- Accruals reverse automatically in the following period
- Overdue reconciliations escalate to Finance Controller

---

### Phase 7 — Reporting and Audit Export (Weeks 29–34)

**Objective:** Make the COA the reporting spine and deliver audit-grade exports.

**Deliverables:**
- Financial statements generated from `fs_placement` metadata (not hardcoded groupings)
- Indented trial balance using full hierarchy
- OCI separation in equity statement (IFRS Full)
- Comparative period columns
- Normal balance exception report
- COA change log report
- Audit export bundle (JSON + CSV + hash integrity report)
- Audit log hash chain verification endpoint

**Definition of done for Phase 7:**
- All financial statements use COA structure and FS placement metadata
- Comparative columns show prior-period figures correctly
- Audit bundle passes hash chain verification
- External auditor role can access and export audit bundle without assistance

---

## 17. Documentation Deliverables

The following documentation deliverables are required as part of the implementation. They are not supplementary — they are acceptance criteria.

| Document | Owner | Required By | Approved By |
|----------|-------|-------------|-------------|
| COA User Guide | Finance Manager | Phase 2 go-live | CFO or equivalent |
| Account Usage Guidelines | COA Administrator | Phase 2 go-live | Finance Manager |
| COA Governance Policy | Finance Controller | Phase 4 go-live | Company Board or equivalent |
| Change Request Process Guide | COA Administrator | Phase 4 go-live | Finance Manager |
| Sensitivity Tier Register | Finance Controller | Phase 5 go-live | CFO or equivalent |
| Reconciliation Procedure Manual | Finance Manager | Phase 6 go-live | Finance Controller |
| Period Close Procedure Manual | Finance Controller | Phase 6 go-live | CFO or equivalent |
| System Administrator Guide | System Administrator | Phase 1 go-live | CTO or equivalent |
| Audit Readiness Guide | Finance Controller | Phase 7 go-live | External Auditor |

---

## 18. Definition of Done

The COA implementation is complete only when all three categories of conditions are satisfied.

### 18.1 Technical Conditions

- The integrated COA catalog (600+ accounts) is seeded and accessible
- All 7 base templates are defined and tested
- The activation wizard completes successfully for all template types
- Account structure rules (hierarchy, code ranges, category consistency) are enforced at the DB and API layers
- Header/posting semantics are enforced — no journal lines can post to header accounts
- Account ownership is recorded for all accounts
- Sensitivity tiers are operational and activate their respective control sets
- Financial statement mapping is explicit via `fs_placement_id` on all posting accounts
- Change workflow is active and protected accounts cannot be modified without it
- The audit log is active, append-only, and field-level
- The hash chain integrity check passes on a clean installation
- SoD rules block all prohibited action combinations in automated tests
- Period close gates are enforced in sequence

### 18.2 Operational Conditions

- The finance team has completed UAT and formally signed off the activated chart
- Opening balances have been imported, validated, signed off by the Finance Controller, and reconciled to the prior system's closing trial balance
- At least one complete period close has been executed successfully through all applicable gates on the new chart
- The COA change request workflow has been tested end-to-end with a real or simulated change request, including approval and effective-date scheduling
- The reconciliation module is in active use by at least one account owner
- At least one audit export bundle has been generated and reviewed

### 18.3 Governance Conditions

- The COA Governance Policy has been approved and distributed
- All account ownership assignments have been formally accepted by each named owner
- All T1 accounts have named-user access lists configured and signed off by the Finance Controller
- An independent reviewer (external auditor, internal audit, or financial controller) has reviewed the activated chart structure and governance controls and issued a written sign-off
- The audit log has been tested with a deliberate change and the change confirmed as captured with full before/after field values

---

## 19. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| R01 | Schema migration breaks existing journal entries | Medium | Critical | Additive-only migration in Phase 1; extensive regression testing; backward-compatible API endpoints maintained throughout |
| R02 | Wizard produces inconsistent COA if interrupted mid-instantiation | Low | High | Atomic transaction with full rollback; post-instantiation integrity check; idempotent dry-run |
| R03 | Opening balance does not reconcile to prior system | Medium | High | Mandatory validation rules; Finance Controller sign-off; reconciliation to source required before migration complete status |
| R04 | SoD rules conflict with existing user assignments | Medium | Medium | SoD rules introduced per phase; existing users notified of role changes; override window provided with audit log |
| R05 | Audit log tampered with before insert-only trigger is deployed | Low | Critical | Insert-only trigger deployed in Phase 1 before any sensitive data is written; verified by automated test |
| R06 | Tax treatment misconfigured triggers incorrect VAT journals | Medium | High | Tax code assignment validated against account type on save; VAT journal generation tested for all tax code types before Phase 1 go-live |
| R07 | Catalog version update breaks existing company COAs | Low | High | Catalog versioning field on `coa_catalog_accounts`; company accounts preserve snapshot of catalog version at instantiation; catalog updates do not auto-propagate |
| R08 | T1 accounts accessible to users without named-user override | Low | Critical | Named-user check enforced at service layer before DB; tested by security regression suite |
| R09 | Period close gate enforcement bypassed via direct DB access | Low | Critical | DB role permissions restrict application service role to DML only; no DDL; gate checks enforced at service layer AND by DB-level triggers |
| R10 | Documentation not completed before go-live | Medium | Medium | Documentation deliverables added to phase acceptance criteria; go-live blocked without approved documentation |

---

*This specification is authoritative for all implementation decisions in the CompanyOS Chart of Accounts domain. Changes to this specification require a formal change request reviewed by the Finance Controller and approved by the Technical Lead. All changes are version-controlled and the change history is maintained alongside this document.*

---

**References:**
- IAS 1 — Presentation of Financial Statements
- IAS 8 — Accounting Policies, Changes in Accounting Estimates and Errors
- IAS 21 — The Effects of Changes in Foreign Exchange Rates
- IFRS for SMEs — International Accounting Standard Board, 2015 edition
- COSO Internal Control — Integrated Framework (2013)
- IIA International Standards for the Professional Practice of Internal Auditing
- South African Companies Act No. 71 of 2008
- Value-Added Tax Act No. 89 of 1991
- Income Tax Act No. 58 of 1962
- POPIA — Protection of Personal Information Act No. 4 of 2013
