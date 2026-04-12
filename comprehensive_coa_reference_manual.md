# Comprehensive Chart of Accounts Reference Manual

**Version:** 1.0  
**Status:** Master Reference Document  
**Supersedes:** account_structure_detail.md · complete_coa_tree.md · detailed_accounts_tree.md  
**Review Frequency:** Annual or upon material COA change  
**Document Owner:** Controller / Chief Financial Officer  

---

## Table of Contents

1. [Document Purpose and Scope](#1-document-purpose-and-scope)
2. [Foundations: Account Structure Design](#2-foundations-account-structure-design)
   - 2.1 [Account Hierarchy and Numbering System](#21-account-hierarchy-and-numbering-system)
   - 2.2 [Parent and Child Account Relationships](#22-parent-and-child-account-relationships)
3. [Account Categories, Types, and Sub-types](#3-account-categories-types-and-sub-types)
   - 3.1 [The Five Primary Categories](#31-the-five-primary-categories)
   - 3.2 [Asset Types and Sub-types](#32-asset-types-and-sub-types)
   - 3.3 [Liability Types and Sub-types](#33-liability-types-and-sub-types)
   - 3.4 [Equity Types and Sub-types](#34-equity-types-and-sub-types)
   - 3.5 [Revenue Types and Sub-types](#35-revenue-types-and-sub-types)
   - 3.6 [Expense Types and Sub-types](#36-expense-types-and-sub-types)
4. [The Integrated Chart of Accounts](#4-the-integrated-chart-of-accounts)
   - 4.1 [Legend and Column Definitions](#41-legend-and-column-definitions)
   - 4.2 [1000 — Assets](#42-1000--assets)
   - 4.3 [2000 — Liabilities](#43-2000--liabilities)
   - 4.4 [3000 — Equity](#44-3000--equity)
   - 4.5 [4000 — Revenue](#45-4000--revenue)
   - 4.6 [5000 — Cost of Goods Sold](#46-5000--cost-of-goods-sold)
   - 4.7 [6000 — Operating Expenses](#47-6000--operating-expenses)
   - 4.8 [7000 — Other Income and Expenses](#48-7000--other-income-and-expenses)
   - 4.9 [8000 — Income Tax](#49-8000--income-tax)
5. [Account Governance Policy](#5-account-governance-policy)
6. [Internal Controls and Security](#6-internal-controls-and-security)
   - 6.1 [Access Controls and Segregation of Duties](#61-access-controls-and-segregation-of-duties)
   - 6.2 [Audit Trail Requirements](#62-audit-trail-requirements)
   - 6.3 [Fraud Prevention Controls](#63-fraud-prevention-controls)
   - 6.4 [Period-End Controls](#64-period-end-controls)
   - 6.5 [Sensitive Account Register](#65-sensitive-account-register)
   - 6.6 [Journal Entry Controls](#66-journal-entry-controls)
7. [Implementation Reference](#7-implementation-reference)
   - 7.1 [Database Schema](#71-database-schema)
   - 7.2 [System Features Required](#72-system-features-required)
   - 7.3 [Validation and Business Rules](#73-validation-and-business-rules)
   - 7.4 [Data Integrity, Backup, and Disaster Recovery](#74-data-integrity-backup-and-disaster-recovery)
8. [Best Practices and Maintenance](#8-best-practices-and-maintenance)
9. [Regulatory and Compliance Considerations](#9-regulatory-and-compliance-considerations)
10. [Appendices](#10-appendices)
    - A. [Account Range Quick Reference Map](#appendix-a-account-range-quick-reference-map)
    - B. [Financial Statement Mapping Table](#appendix-b-financial-statement-mapping-table)
    - C. [Normal Balance Summary](#appendix-c-normal-balance-summary)
    - D. [Reconciliation Frequency Matrix](#appendix-d-reconciliation-frequency-matrix)
    - E. [COA Statistics](#appendix-e-coa-statistics)
    - F. [Change Log](#appendix-f-change-log)

---

## 1. Document Purpose and Scope

This document is the single authoritative reference for the organisation's Chart of Accounts (COA). It combines structural design theory, the complete account listing, internal control requirements, implementation guidance, governance policy, and compliance considerations into one integrated manual.

### Intended Audiences

**Accounting and Finance Staff** — use Parts 3 and 4 for day-to-day account lookup, and Part 6 for controls guidance when posting unusual transactions.

**Controllers and Finance Managers** — use Parts 2, 3, 5, and 6 for governance, period-end procedures, and account maintenance decisions.

**System Administrators and Implementors** — use Parts 2, 7, and the Appendices for system configuration, schema design, and validation rules.

**Internal and External Auditors** — use Parts 4, 5, 6, and the Appendices as the primary COA evidence package.

### Scope

This document covers all general ledger accounts used in the organisation's accounting system. Sub-ledger accounts (individual customer, vendor, employee, and asset records) are governed by their respective sub-ledger policies but must reconcile to the GL accounts defined in Part 4.

### Document Control

Changes to this document require formal approval per the COA Change Policy in Part 5. All approved changes are recorded in Appendix F. Readers should verify they are consulting the current version before making COA decisions.

---

## 2. Foundations: Account Structure Design

### 2.1 Account Hierarchy and Numbering System

#### Purpose

The account numbering system provides a logical, standardised way to identify and organise accounts within the chart of accounts. It enables quick identification of account types, supports sorting and reporting, and accommodates multi-level account groupings.

#### Numbering Structure

This COA uses a four-digit base numbering system, with optional suffix extensions for departmental or dimensional tracking.

**Base Structure: XXXX**
- First digit — Major account category (1 = Assets, 2 = Liabilities, 3 = Equity, 4 = Revenue, 5 = COGS, 6 = Operating Expenses, 7 = Other Income/Expenses, 8 = Income Tax)
- Second digit — Account group within category
- Third and fourth digits — Specific account or sub-account

**Extended Structure with Dimensions: XXXX-DD**
- Suffix DD — Department, cost centre, or project code (optional, configured per organisation)

**Example:**
```
6111    Executive Salaries (base account)
6111-01 Executive Salaries — Sales Division (with department suffix)
6111-02 Executive Salaries — Operations Division
```

#### Range Allocation

| Range | Category |
|-------|----------|
| 1000–1999 | Assets |
| 2000–2999 | Liabilities |
| 3000–3999 | Equity |
| 4000–4999 | Revenue |
| 5000–5999 | Cost of Goods Sold |
| 6000–6999 | Operating Expenses |
| 7000–7999 | Other Income and Expenses |
| 8000–8999 | Income Tax |

Within each major category, sub-ranges are allocated as follows:

**Assets (1000–1999)**
- 1100–1499: Current Assets
- 1500–1599: Fixed Assets (PP&E)
- 1600–1699: Intangible Assets
- 1700–1799: Long-term Investments
- 1800–1999: Other Non-current Assets

**Liabilities (2000–2999)**
- 2100–2699: Current Liabilities
- 2700–2999: Long-term Liabilities

**Equity (3000–3999)**
- 3100–3199: Shareholders' Equity (Corporation)
- 3200–3299: Owner's Equity (Sole Proprietorship)
- 3300–3399: Partners' Equity (Partnership)
- 3900–3999: Current Year Earnings

**Revenue (4000–4999)**
- 4100–4199: Operating Revenue
- 4200–4299: Non-Operating Revenue
- 4900–4999: Contra-Revenue

**Expenses (5000–6999)**
- 5000–5999: Cost of Goods Sold
- 6000–6999: Operating Expenses

#### Numbering Design Principles

1. **Scalability** — Gaps are intentionally left within ranges (e.g. 1111, 1112, 1113 leaving 1114–1119 for future cash accounts) to accommodate future accounts without restructuring.
2. **Consistency** — A uniform digit pattern is maintained across all categories.
3. **Memorability** — Related accounts cluster in sequential ranges so users can navigate without looking up every code.
4. **Standardisation** — The structure is aligned with IFRS presentation requirements (current/non-current split, operating/non-operating split).
5. **Reserved ranges** — The x00 and x90 codes within each group are reserved for header accounts and contra accounts respectively (e.g. 1290 — Allowance for Doubtful Accounts is the contra to the 1200 Accounts Receivable group; 1390 — Inventory Reserve is the contra to the 1300 Inventory group).

#### System Features Required for Numbering

- Account number uniqueness validation before saving
- Format compliance check against defined pattern
- Auto-suggestion of next available number in a sequence
- Range validation to prevent misclassification (e.g. blocking an expense account in the 1000 range)
- Reserved number detection
- Support for account renumbering with automatic transaction history update
- Search by number or number range

---

### 2.2 Parent and Child Account Relationships

#### Purpose

Parent-child relationships create a hierarchical structure that organises accounts into logical groups and enables roll-up reporting, where child account balances automatically aggregate to their parent accounts.

#### Account Levels

```
Level 1:  Major Category         e.g.  1000 — ASSETS
Level 2:  Account Group          e.g.  1100 — Current Assets
Level 3:  Account Sub-group      e.g.  1110 — Cash and Cash Equivalents
Level 4:  Specific Account       e.g.  1113 — Main Checking Account
Level 5:  Sub-account (optional) e.g.  1113-01 — Main Checking — Operating
```

The maximum recommended hierarchy depth is five levels. Deeper structures become difficult to maintain and may cause reporting performance issues.

#### Header Accounts (Parent — No Posting Allowed)

- Cannot have transactions posted directly to them
- Exist purely for organisational and reporting purposes
- Balance is the sum of all child account balances (automatic roll-up)
- Can have multiple levels of children
- Used for subtotals in financial reports
- Identified by the 🏢 symbol in the COA listing

#### Posting Accounts (Leaf — Transactions Allowed)

- Accept direct transaction entries from journals, sub-ledgers, and automated processes
- Represent the actual GL accounts where money flows
- Must always have a parent (orphan accounts are not permitted)
- Contribute their balance to all ancestor account totals
- Identified by the 📄 symbol in the COA listing

#### Practical Roll-up Example

```
1000 — ASSETS 🏢                                    $1,048,000
  └─ 1100 — Current Assets 🏢                          $278,000
      ├─ 1110 — Cash and Cash Equivalents 🏢             $60,500
      │    ├─ 1111 — Petty Cash 📄                          $500
      │    ├─ 1113 — Main Checking Account 📄            $45,000
      │    └─ 1114 — Payroll Checking Account 📄         $15,000
      └─ 1200 — Accounts Receivable 🏢                  $132,500
           ├─ 1211 — AR — Domestic 📄                  $100,000
           ├─ 1212 — AR — International 📄              $30,000
           └─ 1290 — Allowance for Doubtful Accts 📄    ($2,500)
```

#### Relationship Rules and Constraints

1. **No circular references** — An account cannot be its own parent or any of its own ancestors.
2. **Single parent rule** — Each account has exactly one direct parent.
3. **Maximum depth** — Five levels recommended; seven levels absolute maximum.
4. **Category consistency** — Child accounts inherit the major category of their parent. An expense account cannot be a child of an asset header.
5. **Balance validation** — The sum of all children balances must equal the parent balance at all times.
6. **No orphan accounts** — Every account except the top-level category headers (1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000) must have an assigned parent.

#### System Features Required for Hierarchy

- Parent account assignment with dropdown or searchable selection
- Hierarchy visualisation in tree-view format
- Drag-and-drop reorganisation
- Bulk parent reassignment
- Hierarchy depth indicator
- Expand/collapse navigation
- Automatic roll-up calculation
- Indented financial report generation
- Audit trail for parent reassignment (date, user, previous parent, new parent)

---

## 3. Account Categories, Types, and Sub-types

### 3.1 The Five Primary Categories

Account categories represent the five fundamental classifications in the accounting equation. They determine where accounts appear on financial statements and their normal debit/credit behaviour.

**The Accounting Equation:**
```
ASSETS = LIABILITIES + EQUITY
(Revenue increases Equity; Expenses decrease Equity)
```

**Permanent vs Temporary Accounts:**
- Permanent accounts (Assets, Liabilities, Equity) carry forward their balances to the next accounting period.
- Temporary accounts (Revenue, Expenses) are closed to Retained Earnings at the end of each accounting period.

**Normal Balance Rule:**
- Assets and Expenses: Normal balance is **Debit**. Increases are recorded as debits; decreases as credits.
- Liabilities, Equity, and Revenue: Normal balance is **Credit**. Increases are recorded as credits; decreases as debits.

**Contra Accounts** have the opposite normal balance from their category. Examples include Accumulated Depreciation (contra-asset, normal balance credit), Sales Returns (contra-revenue, normal balance debit), and Treasury Stock (contra-equity, normal balance debit). Contra accounts are identified in the COA with a **(Contra)** notation.

---

### 3.2 Asset Types and Sub-types

Assets are resources owned or controlled by the organisation that provide future economic benefit.

**Category characteristics:**
- Normal balance: Debit
- Financial statement: Balance Sheet
- Increases with debits; decreases with credits

#### Type: Current Assets
Assets expected to convert to cash or be consumed within one year (or one operating cycle, whichever is longer).

**Cash and Cash Equivalents** — Petty cash, bank current accounts, savings accounts, money market accounts, short-term deposits with original maturity under three months, foreign currency accounts. Measurement: face value / fair value.

**Short-term Investments** — Trading securities, available-for-sale securities, certificates of deposit under one year, treasury bills, commercial paper. Measurement: fair value (trading) or fair value through OCI (available-for-sale).

**Accounts Receivable** — Trade receivables (domestic and international), notes receivable due within one year, unbilled receivables, retainage receivable, employee advances, insurance claims receivable, tax refunds receivable, interest receivable, dividends receivable. Contra: Allowance for Doubtful Accounts (1290) measured using expected credit loss model under IFRS 9 / ASC 310.

**Inventory** — Raw materials, work-in-process, finished goods, merchandise inventory, inventory in transit, consignment inventory, packaging materials, supplies inventory. Contra: Inventory Reserve for Obsolescence (1390). Measurement: lower of cost and net realisable value (IFRS) / lower of cost or market (GAAP).

**Prepaid Expenses and Other Current Assets** — Prepaid insurance, prepaid rent, prepaid subscriptions, prepaid software licences, prepaid taxes, prepaid marketing, current deposits, deferred tax asset (current).

#### Type: Fixed Assets (Property, Plant and Equipment)
Tangible long-term assets held for use in operations, not for sale.

**Sub-types:** Land · Buildings (and leasehold improvements) · Machinery and Equipment · Vehicles · Computer Equipment · Furniture and Fixtures · Office Equipment · Construction in Progress.

Each sub-type has a corresponding Accumulated Depreciation contra account (identified by the x9 suffix convention, e.g. 1529 for Buildings, 1539 for Machinery). Land is not depreciated. Construction in Progress is not depreciated until the asset is placed in service.

Measurement: Cost model (cost less accumulated depreciation and impairment) or Revaluation model (IFRS only).

#### Type: Intangible Assets
Non-physical assets with long-term value. Includes separately acquired intangibles and those arising from business combinations.

**Sub-types:** Intellectual Property (patents, trademarks, copyrights, trade secrets) · Goodwill and Business Assets (goodwill, customer lists, brand names, franchise rights) · Software and Technology (developed software, purchased licences, website development, domain names).

Each sub-type has a corresponding Accumulated Amortisation contra account (x9 suffix). Goodwill is not amortised under IFRS or US GAAP but is subject to annual impairment testing.

#### Type: Long-term Investments
Assets held for investment purposes with intention to hold beyond one year.

**Sub-types:** Equity Investments (subsidiaries, associates, joint ventures, long-term stock) · Debt Investments (corporate bonds, government bonds, municipal bonds) · Other Long-term Investments (real estate investments, investment property, private equity).

#### Type: Other Non-current Assets
Miscellaneous long-term assets not captured above.

**Sub-types:** Long-term Receivables · Deferred Charges (deferred tax asset non-current, deferred financing costs, organisation costs, bond issue costs) · Deposits and Other Assets (security deposits, utility deposits, lease deposits).

---

### 3.3 Liability Types and Sub-types

Liabilities are obligations or debts owed to external parties that the organisation is required to settle.

**Category characteristics:**
- Normal balance: Credit
- Financial statement: Balance Sheet
- Increases with credits; decreases with debits

#### Type: Current Liabilities
Obligations expected to be settled within one year (or one operating cycle).

**Accounts Payable** — Trade payables, vendor payables, supplier payables, related-party payables.

**Short-term Debt** — Bank overdrafts, lines of credit, short-term loans, notes payable due within one year, current portion of long-term debt (reclassified from long-term), commercial paper issued.

**Credit Cards Payable** — Corporate credit card balances by card type and issuer.

**Accrued Liabilities** — Accrued payroll and benefits (salaries, bonuses, commissions, vacation/PTO, sick leave, payroll taxes, benefits) · Other accrued expenses (interest, rent, utilities, professional fees, audit fees, legal fees, warranty costs, advertising).

**Payroll Liabilities** — Payroll taxes payable (federal/state income tax withheld, social security, Medicare, unemployment) · Employee deductions payable (health insurance, life insurance, retirement plan, 401(k), garnishments, union dues, loan repayments).

**Tax Liabilities** — Sales tax payable (state, county, city) · VAT/GST payable (including VAT input receivable at 2423) · Income tax payable (federal, state, corporate) · Other taxes (property, franchise, withholding, excise).

**Unearned Revenue** — Deferred revenue (products, services), unearned subscription revenue, customer deposits, advance payments, gift card liability.

**Other Current Liabilities** — Dividends payable, customer credit balances, deposits received, amounts due to related parties (current), current lease liabilities.

#### Type: Non-current Liabilities
Obligations due beyond one year.

**Long-term Debt** — Term loans, bank loans, equipment loans, vehicle loans, SBA loans. Contra: Less current portion reclassified (2719).

**Bonds and Notes Payable** — Bonds payable, convertible bonds, long-term notes payable, debentures, bond premium (2725 — credit), bond discount (2726 — debit, contra).

**Mortgage Payable** — Property-specific mortgage liabilities.

**Lease Liabilities** — Finance lease liabilities, operating lease liabilities (IFRS 16 / ASC 842), equipment and vehicle lease liabilities.

**Deferred Tax Liabilities** — Non-current deferred tax, deferred tax on fixed assets, deferred tax on investments.

**Employee Benefit Obligations** — Pension obligations, post-retirement benefits, deferred compensation, long-term disability reserve.

**Other Long-term Liabilities** — Asset retirement obligations, environmental remediation, long-term warranty obligations, contingent liabilities, related-party amounts (long-term).

---

### 3.4 Equity Types and Sub-types

Equity represents the residual interest in assets after deducting liabilities — the owners' stake in the business.

**Category characteristics:**
- Normal balance: Credit
- Financial statement: Balance Sheet (Statement of Financial Position) and Statement of Changes in Equity
- Increases with credits; decreases with debits

#### For Corporations

**Contributed Capital** — Common Stock (par value, no par value, issued, subscribed) · Preferred Stock (par value, issued, subscribed) · Additional Paid-in Capital (in excess of par for common and preferred, from treasury stock, from stock options, from warrants).

**Retained Earnings** — Appropriated retained earnings, unappropriated retained earnings, prior period adjustments (CR/DR).

**Treasury Stock** — Contra-equity, normal balance debit. Common stock repurchased and held by the company. Recorded at cost.

**Accumulated Other Comprehensive Income (AOCI)** — Unrealised gains/losses on available-for-sale securities, foreign currency translation adjustments, pension plan adjustments, cash flow hedge adjustments. These items bypass the income statement and are recognised directly in equity.

#### For Sole Proprietorships

**Owner's Equity** — Owner's Capital (CR) · Owner's Contributions (CR) · Owner's Drawings (DR — contra-equity) · Owner's Retained Earnings (CR).

#### For Partnerships

**Partners' Equity** — Separate capital account, contributions account, drawings account (DR — contra), and profit/loss allocation account for each partner.

#### Current Year Earnings

- 3901 — Net Income (system-calculated, CR)
- 3902 — Dividends Declared (DR — contra-equity)
- 3903 — Distributions Declared (DR — contra-equity)

---

### 3.5 Revenue Types and Sub-types

Revenue represents income generated from business operations and other sources.

**Category characteristics:**
- Normal balance: Credit
- Financial statement: Income Statement (Profit and Loss)
- Temporary account — closes to Retained Earnings at year-end
- Increases with credits; decreases with debits

#### Type: Operating Revenue
Revenue from the entity's primary business activities.

**Product Sales** — Revenue from sale of goods by product line, channel (wholesale, retail, online), and geography (domestic, export).

**Service Revenue** — Consulting, professional, maintenance, support, installation, training, design, and contract revenue.

**Subscription and Recurring Revenue** — SaaS subscriptions, software licence revenue, membership fees, recurring service revenue, maintenance contracts. Revenue recognition must comply with IFRS 15 / ASC 606 (performance obligation model).

**Rental and Lease Income** — Property, equipment, and vehicle rental and lease income.

**Commission and Fee Income** — Sales commissions earned, brokerage fees, referral fees, transaction fees, service fees, late payment fees, processing fees.

**Franchise and Royalty Income** — Franchise fees, royalty income, licensing fees.

#### Type: Non-Operating Revenue
Revenue from activities outside the primary business.

**Investment Income** — Interest income (bank accounts, investments, notes receivable), dividend income, investment gains.

**Gain on Disposal of Assets** — Gain on sale of fixed assets, investments, property, equipment. Note: these are gains (proceeds exceed book value); losses appear in account 7200.

**Foreign Exchange Gains** — Realised gains (from settled transactions) and unrealised gains (from period-end revaluation of monetary items). Unrealised gains must be reversed or updated at each subsequent period end.

**Other Income** — Insurance proceeds, recovery of bad debts, scrap sales, miscellaneous income, government grants, rebates and incentives.

#### Type: Contra-Revenue
Accounts that reduce gross revenue to arrive at net revenue. Normal balance is debit.

**Sub-types:** Sales Returns and Allowances · Sales Discounts · Volume Rebates · Promotional Discounts.

---

### 3.6 Expense Types and Sub-types

Expenses are costs incurred in generating revenue and operating the business.

**Category characteristics:**
- Normal balance: Debit
- Financial statement: Income Statement (Profit and Loss)
- Temporary account — closes to Retained Earnings at year-end
- Increases with debits; decreases with credits

#### Type: Cost of Goods Sold (COGS) — 5000 range
Direct costs attributable to the production of goods or services sold.

**Direct Materials** — Raw materials used, component parts, packaging, direct materials by product line.

**Direct Labor** — Production wages, manufacturing labour, assembly labour, direct labour by product line.

**Manufacturing Overhead** — Factory utilities, supplies, equipment depreciation, factory rent, indirect labour, maintenance, quality control.

**Other COGS** — Freight-in, import duties, inventory adjustments, inventory shrinkage. Contra: Purchase Returns (5145 — CR) and Purchase Discounts (5146 — CR).

#### Type: Operating Expenses — 6000 range

**Personnel Expenses** — Salaries and wages (by function: executive, management, administrative, sales, marketing, IT, customer service, hourly, overtime) · Employee benefits (health, dental, vision, life, disability, retirement, 401k, pension, wellness) · Payroll taxes (social security employer, Medicare employer, federal and state unemployment, workers' compensation) · Employee development (training, education, conferences, memberships, certifications) · Recruitment and HR (recruitment costs, job advertising, background checks, relocation, recognition, team building).

**Facility Expenses** — Rent and lease (office, warehouse, retail, equipment, vehicle) · Utilities (electricity, water, gas, heating/cooling, waste) · Building maintenance (repairs, janitorial, landscaping, pest control, HVAC, elevator) · Property and security (property taxes, property insurance, security services and systems, fire protection).

**Administrative Expenses** — Office supplies and equipment · Communication (telephone, mobile, internet, video conferencing, courier) · Professional fees (legal, accounting, audit, consulting, tax preparation, bookkeeping) · Insurance (general liability, professional liability, D&O, business interruption, vehicle, cyber) · Subscriptions and licences · Bank and financial services (bank charges, merchant fees, credit card processing, wire transfers, check printing, NSF charges).

**Sales and Marketing** — Advertising (online, print, radio, television, outdoor, sponsorships) · Marketing campaigns, content, social media, email, SEO/SEM, market research, brand development · Promotional materials (brochures, business cards, trade show materials, POS materials) · Sales expenses (commissions, bonuses, travel, customer entertainment, meetings, CRM software) · Trade shows and events.

**Technology and IT** — Software and applications (licences, cloud services, databases, backup, collaboration tools) · IT services (helpdesk, managed services, network maintenance, system administration, IT consulting) · Hardware and infrastructure (computer hardware, server maintenance, network equipment, repairs) · Website and digital (hosting, maintenance, domain registration, SSL, web development).

**Travel and Entertainment** — Airfare, hotel, ground transportation, taxi/rideshare, car rental, parking/tolls, travel meals · Business meals, client entertainment, employee meals, office snacks · Vehicle expenses (fuel, maintenance, repairs, registration, mileage reimbursement).

**Depreciation and Amortisation** — Depreciation by asset class (buildings, machinery, vehicles, computer equipment, furniture, office equipment, leasehold improvements) · Amortisation by intangible type (patents, trademarks, software, customer relationships, goodwill).

**Research and Development** — Research salaries, laboratory supplies, testing and prototyping, research equipment, patent filing costs, external R&D services.

**Other Operating Expenses** — Bad debt and write-offs (bad debt expense, write-off of receivables, inventory write-downs) · Taxes and fees (business licences, regulatory fees, franchise taxes) · Donations and contributions · Miscellaneous (equipment rental, storage, uniforms, repairs, safety equipment).

#### Type: Financial Expenses — 7000 range

**Interest Expense** — On short-term and long-term debt, mortgages, bonds, lease liabilities, credit cards.

**Loss on Disposal of Assets** — Loss on sale of fixed assets, investments, property, equipment. Asset impairment losses.

**Foreign Exchange Losses** — Realised and unrealised foreign exchange losses.

**Other Non-operating Expenses** — Litigation settlements, penalties and fines, restructuring costs, extraordinary losses.

#### Type: Income Tax — 8000 range

**Income Tax Expense** — Current income tax expense (the amount due to tax authorities for the current period) · Deferred income tax expense (arising from temporary differences) · Federal and state income tax expense · Foreign income tax expense · Tax penalties and interest.

---

## 4. The Integrated Chart of Accounts

### 4.1 Legend and Column Definitions

**Account Type:**
- 🏢 **Header Account** — Parent node; no direct posting permitted. Balance equals sum of all children.
- 📄 **Posting Account** — Leaf node; transactions may be posted directly.

**Normal Balance:**
- **[DR]** — Debit normal balance. Account increases with debits, decreases with credits.
- **[CR]** — Credit normal balance. Account increases with credits, decreases with debits.
- **[CR/DR]** — Balance can be either debit or credit depending on circumstances.

**Sensitivity Tier:**
- 🔴 **T1 — Restricted** — Highest sensitivity. Restricted posting access, frequent reconciliation, dual approval above threshold.
- 🟡 **T2 — Elevated** — Elevated sensitivity. Reconciliation sign-off required at period close.
- 🟢 **T3 — Standard** — Routine monitoring. Standard controls apply.

**Financial Statement Placement:**
- **BS-CA** — Balance Sheet, Current Assets
- **BS-NCA** — Balance Sheet, Non-current Assets
- **BS-CL** — Balance Sheet, Current Liabilities
- **BS-NCL** — Balance Sheet, Non-current Liabilities
- **BS-EQ** — Balance Sheet, Equity
- **IS-REV** — Income Statement, Revenue
- **IS-COGS** — Income Statement, Cost of Goods Sold
- **IS-OPEX** — Income Statement, Operating Expenses
- **IS-OIE** — Income Statement, Other Income/Expenses
- **IS-TAX** — Income Statement, Income Tax

---

### 4.2 1000 — Assets

#### 1000 — ASSETS 🏢 [DR]

##### 1100 — Current Assets 🏢 [DR] | BS-CA

###### 1110 — Cash and Cash Equivalents 🏢 [DR] | BS-CA

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 1111 | Petty Cash | 📄 | DR | 🔴 T1 | BS-CA |
| 1112 | Cash on Hand | 📄 | DR | 🔴 T1 | BS-CA |
| 1113 | Main Checking Account | 📄 | DR | 🔴 T1 | BS-CA |
| 1114 | Payroll Checking Account | 📄 | DR | 🔴 T1 | BS-CA |
| 1115 | Savings Account | 📄 | DR | 🔴 T1 | BS-CA |
| 1116 | Money Market Account | 📄 | DR | 🔴 T1 | BS-CA |
| 1117 | Foreign Currency Account — USD | 📄 | DR | 🔴 T1 | BS-CA |
| 1118 | Foreign Currency Account — EUR | 📄 | DR | 🔴 T1 | BS-CA |
| 1119 | Foreign Currency Account — GBP | 📄 | DR | 🔴 T1 | BS-CA |

###### 1120 — Short-term Investments 🏢 [DR] | BS-CA

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 1121 | Trading Securities | 📄 | DR | 🟡 T2 | BS-CA |
| 1122 | Available-for-Sale Securities | 📄 | DR | 🟡 T2 | BS-CA |
| 1123 | Certificates of Deposit (< 1 year) | 📄 | DR | 🟡 T2 | BS-CA |
| 1124 | Treasury Bills | 📄 | DR | 🟡 T2 | BS-CA |
| 1125 | Commercial Paper | 📄 | DR | 🟡 T2 | BS-CA |

###### 1200 — Accounts Receivable 🏢 [DR] | BS-CA

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 1210 | Trade Receivables | 🏢 | DR | 🟡 T2 | BS-CA |
| 1211 | Accounts Receivable — Domestic | 📄 | DR | 🟡 T2 | BS-CA |
| 1212 | Accounts Receivable — International | 📄 | DR | 🟡 T2 | BS-CA |
| 1213 | Notes Receivable — Short-term | 📄 | DR | 🟡 T2 | BS-CA |
| 1214 | Unbilled Receivables | 📄 | DR | 🟡 T2 | BS-CA |
| 1215 | Retainage Receivable | 📄 | DR | 🟡 T2 | BS-CA |
| 1220 | Other Receivables | 🏢 | DR | 🟡 T2 | BS-CA |
| 1221 | Employee Advances | 📄 | DR | 🔴 T1 | BS-CA |
| 1222 | Loans to Employees | 📄 | DR | 🔴 T1 | BS-CA |
| 1223 | Insurance Claims Receivable | 📄 | DR | 🟡 T2 | BS-CA |
| 1224 | Tax Refunds Receivable | 📄 | DR | 🟡 T2 | BS-CA |
| 1225 | Interest Receivable | 📄 | DR | 🟢 T3 | BS-CA |
| 1226 | Dividends Receivable | 📄 | DR | 🟢 T3 | BS-CA |
| 1290 | Allowance for Doubtful Accounts | 📄 | CR | 🟡 T2 | BS-CA (Contra-Asset) |

###### 1300 — Inventory 🏢 [DR] | BS-CA

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 1310 | Raw Materials Inventory | 📄 | DR | 🟡 T2 | BS-CA |
| 1320 | Work-in-Process Inventory | 📄 | DR | 🟡 T2 | BS-CA |
| 1330 | Finished Goods Inventory | 📄 | DR | 🟡 T2 | BS-CA |
| 1340 | Merchandise Inventory | 📄 | DR | 🟡 T2 | BS-CA |
| 1350 | Inventory in Transit | 📄 | DR | 🟡 T2 | BS-CA |
| 1360 | Consignment Inventory | 📄 | DR | 🟡 T2 | BS-CA |
| 1370 | Packaging Materials | 📄 | DR | 🟢 T3 | BS-CA |
| 1380 | Supplies Inventory | 📄 | DR | 🟢 T3 | BS-CA |
| 1390 | Inventory Reserve for Obsolescence | 📄 | CR | 🟡 T2 | BS-CA (Contra-Asset) |

###### 1400 — Prepaid Expenses and Other Current Assets 🏢 [DR] | BS-CA

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 1410 | Prepaid Insurance | 📄 | DR | 🟢 T3 | BS-CA |
| 1420 | Prepaid Rent | 📄 | DR | 🟢 T3 | BS-CA |
| 1430 | Prepaid Subscriptions | 📄 | DR | 🟢 T3 | BS-CA |
| 1440 | Prepaid Software Licences | 📄 | DR | 🟢 T3 | BS-CA |
| 1450 | Prepaid Taxes | 📄 | DR | 🟡 T2 | BS-CA |
| 1460 | Prepaid Marketing | 📄 | DR | 🟢 T3 | BS-CA |
| 1470 | Deposits — Current | 📄 | DR | 🟢 T3 | BS-CA |
| 1480 | Deferred Tax Asset — Current | 📄 | DR | 🟡 T2 | BS-CA |
| 1490 | Other Prepaid Expenses | 📄 | DR | 🟢 T3 | BS-CA |

---

##### 1500 — Fixed Assets (Property, Plant and Equipment) 🏢 [DR] | BS-NCA

###### 1510 — Land 🏢 [DR] | BS-NCA

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 1511 | Land — Corporate Office | 📄 | DR | 🟡 T2 | BS-NCA |
| 1512 | Land — Manufacturing Facility | 📄 | DR | 🟡 T2 | BS-NCA |
| 1513 | Land — Warehouse | 📄 | DR | 🟡 T2 | BS-NCA |
| 1514 | Land Improvements | 📄 | DR | 🟡 T2 | BS-NCA |

###### 1520 — Buildings 🏢 [DR] | BS-NCA

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 1521 | Building — Corporate Office | 📄 | DR | 🟡 T2 | BS-NCA |
| 1522 | Building — Manufacturing Plant | 📄 | DR | 🟡 T2 | BS-NCA |
| 1523 | Building — Warehouse | 📄 | DR | 🟡 T2 | BS-NCA |
| 1524 | Building — Retail Locations | 📄 | DR | 🟡 T2 | BS-NCA |
| 1525 | Leasehold Improvements | 📄 | DR | 🟡 T2 | BS-NCA |
| 1526 | Building Improvements | 📄 | DR | 🟡 T2 | BS-NCA |
| 1529 | Accumulated Depreciation — Buildings | 📄 | CR | 🟡 T2 | BS-NCA (Contra-Asset) |

###### 1530 — Machinery and Equipment 🏢 [DR] | BS-NCA

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 1531 | Manufacturing Equipment | 📄 | DR | 🟡 T2 | BS-NCA |
| 1532 | Production Machinery | 📄 | DR | 🟡 T2 | BS-NCA |
| 1533 | Tools and Dies | 📄 | DR | 🟢 T3 | BS-NCA |
| 1534 | Testing Equipment | 📄 | DR | 🟢 T3 | BS-NCA |
| 1535 | Assembly Line Equipment | 📄 | DR | 🟢 T3 | BS-NCA |
| 1539 | Accumulated Depreciation — Machinery | 📄 | CR | 🟡 T2 | BS-NCA (Contra-Asset) |

###### 1540 — Vehicles 🏢 [DR] | BS-NCA

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 1541 | Delivery Trucks | 📄 | DR | 🟢 T3 | BS-NCA |
| 1542 | Company Vehicles | 📄 | DR | 🟢 T3 | BS-NCA |
| 1543 | Forklifts and Material Handling | 📄 | DR | 🟢 T3 | BS-NCA |
| 1544 | Fleet Vehicles | 📄 | DR | 🟢 T3 | BS-NCA |
| 1549 | Accumulated Depreciation — Vehicles | 📄 | CR | 🟡 T2 | BS-NCA (Contra-Asset) |

###### 1550 — Computer Equipment 🏢 [DR] | BS-NCA

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 1551 | Servers and Data Centre Equipment | 📄 | DR | 🟢 T3 | BS-NCA |
| 1552 | Desktop Computers | 📄 | DR | 🟢 T3 | BS-NCA |
| 1553 | Laptop Computers | 📄 | DR | 🟢 T3 | BS-NCA |
| 1554 | Network Equipment | 📄 | DR | 🟢 T3 | BS-NCA |
| 1555 | Tablets and Mobile Devices | 📄 | DR | 🟢 T3 | BS-NCA |
| 1556 | Peripherals and Accessories | 📄 | DR | 🟢 T3 | BS-NCA |
| 1559 | Accumulated Depreciation — Computer Equipment | 📄 | CR | 🟡 T2 | BS-NCA (Contra-Asset) |

###### 1560 — Furniture and Fixtures 🏢 [DR] | BS-NCA

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 1561 | Office Furniture | 📄 | DR | 🟢 T3 | BS-NCA |
| 1562 | Office Fixtures | 📄 | DR | 🟢 T3 | BS-NCA |
| 1563 | Display Fixtures | 📄 | DR | 🟢 T3 | BS-NCA |
| 1564 | Signage | 📄 | DR | 🟢 T3 | BS-NCA |
| 1569 | Accumulated Depreciation — Furniture | 📄 | CR | 🟡 T2 | BS-NCA (Contra-Asset) |

###### 1570 — Office Equipment 🏢 [DR] | BS-NCA

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 1571 | Copiers and Printers | 📄 | DR | 🟢 T3 | BS-NCA |
| 1572 | Phone Systems | 📄 | DR | 🟢 T3 | BS-NCA |
| 1573 | Security Systems | 📄 | DR | 🟢 T3 | BS-NCA |
| 1574 | Other Office Equipment | 📄 | DR | 🟢 T3 | BS-NCA |
| 1579 | Accumulated Depreciation — Office Equipment | 📄 | CR | 🟡 T2 | BS-NCA (Contra-Asset) |

###### 1580 — Construction in Progress 🏢 [DR] | BS-NCA

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 1581 | Building Construction WIP | 📄 | DR | 🟡 T2 | BS-NCA |
| 1582 | Equipment Installation WIP | 📄 | DR | 🟡 T2 | BS-NCA |
| 1583 | IT Infrastructure WIP | 📄 | DR | 🟡 T2 | BS-NCA |

---

##### 1600 — Intangible Assets 🏢 [DR] | BS-NCA

###### 1610 — Intellectual Property 🏢 [DR] | BS-NCA

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 1611 | Patents | 📄 | DR | 🟡 T2 | BS-NCA |
| 1612 | Trademarks | 📄 | DR | 🟡 T2 | BS-NCA |
| 1613 | Copyrights | 📄 | DR | 🟡 T2 | BS-NCA |
| 1614 | Trade Secrets | 📄 | DR | 🟡 T2 | BS-NCA |
| 1619 | Accumulated Amortisation — IP | 📄 | CR | 🟡 T2 | BS-NCA (Contra-Asset) |

###### 1620 — Goodwill and Business Assets 🏢 [DR] | BS-NCA

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 1621 | Goodwill | 📄 | DR | 🟡 T2 | BS-NCA |
| 1622 | Customer Lists | 📄 | DR | 🟡 T2 | BS-NCA |
| 1623 | Customer Relationships | 📄 | DR | 🟡 T2 | BS-NCA |
| 1624 | Brand Names | 📄 | DR | 🟡 T2 | BS-NCA |
| 1625 | Franchise Rights | 📄 | DR | 🟡 T2 | BS-NCA |
| 1629 | Accumulated Amortisation — Business Assets | 📄 | CR | 🟡 T2 | BS-NCA (Contra-Asset) |

###### 1630 — Software and Technology 🏢 [DR] | BS-NCA

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 1631 | Developed Software | 📄 | DR | 🟡 T2 | BS-NCA |
| 1632 | Purchased Software Licences | 📄 | DR | 🟢 T3 | BS-NCA |
| 1633 | Website Development Costs | 📄 | DR | 🟢 T3 | BS-NCA |
| 1634 | Mobile App Development | 📄 | DR | 🟢 T3 | BS-NCA |
| 1635 | Domain Names | 📄 | DR | 🟢 T3 | BS-NCA |
| 1639 | Accumulated Amortisation — Software | 📄 | CR | 🟡 T2 | BS-NCA (Contra-Asset) |

---

##### 1700 — Long-term Investments 🏢 [DR] | BS-NCA

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 1711 | Investment in Subsidiaries | 📄 | DR | 🔴 T1 | BS-NCA |
| 1712 | Investment in Associates | 📄 | DR | 🔴 T1 | BS-NCA |
| 1713 | Investment in Joint Ventures | 📄 | DR | 🔴 T1 | BS-NCA |
| 1714 | Long-term Stock Investments | 📄 | DR | 🟡 T2 | BS-NCA |
| 1721 | Corporate Bonds | 📄 | DR | 🟡 T2 | BS-NCA |
| 1722 | Government Bonds | 📄 | DR | 🟡 T2 | BS-NCA |
| 1723 | Municipal Bonds | 📄 | DR | 🟡 T2 | BS-NCA |
| 1731 | Real Estate Investments | 📄 | DR | 🟡 T2 | BS-NCA |
| 1732 | Investment Property | 📄 | DR | 🟡 T2 | BS-NCA |
| 1733 | Private Equity Investments | 📄 | DR | 🔴 T1 | BS-NCA |

---

##### 1800 — Other Non-current Assets 🏢 [DR] | BS-NCA

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 1811 | Notes Receivable — Long-term | 📄 | DR | 🟡 T2 | BS-NCA |
| 1812 | Loans to Employees — Long-term | 📄 | DR | 🔴 T1 | BS-NCA |
| 1813 | Loans to Officers | 📄 | DR | 🔴 T1 | BS-NCA |
| 1821 | Deferred Tax Asset — Non-current | 📄 | DR | 🟡 T2 | BS-NCA |
| 1822 | Deferred Financing Costs | 📄 | DR | 🟡 T2 | BS-NCA |
| 1823 | Organisation Costs | 📄 | DR | 🟢 T3 | BS-NCA |
| 1824 | Bond Issue Costs | 📄 | DR | 🟡 T2 | BS-NCA |
| 1831 | Security Deposits — Long-term | 📄 | DR | 🟢 T3 | BS-NCA |
| 1832 | Utility Deposits | 📄 | DR | 🟢 T3 | BS-NCA |
| 1833 | Lease Deposits | 📄 | DR | 🟢 T3 | BS-NCA |
| 1834 | Other Long-term Assets | 📄 | DR | 🟢 T3 | BS-NCA |

---

### 4.3 2000 — Liabilities

#### 2000 — LIABILITIES 🏢 [CR]

##### 2100 — Current Liabilities 🏢 [CR] | BS-CL

###### 2110 — Accounts Payable 🏢 [CR] | BS-CL

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 2111 | Accounts Payable — Trade | 📄 | CR | 🟡 T2 | BS-CL |
| 2112 | Accounts Payable — Vendors | 📄 | CR | 🟡 T2 | BS-CL |
| 2113 | Accounts Payable — Suppliers | 📄 | CR | 🟡 T2 | BS-CL |
| 2114 | Accounts Payable — Related Parties | 📄 | CR | 🔴 T1 | BS-CL |

###### 2120 — Short-term Debt 🏢 [CR] | BS-CL

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 2121 | Bank Overdraft | 📄 | CR | 🔴 T1 | BS-CL |
| 2122 | Line of Credit | 📄 | CR | 🔴 T1 | BS-CL |
| 2123 | Short-term Loans | 📄 | CR | 🔴 T1 | BS-CL |
| 2124 | Notes Payable — Short-term | 📄 | CR | 🟡 T2 | BS-CL |
| 2125 | Current Portion of Long-term Debt | 📄 | CR | 🟡 T2 | BS-CL |
| 2126 | Commercial Paper Issued | 📄 | CR | 🟡 T2 | BS-CL |

###### 2130 — Credit Cards Payable 🏢 [CR] | BS-CL

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 2131 | Corporate Credit Card — AMEX | 📄 | CR | 🔴 T1 | BS-CL |
| 2132 | Corporate Credit Card — Visa | 📄 | CR | 🔴 T1 | BS-CL |
| 2133 | Corporate Credit Card — Mastercard | 📄 | CR | 🔴 T1 | BS-CL |
| 2134 | Employee Credit Cards | 📄 | CR | 🔴 T1 | BS-CL |

###### 2200 — Accrued Liabilities 🏢 [CR] | BS-CL

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 2210 | Accrued Payroll and Benefits | 🏢 | CR | 🔴 T1 | BS-CL |
| 2211 | Accrued Salaries and Wages | 📄 | CR | 🔴 T1 | BS-CL |
| 2212 | Accrued Bonuses | 📄 | CR | 🔴 T1 | BS-CL |
| 2213 | Accrued Commissions | 📄 | CR | 🔴 T1 | BS-CL |
| 2214 | Accrued Vacation and PTO | 📄 | CR | 🔴 T1 | BS-CL |
| 2215 | Accrued Sick Leave | 📄 | CR | 🔴 T1 | BS-CL |
| 2216 | Accrued Payroll Taxes | 📄 | CR | 🔴 T1 | BS-CL |
| 2217 | Accrued Benefits | 📄 | CR | 🔴 T1 | BS-CL |
| 2220 | Other Accrued Expenses | 🏢 | CR | 🟡 T2 | BS-CL |
| 2221 | Accrued Interest | 📄 | CR | 🟡 T2 | BS-CL |
| 2222 | Accrued Rent | 📄 | CR | 🟢 T3 | BS-CL |
| 2223 | Accrued Utilities | 📄 | CR | 🟢 T3 | BS-CL |
| 2224 | Accrued Professional Fees | 📄 | CR | 🟢 T3 | BS-CL |
| 2225 | Accrued Audit Fees | 📄 | CR | 🟢 T3 | BS-CL |
| 2226 | Accrued Legal Fees | 📄 | CR | 🟡 T2 | BS-CL |
| 2227 | Accrued Warranty Costs | 📄 | CR | 🟢 T3 | BS-CL |
| 2228 | Accrued Advertising | 📄 | CR | 🟢 T3 | BS-CL |
| 2229 | Other Accrued Liabilities | 📄 | CR | 🟡 T2 | BS-CL |

###### 2300 — Payroll Liabilities 🏢 [CR] | BS-CL

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 2310 | Payroll Taxes Payable | 🏢 | CR | 🔴 T1 | BS-CL |
| 2311 | Federal Income Tax Withheld | 📄 | CR | 🔴 T1 | BS-CL |
| 2312 | State Income Tax Withheld | 📄 | CR | 🔴 T1 | BS-CL |
| 2313 | Social Security Tax Payable | 📄 | CR | 🔴 T1 | BS-CL |
| 2314 | Medicare Tax Payable | 📄 | CR | 🔴 T1 | BS-CL |
| 2315 | Unemployment Tax Payable — Federal | 📄 | CR | 🔴 T1 | BS-CL |
| 2316 | Unemployment Tax Payable — State | 📄 | CR | 🔴 T1 | BS-CL |
| 2320 | Employee Deductions Payable | 🏢 | CR | 🔴 T1 | BS-CL |
| 2321 | Health Insurance Premiums Payable | 📄 | CR | 🔴 T1 | BS-CL |
| 2322 | Life Insurance Premiums Payable | 📄 | CR | 🔴 T1 | BS-CL |
| 2323 | Retirement Plan Contributions Payable | 📄 | CR | 🔴 T1 | BS-CL |
| 2324 | 401(k) Contributions Payable | 📄 | CR | 🔴 T1 | BS-CL |
| 2325 | Garnishments Payable | 📄 | CR | 🔴 T1 | BS-CL |
| 2326 | Union Dues Payable | 📄 | CR | 🔴 T1 | BS-CL |
| 2327 | Employee Loan Repayments Payable | 📄 | CR | 🔴 T1 | BS-CL |

###### 2400 — Tax Liabilities 🏢 [CR] | BS-CL

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 2410 | Sales Tax Payable | 🏢 | CR | 🔴 T1 | BS-CL |
| 2411 | Sales Tax Payable — State | 📄 | CR | 🔴 T1 | BS-CL |
| 2412 | Sales Tax Payable — County | 📄 | CR | 🔴 T1 | BS-CL |
| 2413 | Sales Tax Payable — City | 📄 | CR | 🔴 T1 | BS-CL |
| 2420 | VAT/GST Payable | 🏢 | CR | 🔴 T1 | BS-CL |
| 2421 | VAT Payable | 📄 | CR | 🔴 T1 | BS-CL |
| 2422 | GST Payable | 📄 | CR | 🔴 T1 | BS-CL |
| 2423 | VAT Input (Receivable) | 📄 | DR | 🔴 T1 | BS-CL |
| 2424 | VAT Output (Payable) | 📄 | CR | 🔴 T1 | BS-CL |
| 2430 | Income Tax Payable | 🏢 | CR | 🔴 T1 | BS-CL |
| 2431 | Federal Income Tax Payable | 📄 | CR | 🔴 T1 | BS-CL |
| 2432 | State Income Tax Payable | 📄 | CR | 🔴 T1 | BS-CL |
| 2433 | Corporate Income Tax Payable | 📄 | CR | 🔴 T1 | BS-CL |
| 2440 | Other Taxes Payable | 🏢 | CR | 🟡 T2 | BS-CL |
| 2441 | Property Tax Payable | 📄 | CR | 🟡 T2 | BS-CL |
| 2442 | Franchise Tax Payable | 📄 | CR | 🟡 T2 | BS-CL |
| 2443 | Withholding Tax Payable | 📄 | CR | 🔴 T1 | BS-CL |
| 2444 | Excise Tax Payable | 📄 | CR | 🟡 T2 | BS-CL |

###### 2500 — Unearned Revenue 🏢 [CR] | BS-CL

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 2510 | Deferred Revenue — Products | 📄 | CR | 🟡 T2 | BS-CL |
| 2520 | Deferred Revenue — Services | 📄 | CR | 🟡 T2 | BS-CL |
| 2530 | Unearned Subscription Revenue | 📄 | CR | 🟡 T2 | BS-CL |
| 2540 | Customer Deposits | 📄 | CR | 🟡 T2 | BS-CL |
| 2550 | Advance Payments from Customers | 📄 | CR | 🟡 T2 | BS-CL |
| 2560 | Gift Card Liability | 📄 | CR | 🟡 T2 | BS-CL |

###### 2600 — Other Current Liabilities 🏢 [CR] | BS-CL

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 2610 | Dividends Payable | 📄 | CR | 🟡 T2 | BS-CL |
| 2620 | Customer Credit Balances | 📄 | CR | 🟡 T2 | BS-CL |
| 2630 | Deposits Received | 📄 | CR | 🟡 T2 | BS-CL |
| 2640 | Due to Related Parties — Current | 📄 | CR | 🔴 T1 | BS-CL |
| 2650 | Current Lease Liabilities | 📄 | CR | 🟡 T2 | BS-CL |
| 2690 | Other Short-term Liabilities | 📄 | CR | 🟡 T2 | BS-CL |

---

##### 2700 — Long-term Liabilities 🏢 [CR] | BS-NCL

###### 2710 — Long-term Debt 🏢 [CR] | BS-NCL

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 2711 | Term Loans | 📄 | CR | 🔴 T1 | BS-NCL |
| 2712 | Bank Loans — Long-term | 📄 | CR | 🔴 T1 | BS-NCL |
| 2713 | Equipment Loans | 📄 | CR | 🟡 T2 | BS-NCL |
| 2714 | Vehicle Loans | 📄 | CR | 🟡 T2 | BS-NCL |
| 2715 | SBA Loans | 📄 | CR | 🟡 T2 | BS-NCL |
| 2719 | Less: Current Portion of Long-term Debt | 📄 | DR | 🟡 T2 | BS-NCL (Contra) |

###### 2720 — Bonds and Notes Payable 🏢 [CR] | BS-NCL

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 2721 | Bonds Payable | 📄 | CR | 🔴 T1 | BS-NCL |
| 2722 | Convertible Bonds | 📄 | CR | 🔴 T1 | BS-NCL |
| 2723 | Notes Payable — Long-term | 📄 | CR | 🔴 T1 | BS-NCL |
| 2724 | Debentures | 📄 | CR | 🔴 T1 | BS-NCL |
| 2725 | Bond Premium | 📄 | CR | 🟡 T2 | BS-NCL |
| 2726 | Bond Discount | 📄 | DR | 🟡 T2 | BS-NCL (Contra) |

###### 2730 — Mortgage Payable 🏢 [CR] | BS-NCL

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 2731 | Mortgage Payable — Office Building | 📄 | CR | 🔴 T1 | BS-NCL |
| 2732 | Mortgage Payable — Manufacturing Facility | 📄 | CR | 🔴 T1 | BS-NCL |
| 2733 | Mortgage Payable — Warehouse | 📄 | CR | 🔴 T1 | BS-NCL |

###### 2740 — Lease Liabilities 🏢 [CR] | BS-NCL

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 2741 | Finance Lease Liabilities | 📄 | CR | 🟡 T2 | BS-NCL |
| 2742 | Operating Lease Liabilities | 📄 | CR | 🟡 T2 | BS-NCL |
| 2743 | Equipment Lease Liabilities | 📄 | CR | 🟡 T2 | BS-NCL |
| 2744 | Vehicle Lease Liabilities | 📄 | CR | 🟡 T2 | BS-NCL |

###### 2750–2779 — Deferred, Benefit, and Other Long-term Liabilities

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 2751 | Deferred Tax Liability — Non-current | 📄 | CR | 🟡 T2 | BS-NCL |
| 2752 | Deferred Tax on Fixed Assets | 📄 | CR | 🟡 T2 | BS-NCL |
| 2753 | Deferred Tax on Investments | 📄 | CR | 🟡 T2 | BS-NCL |
| 2761 | Pension Obligations | 📄 | CR | 🟡 T2 | BS-NCL |
| 2762 | Post-retirement Benefits Payable | 📄 | CR | 🟡 T2 | BS-NCL |
| 2763 | Deferred Compensation | 📄 | CR | 🔴 T1 | BS-NCL |
| 2764 | Long-term Disability Reserve | 📄 | CR | 🟡 T2 | BS-NCL |
| 2771 | Asset Retirement Obligations | 📄 | CR | 🟡 T2 | BS-NCL |
| 2772 | Environmental Remediation Liability | 📄 | CR | 🟡 T2 | BS-NCL |
| 2773 | Long-term Warranty Obligations | 📄 | CR | 🟡 T2 | BS-NCL |
| 2774 | Contingent Liabilities | 📄 | CR | 🟡 T2 | BS-NCL |
| 2775 | Due to Related Parties — Long-term | 📄 | CR | 🔴 T1 | BS-NCL |
| 2779 | Other Non-current Liabilities | 📄 | CR | 🟡 T2 | BS-NCL |

---

### 4.4 3000 — Equity

#### 3000 — EQUITY 🏢 [CR]

##### 3100 — Shareholders' Equity (Corporation) 🏢 [CR] | BS-EQ

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 3111 | Common Stock — Par Value | 📄 | CR | 🔴 T1 | BS-EQ |
| 3112 | Common Stock — No Par Value | 📄 | CR | 🔴 T1 | BS-EQ |
| 3113 | Common Stock Issued | 📄 | CR | 🔴 T1 | BS-EQ |
| 3114 | Common Stock Subscribed | 📄 | CR | 🔴 T1 | BS-EQ |
| 3121 | Preferred Stock — Par Value | 📄 | CR | 🔴 T1 | BS-EQ |
| 3122 | Preferred Stock Issued | 📄 | CR | 🔴 T1 | BS-EQ |
| 3123 | Preferred Stock Subscribed | 📄 | CR | 🔴 T1 | BS-EQ |
| 3131 | Paid-in Capital in Excess of Par — Common | 📄 | CR | 🔴 T1 | BS-EQ |
| 3132 | Paid-in Capital in Excess of Par — Preferred | 📄 | CR | 🔴 T1 | BS-EQ |
| 3133 | Paid-in Capital from Treasury Stock | 📄 | CR | 🔴 T1 | BS-EQ |
| 3134 | Paid-in Capital from Stock Options | 📄 | CR | 🔴 T1 | BS-EQ |
| 3135 | Paid-in Capital from Warrants | 📄 | CR | 🔴 T1 | BS-EQ |
| 3141 | Retained Earnings — Appropriated | 📄 | CR | 🔴 T1 | BS-EQ |
| 3142 | Retained Earnings — Unappropriated | 📄 | CR | 🔴 T1 | BS-EQ |
| 3143 | Prior Period Adjustments | 📄 | CR/DR | 🔴 T1 | BS-EQ |
| 3151 | Treasury Stock — Common | 📄 | DR | 🔴 T1 | BS-EQ (Contra-Equity) |
| 3152 | Treasury Stock — Preferred | 📄 | DR | 🔴 T1 | BS-EQ (Contra-Equity) |
| 3161 | Unrealised Gains/Losses on Securities | 📄 | CR/DR | 🔴 T1 | BS-EQ |
| 3162 | Foreign Currency Translation Adjustments | 📄 | CR/DR | 🔴 T1 | BS-EQ |
| 3163 | Pension Plan Adjustments | 📄 | CR/DR | 🔴 T1 | BS-EQ |
| 3164 | Cash Flow Hedge Adjustments | 📄 | CR/DR | 🔴 T1 | BS-EQ |

##### 3200 — Owner's Equity (Sole Proprietorship) 🏢 [CR] | BS-EQ

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 3211 | Owner's Capital | 📄 | CR | 🔴 T1 | BS-EQ |
| 3212 | Owner's Contributions | 📄 | CR | 🔴 T1 | BS-EQ |
| 3213 | Owner's Drawings | 📄 | DR | 🔴 T1 | BS-EQ (Contra-Equity) |
| 3214 | Owner's Retained Earnings | 📄 | CR | 🔴 T1 | BS-EQ |

##### 3300 — Partners' Equity (Partnership) 🏢 [CR] | BS-EQ

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 3311 | Partner A Capital Account | 📄 | CR | 🔴 T1 | BS-EQ |
| 3312 | Partner A Contributions | 📄 | CR | 🔴 T1 | BS-EQ |
| 3313 | Partner A Drawings | 📄 | DR | 🔴 T1 | BS-EQ (Contra-Equity) |
| 3314 | Partner A Profit/Loss Allocation | 📄 | CR/DR | 🔴 T1 | BS-EQ |
| 3321 | Partner B Capital Account | 📄 | CR | 🔴 T1 | BS-EQ |
| 3322 | Partner B Contributions | 📄 | CR | 🔴 T1 | BS-EQ |
| 3323 | Partner B Drawings | 📄 | DR | 🔴 T1 | BS-EQ (Contra-Equity) |
| 3324 | Partner B Profit/Loss Allocation | 📄 | CR/DR | 🔴 T1 | BS-EQ |
| 3331 | Partner C Capital Account | 📄 | CR | 🔴 T1 | BS-EQ |
| 3332 | Partner C Contributions | 📄 | CR | 🔴 T1 | BS-EQ |
| 3333 | Partner C Drawings | 📄 | DR | 🔴 T1 | BS-EQ (Contra-Equity) |
| 3334 | Partner C Profit/Loss Allocation | 📄 | CR/DR | 🔴 T1 | BS-EQ |

##### 3900 — Current Year Earnings 🏢 [CR] | BS-EQ

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 3901 | Net Income (Calculated) | 📄 | CR | 🔴 T1 | BS-EQ |
| 3902 | Dividends Declared | 📄 | DR | 🔴 T1 | BS-EQ (Contra-Equity) |
| 3903 | Distributions Declared | 📄 | DR | 🔴 T1 | BS-EQ (Contra-Equity) |

---

### 4.5 4000 — Revenue

#### 4000 — REVENUE 🏢 [CR]

##### 4100 — Operating Revenue 🏢 [CR] | IS-REV

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 4111 | Product Line A Sales | 📄 | CR | 🟡 T2 | IS-REV |
| 4112 | Product Line B Sales | 📄 | CR | 🟡 T2 | IS-REV |
| 4113 | Product Line C Sales | 📄 | CR | 🟡 T2 | IS-REV |
| 4114 | Wholesale Sales | 📄 | CR | 🟡 T2 | IS-REV |
| 4115 | Retail Sales | 📄 | CR | 🟡 T2 | IS-REV |
| 4116 | Online Sales | 📄 | CR | 🟡 T2 | IS-REV |
| 4117 | Export Sales | 📄 | CR | 🟡 T2 | IS-REV |
| 4118 | Domestic Sales | 📄 | CR | 🟡 T2 | IS-REV |
| 4121 | Consulting Services | 📄 | CR | 🟡 T2 | IS-REV |
| 4122 | Professional Services | 📄 | CR | 🟡 T2 | IS-REV |
| 4123 | Maintenance Services | 📄 | CR | 🟡 T2 | IS-REV |
| 4124 | Support Services | 📄 | CR | 🟡 T2 | IS-REV |
| 4125 | Installation Services | 📄 | CR | 🟡 T2 | IS-REV |
| 4126 | Training Services | 📄 | CR | 🟡 T2 | IS-REV |
| 4127 | Design Services | 📄 | CR | 🟡 T2 | IS-REV |
| 4128 | Contract Revenue | 📄 | CR | 🟡 T2 | IS-REV |
| 4131 | SaaS Subscription Revenue | 📄 | CR | 🟡 T2 | IS-REV |
| 4132 | Software Licence Revenue | 📄 | CR | 🟡 T2 | IS-REV |
| 4133 | Membership Fees | 📄 | CR | 🟡 T2 | IS-REV |
| 4134 | Subscription Fees | 📄 | CR | 🟡 T2 | IS-REV |
| 4135 | Recurring Service Revenue | 📄 | CR | 🟡 T2 | IS-REV |
| 4136 | Maintenance Contracts | 📄 | CR | 🟡 T2 | IS-REV |
| 4141 | Property Rental Income | 📄 | CR | 🟡 T2 | IS-REV |
| 4142 | Equipment Rental Income | 📄 | CR | 🟡 T2 | IS-REV |
| 4143 | Vehicle Rental Income | 📄 | CR | 🟡 T2 | IS-REV |
| 4144 | Lease Income | 📄 | CR | 🟡 T2 | IS-REV |
| 4151 | Sales Commissions Earned | 📄 | CR | 🟡 T2 | IS-REV |
| 4152 | Brokerage Fees | 📄 | CR | 🟡 T2 | IS-REV |
| 4153 | Referral Fees | 📄 | CR | 🟡 T2 | IS-REV |
| 4154 | Transaction Fees | 📄 | CR | 🟡 T2 | IS-REV |
| 4155 | Service Fees | 📄 | CR | 🟡 T2 | IS-REV |
| 4156 | Late Payment Fees | 📄 | CR | 🟡 T2 | IS-REV |
| 4157 | Processing Fees | 📄 | CR | 🟡 T2 | IS-REV |
| 4161 | Franchise Fees | 📄 | CR | 🟡 T2 | IS-REV |
| 4162 | Royalty Income | 📄 | CR | 🟡 T2 | IS-REV |
| 4163 | Licensing Fees | 📄 | CR | 🟡 T2 | IS-REV |

##### 4200 — Non-Operating Revenue 🏢 [CR] | IS-OIE

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 4211 | Interest Income — Bank Accounts | 📄 | CR | 🟡 T2 | IS-OIE |
| 4212 | Interest Income — Investments | 📄 | CR | 🟡 T2 | IS-OIE |
| 4213 | Interest Income — Notes Receivable | 📄 | CR | 🟡 T2 | IS-OIE |
| 4214 | Dividend Income | 📄 | CR | 🟡 T2 | IS-OIE |
| 4215 | Investment Gains | 📄 | CR | 🟡 T2 | IS-OIE |
| 4221 | Gain on Sale of Fixed Assets | 📄 | CR | 🟡 T2 | IS-OIE |
| 4222 | Gain on Sale of Investments | 📄 | CR | 🟡 T2 | IS-OIE |
| 4223 | Gain on Sale of Property | 📄 | CR | 🟡 T2 | IS-OIE |
| 4224 | Gain on Disposal of Equipment | 📄 | CR | 🟡 T2 | IS-OIE |
| 4231 | Realised Foreign Exchange Gains | 📄 | CR | 🟡 T2 | IS-OIE |
| 4232 | Unrealised Foreign Exchange Gains | 📄 | CR | 🟡 T2 | IS-OIE |
| 4241 | Insurance Proceeds | 📄 | CR | 🟡 T2 | IS-OIE |
| 4242 | Recovery of Bad Debts | 📄 | CR | 🟡 T2 | IS-OIE |
| 4243 | Scrap Sales | 📄 | CR | 🟢 T3 | IS-OIE |
| 4244 | Miscellaneous Income | 📄 | CR | 🟡 T2 | IS-OIE |
| 4245 | Government Grants | 📄 | CR | 🟡 T2 | IS-OIE |
| 4246 | Rebates and Incentives | 📄 | CR | 🟢 T3 | IS-OIE |

##### 4900 — Contra-Revenue 🏢 [DR] | IS-REV

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 4901 | Sales Returns and Allowances | 📄 | DR | 🟡 T2 | IS-REV (Contra) |
| 4902 | Sales Discounts | 📄 | DR | 🟡 T2 | IS-REV (Contra) |
| 4903 | Volume Rebates | 📄 | DR | 🟡 T2 | IS-REV (Contra) |
| 4904 | Promotional Discounts | 📄 | DR | 🟡 T2 | IS-REV (Contra) |

---

### 4.6 5000 — Cost of Goods Sold

#### 5000 — COST OF GOODS SOLD 🏢 [DR]

##### 5100 — Direct Costs 🏢 [DR] | IS-COGS

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 5111 | Raw Materials Used | 📄 | DR | 🟡 T2 | IS-COGS |
| 5112 | Component Parts | 📄 | DR | 🟡 T2 | IS-COGS |
| 5113 | Packaging Materials | 📄 | DR | 🟢 T3 | IS-COGS |
| 5114 | Direct Materials — Product A | 📄 | DR | 🟡 T2 | IS-COGS |
| 5115 | Direct Materials — Product B | 📄 | DR | 🟡 T2 | IS-COGS |
| 5121 | Production Wages | 📄 | DR | 🔴 T1 | IS-COGS |
| 5122 | Manufacturing Labour | 📄 | DR | 🔴 T1 | IS-COGS |
| 5123 | Assembly Labour | 📄 | DR | 🔴 T1 | IS-COGS |
| 5124 | Direct Labour — Product A | 📄 | DR | 🟡 T2 | IS-COGS |
| 5125 | Direct Labour — Product B | 📄 | DR | 🟡 T2 | IS-COGS |
| 5131 | Factory Utilities | 📄 | DR | 🟢 T3 | IS-COGS |
| 5132 | Factory Supplies | 📄 | DR | 🟢 T3 | IS-COGS |
| 5133 | Factory Equipment Depreciation | 📄 | DR | 🟡 T2 | IS-COGS |
| 5134 | Factory Rent | 📄 | DR | 🟢 T3 | IS-COGS |
| 5135 | Indirect Labour | 📄 | DR | 🟡 T2 | IS-COGS |
| 5136 | Factory Maintenance | 📄 | DR | 🟢 T3 | IS-COGS |
| 5137 | Quality Control | 📄 | DR | 🟢 T3 | IS-COGS |
| 5141 | Freight-in | 📄 | DR | 🟢 T3 | IS-COGS |
| 5142 | Import Duties | 📄 | DR | 🟢 T3 | IS-COGS |
| 5143 | Inventory Adjustments | 📄 | DR | 🟡 T2 | IS-COGS |
| 5144 | Inventory Shrinkage | 📄 | DR | 🟡 T2 | IS-COGS |
| 5145 | Purchase Returns | 📄 | CR | 🟡 T2 | IS-COGS (Contra) |
| 5146 | Purchase Discounts | 📄 | CR | 🟡 T2 | IS-COGS (Contra) |

---

### 4.7 6000 — Operating Expenses

#### 6000 — OPERATING EXPENSES 🏢 [DR]

##### 6100 — Personnel Expenses 🏢 [DR] | IS-OPEX

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 6111 | Executive Salaries | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6112 | Management Salaries | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6113 | Administrative Salaries | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6114 | Sales Salaries | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6115 | Marketing Salaries | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6116 | IT Salaries | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6117 | Customer Service Salaries | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6118 | Hourly Wages | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6119 | Overtime Wages | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6121 | Health Insurance | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6122 | Dental Insurance | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6123 | Vision Insurance | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6124 | Life Insurance | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6125 | Disability Insurance | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6126 | Retirement Plan — Employer Match | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6127 | 401(k) Employer Contributions | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6128 | Pension Expense | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6129 | Employee Wellness Programs | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6131 | Social Security Tax — Employer | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6132 | Medicare Tax — Employer | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6133 | Federal Unemployment Tax | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6134 | State Unemployment Tax | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6135 | Workers' Compensation Insurance | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6141 | Training and Development | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6142 | Employee Education | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6143 | Conferences and Seminars | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6144 | Professional Memberships | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6145 | Certifications and Licences | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6151 | Recruitment Costs | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6152 | Job Advertising | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6153 | Background Checks | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6154 | Relocation Expenses | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6155 | Employee Recognition | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6156 | Team Building Activities | 📄 | DR | 🟢 T3 | IS-OPEX |

##### 6200 — Facility Expenses 🏢 [DR] | IS-OPEX

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 6211 | Office Rent | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6212 | Warehouse Rent | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6213 | Retail Space Rent | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6214 | Equipment Lease Expense | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6215 | Vehicle Lease Expense | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6221 | Electricity | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6222 | Water and Sewer | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6223 | Natural Gas | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6224 | Heating and Cooling | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6225 | Waste Disposal | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6231 | Building Repairs | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6232 | Janitorial Services | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6233 | Landscaping and Grounds | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6234 | Pest Control | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6235 | HVAC Maintenance | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6236 | Elevator Maintenance | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6241 | Property Taxes | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6242 | Property Insurance | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6243 | Security Services | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6244 | Security Systems | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6245 | Fire Protection | 📄 | DR | 🟢 T3 | IS-OPEX |

##### 6300 — Administrative Expenses 🏢 [DR] | IS-OPEX

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 6311 | Office Supplies | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6312 | Stationery and Printing | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6313 | Postage and Shipping | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6314 | Copy and Printing Services | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6315 | Small Equipment Purchases | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6321 | Telephone | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6322 | Mobile Phones | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6323 | Internet Service | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6324 | Video Conferencing | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6325 | Courier and Delivery | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6331 | Legal Fees | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6332 | Accounting Fees | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6333 | Audit Fees | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6334 | Consulting Fees | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6335 | Tax Preparation Fees | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6336 | Bookkeeping Services | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6341 | General Liability Insurance | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6342 | Professional Liability Insurance | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6343 | Directors and Officers Insurance | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6344 | Business Interruption Insurance | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6345 | Vehicle Insurance | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6346 | Cyber Insurance | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6351 | Software Subscriptions | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6352 | SaaS Subscriptions | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6353 | Business Licences | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6354 | Professional Licences | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6355 | Trade Association Dues | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6356 | Publications and Research | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6361 | Bank Service Charges | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6362 | Merchant Fees | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6363 | Credit Card Processing Fees | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6364 | Wire Transfer Fees | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6365 | Check Printing | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6366 | NSF Charges | 📄 | DR | 🟡 T2 | IS-OPEX |

##### 6400 — Sales and Marketing 🏢 [DR] | IS-OPEX

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 6411 | Online Advertising | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6412 | Print Advertising | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6413 | Radio Advertising | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6414 | Television Advertising | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6415 | Outdoor Advertising | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6416 | Sponsorships | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6421 | Marketing Campaigns | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6422 | Content Marketing | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6423 | Social Media Marketing | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6424 | Email Marketing | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6425 | SEO and SEM | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6426 | Market Research | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6427 | Brand Development | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6431 | Brochures and Catalogues | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6432 | Business Cards | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6433 | Promotional Products | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6434 | Trade Show Materials | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6435 | Point of Sale Materials | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6441 | Sales Commissions | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6442 | Sales Bonuses | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6443 | Sales Travel | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6444 | Customer Entertainment | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6445 | Sales Meetings | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6446 | CRM Software | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6451 | Trade Show Fees | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6452 | Booth Design and Setup | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6453 | Event Sponsorship | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6454 | Networking Events | 📄 | DR | 🟢 T3 | IS-OPEX |

##### 6500 — Technology and IT 🏢 [DR] | IS-OPEX

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 6511 | Software Licences | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6512 | Cloud Services | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6513 | Database Services | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6514 | Backup and Storage | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6515 | Collaboration Tools | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6521 | IT Support and Helpdesk | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6522 | Managed IT Services | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6523 | Network Maintenance | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6524 | System Administration | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6525 | IT Consulting | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6531 | Computer Hardware | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6532 | Server Maintenance | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6533 | Network Equipment (Expensed) | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6534 | Hardware Repairs | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6541 | Website Hosting | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6542 | Website Maintenance | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6543 | Domain Registration | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6544 | SSL Certificates | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6545 | Web Development | 📄 | DR | 🟢 T3 | IS-OPEX |

##### 6600 — Travel and Entertainment 🏢 [DR] | IS-OPEX

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 6611 | Airfare | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6612 | Hotel and Lodging | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6613 | Ground Transportation | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6614 | Taxi and Rideshare | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6615 | Car Rental | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6616 | Parking and Tolls | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6617 | Travel Meals | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6621 | Business Meals | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6622 | Client Entertainment | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6623 | Employee Meals | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6624 | Office Snacks and Beverages | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6631 | Vehicle Fuel | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6632 | Vehicle Maintenance | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6633 | Vehicle Repairs | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6634 | Vehicle Registration | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6635 | Mileage Reimbursement | 📄 | DR | 🟢 T3 | IS-OPEX |

##### 6700 — Depreciation and Amortisation 🏢 [DR] | IS-OPEX

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 6711 | Depreciation — Buildings | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6712 | Depreciation — Machinery and Equipment | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6713 | Depreciation — Vehicles | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6714 | Depreciation — Computer Equipment | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6715 | Depreciation — Furniture and Fixtures | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6716 | Depreciation — Office Equipment | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6717 | Depreciation — Leasehold Improvements | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6721 | Amortisation — Patents | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6722 | Amortisation — Trademarks | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6723 | Amortisation — Software | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6724 | Amortisation — Customer Relationships | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6725 | Amortisation — Goodwill | 📄 | DR | 🟡 T2 | IS-OPEX |

##### 6800 — Research and Development 🏢 [DR] | IS-OPEX

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 6811 | Research Salaries | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6812 | Laboratory Supplies | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6813 | Testing and Prototyping | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6814 | Research Equipment | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6815 | Patent Filing Costs | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6816 | External R&D Services | 📄 | DR | 🟡 T2 | IS-OPEX |

##### 6900 — Other Operating Expenses 🏢 [DR] | IS-OPEX

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 6911 | Bad Debt Expense | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6912 | Write-off of Receivables | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6913 | Inventory Write-downs | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6921 | Business Licences and Permits | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6922 | Regulatory Fees | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6923 | Franchise Taxes | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6931 | Charitable Contributions | 📄 | DR | 🟡 T2 | IS-OPEX |
| 6932 | Community Sponsorships | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6933 | Political Contributions | 📄 | DR | 🔴 T1 | IS-OPEX |
| 6941 | Equipment Rental — Short-term | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6942 | Storage Fees | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6943 | Moving and Relocation | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6944 | Uniforms and Workwear | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6945 | Employee Recruitment | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6946 | Repairs and Maintenance | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6947 | Cleaning Supplies | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6948 | Safety Equipment | 📄 | DR | 🟢 T3 | IS-OPEX |
| 6949 | Other Operating Expenses | 📄 | DR | 🟡 T2 | IS-OPEX |

---

### 4.8 7000 — Other Income and Expenses

#### 7000 — OTHER INCOME AND EXPENSES 🏢 [DR/CR]

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 7110 | Interest Expense — Short-term Debt | 📄 | DR | 🔴 T1 | IS-OIE |
| 7120 | Interest Expense — Long-term Debt | 📄 | DR | 🔴 T1 | IS-OIE |
| 7130 | Interest Expense — Mortgage | 📄 | DR | 🔴 T1 | IS-OIE |
| 7140 | Interest Expense — Bonds | 📄 | DR | 🔴 T1 | IS-OIE |
| 7150 | Interest Expense — Lease Liabilities | 📄 | DR | 🟡 T2 | IS-OIE |
| 7160 | Interest Expense — Credit Cards | 📄 | DR | 🔴 T1 | IS-OIE |
| 7170 | Interest Expense — Other | 📄 | DR | 🟡 T2 | IS-OIE |
| 7210 | Loss on Sale of Fixed Assets | 📄 | DR | 🟡 T2 | IS-OIE |
| 7220 | Loss on Sale of Investments | 📄 | DR | 🟡 T2 | IS-OIE |
| 7230 | Loss on Disposal of Equipment | 📄 | DR | 🟡 T2 | IS-OIE |
| 7240 | Asset Impairment Losses | 📄 | DR | 🔴 T1 | IS-OIE |
| 7310 | Realised Foreign Exchange Losses | 📄 | DR | 🟡 T2 | IS-OIE |
| 7320 | Unrealised Foreign Exchange Losses | 📄 | DR | 🟡 T2 | IS-OIE |
| 7410 | Litigation Settlements | 📄 | DR | 🔴 T1 | IS-OIE |
| 7420 | Penalties and Fines | 📄 | DR | 🔴 T1 | IS-OIE |
| 7430 | Restructuring Costs | 📄 | DR | 🔴 T1 | IS-OIE |
| 7440 | Extraordinary Losses | 📄 | DR | 🔴 T1 | IS-OIE |
| 7450 | Other Non-operating Expenses | 📄 | DR | 🟡 T2 | IS-OIE |

---

### 4.9 8000 — Income Tax

#### 8000 — INCOME TAX 🏢 [DR]

| Code | Account Name | Type | Dr/Cr | Sensitivity | FS Line |
|------|--------------|------|-------|-------------|---------|
| 8110 | Current Income Tax Expense | 📄 | DR | 🔴 T1 | IS-TAX |
| 8120 | Deferred Income Tax Expense | 📄 | DR | 🔴 T1 | IS-TAX |
| 8130 | Federal Income Tax Expense | 📄 | DR | 🔴 T1 | IS-TAX |
| 8140 | State Income Tax Expense | 📄 | DR | 🔴 T1 | IS-TAX |
| 8150 | Foreign Income Tax Expense | 📄 | DR | 🔴 T1 | IS-TAX |
| 8160 | Tax Penalties and Interest | 📄 | DR | 🔴 T1 | IS-TAX |

---

## 5. Account Governance Policy

### 5.1 COA Change Policy

The Chart of Accounts is a controlled document. No account may be created, renamed, renumbered, reclassified, merged, or deactivated without formal approval. The following policy applies to all changes.

#### Permitted Requestors

Any member of the finance, accounting, or operations team may request a COA change. Requests from outside the finance function must be sponsored by the relevant department head.

#### Required Justification

Every COA change request must document: the business purpose for the change, the accounts affected, the expected volume of activity, the financial statement impact, any tax or regulatory implications, and whether any historical reclassifications are required.

#### Approval Authority

| Change Type | Required Approver |
|-------------|-------------------|
| New posting account (T3 sensitivity) | Controller |
| New posting account (T1/T2 sensitivity) | Controller + CFO |
| New header account | CFO |
| Account renaming (no reclassification) | Controller |
| Account reclassification to different category | CFO |
| Account deactivation | Controller |
| Account deletion (no transactions) | CFO |
| Structural hierarchy change | CFO + Board (if material) |

#### Lead Times

Routine changes (new T3 account, renaming): minimum five business days.
Significant changes (new T1/T2 account, reclassification): minimum ten business days, to allow system configuration, user communication, and testing.
Emergency changes: same-day approval by CFO is permitted in exceptional circumstances, with full documentation completed within five business days.

#### Communication

All approved COA changes must be communicated to all accounting system users at least three business days before the effective date, along with guidance on how the new or changed account should be used.

#### Version Control

Each material COA change increments the document version. All versions are retained in Appendix F (Change Log) and in the organisation's document management system. Version history must be accessible to auditors on request.

---

### 5.2 Account Ownership

Every posting account must have a designated account owner. Account ownership is recorded in the accounting system's account master and reviewed annually.

**Account Owner Responsibilities:**
- Monitor the account balance for reasonableness each period
- Investigate and explain unusual variances or unexpected balances
- Sign off on reconciliations before period close
- Review and approve any manual journal entries posted to the account above the defined threshold
- Notify the Controller if the account is no longer required

**Owner Assignment by Account Type:**
- Cash and bank accounts: Treasurer or CFO
- Accounts receivable: Credit Controller or AR Manager
- Inventory: Inventory or Supply Chain Manager
- Fixed assets: Fixed Asset Accountant or Controller
- Payroll accounts: Payroll Manager
- Tax liability accounts: Tax Manager or Controller
- Revenue accounts: Revenue or Finance Manager
- Expense accounts: Relevant cost centre or department head
- Equity accounts: CFO

---

### 5.3 Prohibited Uses

The following prohibitions apply to all users and override any other instruction:

1. Cash or bank payments must never be posted to depreciation expense accounts (6711–6717) or amortisation accounts (6721–6725). These are non-cash accounts and may only be posted to by automated depreciation runs or approved manual journals.
2. Income tax expense accounts (8110–8160) may only be posted to by the tax team via approved tax provision journals. No other team member may post to these accounts.
3. Equity accounts (3000–3999) may only be posted to by the Controller or CFO via formally approved journals. No sub-ledger or automated process may post directly to equity except for the automated close of temporary accounts.
4. Intercompany accounts (2114, 2640, 2775, and counterpart asset accounts) must never carry third-party (external) transactions. Every balance in an intercompany account must have a corresponding mirror entry in the counterpart entity's books.
5. Suspense or clearing accounts must not carry items older than the period-end close date. All items in suspense must be investigated, resolved, and reclassified before the period is considered closed.
6. The account 4244 (Miscellaneous Income) and 6949 (Other Operating Expenses) must not be used as catch-all buckets for transactions that belong in specific accounts. These accounts require Controller approval for each posting and are reviewed monthly for reclassification.

---

### 5.4 Dormancy and Sunset Policy

An account is considered dormant if it has had no posting activity for 12 consecutive calendar months. Upon reaching dormancy:

- The system flags the account automatically
- The account owner is notified and must confirm within 30 days whether the account should remain active
- If no response is received, the Controller deactivates the account
- Deactivated accounts retain their history and can be reactivated by the Controller upon request
- Accounts dormant for 36 consecutive months are candidates for permanent deactivation and archival, subject to CFO approval

This policy does not apply to header accounts, which by definition carry no direct postings.

---

## 6. Internal Controls and Security

### 6.1 Access Controls and Segregation of Duties

#### Role Definitions

Four standard roles are defined for the accounting system. Organisations may customise these roles but must not reduce the segregation boundaries described below.

| Role | Permitted Actions | Prohibited Actions |
|------|------------------|--------------------|
| **Read-Only Viewer** | View account balances, run standard reports | Post transactions, create/modify accounts, approve journals |
| **Transaction Poster** | Post transactions within assigned accounts | Create/modify/delete accounts, approve own journals |
| **Account Maintainer** | Create and modify accounts, manage hierarchy | Post transactions, approve own account changes |
| **COA Administrator** | Full access including deletion and restructuring | None — but all administrator actions are logged and reviewed |

#### Mandatory Segregation of Duties

The following SoD rules are non-negotiable and must be enforced by system configuration, not merely policy:

1. The person who **creates or modifies a COA account** must not be the same person who **posts transactions to that account**.
2. The person who **posts a journal entry** must not be the same person who **approves it**.
3. The person who **approves a journal entry** must not be the same person who **reconciles the accounts** affected by it.
4. The person who **processes payroll** must not be the same person who **approves payroll** or **has access to the bank account** used for payment.
5. The person who **creates a new vendor** in the accounts payable system must not be the same person who **processes payments** to that vendor.
6. No single person should have the ability to both **initiate and complete a financial transaction** end-to-end without a second person's involvement.

In small organisations where these separations are not fully achievable due to staff numbers, compensating controls must be documented and approved by the board. Compensating controls include: regular management review of all journal entries, periodic external review by an accountant or auditor, and dual-signatory requirements on all bank payments.

#### Sensitive Account Restrictions

Accounts with T1 (Restricted) sensitivity require the following additional access controls:

- Posting access limited to named individuals only (no role-based access — explicit user-by-user authorisation)
- Dual approval required for journal entries above the organisation's defined materiality threshold
- Real-time notification to the account owner and Controller on any posting
- Monthly reconciliation review by an independent person (not the poster)

#### Access Review

User access to the accounting system must be reviewed formally every six months. The review must confirm that:
- Every active user account belongs to a current employee or contractor with a legitimate business need
- No user holds incompatible roles that violate SoD rules
- Terminated employees' access has been removed (this must occur on the date of termination, not retrospectively)
- Administrator access is held only by the minimum number of users necessary

---

### 6.2 Audit Trail Requirements

#### Account Master Audit Trail

Every change to the account master must be automatically logged with the following fields. This log must be immutable — no user, including system administrators, may delete or modify an audit trail entry.

| Field | Description |
|-------|-------------|
| Timestamp | Date and time of change (UTC, millisecond precision) |
| User ID | System identifier of the user who made the change |
| User Name | Display name of the user |
| Action Type | Created / Modified / Deactivated / Reactivated / Deleted |
| Field Changed | Name of the specific field that was changed |
| Previous Value | Value before the change |
| New Value | Value after the change |
| Approval Reference | Reference number of the COA change approval |
| IP Address | Network address from which the change was made |

#### Transaction Audit Trail

Every posted journal entry must carry:

- Journal entry number (unique, sequential, non-reusable)
- Posting date and system timestamp
- Preparer user ID and name
- Approver user ID and name (for dual-approval journals)
- Source document reference (invoice number, payroll run ID, bank statement date, etc.)
- Narrative description (mandatory, minimum 10 characters)
- Reversal reference (if the entry is a reversal of a prior entry)

Entries cannot be deleted after posting. Corrections must be made through formal reversal entries, which themselves generate audit records.

#### Audit Trail Retention

Audit trail records must be retained for a minimum of seven years, or longer if required by applicable law. Audit trail data must be backed up separately from operational data and protected against modification by database administrators.

#### Auditor Access

External and internal auditors must be able to access the full audit trail for any account or period on request, without requiring assistance from the accounting team. Read-only auditor access should be configured as a standard system role.

---

### 6.3 Fraud Prevention Controls

#### Duplicate Posting Detection

The system should automatically flag and hold for review any journal entry or sub-ledger posting where the same combination of amount, vendor/customer, and account appears within a 30-day window. Legitimate duplicates (e.g. recurring monthly invoices of the same amount) must be explicitly approved and marked as expected recurring items.

#### Approval Threshold Controls

All organisations must define a monetary threshold above which journal entries require dual approval. This threshold should be set at a level representing materiality for the organisation (typically between 0.5% and 1% of total revenue or total assets, whichever is lower). The threshold must be documented, approved by the CFO, and reviewed annually.

Specific high-risk account types (T1 accounts, income accounts, equity accounts, intercompany accounts) should have lower thresholds than routine expense accounts.

#### Round Number and Threshold Monitoring

The following transaction patterns are recognised fraud indicators and should trigger a mandatory review workflow:

- Round number transactions (exactly $1,000; $5,000; $10,000; $50,000; $100,000 or local currency equivalent) in expense or discretionary accounts
- Transactions just below approval thresholds (e.g. $4,990 when the threshold is $5,000)
- Multiple transactions to the same payee in a short period that individually fall below the approval threshold but collectively exceed it (structuring)
- Expense postings on weekends, public holidays, or outside normal business hours without explanation

#### Dormant Account Monitoring

Any posting to an account that has been inactive for six or more months must trigger an automatic notification to the Controller and account owner. The posting must be reviewed and approved before the period is closed.

#### Contra Account Controls

Adjustments to contra accounts (1290, 1390, 1529, 1539, 1549, 1559, 1569, 1579, 4901–4904, 5145–5146) require senior approval because they directly reduce reported asset or revenue values. The following rules apply:
- Allowance for Doubtful Accounts (1290): adjustments above the defined threshold require CFO approval and must reference a specific debtor analysis
- Inventory Reserve (1390): adjustments must reference an inventory count or ageing report
- Accumulated Depreciation accounts: may only be adjusted via approved depreciation runs or formal correction journals; ad hoc adjustments require Controller approval

#### Statistical Anomaly Monitoring

For organisations processing high volumes of transactions, the following analytical controls are recommended as part of the annual internal audit programme:
- Benford's Law analysis of leading digits in expense postings (significant deviation from the expected distribution is a fraud indicator)
- Duplicate payment analysis across the full year
- Vendor master change analysis (new vendors added, bank details changed, address changes)
- Journal entry analysis for unusual posting times, unusual narrations, and entries that net to zero

---

### 6.4 Period-End Controls

#### Period Lock Policy

| Period Type | Lock Timing | Lock Authority | Unlock Authority |
|-------------|-------------|----------------|-----------------|
| Monthly close | 10 business days after month-end | Controller | Controller + CFO |
| Quarterly close | 15 business days after quarter-end | CFO | CFO + Board approval |
| Annual close | 30 business days after year-end | CFO | CFO + Board approval |

Once a period is locked, no postings may be made to accounts in that period without an explicit unlock. Prior period adjustments (postings to a locked period) require:
- Written justification
- CFO approval
- A disclosure note if the adjustment is material
- Re-lock of the period after the adjustment

#### Month-End Close Checklist

The following reconciliations and confirmations must be completed before the Controller authorises period close. Each item must be signed off by the account owner and independently reviewed.

**Balance Sheet Accounts (mandatory for all periods):**
- [ ] Bank reconciliation completed for all accounts (1111–1119) — reconciled to bank statements
- [ ] Accounts receivable ageing reviewed; allowance for doubtful accounts updated (1290)
- [ ] Inventory count or cycle count completed; inventory reserve reviewed (1390)
- [ ] Prepaid expense amortisation schedule updated; balances confirmed (1410–1490)
- [ ] Fixed asset additions and disposals recorded; depreciation run completed (1500–1599)
- [ ] Accounts payable sub-ledger reconciled to GL (2111–2114)
- [ ] All payroll liabilities reconciled to payroll system (2300–2327)
- [ ] All tax liability accounts reconciled to tax returns or estimates (2400–2444)
- [ ] Deferred revenue schedule updated; earned amounts recognised (2510–2560)
- [ ] Intercompany balances agreed between all entities (2114, 2640, 2775)
- [ ] All suspense and clearing accounts reviewed; must be zero or fully explained

**Income Statement Accounts (review for reasonableness):**
- [ ] Revenue accounts reviewed for unrecognised amounts or premature recognition
- [ ] Payroll expense reconciled to payroll system
- [ ] Depreciation and amortisation expenses confirmed to schedules
- [ ] Accruals reviewed and updated for known liabilities not yet invoiced

**Journal Entry Review:**
- [ ] All manual journal entries for the period reviewed by Controller
- [ ] All recurring journal entries confirmed as still appropriate
- [ ] All reversing entries from the prior period confirmed as reversed

#### Accruals Policy

Accruals must be recorded for all known liabilities and expenses where an invoice has not yet been received, but the obligation has been incurred. Accruals must:
- Reference the underlying obligation (contract, purchase order, estimate)
- Be reversed in the following period when the invoice is received
- Be reviewed at least quarterly for continued accuracy
- Not be used to smooth earnings or defer recognition to a future period

---

### 6.5 Sensitive Account Register

The following accounts carry elevated fraud or error risk and are subject to additional controls beyond the standard tier. This register supplements the sensitivity tier (T1/T2/T3) shown in the COA table and provides specific control requirements.

#### Tier 1 — Restricted Accounts (selected highlights)

| Account Range | Control Requirements |
|---------------|---------------------|
| 1111–1119 (Cash and Bank) | Daily or weekly reconciliation to bank statements; dual signatory on all payments above threshold; CFO approval for new accounts |
| 1111 (Petty Cash) | Physical count monthly; surprise counts at least twice per year; maximum float defined and enforced |
| 1113–1114 (Checking Accounts) | Online banking access restricted to Treasurer and CFO; all outgoing payments require dual authorisation |
| 1221–1222 (Employee Loans/Advances) | Board or CFO approval for any new advance; maximum amount and repayment schedule documented; deducted from salary if not repaid |
| 1813 (Loans to Officers) | Board approval required; disclosed in financial statement notes; reviewed by external auditor |
| 2114 (AP Related Parties) | CFO approval for all postings; disclosed in financial statement notes; supported by transfer pricing documentation |
| 2311–2316 (Payroll Taxes Withheld) | Reconciled to each payroll run; remitted to tax authorities on statutory due dates; late remittance triggers immediate Controller alert |
| 3000–3999 (All Equity) | CFO approval for all postings; annual reconciliation to share register and retained earnings calculation |
| 6111–6112 (Executive Salaries) | Approved by board remuneration committee; disclosed in financial statements for listed entities |
| 7410 (Litigation Settlements) | Legal team and CFO approval; disclosed in financial statement notes; reviewed by external legal counsel |

#### Suspense and Clearing Account Policy

Any account used as a suspense or clearing account must:
- Have a named owner with responsibility for clearing items
- Be reviewed weekly
- Have a maximum age policy for open items (recommended: 30 days)
- Be at zero balance at every period close, or have every open item documented with an expected resolution date
- Never be used as a permanent resting place for unresolved items

---

### 6.6 Journal Entry Controls

Manual journal entries are the highest-risk transaction type in any accounting system because they can bypass sub-ledger controls and directly affect any account. The following controls are mandatory.

#### What Requires a Manual Journal Entry

- Accruals and reversals
- Depreciation (if not automated)
- Corrections to posting errors
- Period-end adjustments
- Allocation of costs across departments or cost centres
- Tax provision entries
- Consolidation adjustments
- Prior period corrections

#### Mandatory Journal Entry Fields

Every manual journal entry must include:
- Date and accounting period
- Journal type (accrual, correction, allocation, etc.)
- Debit and credit accounts (must balance to zero)
- Monetary amount and currency
- Preparer name and authorisation signature (or electronic approval)
- Approver name and authorisation (separate from preparer — SoD)
- Supporting document reference (attached or referenced)
- Narrative description (what is being recorded and why)
- Reversal date (for accrual entries that should reverse in the next period)

#### Recurring Journal Entries

Recurring journal entries (standing entries that post automatically each period) must:
- Be set up only by the Controller or CFO
- Have a defined review date (at least annual)
- Have a defined expiry date where the underlying obligation has an end date
- Be reviewed at each annual budget cycle for continued necessity and accuracy

#### Year-End Journals

All year-end closing entries (closing temporary accounts to retained earnings, recording final tax provisions, recording audit adjustments) require CFO approval. These entries must be separately identified in the audit trail and retained as part of the annual close package.

---

## 7. Implementation Reference

### 7.1 Database Schema

The following schema supports the full account structure including hierarchy, sensitivity, and financial statement mapping.

```sql
-- Core account table
accounts (
  account_id           BIGINT PRIMARY KEY,
  account_code         VARCHAR(20) UNIQUE NOT NULL,
  account_name         VARCHAR(100) NOT NULL,
  description          TEXT,
  category_id          INT REFERENCES account_categories(category_id),
  type_id              INT REFERENCES account_types(type_id),
  subtype_id           INT REFERENCES account_subtypes(subtype_id),
  parent_account_id    BIGINT REFERENCES accounts(account_id),
  is_header            BOOLEAN NOT NULL DEFAULT FALSE,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  normal_balance       CHAR(2) CHECK (normal_balance IN ('DR','CR')),
  currency_code        CHAR(3) DEFAULT 'USD',
  sensitivity_tier     CHAR(2) CHECK (sensitivity_tier IN ('T1','T2','T3')),
  fs_placement         VARCHAR(10),  -- BS-CA, BS-NCA, BS-CL, etc.
  account_owner_id     INT REFERENCES users(user_id),
  budget_enabled       BOOLEAN DEFAULT FALSE,
  tax_treatment        VARCHAR(50),  -- deductible, non-deductible, capital, etc.
  level                INT NOT NULL,
  full_path            TEXT,
  opening_balance      DECIMAL(18,2) DEFAULT 0,
  current_balance      DECIMAL(18,2) DEFAULT 0,
  created_date         TIMESTAMP NOT NULL DEFAULT NOW(),
  modified_date        TIMESTAMP,
  created_by           INT REFERENCES users(user_id),
  modified_by          INT REFERENCES users(user_id)
)

-- Category lookup
account_categories (
  category_id          INT PRIMARY KEY,
  category_name        VARCHAR(50),  -- Assets, Liabilities, Equity, Revenue, Expenses
  normal_balance       CHAR(2),
  statement_type       VARCHAR(30),  -- Balance Sheet, Income Statement
  is_permanent         BOOLEAN,
  sort_order           INT
)

-- Type lookup
account_types (
  type_id              INT PRIMARY KEY,
  category_id          INT REFERENCES account_categories(category_id),
  type_name            VARCHAR(100),
  description          TEXT,
  sort_order           INT
)

-- Sub-type lookup
account_subtypes (
  subtype_id           INT PRIMARY KEY,
  type_id              INT REFERENCES account_types(type_id),
  subtype_name         VARCHAR(100),
  description          TEXT,
  sort_order           INT
)

-- Immutable audit trail for account master changes
account_audit_log (
  log_id               BIGINT PRIMARY KEY,
  account_id           BIGINT REFERENCES accounts(account_id),
  action_type          VARCHAR(20),  -- CREATED, MODIFIED, DEACTIVATED, etc.
  field_changed        VARCHAR(100),
  previous_value       TEXT,
  new_value            TEXT,
  changed_by_user_id   INT,
  changed_by_name      VARCHAR(100),
  change_timestamp     TIMESTAMP NOT NULL,
  approval_reference   VARCHAR(50),
  ip_address           VARCHAR(45)
)

-- Period lock table
accounting_periods (
  period_id            INT PRIMARY KEY,
  period_name          VARCHAR(20),  -- e.g. 2024-01
  start_date           DATE,
  end_date             DATE,
  is_locked            BOOLEAN DEFAULT FALSE,
  locked_by            INT REFERENCES users(user_id),
  locked_date          TIMESTAMP,
  period_type          VARCHAR(10)   -- monthly, quarterly, annual
)
```

---

### 7.2 System Features Required

#### Account Management
- Account creation wizard with step-by-step validation and contextual help
- Real-time uniqueness and format validation on account code entry
- Auto-suggestion of next available account number in sequence
- Mandatory account owner assignment before saving
- Sensitivity tier auto-assignment based on account range (overridable by Controller)
- Preview of financial statement placement based on category selection

#### Hierarchy Management
- Expandable tree view with expand/collapse at each level
- Drag-and-drop parent reassignment (with SoD check — users cannot reassign accounts they post to)
- Hierarchy depth indicator and maximum depth enforcement
- Real-time roll-up balance display at each level
- Orphan account detection and resolution workflow
- Bulk parent reassignment for restructuring

#### Security and Access
- Role-based access control with the four standard roles defined in Section 6.1
- Per-account access override for T1 accounts (named-user authorisation)
- SoD enforcement: system blocks posting to accounts the same user created or modified
- Dual-approval workflow for journals above configurable thresholds
- Session timeout after configurable period of inactivity
- Multi-factor authentication for COA Administrator role

#### Audit and Compliance
- Immutable audit trail as specified in Section 6.2
- Audit trail export in CSV and PDF formats for auditor access
- Period lock and unlock with full workflow and audit record
- Dormant account flagging at 6-month and 12-month thresholds
- Duplicate posting detection with hold-for-review workflow
- Round-number and threshold-proximity alerts

#### Reporting
- Financial statements generated directly from COA structure (Balance Sheet, P&L, Trial Balance)
- Indented trial balance showing hierarchy roll-ups
- Account activity report by date range, user, and journal type
- Variance report comparing actual to budget for budget-enabled accounts
- Reconciliation status dashboard showing completion percentage by account owner
- COA change log report

---

### 7.3 Validation and Business Rules

#### Account Code Validation
- Code must be unique across all active and inactive accounts
- Code must conform to the defined format (4 digits, optional suffix)
- Code must fall within the correct range for the selected category
- Reserved codes (x00 for header, x90 for contra) may only be used for their designated purposes

#### Hierarchy Validation
- No circular references (validated by walking the parent chain before saving)
- Maximum depth of five levels enforced
- Category consistency: child must inherit parent's major category
- Balance validation: parent balance must equal sum of children at all times

#### Transaction Validation
- Header accounts (is_header = TRUE) block posting — any attempt returns an error
- Posting to inactive accounts is blocked
- Posting to locked periods is blocked unless explicitly unlocked
- Debit/credit balance must equal zero before a journal entry can be posted
- Manual journals above threshold are held in a pending queue until approved

#### Integrity Checks (scheduled, run nightly)
- Parent-child balance reconciliation: flag any discrepancy
- Normal balance exceptions: flag posting accounts with balances opposite to their normal balance (with exceptions for known contra accounts)
- Orphan account detection: flag any account without a parent (except the eight top-level category headers)
- Dormant account flagging
- SoD violation detection: flag any user who both created/modified an account and posted to it in the same period

---

### 7.4 Data Integrity, Backup, and Disaster Recovery

#### Immutability of Posted Transactions

Posted and period-locked transactions must be immutable. The system must not allow deletion of posted entries — corrections are made exclusively through reversal entries. Any system that permits deletion of posted transactions fails fundamental accounting integrity requirements and must not be used.

#### Encryption Requirements

- All accounting data must be encrypted at rest using AES-256 or equivalent
- Data in transit must be encrypted using TLS 1.2 or higher
- Encryption keys must be stored separately from encrypted data
- T1 (Restricted) account data, payroll data, and tax data represent the highest sensitivity class and must be protected accordingly

#### Backup Requirements

| Backup Type | Frequency | Retention | Test Frequency |
|-------------|-----------|-----------|----------------|
| Full database backup | Daily | 7 years | Quarterly restore test |
| Transaction log backup | Hourly | 90 days | Monthly restore test |
| Audit trail backup | Daily | 7 years | Annual restore test |
| COA master data backup | On every change | 7 years | Annual restore test |

Backup media must be stored in a physically separate location from the primary system. Cloud backups must be in a different geographic region from the primary data.

#### Disaster Recovery

A documented disaster recovery plan must define:
- Recovery Time Objective (RTO): the maximum acceptable time to restore accounting system availability after a failure
- Recovery Point Objective (RPO): the maximum acceptable data loss (in time) after a failure
- Recovery procedures and responsible personnel
- Annual DR test including a simulated full restore

Accounting systems typically require RTO of 4 hours or less and RPO of 1 hour or less for organisations that process daily transactions.

---

## 8. Best Practices and Maintenance

### 8.1 Planning Phase

- Map out the complete account structure before implementation, using the range allocation table in Section 2.1 as the foundation
- Engage all financial reporting stakeholders (management, tax, treasury, operations) before finalising the structure
- Align the COA with required external reporting (IFRS or GAAP financial statements, regulatory returns, tax returns) to ensure every required line item maps to specific accounts
- Review the industry-specific account requirements for the organisation's sector
- Design with reporting outputs in mind — work backwards from the financial statements and management reports you need to produce

### 8.2 Numbering and Naming Standards

- Use consistent digit lengths throughout (four digits for all base codes)
- Leave gaps in numbering for future expansion within each group
- Use consistent naming conventions: account names should be noun phrases in title case, unambiguous, and self-explanatory without requiring the account code
- Avoid abbreviations in account names except for universally understood terms (AR, AP, VAT, PP&E)
- Use a dash (—) rather than a hyphen or slash to separate account name qualifiers (e.g. "Accounts Payable — Related Parties" not "Accounts Payable/Related Parties")
- Document naming conventions in a style guide and distribute to all users who create accounts

### 8.3 Hierarchy Design

- Keep hierarchy depth to four or five levels for most accounts; reserve level five for exceptional cases
- Balance the need for detail against the complexity of maintenance — more granularity is only useful if it will be reported and analysed
- Align the structure with the organisation's actual reporting dimensions (legal entities, business units, departments, cost centres)
- Ensure the hierarchy maps directly to the structure of required financial statements

### 8.4 Annual Review Process

The COA should be reviewed annually, ideally before the start of each financial year. The annual review must assess:

- Dormant accounts (per Section 5.4 dormancy policy)
- Accounts whose purpose has changed or is no longer needed
- Gaps in the structure highlighted by the previous year's operations
- Changes in accounting standards that require new account types or reclassifications
- Changes in the business (new product lines, new legal entities, acquisitions, disposals) that require structural changes
- Feedback from the external audit

All changes arising from the annual review are processed through the COA change policy in Section 5.1.

### 8.5 User Training Standards

All users with posting access to the accounting system must complete mandatory training on:

- The COA structure and numbering logic
- The five account categories and normal balance rules
- How to identify the correct account for common transaction types
- The journal entry controls and approval workflow
- The period-end close process and their responsibilities
- Fraud awareness and how to report concerns

Training must be completed before posting access is granted to new users. Refresher training is required annually, or whenever material changes are made to the COA structure. Training completion must be recorded and available for audit.

### 8.6 External Audit Interface

The following documentation must be maintained and made available to external auditors on request:

- This document (current version)
- All prior versions (Appendix F)
- Account master export as at the audit date
- Full audit trail for all COA changes during the audit period
- All journal entries for the audit period with supporting documents
- Reconciliation sign-offs for all T1 and T2 accounts
- Period lock/unlock log for all periods in scope
- User access review records for the audit period

---

## 9. Regulatory and Compliance Considerations

### 9.1 IFRS and GAAP Treatment Differences

The following account areas have materially different treatment under IFRS versus US GAAP. Organisations must apply the framework appropriate to their jurisdiction and ensure the COA structure supports the required disclosures.

**Lease Accounting (Accounts 2741–2744, 6214–6215):** Under IFRS 16, virtually all leases are recognised on the balance sheet as right-of-use assets and lease liabilities. Under US GAAP ASC 842, operating leases are also recognised on the balance sheet, but the income statement treatment differs (single straight-line lease expense under ASC 842 vs. interest and depreciation under IFRS 16). The COA structure supports both through separate lease liability accounts (2741–2744) and lease expense accounts (6214–6215).

**Revenue Recognition (Accounts 4000–4999):** Both IFRS 15 and ASC 606 follow the same five-step performance obligation model, but application guidance differs. Deferred revenue accounts (2510–2530) are critical for capturing obligations not yet recognised as revenue. Organisations must maintain sufficient granularity in revenue accounts to support disclosure of revenue disaggregation as required by both standards.

**Inventory (Accounts 1310–1390):** IFRS prohibits the use of LIFO (Last-In-First-Out) as an inventory costing method. US GAAP permits LIFO. Organisations using US GAAP that apply LIFO must maintain LIFO reserve tracking. Organisations transitioning from US GAAP to IFRS must reclassify inventory values accordingly.

**Development Costs (Accounts 1630–1635):** Under IFRS (IAS 38), development costs that meet specific criteria must be capitalised as intangible assets. Under US GAAP, most development costs are expensed as incurred (with the exception of internal-use software under ASC 350-40). This affects the classification of software development spend between the 1630–1635 intangible asset accounts and the 6813–6816 R&D expense accounts.

### 9.2 Sarbanes-Oxley (SOX) Compliance

For organisations subject to SOX (listed entities on US exchanges and their subsidiaries), the following requirements apply:

- The COA structure forms part of the internal control environment over financial reporting (ICFR) and must be included in the annual ICFR assessment
- Material changes to the COA are changes to the control environment and must be assessed for their impact on ICFR design and operating effectiveness
- The COA change log (Appendix F) and access control records are required as audit evidence for the SOX review
- Manual journal entry controls (Section 6.6) are specifically tested in SOX audits — ensure all requirements are met and documented
- Segregation of duties (Section 6.1) is a SOX control — violations must be documented as control deficiencies and remediated

### 9.3 VAT, GST, and Sales Tax Mapping

Each posting account should carry a default tax code that drives automated tax calculation and reporting. The following tax treatment categories apply:

| Tax Treatment | Description | Example Accounts |
|---------------|-------------|-----------------|
| Standard-rated output | Sales subject to standard VAT/GST rate | 4111–4163 (most revenue) |
| Zero-rated output | Sales subject to zero VAT/GST rate | 4117 (Export Sales) |
| Exempt output | Sales not subject to VAT/GST | 4211–4214 (investment income) |
| Standard-rated input | Purchases with recoverable VAT/GST | Most 5000–6999 expense accounts |
| Non-recoverable input | Purchases where VAT/GST is not recoverable | 6621–6624 (entertainment) |
| Out of scope | Transactions outside the VAT/GST system | 3000–3999 (equity), 1000–1999 (most asset purchases) |

VAT/GST input tax (2423) must be reconciled to tax returns at each filing period. The net VAT position (2424 less 2423) represents the amount payable to or refundable from the tax authority.

### 9.4 Data Privacy Compliance

The following accounts may contain or reference personal data subject to data protection legislation (GDPR, POPIA, CCPA, or equivalent):

- 1221–1222 (Employee Advances and Loans): contain employee personal financial information
- 1813 (Loans to Officers): contains officer personal financial information
- 2211–2217 (Accrued Payroll): indirectly reference individual employee compensation
- 2311–2327 (Payroll Liabilities): contain individual employee withholding and deduction data
- 6111–6119 (All Salary and Wage Accounts): indirectly reference personal compensation data

Personal data in accounting systems must be:
- Accessible only to users with a legitimate business need (minimum necessary access principle)
- Retained only for as long as required by applicable law
- Protected by the encryption requirements in Section 7.4
- Included in the organisation's data processing register and privacy impact assessments

### 9.5 Record Retention Requirements

Financial records must be retained for the periods specified by applicable law. The following minimum retention periods apply (organisations in multiple jurisdictions must comply with the most stringent applicable requirement):

| Record Type | Minimum Retention |
|-------------|------------------|
| General ledger and chart of accounts | 7 years |
| Journal entries and supporting documents | 7 years |
| Tax returns and supporting computations | 7 years (or longer in some jurisdictions) |
| Payroll records | 7 years |
| Contracts and agreements | Duration of contract + 7 years |
| Audit reports | Indefinitely |
| Board resolutions relating to financial matters | Indefinitely |

Electronic records have the same legal status as paper records in most jurisdictions, provided they are stored in a format that remains accessible and readable throughout the retention period.

### 9.6 Inter-company and Consolidation Controls

For organisations operating with multiple legal entities:

**Intercompany Account Rules:**
- Every intercompany payable (2114, 2640, 2775) must have a corresponding intercompany receivable (1221 or equivalent) in the counterpart entity's books
- Intercompany balances must be formally agreed between both entities at each month-end before close
- Disagreements between intercompany balances must be resolved before the period is locked
- Intercompany transactions must be recorded at arm's length prices in accordance with transfer pricing rules

**Consolidation Entries:**
- Intercompany balances are eliminated on consolidation
- Unrealised profits on intercompany transactions are eliminated
- Elimination journals must be prepared, approved, and retained as part of the consolidation working papers
- The consolidated COA must map to individual entity COAs through a defined translation table

**Transfer Pricing:**
- All intercompany transactions involving related parties in different tax jurisdictions must be supported by transfer pricing documentation
- Transfer pricing policies must be reviewed annually and updated for changes in the business
- Account 2114 (Accounts Payable — Related Parties) postings must reference the applicable transfer pricing agreement

---

## 10. Appendices

### Appendix A: Account Range Quick Reference Map

```
1000–1999  ASSETS
  1100–1499  Current Assets
    1110       Cash and Cash Equivalents
    1120       Short-term Investments
    1200       Accounts Receivable (incl. 1290 contra)
    1300       Inventory (incl. 1390 contra)
    1400       Prepaid Expenses and Other Current Assets
  1500–1599  Fixed Assets (PP&E)
    1510       Land
    1520       Buildings (incl. 1529 contra)
    1530       Machinery and Equipment (incl. 1539 contra)
    1540       Vehicles (incl. 1549 contra)
    1550       Computer Equipment (incl. 1559 contra)
    1560       Furniture and Fixtures (incl. 1569 contra)
    1570       Office Equipment (incl. 1579 contra)
    1580       Construction in Progress
  1600–1699  Intangible Assets
    1610       Intellectual Property (incl. 1619 contra)
    1620       Goodwill and Business Assets (incl. 1629 contra)
    1630       Software and Technology (incl. 1639 contra)
  1700–1799  Long-term Investments
    1710       Equity Investments
    1720       Debt Investments
    1730       Other Long-term Investments
  1800–1999  Other Non-current Assets
    1810       Long-term Receivables
    1820       Deferred Charges
    1830       Deposits and Other Assets

2000–2999  LIABILITIES
  2100–2699  Current Liabilities
    2110       Accounts Payable
    2120       Short-term Debt
    2130       Credit Cards Payable
    2200       Accrued Liabilities
    2300       Payroll Liabilities
    2400       Tax Liabilities
    2500       Unearned Revenue
    2600       Other Current Liabilities
  2700–2999  Long-term Liabilities
    2710       Long-term Debt
    2720       Bonds and Notes Payable
    2730       Mortgage Payable
    2740       Lease Liabilities
    2750       Deferred Tax Liabilities
    2760       Employee Benefit Obligations
    2770       Other Long-term Liabilities

3000–3999  EQUITY
  3100       Shareholders' Equity (Corporation)
  3200       Owner's Equity (Sole Proprietorship)
  3300       Partners' Equity (Partnership)
  3900       Current Year Earnings

4000–4999  REVENUE
  4100       Operating Revenue
    4110         Product Sales
    4120         Service Revenue
    4130         Subscription and Recurring Revenue
    4140         Rental and Lease Income
    4150         Commission and Fee Income
    4160         Franchise and Royalty Income
  4200       Non-Operating Revenue
  4900       Contra-Revenue

5000–5999  COST OF GOODS SOLD
  5100       Direct Costs
    5110         Direct Materials
    5120         Direct Labor
    5130         Manufacturing Overhead
    5140         Other COGS

6000–6999  OPERATING EXPENSES
  6100       Personnel Expenses
  6200       Facility Expenses
  6300       Administrative Expenses
  6400       Sales and Marketing
  6500       Technology and IT
  6600       Travel and Entertainment
  6700       Depreciation and Amortisation
  6800       Research and Development
  6900       Other Operating Expenses

7000–7999  OTHER INCOME AND EXPENSES
  7100       Interest Expense
  7200       Loss on Disposal of Assets
  7300       Foreign Exchange Losses
  7400       Other Non-operating Expenses

8000–8999  INCOME TAX
  8100       Income Tax Expense
```

---

### Appendix B: Financial Statement Mapping Table

#### Balance Sheet

| Balance Sheet Line | Account Range(s) |
|-------------------|-----------------|
| **Current Assets** | |
| Cash and Cash Equivalents | 1111–1119 |
| Short-term Investments | 1121–1125 |
| Accounts Receivable (net) | 1211–1226 less 1290 |
| Inventory (net) | 1310–1380 less 1390 |
| Prepaid Expenses and Other | 1410–1490 |
| **Non-current Assets** | |
| Property, Plant and Equipment (net) | 1511–1583 less 1529/1539/1549/1559/1569/1579 |
| Intangible Assets (net) | 1611–1635 less 1619/1629/1639 |
| Long-term Investments | 1711–1733 |
| Other Non-current Assets | 1811–1834 |
| **Current Liabilities** | |
| Accounts Payable | 2111–2114 |
| Short-term Debt and Credit Cards | 2121–2134 |
| Accrued Liabilities | 2211–2229 |
| Payroll Liabilities | 2311–2327 |
| Tax Liabilities | 2411–2444 |
| Unearned Revenue | 2510–2560 |
| Other Current Liabilities | 2610–2690 |
| **Non-current Liabilities** | |
| Long-term Debt | 2711–2719 |
| Bonds and Notes Payable | 2721–2726 |
| Mortgage Payable | 2731–2733 |
| Lease Liabilities | 2741–2744 |
| Deferred Tax Liabilities | 2751–2753 |
| Employee Benefit Obligations | 2761–2764 |
| Other Long-term Liabilities | 2771–2779 |
| **Equity** | 3111–3903 |

#### Income Statement

| Income Statement Line | Account Range(s) |
|----------------------|-----------------|
| Gross Revenue | 4111–4163 |
| Less: Contra-Revenue | 4901–4904 |
| **Net Revenue** | 4111–4904 (net) |
| Cost of Goods Sold | 5111–5146 (net of contras) |
| **Gross Profit** | Net Revenue less COGS |
| Personnel Expenses | 6111–6156 |
| Facility Expenses | 6211–6245 |
| Administrative Expenses | 6311–6366 |
| Sales and Marketing | 6411–6454 |
| Technology and IT | 6511–6545 |
| Travel and Entertainment | 6611–6635 |
| Depreciation and Amortisation | 6711–6725 |
| Research and Development | 6811–6816 |
| Other Operating Expenses | 6911–6949 |
| **Operating Profit (EBIT)** | Gross Profit less Operating Expenses |
| Other Income | 4211–4246 |
| Interest Expense | 7110–7170 |
| Losses on Disposal and FX | 7210–7450 |
| **Profit Before Tax (EBT)** | EBIT plus/minus Other Income/Expenses |
| Income Tax Expense | 8110–8160 |
| **Net Profit** | EBT less Income Tax |

---

### Appendix C: Normal Balance Summary

| Category | Normal Balance | Increases With | Decreases With | Closes To |
|----------|---------------|----------------|----------------|-----------|
| Assets (1000–1999) | Debit | Debit | Credit | Carries forward |
| Liabilities (2000–2999) | Credit | Credit | Debit | Carries forward |
| Equity (3000–3999) | Credit | Credit | Debit | Carries forward |
| Revenue (4000–4999) | Credit | Credit | Debit | Retained Earnings (year-end) |
| COGS (5000–5999) | Debit | Debit | Credit | Retained Earnings (year-end) |
| Operating Expenses (6000–6999) | Debit | Debit | Credit | Retained Earnings (year-end) |
| Other Income/Expenses (7000–7999) | Debit (net) | Debit | Credit | Retained Earnings (year-end) |
| Income Tax (8000–8999) | Debit | Debit | Credit | Retained Earnings (year-end) |

**Contra Account Normal Balances (opposite of their parent category):**
- Accumulated Depreciation (1529, 1539, 1549, 1559, 1569, 1579) — Credit
- Accumulated Amortisation (1619, 1629, 1639) — Credit
- Allowance for Doubtful Accounts (1290) — Credit
- Inventory Reserve (1390) — Credit
- Treasury Stock (3151, 3152) — Debit
- Owner's Drawings (3213) — Debit
- Partner Drawings (3313, 3323, 3333) — Debit
- Contra-Revenue (4901–4904) — Debit
- Purchase Returns and Discounts (5145, 5146) — Credit
- Bond Discount (2726) — Debit

---

### Appendix D: Reconciliation Frequency Matrix

| Account Group | Reconciliation Frequency | Reconciler | Reviewer | Zero Balance Required? |
|--------------|--------------------------|------------|----------|----------------------|
| Cash and Bank (1111–1119) | Weekly | Treasurer | Controller | No |
| Petty Cash (1111) | Monthly + surprise counts | Cashier | Controller | No (per float) |
| Accounts Receivable (1211–1290) | Monthly before close | AR Manager | Controller | No |
| Inventory (1310–1390) | Monthly (cycle count) + annual full count | Inventory Manager | Controller | No |
| Prepaid Expenses (1410–1490) | Monthly | Accountant | Controller | No |
| Fixed Assets (1510–1583) | Quarterly | Fixed Asset Accountant | Controller | No |
| Accumulated Depreciation (1529–1579) | Monthly | Fixed Asset Accountant | Controller | No |
| Accounts Payable (2111–2114) | Monthly before close | AP Manager | Controller | No |
| Payroll Liabilities (2300–2327) | Every payroll run | Payroll Manager | Controller | Per run |
| Tax Liabilities (2400–2444) | Each filing period | Tax Manager | CFO | Per return |
| Deferred Revenue (2510–2560) | Monthly | Revenue Accountant | Controller | No |
| Intercompany (2114, 2640, 2775) | Monthly before close | Controller | CFO | No (must agree between entities) |
| Suspense / Clearing | Weekly | Account Owner | Controller | Yes — before period close |
| Equity (3000–3999) | Annual | Controller | CFO/Auditor | No |
| Revenue (4000–4999) | Monthly (reasonableness review) | Revenue Manager | CFO | No |
| Payroll Expenses (6111–6135) | Monthly (reconcile to payroll system) | Payroll Manager | Controller | No |
| Depreciation Expenses (6711–6725) | Monthly (reconcile to depreciation schedule) | Fixed Asset Accountant | Controller | No |
| Income Tax (8110–8160) | Quarterly (reconcile to tax provision) | Tax Manager | CFO | No |

---

### Appendix E: COA Statistics

| Metric | Value |
|--------|-------|
| Total accounts | 666 |
| Header accounts (🏢) | 141 |
| Posting accounts (📄) | 525 |
| Maximum hierarchy depth | 5 levels |
| Average hierarchy depth | 3.5 levels |
| T1 (Restricted) posting accounts | ~95 |
| T2 (Elevated) posting accounts | ~165 |
| T3 (Standard) posting accounts | ~265 |

**Posting Accounts by Category:**

| Category | Range | Posting Accounts |
|----------|-------|-----------------|
| Assets | 1000–1999 | 134 |
| Liabilities | 2000–2999 | 88 |
| Equity | 3000–3999 | 35 |
| Revenue | 4000–4999 | 53 |
| Cost of Goods Sold | 5000–5999 | 26 |
| Operating Expenses | 6000–6999 | 167 |
| Other Income/Expenses | 7000–7999 | 16 |
| Income Tax | 8000–8999 | 6 |
| **Total** | | **525** |

---

### Appendix F: Change Log

| Version | Date | Changed By | Approved By | Description of Change |
|---------|------|-----------|-------------|----------------------|
| 1.0 | [Insert Date] | [Document Owner] | CFO | Initial release. Consolidates account_structure_detail.md, complete_coa_tree.md, and detailed_accounts_tree.md. Adds internal controls, governance, compliance, and security sections. |

*All future changes to this document are recorded here in accordance with the COA Change Policy in Section 5.1. Each version is archived in the organisation's document management system.*

---

*End of Document*

**Document Control Information**

| Field | Detail |
|-------|--------|
| Document Title | Comprehensive Chart of Accounts Reference Manual |
| Version | 1.0 |
| Status | Active |
| Owner | Controller / CFO |
| Review Date | [Annual review date] |
| Location | [Document management system path] |
| Distribution | All finance and accounting staff; available to internal and external auditors on request |
