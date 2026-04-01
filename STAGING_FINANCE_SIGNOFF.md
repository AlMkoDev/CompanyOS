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
| Operator |  |
| Reviewer |  |
| Latest commit validated |  |
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
| `/ap` dashboard counts | Non-zero AP outstanding, active vendors, pending POs, matched ratio |  |  |
| `/ap/vendors` | `Highveld Produce Suppliers` is visible with status and terms |  |  |
| `/ap/vendor-bills` | `VB-STG-001` appears with vendor-bill wording and match state |  |  |
| `/ap/requisitions` | `APRQ-STG-001` appears and supports the requisition-first story |  |  |
| `/ap/payment-runs` | Approved payment run is visible and reads cleanly |  |  |
| AP wording consistency | UI uses `vendor bill` / `vendor partner` language consistently |  |  |

## 4. AR Dashboard Checks

| Check | Expected result | Status | Evidence / notes |
|---|---|---|---|
| `/ar` header actions | `Customer Directory`, `Dispute Register`, `Customer Dispute Portal`, `Issue Invoice` are visible |  |  |
| `/ar` top cards | Current balance, customer count, collection cases, disputes-at-risk all load with seeded values |  |  |
| AR aging profile | Current / overdue / disputed buckets reflect seeded invoices and disputes |  |  |
| Product hotspots | `MARROW` and `POTATO` appear with disputed values |  |  |
| Top dispute customers | `North Ledger Overdue Buyer` appears with disputed value |  |  |
| Live escalations | Only active overdue case appears, with no duplicate stale demo items |  |  |

## 5. AR Invoice Workspace Checks

| Check | Expected result | Status | Evidence / notes |
|---|---|---|---|
| `/ar/invoices` row coverage | Both `AR-STG-OPEN-001` and `AR-STG-OVD-001` appear |  |  |
| Open invoice balances | `AR-STG-OPEN-001` shows `RECEIVED R 4,000` and `OPEN R 8,400` |  |  |
| Overdue invoice state | `AR-STG-OVD-001` shows `ACTION REQUIRED` and full outstanding balance |  |  |
| Row action discoverability | Icon strip is visible and legible |  |  |
| Dunning action | Reminder / delivery action opens without layout breakage |  |  |
| Dispute action | Dispute access from invoice row works |  |  |

## 6. Dispute Register Checks

| Check | Expected result | Status | Evidence / notes |
|---|---|---|---|
| `/ar/disputes` seeded rows | `DSP-STG-001` through `DSP-STG-004` are visible |  |  |
| Status coverage | Under review, evidence pending, closed, and closure-pending-customer states are represented |  |  |
| Resolution visibility | Closed disputes show posted/approved resolution cues |  |  |
| Dossier-ready state | Closed disputes with dossiers show `Dossier ready` |  |  |
| Search/filter behavior | Case search and status filter behave correctly |  |  |

## 7. Collaboration Hub Checks

| Check | Expected result | Status | Evidence / notes |
|---|---|---|---|
| Modal overlay | Hub renders above the app shell and is not clipped by sidebar or top chrome |  |  |
| Header summary | Status, disputed value, evidence count, timeline count, closure state are visible |  |  |
| Unified timeline | Timeline cards render cleanly and remain readable |  |  |
| Duplicate-event collapse | Repeated reopen or dossier events are collapsed visually instead of flooding the timeline |  |  |
| Export hub | Internal dossier list is visible and no longer grows with duplicate clicks |  |  |
| Collaboration form | Internal note / mentions / task creation panel remains usable |  |  |

## 8. Customer Portal Checks

| Check | Expected result | Status | Evidence / notes |
|---|---|---|---|
| `/disputes` access | Portal loads and `Back to Workspace` appears for signed-in staff |  |  |
| Closed case lookup | `DSP-STG-003` + `AR-STG-OPEN-001` returns grouped timeline and document hub |  |  |
| Acceptance case lookup | `DSP-STG-004` + `AR-STG-OPEN-001` returns closure acceptance controls |  |  |
| Closure acknowledgement | Standard closure acknowledgement path is visible and coherent |  |  |
| Fairness survey | Survey control appears in the portal on closeout states |  |  |
| Reopen request | Reopen request logs to the case without breaking layout |  |  |

## 9. Accounting Checks

| Check | Expected result | Status | Evidence / notes |
|---|---|---|---|
| `/accounting` cards | AP, AR, bank statement, open period, and trial values are no longer all zero |  |  |
| AP wording | Accounting AP surfaces say `vendor bills` |  |  |
| AR wording | Accounting AR surfaces say `sales invoices` |  |  |
| Bank statement visibility | `BS-STG-001` supports bank statement presence |  |  |
| Open period visibility | Current period appears open |  |  |
| Journal credibility | Journal area no longer reads as completely empty |  |  |

## 10. Remaining Polish Issues

Use this section only for non-blocking issues that should be tracked after signoff.

| Severity | Area | Issue | Owner | Status |
|---|---|---|---|---|
|  |  |  |  |  |

## 11. Blocking Issues

Use this section for anything that prevents us from calling the finance/disputes phase staging-ready.

| Severity | Area | Issue | Owner | Status |
|---|---|---|---|---|
|  |  |  |  |  |

## 12. Final Decision

| Decision | Approver | Date | Notes |
|---|---|---|---|
| `Go` / `No-Go` |  |  |  |
