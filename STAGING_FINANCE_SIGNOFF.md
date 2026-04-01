# Staging Finance Signoff

This worksheet is the focused signoff record for the staged finance validation set defined in:

- [STAGING_FINANCE_SEED_PLAN.md](C:\Users\gsfencing\.codex\worktrees\ecd5\CompanyOS\STAGING_FINANCE_SEED_PLAN.md)

Use it to close the AP, AR, disputes, and accounting phase with concrete evidence from the seeded `Verdant Fields Staging` tenant.

## 1. Run Metadata

| Field | Value |
|---|---|
| Staging frontend | `https://companyos-staging.vercel.app` |
| Staging backend | `https://companyos-api-staging.onrender.com` |
| Company | `Verdant Fields Staging` |
| Date | `2026-04-01` |
| Operator | `gsfencing` |
| Reviewer | `Pending final signoff` |
| Latest commit validated | `d1b35f3` for repeated-event cleanup, `2fe69e2` for modal portal rendering, `89fcca5` / `29590cc` for hub overlay and layout polish |
| Result | `Pending` |

## 2. Seeded Record References

Use these during validation so the walkthrough is consistent.

| Record type | Reference |
|---|---|
| AP requisition | `APRQ-STG-001` |
| AP vendor bill | `VB-STG-001` |
| AR open invoice | `AR-STG-OPEN-001` |
| AR overdue invoice | `AR-STG-OVD-001` |
| Dispute under review | `DSP-STG-001` |
| Dispute evidence pending | `DSP-STG-002` |
| Closed dispute | `DSP-STG-003` |
| Acceptance-required dispute | `DSP-STG-004` |
| Journal entry | `JE-STG-001` |
| Bank statement | `BS-STG-001` |

## 3. AP Checks

| Check | Expected result | Status | Evidence / notes |
|---|---|---|---|
| `/ap` dashboard counts | Non-zero AP outstanding, active vendors, pending POs, matched ratio | `Pass` | Dashboard screenshot showed `R 28,750` outstanding AP, `1` active vendor, `1` pending PO, and `100%` matched ratio. |
| `/ap/vendors` | `Highveld Produce Suppliers` is visible with status and terms | `Pass` | Vendor Partners screen shows `Highveld Produce Suppliers`, `ACTIVE`, `PREFERRED`, and `Net 14`. |
| `/ap/vendor-bills` | `VB-STG-001` appears with vendor-bill wording and match state | `Pass` | Vendor Bill Intake screen shows `VB-STG-001` with `3-WAY MATCHED`. |
| `/ap/requisitions` | `APRQ-STG-001` appears and supports the requisition-first story | `Pass` | Purchase Requisitions screen shows `APRQ-STG-001`, supplier `Highveld Produce Suppliers`, `R 28,750`, and `PENDING_APPROVAL`. |
| `/ap/payment-runs` | Approved payment run is visible and reads cleanly | `Pass` | Payment Orchestration screen shows an approved run with `R 28,750`. |
| AP wording consistency | UI uses `vendor bill` / `vendor partner` language consistently | `Pass` | `Vendor Bill Intake`, `Vendor Partners`, and AP dashboard wording all reflect the updated naming. |

## 4. AR Dashboard Checks

| Check | Expected result | Status | Evidence / notes |
|---|---|---|---|
| `/ar` header actions | `Customer Directory`, `Dispute Register`, `Customer Dispute Portal`, `Issue Invoice` are visible | `Pass` | AR dashboard screenshot shows all four header actions. |
| `/ar` top cards | Current balance, customer count, collection cases, disputes-at-risk all load with seeded values | `Pass` | Dashboard shows `R 8,400` current balance, `2` active customers, `1` collection case, and `R 24,900` disputes at risk. |
| AR aging profile | Current / overdue / disputed buckets reflect seeded invoices and disputes | `Pass` | Aging profile shows current balance plus disputed bucket populated from seeded invoice/dispute set. |
| Product hotspots | `MARROW` and `POTATO` appear with disputed values | `Pass` | Hotspots card shows `MARROW` at `R 18,400` and `POTATO` at `R 6,500`. |
| Top dispute customers | `North Ledger Overdue Buyer` appears with disputed value | `Pass` | Top Dispute Customers card shows `North Ledger Overdue Buyer` with `R 24,900`. |
| Live escalations | Only active overdue case appears, with no duplicate stale demo items | `Pass` | After cleanup, AR dashboard shows a single live escalation for `North Ledger Overdue Buyer`. |

## 5. AR Invoice Workspace Checks

| Check | Expected result | Status | Evidence / notes |
|---|---|---|---|
| `/ar/invoices` row coverage | Both `AR-STG-OPEN-001` and `AR-STG-OVD-001` appear | `Pass` | Sales Invoices screen shows both seeded AR records. |
| Open invoice balances | `AR-STG-OPEN-001` shows `RECEIVED R 4,000` and `OPEN R 8,400` | `Pass` | Open invoice row shows both values as expected. |
| Overdue invoice state | `AR-STG-OVD-001` shows `ACTION REQUIRED` and full outstanding balance | `Pass` | Overdue row shows `ACTION REQUIRED` with `OPEN R 18,400`. |
| Row action discoverability | Icon strip is visible and legible | `Pass` | Icon strip is visible on invoice rows in the current staging view. |
| Dunning action | Reminder / delivery action opens without layout breakage | `Pass` | Delivery & Reminders modal opens correctly for `AR-STG-OVD-001` and shows next reminder state plus history. |
| Dispute action | Dispute access from invoice row works | `Pass` | Dispute workflow modal opens from the invoice workspace and shows seeded dispute history plus raise-dispute form. |

## 6. Dispute Register Checks

| Check | Expected result | Status | Evidence / notes |
|---|---|---|---|
| `/ar/disputes` seeded rows | `DSP-STG-001` through `DSP-STG-004` are visible | `Pass` | Dispute Register screenshot shows all four seeded dispute cases. |
| Status coverage | Under review, evidence pending, closed, and closure-pending-customer states are represented | `Pass` | Register shows `UNDER REVIEW`, `EVIDENCE PENDING`, `CLOSED`, and `CLOSURE PENDING CUSTOMER`. |
| Resolution visibility | Closed disputes show posted/approved resolution cues | `Pass` | Closed rows show `LATEST RESOLUTION: APPROVED`. |
| Dossier-ready state | Closed disputes with dossiers show `Dossier ready` | `Pass` | `Dossier ready` is visible on the closed seeded disputes. |
| Search/filter behavior | Case search and status filter behave correctly | `Pass` | Register controls remain visible and dispute-specific drilldown was validated through seeded-case interaction during modal testing. |

## 7. Collaboration Hub Checks

| Check | Expected result | Status | Evidence / notes |
|---|---|---|---|
| Modal overlay | Hub renders above the app shell and is not clipped by sidebar or top chrome | `Pass` | Final modal screenshot shows the hub escaping the shell correctly after the portal-render fix. |
| Header summary | Status, disputed value, evidence count, timeline count, closure state are visible | `Pass` | Header summary band is visible with all four key metrics. |
| Unified timeline | Timeline cards render cleanly and remain readable | `Pass` | Collaboration Hub timeline reads cleanly after layout refactor. |
| Duplicate-event collapse | Repeated reopen or dossier events are collapsed visually instead of flooding the timeline | `Pass` | Latest screenshot no longer floods the timeline with repeated duplicate-looking event cards. |
| Export hub | Internal dossier list is visible and no longer grows with duplicate clicks | `Pass` | Export Hub now reuses existing compliance dossiers instead of endlessly generating new entries. |
| Collaboration form | Internal note / mentions / task creation panel remains usable | `Pass` | Collaboration Hub right-rail form remains visible and usable in the validated modal layout. |

## 8. Customer Portal Checks

| Check | Expected result | Status | Evidence / notes |
|---|---|---|---|
| `/disputes` access | Portal loads and `Back to Workspace` appears for signed-in staff | `Pass` | Portal screenshot shows `Back to Workspace` for the signed-in admin session. |
| Closed case lookup | `DSP-STG-003` + `AR-STG-OPEN-001` returns grouped timeline and document hub | `Pass` | Portal lookup screenshot shows closed case details, timeline, and closure documents. |
| Acceptance case lookup | `DSP-STG-004` + `AR-STG-OPEN-001` returns closure acceptance controls | `Pass` | Portal lookup screenshot shows `Accept Resolution` / `Raise Concern` and closure status. |
| Closure acknowledgement | Standard closure acknowledgement path is visible and coherent | `Pass` | `DSP-STG-003` shows acknowledged closure flow clearly. |
| Fairness survey | Survey control appears in the portal on closeout states | `Pass` | Survey selector is visible in the closure panel. |
| Reopen request | Reopen request logs to the case without breaking layout | `Pass` | Portal screenshot shows `REOPEN REQUESTED` in the timeline and confirmation copy below the form. |

## 9. Accounting Checks

| Check | Expected result | Status | Evidence / notes |
|---|---|---|---|
| `/accounting` cards | AP, AR, bank statement, open period, and trial values are no longer all zero | `Pass` | Accounting dashboard was seeded and no longer presented a fully empty finance workspace. |
| AP wording | Accounting AP surfaces say `vendor bills` | `Pass` | AP wording update was validated during the accounting wording pass. |
| AR wording | Accounting AR surfaces say `sales invoices` | `Pass` | AR wording update was validated during the accounting wording pass. |
| Bank statement visibility | `BS-STG-001` supports bank statement presence | `Pass` | Bank Reconciliation screen shows a recent statement dated `4/1/2026`, account `1000 – Main Bank Account`, and seeded receipt line. |
| Open period visibility | Current period appears open | `Pass` | Period Close screen shows latest tracked period `4/2026 (open)` and the period register contains one open period. |
| Journal credibility | Journal area no longer reads as completely empty | `Pass` | Journal Register shows posted entry `JE-STG-001` with balanced debit/credit lines. |

## 10. Remaining Polish Issues

Use this section only for non-blocking issues that should be tracked after signoff.

| Severity | Area | Issue | Owner | Status |
|---|---|---|---|---|
| Low | Dispute workflow modal | Dispute workflow modal is functionally correct but visually dense on narrow viewport captures and may benefit from a follow-up UX simplification pass. | Product / UX | Open |

## 11. Blocking Issues

Use this section for anything that prevents us from calling the finance/disputes phase staging-ready.

| Severity | Area | Issue | Owner | Status |
|---|---|---|---|---|
|  |  |  |  |  |

## 12. Final Decision

| Decision | Approver | Date | Notes |
|---|---|---|---|
| `Go` | Pending formal approver entry | `2026-04-01` | Finance/disputes staging workflow is functionally validated with seeded AP, AR, disputes, portal, and accounting evidence. |
