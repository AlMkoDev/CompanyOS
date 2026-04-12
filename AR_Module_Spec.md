North Ledger

**Accounts Receivable Module**

**Functional Specification for AI Coding Agent**

Version 1.0  •  March 2026  •  Agricultural B2B/B2C Context  •  Internal Use Only

# **1\. Objective**

Build the Accounts Receivable (AR) module. This specification defines the required workflow steps, features, boundary rules, and dashboard integration points for the coding agent.

**Core Principle:** AR is where invoices are created and sent to customers. The AP module receives invoices from vendors. These are separate modules with a hard boundary — no AR function should appear in AP and vice versa.

# **2\. AR vs. AP — Boundary Rule**

Enforce this boundary at the UI, API, and data model levels. No AR screen or endpoint should expose vendor-side payment or purchasing logic.

| Module | Purpose | Invoice Direction |
| :---- | :---- | :---- |
| Accounts Receivable (AR) | Track money customers owe your organisation | You create and send invoices |
| Accounts Payable (AP) | Track money your organisation owes to suppliers | You receive invoices from vendors |

# **3\. AR Workflow — Required Steps**

Implement the following 12 steps in sequence. Each step must be logged in the audit trail and visible from the AR dashboard.

| Step | Action | Owner | Key Output | North Ledger Integration |
| :---- | :---- | :---- | :---- | :---- |
| 1\. Customer Onboarding | Collect customer details, tax ID, payment terms, credit limits | Sales / Finance | Approved customer master record | Sync to Customers module; flag high-risk accounts |
| 2\. Order Receipt | Capture order (email, portal, phone) for eggs / potatoes / marrow | Sales / Operations | Sales Order (SO) | Auto-create SO entry; link to inventory levels |
| 3\. Credit Validation | Check credit limit, payment history, outstanding AR balance | Finance / AP | Credit approval or denial | Real-time credit health score; block orders if \>90-day arrears |
| 4\. Invoice Creation | Generate invoice with item, quantity, unit price, VAT, due date, PO reference | AR Team / System | Official Invoice (PDF / EDI) | Auto-post to AR subledger; trigger Revenue KPI update |
| 5\. Invoice Delivery | Send via email, portal, or print; log delivery confirmation | AR / Admin | Delivery receipt | Track Invoice Sent timestamp for DSO calculation |
| 6\. Goods Fulfillment | Pick, pack, dispatch; record proof of delivery (POD) | Logistics | POD document | Link POD to invoice for dispute resolution |
| 7\. AR Ledger Posting | Record invoice in GL: Dr Accounts Receivable, Cr Revenue | System / Accountant | Journal entry | Update Revenue KPI card; feed cash flow forecast |
| 8\. Payment Monitoring | Track due dates; auto-send reminders at 3 / 7 / 15 days overdue | AR Automation | Dunning log | Feed Aging Report widget; alert on \>30-day delays |
| 9\. Payment Receipt | Record bank transfer, cheque, mobile money; match to invoice | Finance | Payment confirmation | Auto-reconcile; update Cash Balance KPI; reduce AR balance |
| 10\. Dispute Handling | Log short payments, quality claims, or pricing disputes | AR / Customer Service | Dispute ticket | Flag in dashboard; pause aging clock until resolved |
| 11\. Bad Debt Provision | Assess uncollectible invoices; create allowance per policy | Finance Manager | Provision journal | Adjust Net Profit KPI; reflect in Health Score gauge |
| 12\. Reporting & Analysis | Generate AR aging, DSO, collection effectiveness, revenue by product | Finance | Management reports | Power North Ledger widgets: Revenue Trend, Runway Impact, Product Profitability |

# **4\. Required Features — Include vs. Exclude**

The table below defines what must and must not appear in the AR module. Excluded features must not be accessible from any AR screen, form, or API endpoint.

|  | Feature | Notes |
| :---- | :---- | :---- |
| ✅ | Auto-invoice generation from sales orders | Reduce manual entry errors |
| ✅ | Invoice delivery (email, portal, print) with timestamp logging | Required for DSO tracking |
| ✅ | AR subledger posting (Dr AR, Cr Revenue) | Core AR function |
| ✅ | Automated dunning / payment reminders (3/7/15-day) | Core AR function |
| ✅ | Payment receipt and matching (bank, cheque, mobile money) | Core AR function |
| ✅ | Dispute ticketing with aging clock pause | Core AR function |
| ✅ | Bad debt provisioning with journal creation | Core AR function |
| ✅ | Product-level revenue tagging (Eggs, Irish Potato, Baby Marrow) | Agricultural context |
| ✅ | AR aging report export for North Ledger widgets | Dashboard integration |
| ✅ | Credit limit validation with order blocking rules | Cashflow protection |
| ❌ | Invoice receipt from vendors | This is AP — not AR |
| ❌ | 3-way PO matching | This is AP — not AR |
| ❌ | Vendor payment scheduling | This is AP — not AR |

# **5\. Agricultural Context Optimisations**

Given North Ledger's zero-income challenge on key revenue streams (eggs, Irish potato, baby marrow), embed the following controls into the AR module.

## **5.1 Cashflow Acceleration**

* Require pre-payment or deposit from new and high-risk customers — especially for perishable goods.

* Dynamic discounting: offer 2% discount for payment within 7 days on potato and egg orders.

* Automated SMS/email reminders synced to harvest and delivery dates to reduce DSO.

* Mobile money integration for smallholder buyers to speed up collections.

## **5.2 Revenue Protection Controls**

* Mandatory POD before invoice release for wholesale buyers — prevent 'goods received, invoice disputed' gaps.

* Product-level revenue tagging: tag each invoice line to Eggs, Irish Potato, or Baby Marrow for granular performance tracking.

* Price variance alerts: flag invoices where unit price deviates more than 5% from the approved price list to prevent revenue leakage.

## **5.3 Critical Controls — Revenue Leakage Prevention**

* Segregation of duties: the person creating an invoice must not be the person applying payments.

* Mandatory 3-way match for returns: credit note \= return authorisation \+ goods receipt \+ original invoice.

* Auto-lock invoices 48 hours after creation to prevent post-hoc price changes.

* Daily AR reconciliation: match bank deposits to open invoices; investigate unapplied cash immediately.

* Full audit trail: log all invoice edits, approvals, and write-offs with user ID and timestamp.

# **6\. North Ledger Dashboard Integration**

The AR module must feed the following dashboard components in real time. Each data point must be clearly sourced from the AR subledger.

| Dashboard Component | AR Data Source | Purpose |
| :---- | :---- | :---- |
| Revenue KPI Card | Sum of posted invoices (net of returns) | Track daily/weekly revenue recovery |
| Planned vs Actual Graph | Budgeted sales vs. invoiced amount | Identify shortfalls early |
| Health Score (88/100) | Weighted: DSO, % overdue, bad debt ratio | Monitor AR process health |
| Runway Gauge (14 months) | Cash inflow forecast from AR aging | Project liquidity impact of collection delays |
| Aging Report Widget | Bucketed AR: Current, 1-30, 31-60, 61-90, 90+ days | Prioritise collection efforts |

# **7\. Implementation Notes**

## **7.1 Naming Conventions**

Use the following labels precisely. Inconsistent labelling creates audit risk and confusion with the AP module.

| Correct Label | Do NOT Use |
| :---- | :---- |
| Create Invoice | New Bill, Add Vendor Invoice (those belong in AP) |
| Manual AR Entry | anything implying AP or purchasing |
| Create Credit Note | Reverse Invoice, Delete Invoice |
| Record Payment | Post Payment (use consistently for clarity) |
| Create Dispute Ticket | Flag Invoice, Query Invoice |

## **7.2 Strict Out-of-Scope Items**

The following must not appear in the AR module codebase, UI, or API — even behind feature flags:

* Any route, endpoint, or component that receives or processes vendor invoices.

* Any 3-way PO matching logic (PO \+ receipt \+ invoice) — this belongs in AP.

* Any vendor payment scheduling or vendor management screens.

* Any UI element that could be mistaken for AP vendor invoice entry.

## **7.3 AR ↔ AP ↔ Cash Flow Handoff**

The AR module must participate in the closed-loop cashflow cycle. Implement the following data handoffs:

* AR aging data feeds the Runway Gauge and Planned vs Actual graph in the dashboard.

* Cash receipts posted in AR auto-update the Cash Balance KPI and reduce the open AR balance.

* Bad debt provisions from AR feed the Net Profit KPI and Health Score gauge.

* Payment receipts trigger reconciliation events visible in the GL — not managed manually.

## **7.4 Implementation Checklist**

* Enable auto-invoice generation from sales orders to reduce manual entry errors.

* Integrate mobile money and bank APIs for real-time payment posting.

* Configure product-level revenue tags for eggs, potatoes, and marrow.

* Set up automated dunning sequences with escalation rules at 3, 7, and 15 days.

* Build AR aging export to feed the North Ledger Planned vs Actual graph.

* Add Revenue at Risk alert: flag customers with more than 15% of credit limit overdue.

**Document Control**

| Version | Date | Status | Owner |
| :---- | :---- | :---- | :---- |
| 1.0 | March 2026 | Draft | North Ledger Product |

