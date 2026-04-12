# AR Recoveries to GL Integration Plan

## Purpose
Keep the Recoveries Console as an AR operations workspace while tightening its finance truth so collection outcomes align with dispute, accounting, and COA-controlled postings.

## Scope Boundary
- Keep `/ar/collections` as a standalone operational workspace.
- Do not merge recoveries into the COA UI.
- Integrate recoveries with accounting only at control and posting points.

## Current Gaps
- Collection resolution can clear a case without a defined accounting outcome.
- Action history is stored as appended notes instead of structured recovery events.
- Recoveries are not yet tied to COA-mapped write-off, allowance, or credit memo accounts.
- Queue removal is operationally possible before financial resolution is fully complete.

## Desired End State
- A collection case can only be resolved through a valid outcome.
- Each outcome is mapped to a finance control path.
- Write-offs and credits are governed by approval thresholds and GL posting rules.
- Collection history is structured, queryable, and auditable.
- AR dashboards and accounting reports stay consistent.

## Phase 1: Structured Recoveries Model
- Add `CollectionActivity` as a first-class event model.
- Capture:
  - action type
  - actor
  - timestamp
  - channel
  - notes
  - follow-up due date
  - linked dispute or resolution id where relevant
- Keep legacy note text as a derived display layer, not the system of record.

## Phase 2: Controlled Resolution Outcomes
- Replace generic `Resolve Case` with explicit outcomes:
  - `PAID`
  - `PROMISE_TO_PAY`
  - `DISPUTED`
  - `CREDIT_NOTE_REQUIRED`
  - `WRITE_OFF_REQUESTED`
  - `CLOSED_NO_BALANCE`
- Require justification and guardrails per outcome.
- Prevent closure when balance still exists and no valid financial treatment has been selected.

## Phase 3: COA / Accounting Mapping
- Introduce recoveries outcome mapping to COA-controlled accounts:
  - AR control
  - bad debt expense
  - allowance for doubtful debts
  - credit memo / sales return accounts
  - recovery clearing / suspense accounts if needed
- Use the hardened COA metadata to restrict which GL accounts are valid for:
  - write-offs
  - allowance movements
  - recovery-related journals

## Phase 4: Approval and Posting Controls
- Require approval for write-off requests based on threshold policy.
- Prevent case closure until:
  - payment is posted, or
  - dispute is closed, or
  - credit memo is issued, or
  - write-off is approved and posted to GL
- Reuse dispute-resolution approval patterns where possible.

## Phase 5: Dashboard Truthfulness
- Update AR dashboard metrics so recoveries reflect financial state:
  - active collections
  - promise-to-pay queue
  - disputed collections
  - write-off pending approval
  - recovered this period
- Prevent items from disappearing from oversight before accounting completion.

## Phase 6: Audit and Reporting
- Add recoveries reporting by:
  - collector
  - action channel
  - recovery outcome
  - days to recovery
  - write-off value
  - disputed recovery value
- Support audit export of case timeline plus accounting outcome references.

## Suggested Build Order
1. `CollectionActivity` model and API
2. outcome-based case resolution
3. COA account mapping for recoveries outcomes
4. write-off / credit-note accounting controls
5. dashboard and audit reporting

## Dependencies on COA Assignment
- Stable COA metadata and governed account selection
- sensitivity tiers for restricted finance accounts
- FS placement and account ownership
- later governance workflow for sensitive account usage

## Recommendation
Do not pause COA work for this yet.

Finish the COA platform slices first, then use this plan to make recoveries financially rigorous without collapsing operational UX into accounting admin screens.
