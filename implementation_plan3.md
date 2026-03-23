# Implementation Plan: VF-OPS-003 Supply Chain

## Scheduled Phases

### Sprint 0
- **INF-03**: Approval policy configuration service - Implement ApprovalPolicy model with configurable thresholds (auto-approve, L1, L2 amounts) per product category. Seed default policy from §2.1.2 matrix. Admin UI for policy configuration.

### Sprint 1
- **DB-01**: Prisma schema — core supply chain models - Implement Supplier, Product, Location, StockLedger, StockLevel, PurchaseRequisition, PRLineItem, PurchaseOrder, POLineItem, GoodsReceipt, GRLineItem models. All enums (SupplierStatus, LedgerEntryType, PRStatus, POStatus, GRStatus).
- **DB-02**: Prisma schema — premium & analytics models - Add SupplierRejection, PurchaseOrderAmendment, SupplierProduct, SupplierRisk, SupplierInvoice, UnmatchedReceipt, ApprovalPolicy, DemandForecast, SeasonalAdjustment, CycleCount, RFQ, SupplierQuote, COGSRecord models.
- **DB-03**: Seed script — initial data - Seed script for sample products, suppliers, locations, approval policy defaults, and initial stock levels.
- **INF-01**: S3 configuration for PO documents - Create /procurement/orders/{supplierId}/ folder structure in S3. Configure IAM policies for backend write access. Block public access. Enable server-side encryption. Configure presigned URL generation for secure document access.
- **INF-02**: Notification service integration - Configure email service for: PR approval request, PO dispatch to supplier, low stock alert, reorder alert, PO amendment notification, supplier rejection notification, overdue delivery alert.
- **INF-04**: OpenAPI spec for all endpoints - Generate and publish OpenAPI 3.0 spec for all 13 endpoints in §4.4. Full request/response schemas, error codes, auth requirements, pagination contracts.
- **BE-01**: Product & supplier CRUD - Create REST endpoints for Product catalog and Supplier directory management. Supplier code auto-generation (SUP-001 format). Status management (ACTIVE, SUSPENDED, BLACKLISTED). SupplierProduct linking for preferred supplier config.
- **BE-02**: Inventory ledger engine - Implement StockLedger with all 10 entry types from §4.2. Enforce immutability — no UPDATE or DELETE endpoints exist. Every stock change creates a ledger entry. Atomic transfer pair (TRANSFER_OUT + TRANSFER_IN) using database transaction.
- **BE-03**: Stock level aggregation & caching - Create service to calculate current stock from ledger sum per product per location. Cache results in StockLevel table. Invalidate cache on every ledger write. Expose aggregate (all locations) and per-location queries.
- **SEC-01**: API role guards - Implement NestJS guards: AdminGuard, FinanceGuard, ProcurementGuard, WarehouseGuard. Apply to all 13 endpoints per RBAC matrix §2.2.1. Self-approval prevention enforced at service layer.
- **SEC-02**: Ledger immutability enforcement - Ensure StockLedger has no UPDATE or DELETE endpoints. Add database-level trigger preventing direct updates. Add reconciliation job comparing ledger sum to cached StockLevel daily.
- **OPS-01**: Feature flag setup - Wrap entire Supply Chain module in ENABLE_SUPPLY_CHAIN feature flag. Module completely invisible (no routes, API endpoints, DB queries) when disabled.

### Sprint 2
- **BE-04**: Reorder alert service - Daily cron at 07:00 checking quantity <= reorderPoint per location. Real-time trigger on ledger write. Create Notification for Procurement. Optionally create draft PR at EOQ quantity for preferred supplier.
- **BE-05**: Procurement workflow — PR & approval chain - Implement PR CRUD with line items. Approval chain per ApprovalPolicy (INF-03). Self-approval blocked at service level. Budget check against VF-OPS-001 on submission. Multi-level approval routing.
- **BE-06**: Procurement workflow — PO generation & PDF - Implement PO creation from approved PR. PDF generation with supplier details, line items, payment terms, delivery address. Store PDF in S3. Email to supplier with PDF attachment. Preferred supplier suggestion engine.
- **BE-07**: Goods receipt & discrepancy handling - Implement GR endpoint with all four scenarios from §2.1.4: partial receipt, quality rejection (SupplierRejection record), over-receipt prevention (HTTP 422), receipt without PO (UnmatchedReceipt, Finance approval required). Stock update via ledger.
- **BE-08**: Supplier performance scoring - Calculate and update all four performance metrics on every GR: on-time delivery rate, quality rejection rate, lead time accuracy. Price accuracy rate deferred to Phase 4 AP integration. Composite risk score (0–100).
- **BE-09**: Audit logging interceptor - Log all state-changing actions: stock adjustments (with reason code and user), PO approvals, PR approvals, supplier status changes, adjustment approvals. All entries immutable.
- **FE-01**: Supply chain dashboard - Build /ops/supply-chain/dashboard with: StockAlerts (below reorder + predicted stockouts), PendingDeliveries (POs expected this week), InventoryValuation (total £ value), WorkingCapitalWidget, ABCDistributionChart.
- **FE-02**: Inventory catalog - Build /ops/supply-chain/inventory searchable table with: stock levels per location, ABC class badge, reorder status indicator, unit cost (Finance role only), click-through to ledger history.
- **FE-04**: Procurement queue — PR approvals - Build /ops/supply-chain/procurement PR approval interface. List of pending PRs sorted by value and urgency. Approve/Reject/Return actions. Multi-level approval status indicator. Budget check result visible.
- **FE-07**: Stock adjustment modal - Build manual stock adjustment form. Requires reason code selection. Shows approval requirement indicator when value exceeds £1,000 threshold. Dual-entry confirmation for large adjustments.
- **FE-08**: RBAC frontend guards - Implement route guards and component-level permission checks per RBAC matrix in §2.2.1. Unit cost hidden for non-Finance. Create PO button absent for non-Procurement. Approve PR button absent for PR requesters.
- **SEC-03**: PO modification lock & amendment enforcement - Prevent PO edits after status = SENT. API rejects changes to locked POs with HTTP 423 (Locked). Only amendment workflow (BE-10) allows changes to sent POs.
- **SEC-04**: Financial data masking - Ensure unitCost and all valuation fields are accessible only to Finance and Admin roles. API returns null for masked fields for Procurement and Warehouse roles.
- **SEC-05**: Supplier bank detail change controls - Require Finance Director approval for any supplier bank detail or payment information change. Dual verification notification sent to separate Finance contact. All changes audit logged.
- **SEC-06**: Audit log integrity - Ensure all audit log entries are immutable. No DELETE or PUT endpoints on AuditLog. Reconciliation check confirms no gaps in sequence.
- **QA-01**: Unit tests — inventory ledger math - Jest tests for: ledger sum = stock level for all 10 entry types, atomic transfer rollback, partial GR quantity tracking, over-receipt rejection, quality rejection exclusion from stock.
- **QA-02**: Unit tests — procurement workflow - Jest tests for: approval chain routing per policy, self-approval rejection, multi-level approval flow, PO modification lock, PR state machine all transitions.

### Sprint 3
- **BE-10**: PO amendment workflow - Implement PurchaseOrderAmendment with versioning. Original PO preserved as read-only. Amendment re-runs approval chain if value increases above threshold. Supplier notified by email with amendment details. Supplier acknowledgement tracked.
- **BE-11**: Three-way matching engine - Implement SupplierInvoice CRUD. Automatic matching against PurchaseOrder (price/quantity) and GoodsReceipt (delivered quantity). Discrepancy detection and routing. Approved invoices create AP payment record stub.
- **BE-12**: Demand forecasting service - 12-month rolling average consumption with seasonal adjustment. DemandForecast records per SKU per location for 30/60/90 day windows. Monthly EOQ recalculation. Dynamic reorder point update.
- **BE-14**: Supplier risk register - Implement SupplierRisk CRUD. Single-source dependency detection (only one active supplier for a product category). Alert when single-source supplier risk score drops below 60.
- **BE-16**: Stock valuation service - Implement FIFO, weighted average cost, and standard cost valuation methods. Real-time total portfolio valuation updated on every ledger write. Valuation by location, ABC class, category, supplier.
- **BE-20**: Cycle count workflow - Implement CycleCount model and workflow. Frequency driven by ABC class (A=quarterly, B=bi-annually, C=annually). Count results create CYCLE_COUNT ledger entries for variance. Variance report.
- **FE-03**: Stock ledger history view - Build ledger history panel per product showing all entries in reverse chronological order. Entry type badges, quantity change, running balance, user, timestamp, reason code (for adjustments).
- **FE-05**: PO manager - Build PO list and detail view. View/edit draft POs. Send to supplier button (triggers PDF generation and email). PO PDF preview. Amendment creation workflow.
- **FE-06**: Goods receipt wizard - Build step-by-step GR wizard: (1) Select PO, (2) Input quantities received per line item, (3) Flag quality rejections with reason, (4) Select receiving location, (5) Confirm and submit. Shows partial receipt status.
- **FE-09**: Supplier directory & scorecard - Build /ops/supply-chain/suppliers list with 4-metric scorecard badges per supplier. Risk score band colour-coding. Click-through to supplier detail: contact info, contract history (VF-LEG-001 link), performance trend charts, risk register.
- **FE-10**: Multi-location stock view - Build location selector on inventory catalog. Per-location stock breakdown per SKU. Inter-location transfer request UI. In-transit stock indicator. Network optimisation suggestions (overstocked vs understocked locations).
- **FE-11**: PO amendment UI - Build amendment creation flow accessible from locked PO detail page. Shows original vs proposed changes. Re-approval status tracker. Supplier acknowledgement status.
- **FE-12**: Three-way match panel - Build matching status panel on PO detail page. Shows PO lines, GR quantities, and invoice lines side by side. Variance highlighting. Dispute resolution workflow.
- **QA-03**: Integration tests — full procurement flow - Flow 1: Create PR ? approve (single level) ? create PO ? record full GR ? verify stock increase ? verify ledger entries. Flow 2: Create PR ? approve (multi-level) ? create PO ? partial GR ? quality rejection ? verify PO PARTIAL status.
- **QA-04**: Security penetration test - Attempt: (1) DELETE/UPDATE StockLedger via API and direct DB. (2) Approve own PR. (3) Edit locked PO. (4) Access unit cost as Warehouse. (5) Change supplier bank details without Finance Director role. (6) Access PO PDF via direct S3 link.
- **QA-05**: E2E test — goods receipt workflow - Playwright: Login as Warehouse ? Find PO ? Open GR wizard ? Input received quantities ? Flag quality rejection on one line ? Submit ? Verify stock increase for accepted lines ? Verify rejected lines not in stock.
- **QA-06**: E2E test — procurement approval chain - Playwright: Login as Procurement ? Create PR (£10,000 value) ? Verify routed to Line Manager ? Login as Line Manager ? Approve ? Verify routed to Finance Director ? Login as Finance Director ? Approve ? Verify PO can be created.
- **OPS-03**: Stock take CSV import tool - Build CSV import tool for opening balance upload. Template with required fields. Validation (duplicate product codes, unknown locations, negative quantities). Bulk OPENING_BALANCE ledger entry creation.
- **OPS-04**: Cron job monitoring - Configure monitoring for: reorder alert cron failure, demand forecast batch job failure, reconciliation job failure (ledger sum vs StockLevel discrepancy), notification delivery failures.

### Sprint 4
- **BE-13**: ABC/XYZ classification engine - Calculate ABC classification from inventory value contribution. Calculate XYZ from demand variance coefficient. Store as Product.abcClass, Product.xyzClass. Update monthly. Drive differentiated cycle count frequencies.
- **BE-15**: RFQ management service - Implement RFQ CRUD. Supplier invitation. Quote submission endpoint (supplier-facing or manual input). Quote comparison scoring. Mandate RFQ for high-value procurement above configurable threshold.
- **BE-17**: COGS tracking & VF-OPS-001 integration - Every LEDGER_OUT (project allocation, write-off) creates COGSRecord linked to VF-OPS-001 project. Actual material costs flow to project actual spend automatically.
- **BE-18**: Predictive stockout detection - Combine demand forecast, current stock, in-transit quantities, and supplier lead time to predict stockout date per SKU per location. Prioritised alert queue showing urgency.
- **BE-19**: Spend analytics service - Category spend analysis (total spend by category, supplier, cost centre, project over 12 months). Maverick spend detection (purchases bypassing preferred supplier or contracted rate).
- **FE-13**: Demand forecast & EOQ view - Build forecasting dashboard: demand forecast charts (30/60/90 day) per SKU, EOQ calculator widget, dynamic reorder point visualisation, data sufficiency indicator.
- **FE-14**: Predictive stockout list - Build prioritised stockout prediction list on dashboard. Shows days-to-stockout per SKU, in-transit quantities, recommended action (order now vs transfer from another location).
- **FE-15**: ABC/XYZ matrix view - Build ABC/XYZ classification matrix showing portfolio distribution. Heat map of SKUs by combined class. Click quadrant to see filtered catalog. Cycle count schedule per class.
- **FE-16**: Stock valuation reports - Build /ops/supply-chain/reports with: stock valuation by method/location/category, SLOB report (items with no movement >90 days), inventory turnover chart, estimated write-down value.
- **FE-17**: Spend analytics dashboard - Build spend analytics with: category spend bar charts, supplier spend pie chart, maverick spend table, cost centre breakdown, 12-month trend line.
- **FE-18**: RFQ management UI - Build RFQ creation form with supplier invitation. Quote submission panel (manual input). Quote comparison matrix with auto-highlighted best value per line. RFQ mandate enforcement warning.
- **QA-07**: Performance testing - Load test: inventory dashboard at 10,000 SKUs. Ledger entry creation under concurrent GRs. Procurement pipeline query at 500 open PRs/POs. Stock level aggregation after bulk import.
- **QA-08**: UAT — warehouse & procurement teams - Warehouse team performs real stock count and GR workflow. Procurement team creates and approves real PRs, raises POs, manages supplier communications.
- **OPS-02**: Production migration + rollback plan - Run Prisma migrations on production DB. Zero-downtime using expand-contract pattern. Rollback script authored and tested in staging. Post-migration smoke test.
- **OPS-05**: User training programme - Workshop for Warehouse team (stock receipt, adjustments, transfers) and Procurement team (PR creation, PO management, supplier communication). Training materials and video walkthroughs.
- **OPS-06**: Phase 1 & 2 rollout — data import - Import Product Catalog and Supplier Directory. Configure approval policies. Configure locations. Perform physical stock count. Import opening balances via OPS-03.

## Verification Plan
### Automated Tests
- Run DB schema migrations and tests.
### Manual Verification
- Manual verification of CSV imports and workflows.