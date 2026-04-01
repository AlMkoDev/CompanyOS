# CompanyOS COA Implementation Blueprint

## Purpose

This blueprint translates the requirements in [comprehensive_coa_reference_manual.md](C:\Users\gsfencing\.codex\worktrees\ecd5\CompanyOS\comprehensive_coa_reference_manual.md) into a practical implementation plan for CompanyOS.

The manual is treated as the authoritative functional specification for the Chart of Accounts domain. This document answers four questions:

1. What the manual requires us to support
2. What already exists in CompanyOS today
3. What gaps are material
4. What the safest build order is

---

## Executive Summary

The manual does **not** describe a simple account list. It describes a **controlled accounting master-data platform** with:

- hierarchical account structure
- statement mapping
- sensitivity tiers
- account ownership
- approval-governed changes
- immutable audit history
- segregation-of-duties enforcement
- period lock discipline
- reporting and reconciliation hooks

CompanyOS already has a useful accounting baseline:

- `GLAccount`
- `JournalEntry`
- `JournalLine`
- `AccountingPeriod`
- bank statements and reconciliation matching
- accounting UI pages for chart of accounts, journals, close, trial balance, and bank reconciliation

But the current implementation is still **v1 operational accounting**, not the governed COA platform described in the manual.

The core assignment implication is:

> We should build the COA as a finance control system, not just a CRUD screen for ledger accounts.

---

## What The Manual Requires

### 1. COA Data Model Requirements

The manual requires the account master to support:

- fixed range classification by major category:
  - `1000–1999` Assets
  - `2000–2999` Liabilities
  - `3000–3999` Equity
  - `4000–4999` Revenue
  - `5000–5999` COGS
  - `6000–6999` Operating Expenses
  - `7000–7999` Other Income / Expenses
  - `8000–8999` Income Tax
- 4-digit base account codes with optional dimensional suffixes
- parent-child hierarchy
- header vs posting accounts
- max hierarchy depth
- normal balance tracking
- account category, type, and subtype
- financial statement placement / mapping
- sensitivity tier (`T1`, `T2`, `T3`)
- account owner
- active / dormant / sunset lifecycle
- reserved codes and contra-account conventions

### 2. Governance Requirements

The manual requires:

- controlled change requests
- documented justifications
- approval routing by change type
- version control of structural changes
- lead times and communication before effective date
- explicit ownership of posting accounts

### 3. Controls Requirements

The manual requires system-enforced controls for:

- segregation of duties
- restricted posting access to sensitive accounts
- immutable audit trail for account master changes
- immutable audit trail for posted journals
- dual approval for material journals
- duplicate posting detection
- threshold and round-number anomaly review
- dormant account monitoring
- lock / unlock workflow for accounting periods
- reversal-only correction model for posted transactions

### 4. Reporting and Reconciliation Requirements

The manual expects:

- reports driven from the COA structure itself
- financial statement mapping table support
- normal-balance awareness
- reconciliation ownership and cadence by account group
- reconciliation completion visibility
- direct alignment between sub-ledgers and GL

---

## Current CompanyOS State

### Backend Today

Relevant current models in [backend/prisma/schema.prisma](C:\Users\gsfencing\.codex\worktrees\ecd5\CompanyOS\backend\prisma\schema.prisma):

- `GLAccount`
- `JournalEntry`
- `JournalLine`
- `AccountingPeriod`
- `BankStatement`
- `BankStatementLine`
- reconciliation match models downstream in the accounting service

Current accounting service in [backend/src/modules/accounting/accounting.service.ts](C:\Users\gsfencing\.codex\worktrees\ecd5\CompanyOS\backend\src\modules\accounting\accounting.service.ts) already supports:

- create / list / update accounts
- create / post / reverse journal entries
- period upsert and close-readiness
- trial balance
- P&L and balance sheet
- bank statement import and matching

Current accounting controller in [backend/src/modules/accounting/accounting.controller.ts](C:\Users\gsfencing\.codex\worktrees\ecd5\CompanyOS\backend\src\modules\accounting\accounting.controller.ts) exposes those flows cleanly.

### Frontend Today

Relevant current UI:

- [frontend/src/app/(ops)/accounting/page.tsx](C:\Users\gsfencing\.codex\worktrees\ecd5\CompanyOS\frontend\src\app\(ops)\accounting\page.tsx)
- [frontend/src/app/(ops)/accounting/chart-of-accounts/page.tsx](C:\Users\gsfencing\.codex\worktrees\ecd5\CompanyOS\frontend\src\app\(ops)\accounting\chart-of-accounts\page.tsx)
- [frontend/src/app/(ops)/accounting/journal/page.tsx](C:\Users\gsfencing\.codex\worktrees\ecd5\CompanyOS\frontend\src\app\(ops)\accounting\journal\page.tsx)
- [frontend/src/app/(ops)/accounting/bank-import/page.tsx](C:\Users\gsfencing\.codex\worktrees\ecd5\CompanyOS\frontend\src\app\(ops)\accounting\bank-import\page.tsx)
- period close screen already exists and is seeded in staging

### What Already Aligns Well

- company-scoped accounting records
- parent pointer on GL accounts
- active/inactive state
- accounting periods
- journal balancing
- blocked posting to closed periods
- reversal workflow
- bank reconciliation baseline
- chart-of-accounts UI already established in product navigation

---

## Material Gaps Against The Manual

### Gap 1. The Account Master Is Too Thin

Current `GLAccount` only stores:

- `code`
- `name`
- `type`
- `parent_id`
- `is_active`

Missing material fields:

- `is_header`
- `category_id`
- `type_id`
- `subtype_id`
- `normal_balance`
- `sensitivity_tier`
- `fs_placement`
- `account_owner_id`
- `level`
- `full_path`
- `description`
- `budget_enabled`
- `tax_treatment`
- dormancy flags / timestamps
- approval metadata

### Gap 2. Governance Is Not Modeled

There is no first-class workflow for:

- change request creation
- approval references
- change classification
- effective dates
- pre-go-live communication
- COA versioning

### Gap 3. Audit Coverage Is Insufficient

The manual requires immutable account-master audit logs. Today we do not have a dedicated `account_audit_log` equivalent for:

- created
- modified
- deactivated
- reactivated
- deleted
- parent reassignment
- field-by-field before/after values

### Gap 4. SoD Is Policy-Light in the COA Domain

Current accounting flows do not appear to enforce the manual’s non-negotiable COA SoD rules, especially:

- creator/modifier of account cannot post to that account
- preparer cannot approve same journal
- approver cannot reconcile affected account
- named-user restrictions on `T1` accounts

### Gap 5. Hierarchy Validation Is Incomplete

The current service checks only:

- account exists
- account is not its own parent

Missing:

- circular ancestry detection
- max depth enforcement
- category inheritance consistency
- orphan detection
- header-posting guardrails
- roll-up integrity checks

### Gap 6. Reporting Metadata Is Missing

The manual expects financial statements to be generated from structure and mapping. Today the system lacks explicit account-level:

- FS placement codes
- contra semantics
- reconciliation frequency metadata
- sensitivity-driven reporting context

### Gap 7. Dormancy and Sensitive Account Controls Are Missing

The manual’s dormant-account and sensitive-account policies are not modeled as operational features yet.

### Gap 8. The Integrated COA Itself Is Not Seeded as a Controlled Reference

The manual defines an integrated chart of hundreds of accounts. CompanyOS currently behaves like a free-form account creator instead of a seeded, governed master chart with controlled extensions.

---

## Recommended Target Architecture

## A. Core Master Data

### 1. `gl_accounts`

Upgrade current `GLAccount` into a richer controlled master record with:

- `company_id`
- `code`
- `name`
- `description`
- `major_category`
- `account_type_id`
- `account_subtype_id`
- `parent_id`
- `is_header`
- `is_active`
- `normal_balance`
- `sensitivity_tier`
- `fs_placement`
- `account_owner_id`
- `budget_enabled`
- `tax_treatment`
- `level`
- `full_path`
- `dormant_since`
- `sunset_candidate`
- `created_by`
- `modified_by`

### 2. Lookups

- `account_categories`
- `account_types`
- `account_subtypes`
- `fs_placements`
- optional `reconciliation_profiles`

### 3. Audit + Governance

- `gl_account_change_requests`
- `gl_account_change_approvals`
- `gl_account_audit_log`
- optional `gl_account_versions`

### 4. Access / Restrictions

- `gl_account_access_overrides` for named-user access on `T1`
- optional `gl_account_role_rules`

### 5. Reconciliation Ownership

- `gl_account_reconciliation_policy`
- `gl_account_reconciliation_status`

---

## B. Validation / Policy Engine

Centralize the manual’s COA rules into service-level validation:

- code uniqueness
- range-to-category validation
- reserved code validation
- contra code handling
- header account posting block
- inactive account posting block
- circular hierarchy detection
- depth check
- category inheritance check
- SoD conflict check
- locked period posting block
- approval threshold routing

This should be a discrete policy layer rather than scattered controller checks.

---

## C. Controlled Change Workflow

COA changes should become request-driven.

Suggested change types:

- new posting account
- new header account
- rename
- reclassify
- deactivate
- reactivate
- delete unused account
- hierarchy reassignment

Each request should capture:

- requestor
- sponsor
- justification
- impacted accounts
- financial statement impact
- tax/regulatory impact
- historical reclass requirement
- urgency
- approval reference
- effective date

---

## D. Seeded Master Chart Strategy

The integrated chart in the manual should be loaded as a baseline controlled reference set.

Recommended approach:

1. seed all standard header/posting accounts from the manual
2. mark them as `system_managed = true`
3. allow customer-specific additions only in approved open ranges or dimensional suffixes
4. block arbitrary edits to seeded protected accounts without workflow

This will preserve consistency while still allowing tenant flexibility.

---

## Recommended Implementation Phases

## Phase 1. Harden the Existing Account Model

Goal:
- evolve current accounting safely without breaking journals

Deliver:

- add master-data fields to `GLAccount`
- add `is_header`
- add `normal_balance`
- add `sensitivity_tier`
- add `fs_placement`
- add `account_owner_id`
- add `level` and `full_path`
- strengthen hierarchy validation
- block posting to header/inactive accounts

Why first:
- this gives us a safe structural base before governance and workflow complexity

## Phase 2. Seed the Canonical Integrated COA

Goal:
- align the system with the manual’s actual chart

Deliver:

- category/type/subtype lookup seeds
- integrated COA seed import
- reserved range protection
- initial mapping to current statements/reports

Why second:
- we need the real chart before governance can operate meaningfully on it

## Phase 3. Add COA Governance Workflow

Goal:
- turn account maintenance into a controlled process

Deliver:

- account change request model
- approval chains
- approval references
- effective dates
- version history
- account-master audit log

Why third:
- once the chart is real, changes to it become business-critical and must be controlled

## Phase 4. Add Sensitive Account and SoD Enforcement

Goal:
- satisfy the manual’s internal-control expectations

Deliver:

- `T1/T2/T3` enforcement
- named-user restrictions on `T1`
- creator/poster separation
- journal preparer/approver separation
- account-owner notifications
- dormant-account monitoring

## Phase 5. Reconciliation and Close Integration

Goal:
- connect the COA model to finance operations

Deliver:

- reconciliation frequency metadata
- reconciliation dashboard by account owner
- period-close checklist tied to account groups
- sensitive account register UI

## Phase 6. Reporting and Audit Export

Goal:
- make the COA the reporting spine the manual describes

Deliver:

- financial statement generation from FS placement metadata
- indented trial balance using hierarchy
- COA change log report
- audit export bundle
- normal-balance exception reporting

---

## CompanyOS-Specific Build Recommendation

For this codebase, the safest sequence is:

1. **Schema evolution without breaking journals**
- extend `GLAccount`
- do not replace it wholesale

2. **Service hardening**
- upgrade [backend/src/modules/accounting/accounting.service.ts](C:\Users\gsfencing\.codex\worktrees\ecd5\CompanyOS\backend\src\modules\accounting\accounting.service.ts)
- centralize validation rules

3. **COA seed import**
- create a formal seed/import script from the manual’s integrated chart

4. **Frontend chart-of-accounts redesign**
- current page is CRUD-oriented
- evolve it into:
  - hierarchy explorer
  - metadata panel
  - owner / sensitivity assignment
  - change-request entry point

5. **Governance UI**
- change request queue
- approvals queue
- change history

6. **Close + reconciliation linkage**
- connect account metadata to close-readiness and ownership workflows

---

## UI/UX Target State

### Chart of Accounts Workspace Should Become

- tree-first hierarchy explorer
- metadata-rich account inspector
- filter by:
  - category
  - sensitivity
  - owner
  - active/dormant
  - posting/header
  - reconciliation status
- “Request Change” instead of direct unrestricted mutation for protected accounts
- visibility into:
  - statement mapping
  - contra behavior
  - owner
  - last changed
  - last reconciled
  - approval history

### Supporting Internal Screens

- COA change requests
- COA approvals
- sensitive account register
- account dormancy review
- reconciliation status board
- audit export view

---

## Risks To Manage

### 1. Breaking Existing Accounting Flows

Risk:
- journals, AP, AR, bank rec, and seeded staging data already depend on the current accounting module

Mitigation:
- additive schema evolution first
- maintain backward-compatible endpoints during transition
- introduce stricter validation behind targeted upgrades, not all at once

### 2. Overbuilding Before the Master Chart Exists

Risk:
- building governance before loading the integrated COA may create workflow around placeholder accounts

Mitigation:
- seed the canonical chart early

### 3. Too Much Freeform Editing

Risk:
- unrestricted account edits will undermine financial statement consistency quickly

Mitigation:
- protect seeded/system accounts
- route material changes through workflow

### 4. SOd Rules Colliding With Current User Model

Risk:
- current auth/role system may not yet express all accounting-specific SoD boundaries

Mitigation:
- implement per-feature enforcement in accounting first
- extend global role/permission model only where justified

---

## Suggested First Build Slice

The best first implementation slice is:

### Slice 1: COA Foundation Hardening

Build:

- richer `GLAccount` schema
- category/type/subtype metadata
- `is_header`
- `normal_balance`
- `sensitivity_tier`
- `fs_placement`
- `account_owner_id`
- hierarchy validation engine
- posting guardrails
- chart-of-accounts UI inspector refresh

Expected result:
- we move from “ledger account CRUD” to a real governed account master foundation

This gives us the base needed for:

- integrated COA seeding
- governance workflow
- reconciliation ownership
- statement mapping

---

## Recommended Definition of Done For The Major Assignment

This assignment should be considered complete only when:

- the integrated COA is represented in CompanyOS
- account structure rules are enforced in-system
- header/posting semantics are enforced
- account ownership is recorded
- sensitivity tiers are operational
- financial statement mapping is explicit
- change workflow and audit log exist
- SoD and period lock controls are active in accounting flows
- reports use the COA structure rather than freeform grouping

---

## Immediate Next Step

The next practical move is:

1. design the target schema changes for `GLAccount` and related lookup / audit / workflow tables
2. map current endpoints and UI to the new model
3. implement the Phase 1 foundation slice

That is the cleanest and safest starting point for the major assignment.
