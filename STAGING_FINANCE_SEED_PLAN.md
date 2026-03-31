# Staging Finance Seed Plan

This plan defines the minimum staged finance dataset needed to demonstrate the current AP, AR, dispute, and accounting flows in a believable way during release validation.

Use this plan when the UI is rendering correctly but the staging company is too empty to exhibit the newer finance workflows.

## Goal

Seed a small, intentional dataset that unlocks:

- AP vendor bill workflow
- AR invoice and collections workflow
- dispute intake, register, portal, and closure flows
- accounting reconciliation and journal visibility
- dashboard cards with live, non-zero examples

## Target Company

Seed into the staging company already used for finance validation:

- `Verdant Fields Staging`

Do not spread the demo records across multiple companies. The walkthrough depends on one coherent tenant.

## Seed Design Principles

- Prefer a few high-signal records over bulk dummy data.
- Reuse linked records where possible so one scenario lights up multiple surfaces.
- Keep naming obvious so testers can find records quickly.
- Use dates intentionally:
  - one current/open case
  - one overdue case
  - one closed case
  - one dispute under active review
- Use amounts large enough to be visually obvious on cards.

## Seed Set

### 1. AP Vendor

Create one supplier:

- Name: `Highveld Produce Suppliers`
- Purpose:
  - unlocks AP vendor count
  - supports vendor bill and requisition workflow

Visible on:

- `/ap`
- `/ap/vendors`
- `/accounting`

Expected outcome:

- AP dashboard no longer shows `0 vendors`
- vendor directory has at least one realistic record

### 2. AP Requisition

Create one requisition linked to the AP vendor scenario:

- Reference: `APRQ-STG-001`
- Status: `pending_approval`
- Purpose:
  - shows requisition-first AP flow
  - validates AP boundary refactor

Visible on:

- `/ap`
- `/ap/requisitions`

Expected outcome:

- AP workflow area shows a real requisition queue

### 3. AP Vendor Bill Awaiting Approval

Create one vendor bill:

- Reference: `VB-STG-001`
- Vendor: `Highveld Produce Suppliers`
- Status: `matched` or `awaiting_approval`
- Amount: `R 28,750`

Purpose:

- unlocks vendor bill intake wording
- shows AP approval queue
- gives accounting a non-zero AP balance

Visible on:

- `/ap`
- `/ap/vendor-bills`
- `/accounting`

Expected outcome:

- AP outstanding is non-zero
- queue wording is exercised with a real bill
- accounting AP card reflects vendor bill exposure

### 4. AP Payment Run

Create one payment run using the vendor bill:

- Reference: `APRUN-STG-001`
- Status: `approved`

Purpose:

- exhibits the run lifecycle beyond invoice approval
- validates payment-run status logic

Visible on:

- `/ap/payment-runs`

Expected outcome:

- payment-run cards show a live example instead of pure empty state

### 5. AR Current Customer

Create one normal customer:

- Name: `North Ledger Retail`
- Purpose:
  - unlocks AR customer directory
  - anchors current/open invoice examples

Visible on:

- `/ar`
- `/ar/customers`
- `/accounting`

Expected outcome:

- AR and accounting customer counts become non-zero

### 6. AR Open Sales Invoice

Create one current invoice:

- Invoice no: `AR-STG-OPEN-001`
- Customer: `North Ledger Retail`
- Amount: `R 12,400`
- Paid amount: `R 4,000`
- Status: `partially_paid`

Purpose:

- exhibits receipt allocation
- shows `RECEIVED` and `OPEN` values on the invoice row
- keeps at least one non-overdue receivable visible

Visible on:

- `/ar`
- `/ar/invoices`
- `/accounting`

Expected outcome:

- AR invoice table shows:
  - received amount
  - open amount
  - record payment action
  - receipt allocation history

### 7. AR Overdue Invoice

Create one overdue invoice:

- Invoice no: `AR-STG-OVD-001`
- Customer: `North Ledger Overdue Buyer`
- Amount: `R 18,400`
- Paid amount: `R 0`
- Status: `overdue`
- Due date: at least 15 days in the past

Purpose:

- powers overdue invoice list
- powers reminder-due signal
- powers live escalations with a meaningful balance

Visible on:

- `/ar`
- `/ar/invoices`

Expected outcome:

- overdue list contains one obvious invoice
- `Disputes At Risk` and collections surfaces can be contrasted against normal AR

### 8. Dispute Under Review

Create one active dispute against the overdue invoice:

- Case number: `DSP-STG-001`
- Status: `UNDER_REVIEW`
- Type: `QUALITY`
- Priority: `HIGH`
- Product code: `MARROW`
- Disputed amount: `R 18,400`
- `blocks_payment`: `true`

Purpose:

- unlocks dispute register row
- demonstrates aging pause / disputed handling
- supports collaboration hub

Visible on:

- `/ar/disputes`
- `/ar`
- `/ar/invoices`
- `/disputes` after case lookup

Expected outcome:

- internal dispute register has at least one meaningful row
- collaboration hub can be opened
- dashboard dispute widgets are non-empty

### 9. Evidence-Pending Dispute

Create one second dispute:

- Case number: `DSP-STG-002`
- Status: `EVIDENCE_PENDING`
- Type: `QUANTITY`
- Priority: `MEDIUM`
- Product code: `POTATO`
- Disputed amount: `R 6,500`

Purpose:

- demonstrates evidence deadline handling
- exercises evidence pressure metrics

Visible on:

- `/ar/disputes`
- `/ar`
- `/disputes`

Expected outcome:

- dispute register shows a second workflow state
- dashboard evidence-pending counts are non-zero

### 10. Closed Dispute With Documents

Create one closed dispute:

- Case number: `DSP-STG-003`
- Status: `CLOSED`
- Resolution type: `credit_note`
- Resolution letter generated
- Closure receipt generated

Purpose:

- unlocks document hub
- unlocks grouped timeline with closure events
- gives portal a closed case example

Visible on:

- `/ar/disputes`
- `/disputes`

Expected outcome:

- portal lookup shows:
  - grouped timeline cards
  - document hub
  - closure artifacts

### 11. Acceptance-Required Closure

Create one customer-facing closure requiring acceptance:

- Case number: `DSP-STG-004`
- Status: `RESOLVED` or `CLOSED_PENDING_ACCEPTANCE`
- Acceptance required: `true`
- Survey not yet submitted

Purpose:

- demonstrates the acceptance flow
- demonstrates fairness survey
- demonstrates reopen request controls

Visible on:

- `/disputes`
- `/ar/disputes`

Expected outcome:

- portal shows:
  - accept / reject or acknowledge controls
  - fairness survey input
  - reopen request box

### 12. Generated Compliance Dossier

Generate at least one dossier against an existing dispute:

- Target case: `DSP-STG-003` or `DSP-STG-004`

Purpose:

- validates the internal export path
- exercises dossier-ready state in the register

Visible on:

- `/ar/disputes`

Expected outcome:

- dispute register shows `Dossier ready`
- collaboration hub export area has a stored dossier entry

### 13. Bank Statement

Create one imported bank statement:

- Reference: `BS-STG-001`
- Status: `imported`

Purpose:

- unlocks accounting bank statement card
- supports bank reconciliation area

Visible on:

- `/accounting`
- `/accounting/bank-statements`

Expected outcome:

- accounting no longer shows `0` imported files

### 14. Journal Entry

Create one posted journal entry:

- Reference: `JE-STG-001`
- Status: `posted`
- Balanced

Purpose:

- unlocks ledger movement
- supports trial balance / accounting credibility

Visible on:

- `/accounting`
- `/accounting/journal-entries`

Expected outcome:

- ledger cards are no longer entirely empty

### 15. Open Accounting Period

Create one accounting period:

- Period: current month
- Status: `open`

Purpose:

- unlocks close workflow visibility

Visible on:

- `/accounting`
- `/accounting/periods`

Expected outcome:

- accounting workspace no longer shows `0 open periods`

## Walkthrough Mapping

### `/ap`

Should exhibit:

- non-zero vendor count
- requisition activity
- vendor bill wording
- non-empty approval queue

Records needed:

- AP vendor
- AP requisition
- AP vendor bill

### `/ap/payment-runs`

Should exhibit:

- one realistic run lifecycle card

Records needed:

- AP payment run

### `/ar`

Should exhibit:

- current AR balance
- active customers
- overdue invoice list
- disputes-at-risk behavior
- non-empty escalations based on real outstanding items only

Records needed:

- AR customer
- open invoice
- overdue invoice
- disputes

### `/ar/invoices`

Should exhibit:

- received/open balance context
- payment action
- delivery/reminders action
- dispute action

Records needed:

- open invoice
- overdue invoice

### `/ar/disputes`

Should exhibit:

- multiple dispute states
- collaboration hub
- acceptance state
- dossier-ready state

Records needed:

- active dispute
- evidence-pending dispute
- closed dispute
- acceptance-required dispute
- generated dossier

### `/disputes`

Should exhibit:

- successful case lookup
- grouped timeline cards
- document hub
- acceptance flow
- reopen request

Records needed:

- closed dispute with documents
- acceptance-required dispute

### `/accounting`

Should exhibit:

- non-zero AP / AR context
- bank statements
- open periods
- trial/journal credibility

Records needed:

- vendor bill
- open invoice / overdue invoice
- bank statement
- journal entry
- accounting period

## Recommended Seeding Order

1. company-linked vendor and customer masters
2. AP requisition and vendor bill
3. AR open invoice and overdue invoice
4. disputes in multiple states
5. dispute documents, acceptance-required case, and dossier
6. accounting statement, journal, and period

This order lets each later record reuse the earlier ones instead of creating disconnected demo data.

## Minimum Pass / Better Pass

### Minimum Pass

Seed:

- AP vendor
- AP vendor bill
- AR customer
- open invoice
- overdue invoice
- one active dispute
- one closed dispute
- one bank statement

This is enough to make the main dashboards and core dispute flows look alive.

### Better Pass

Seed everything in this document.

That gives us a believable end-to-end finance walkthrough rather than a partial demo.

## Recommended Next Step

Translate this plan into one dedicated staging seed script that:

- targets `Verdant Fields Staging`
- is safe to rerun
- uses clear fixture names
- prints the record references needed for the walkthrough

That will let us move from planning to repeatable staging setup without manually creating each example every time.
