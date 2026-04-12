# AR Gap-Fix Plan

Purpose: align the current Accounts Receivable implementation with [AR_Module_Spec.md](/C:/CompanyOS/AR_Module_Spec.md) step by step without losing the working AR foundation already in place.

## Keep As-Is

- Customer onboarding basics in [frontend/src/app/(ops)/ar/customers/page.tsx](/C:/CompanyOS/frontend/src/app/(ops)/ar/customers/page.tsx) and [backend/src/modules/ar/ar.controller.ts](/C:/CompanyOS/backend/src/modules/ar/ar.controller.ts).
- Core AR invoice creation and sending in [frontend/src/app/(ops)/ar/invoices/page.tsx](/C:/CompanyOS/frontend/src/app/(ops)/ar/invoices/page.tsx) and [backend/src/modules/ar/ar.service.ts](/C:/CompanyOS/backend/src/modules/ar/ar.service.ts).
- Payment receipt recording in [backend/src/modules/ar/ar.service.ts](/C:/CompanyOS/backend/src/modules/ar/ar.service.ts).
- Receipt allocation controls and receipt history in [backend/src/modules/ar/ar.service.ts](/C:/CompanyOS/backend/src/modules/ar/ar.service.ts) and [frontend/src/app/(ops)/ar/invoices/page.tsx](/C:/CompanyOS/frontend/src/app/(ops)/ar/invoices/page.tsx).
- Aging buckets and live AR dashboard feed in [frontend/src/app/(ops)/ar/page.tsx](/C:/CompanyOS/frontend/src/app/(ops)/ar/page.tsx).
- Collection case workflow and live recoveries queue in [frontend/src/app/(ops)/ar/collections/page.tsx](/C:/CompanyOS/frontend/src/app/(ops)/ar/collections/page.tsx) and [backend/src/modules/ar/ar.service.ts](/C:/CompanyOS/backend/src/modules/ar/ar.service.ts).

## Rename

- Change any remaining generic `Flag Invoice` or queue-action wording to `Create Dispute Ticket` once dispute workflow lands.
- Keep `Record Payment` as the canonical label everywhere. Do not reintroduce `Post Payment`.
- Keep `Create Invoice` as the AR label. Do not let AR copy drift toward AP language such as `Bill`, `Vendor Invoice`, or `Supplier Invoice`.
- When credit-note functionality is added, use `Create Credit Note`, not `Reverse Invoice` or `Delete Invoice`.
- When order-linked invoicing is added, use `Generate Invoice From Sales Order` instead of generic `New Invoice` in order-driven contexts.

## Add Next

### Phase 1: Credit and Order Control

- Add sales order intake for AR-linked revenue orders.
- Add credit validation before invoice release:
  - credit limit check
  - overdue exposure check
  - block if customer is more than 90 days in arrears
- Add `Revenue at Risk` alerting for customers over 15% overdue against credit limit.

### Phase 2: Invoice Delivery and Dunning

- Add invoice delivery log with:
  - sent timestamp
  - delivery method
  - delivery confirmation state
- Add automated dunning workflow for 3 / 7 / 15 days overdue.
- Add reminder history visible on the invoice and collection case.
- Feed DSO and reminder activity into dashboard reporting.

### Phase 3: Disputes and Aging Pause

- Add dispute ticketing tied to invoices.
- Pause aging clock while dispute is open.
- Track dispute reason types:
  - short payment
  - pricing dispute
  - quality claim
  - delivery / POD dispute
- Show dispute state in AR dashboard and collection queue.

### Phase 4: GL and Cashflow Handoff

- Post AR invoices into the GL as AR subledger events.
- Post receipt applications into cash / AR clearing flows.
- Surface reconciliation events for receipts in accounting.
- Feed AR aging into runway, planned-vs-actual, and cash-balance views.

### Phase 5: Bad Debt and Controls

- Add bad debt provisioning workflow with journal creation.
- Add segregation-of-duties enforcement:
  - invoice creator cannot apply payments on the same invoice
- Add invoice lock after 48 hours from creation.
- Add full AR audit trail for:
  - invoice edits
  - sends
  - receipt application
  - disputes
  - write-offs
  - credit notes

### Phase 6: Agricultural Context

- Add product-level revenue tagging for:
  - Eggs
  - Irish Potato
  - Baby Marrow
- Add POD linkage before invoice release for wholesale flows.
- Add price variance alerts for invoices outside approved tolerance.
- Add prepayment or deposit controls for high-risk and new customers.
- Add mobile money receipt option for smaller buyers.

## Remove From AR

- Any AP language or vendor-facing copy from AR screens and endpoints.
- Any vendor invoice receipt flow.
- Any 3-way PO matching logic for standard AR flows.
- Any vendor management or vendor payment scheduling route under `/ar`.
- Any UI labels that could make AR look like AP.

Note:
- The spec allows return-related matching for credit notes, but that should be implemented as an AR return / credit-note control, not as AP-style 3-way PO matching.

## Recommended Execution Order

1. Add invoice delivery logging and automated dunning.
2. Add dispute ticketing with aging pause.
3. Add GL / reconciliation handoff from AR receipts and invoices.
4. Add credit validation and order blocking.
5. Add bad debt provisioning and AR audit controls.
6. Add agricultural tagging, POD gates, and price-variance controls.

## Strongest Spec Gaps Right Now

- No sales-order-driven invoice generation yet.
- No credit blocking or customer risk scoring yet.
- No invoice delivery confirmation log yet.
- No automated reminder sequence yet.
- No dispute ticket model with aging pause yet.
- No bad debt provisioning yet.
- No explicit AR-to-GL posting flow yet.
- No full AR audit trail yet.
- No product revenue tagging or POD release control yet.

## Practical Next Step

Best next implementation slice:

- `invoice delivery logging + automated dunning`

Why:

- It directly satisfies the next two big spec steps after invoice creation.
- It strengthens AR operations without needing a new cross-module architecture first.
- It sets up the right base for dispute handling, DSO, and dashboard health metrics.
