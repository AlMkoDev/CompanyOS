North Ledger

**Accounts Payable Module**

**Functional Specification for AI Coding Agent**

Version 1.0  •  March 2026  •  Internal Use Only

# **1\. Objective**

Build the Accounts Payable (AP) module. This specification defines the required features, workflow steps, boundary rules, and audit controls.

**Critical Rule:** Do not include a "Create Invoice" function in the AP module. Invoice creation belongs exclusively to the Accounts Receivable (AR) module.

# **2\. AP vs. AR — Boundary Rule**

The following table defines the hard architectural boundary between AP and AR. This boundary must be enforced at the UI, API, and data model levels.

| Module | Purpose | Invoice Direction |
| :---- | :---- | :---- |
| Accounts Payable (AP) | Track money your organisation owes to suppliers | You receive invoices |
| Accounts Receivable (AR) | Track money customers owe to your organisation | You create and send invoices |

# **3\. AP Workflow — Required Steps**

Implement the following seven steps in sequence. Each step must be accessible from the AP dashboard and logged in the audit trail.

| Step | Action | Document Owner |
| :---- | :---- | :---- |
| 1\. Purchase Requisition | Internal request for goods/services | Internal team |
| 2\. Purchase Order (PO) | Formal order sent to vendor | Internal team creates PO |
| 3\. Goods/Services Receipt | Delivery confirmation recorded | Vendor delivers; team records |
| 4\. Invoice Receipt | Vendor bill received and logged | Vendor creates & sends invoice |
| 5\. Invoice Verification | 3-way matching: PO \+ receipt \+ invoice | AP team verifies |
| 6\. Approval & Payment | Route for approval, schedule payment | Team approves & pays |
| 7\. Reconciliation | Post payment to General Ledger | Team records in GL |

# **4\. Required Features — Include vs. Exclude**

The table below defines what must and must not appear in the AP module. Excluded features must not be accessible from any AP screen, form, or API endpoint.

|  | Feature | Notes |
| :---- | :---- | :---- |
| ✅ | Invoice receipt and ingestion | Core AP function |
| ✅ | 3-way matching (PO \+ receipt \+ invoice) | Core AP function |
| ✅ | Approval workflows | Core AP function |
| ✅ | Payment scheduling | Core AP function |
| ✅ | Vendor management | Core AP function |
| ✅ | Manual AP Entry (non-PO expenses) | Label clearly — NOT 'Create Invoice' |
| ❌ | Create Invoice (any form) | Belongs to AR module only |
| ❌ | Invoice generation / outbound billing | Belongs to AR module only |

# **5\. Edge Cases — Permitted AP-Adjacent Functions**

The following edge cases are permitted within AP but must be implemented as distinct, clearly labelled functions. They must never be labelled "Create Invoice".

| Edge Case | Correct Label | Description |
| :---- | :---- | :---- |
| Self-Billing / ERS | Generate Self-Bill Document | Buyer-generated invoice based on PO \+ receipt data |
| Credit Memos / Debit Notes | Create Adjustment Note | Correct or reverse a vendor invoice |
| Internal Chargebacks | Create Internal Charge | Cost allocation between departments |
| Non-PO Expense Entry | Manual AP Entry | Ad-hoc expenses (e.g. utilities) without a formal PO |

# **6\. Audit and Control Requirements**

The following controls are mandatory. Implement each as a system-enforced rule, not a user preference.

* Flag all Manual AP Entries for secondary approval before payment can be scheduled.

* Log all 3-way match exceptions with a reason code and timestamp.

* Block payment scheduling on any invoice that is unmatched or unapproved.

* Maintain an immutable audit trail for all AP transactions — no deletions, only reversals.

* Require two-factor approval for payments above configurable thresholds.

# **7\. Implementation Notes**

## **7.1 Naming Conventions**

Use the following labels precisely. Inconsistent labelling creates audit risk and user confusion:

| Correct Label | Do NOT Use |
| :---- | :---- |
| Manual AP Entry | Create Invoice, New Invoice, Add Invoice |
| Generate Self-Bill Document | Create Invoice, Self-Invoice |
| Create Adjustment Note | Credit Invoice, New Credit |
| Create Internal Charge | Internal Invoice, Charge Invoice |

## **7.2 Strict Out-of-Scope Items**

The following must not appear anywhere in the AP module codebase, UI, or API — even behind feature flags:

* Any route, endpoint, or component named CreateInvoice, NewInvoice, or similar.

* Any form that generates an outbound invoice directed at an external party.

* Any UI element in AP that could be mistaken for AR invoice generation.

## **7.3 Cashflow Control Alignment**

In line with North Ledger's strict cashflow controls, the AP module must:

* Surface a real-time payables summary on the AP dashboard (total outstanding, overdue, upcoming).

* Support configurable payment run schedules to manage outgoing cashflow.

* Integrate payment data directly into the GL reconciliation view.

**Document Control**

| Version | Date | Status | Owner |
| :---- | :---- | :---- | :---- |
| 1.0 | March 2026 | Draft | North Ledger Product |

