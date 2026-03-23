

**VERDANT FIELDS AGRITECH LTD.**

**Operational Gap Analysis**

*Process Gap  ·  Technology Gap  ·  Data Gap*

| PROCESS GAP SOP · Training · Accountability | TECHNOLOGY GAP Selection · Config · Integration | DATA GAP Governance · Cleaning · Pipelines |
| :---: | :---: | :---: |

*Confidential — Internal Use Only  |  Verdant Fields AgriTech Ltd.  |  2025*

# **Introduction**

The Department Operations Specification defines what Verdant Fields AgriTech Ltd. is designed to do — the roles, workflows, systems, KPIs, and data assets for each of the nine departments. But a specification alone changes nothing. Between the written design and a genuinely operational company, three specific types of gap must be identified and closed.

| Gap Type | Core Problem Statement | What Closes It |
| :---- | :---- | :---- |
| Process Gap | Workflows are documented in the spec but are not yet adopted, consistently followed, or enforced in daily work across any department. | SOP creation, structured staff training, manager accountability mechanisms, and formal SOP governance. |
| Technology Gap | Systems listed in each department's data pack either do not exist, are not configured for the spec's workflows, or are not integrated with adjacent systems. | Technology audit, systems selection and procurement, configuration to match spec workflows, and end-to-end integration. |
| Data Gap | Data assets identified in the spec exist in some form but are incomplete, inaccurate, inconsistently defined, or inaccessible to the people and systems that depend on them. | Data governance framework, systematic data cleaning, master data standards, and automated data pipelines. |

|  | *These three gaps are not independent. A process cannot be followed if the system it depends on is not configured (Technology Gap). A system cannot produce correct outputs if the data it operates on is dirty (Data Gap). All three must be closed together — but the sequence matters: data first, then technology, then process.* |
| :---- | :---- |

| GAP 1 | Process Gap *Workflows documented but not yet adopted or enforced in daily work* |
| :---: | :---- |

## **Definition & Scope**

| Gap Statement | The Department Operations Specification documents 8 or more workflows per department across all 9 departments. None of these workflows currently exist as formal, written Standard Operating Procedures (SOPs) with step-by-step instructions, named role owners, approval thresholds, system references, and documented exception-handling. Without SOPs, each process is interpreted differently by each person performing it, is not auditable, cannot be consistently trained, and breaks down when the individual who informally owns it is absent. |
| :---- | :---- |
| **What It Means** | Workflows exist as design — they describe what should happen. They do not yet exist as operational procedure — instructions for what to do, step by step, in the real systems, with real data, by a named role, producing a documented output. The gap is the distance between the spec's workflow description and a day-one-ready SOP a new employee can follow without further guidance. |
| **What Closes It** | SOP creation for every workflow in the spec. Structured training for every role that performs each SOP. Manager accountability mechanisms that enforce SOP compliance and detect drift. A governance framework that keeps SOPs current as systems and processes evolve. |
| **Consequence if Ignored** | Process inconsistency permanently embeds itself as culture. KPIs become unmeasurable because the process generating the underlying data varies by person. Audit findings escalate. New employee onboarding time stays high. Manager bandwidth is permanently consumed resolving process failures that a documented SOP would have prevented. |

## **What an Operational SOP Must Contain**

Every workflow in the spec must be converted into an SOP containing, at minimum, the following components. An SOP missing any of these is not complete and must not be treated as adopted.

| SOP Component | Required Content | Why It Is Non-Negotiable |
| :---- | :---- | :---- |
| Title, Version & Dates | Document title, version number (v1.0), effective date, next mandatory review date (max 12 months) | Enables version control and ensures the SOP does not become stale without detection. |
| Purpose Statement | One paragraph: what outcome does this process produce, and why does the business need it to be consistent? | Grounds the SOP user in the intent of the process, not just the mechanics. |
| Scope | Which roles, cost centres, transaction types, and geographies this SOP applies to. Explicit statement of what it does NOT cover. | Prevents misapplication to situations the SOP was not designed for. |
| Trigger / Input | The specific event, date, request, threshold, or system state that starts this process. | Without a defined trigger, the process starts inconsistently — or not at all. |
| RACI Per Step | For each step: Responsible (does it), Accountable (owns the outcome), Consulted (must be asked), Informed (must be notified). | Eliminates the most common process failure: ambiguity about who owns each step. |
| Step-by-Step Procedure | Numbered steps. Each step: action verb \+ role \+ system used \+ decision point (if any) \+ exception path. No steps longer than 3 lines. | Removes interpretation. The SOP should be followable with zero tribal knowledge. |
| Approval & Escalation Matrix | At what transaction value, risk level, or exception condition does this process require escalation? To whom? Via what channel? | Ensures the authority matrix from the spec is embedded in the process, not bypassed. |
| Output / Completion Standard | How does the person performing the process know it is complete? What does the output look like? Where is it stored or sent? | Prevents partial completions being treated as done. |
| Systems & Templates Used | Every system accessed, every template completed, every report produced during this process, with links or file paths. | Makes the SOP executable without knowing where things are. |
| Exception Handling | The three most common things that go wrong in this process, and the defined response to each. | Prevents every exception escalating to a manager unnecessarily. |
| Related Documents | Links to policy, authority matrix, system user guides, other SOPs this one depends on or feeds into. | Connects the SOP to the broader governance framework. |

## **Process Gap — By Department**

The following details the process gap for each of the nine departments, covering the specific workflows requiring SOPs, the current-state gap, and the priority level.

| Department 1 of 9  —  Finance |
| :---- |

### **Finance Process Gap**

Finance has the highest consequence-per-error rate of any department. A single process deviation in month-end close, accounts payable, or treasury can corrupt financial reporting, delay vendor payments, or create cash flow blind spots. Every Finance workflow requires a formally adopted SOP before Month 2 of implementation.

| Workflow (from Spec) | SOP Required | Current Gap | Priority |
| :---- | :---- | :---- | :---- |
| Month-End Financial Close (5 BD target) | Month-End Close SOP | No defined task list, timeline, or handoff sequence for the 5-day close. Dependent on individuals remembering steps. | Critical |
| Annual Budgeting Cycle (Sep–Nov) | Annual Budget Process SOP | Budget rounds managed via email threads. No defined submission schedule, version control, or CFO review protocol. | High |
| Rolling 12-Month Forecast | Forecast Submission & Consolidation SOP | Forecast process not standardised. Departments submit in different formats at different times. | High |
| Management Reporting Pack (Day 1–5 post close) | Management Pack Production SOP | Pack compiled manually. No defined owner per section, no template, no distribution list or deadline protocol. | High |
| Accounts Payable Invoice Processing | AP Invoice Processing SOP | Invoice matching done ad hoc. No 3-way match workflow. Payment run not on fixed schedule. Duplicate payment risk exists. | Critical |
| Accounts Receivable & Collections | AR Collections Cadence SOP | Collections follow-up not on defined schedule. Day 15/25/35/45 contact cadence not implemented. DSO not tracked per invoice. | Critical |
| 13-Week Cash Flow Forecast | Treasury Forecast SOP | Cash position reviewed informally. 13-week rolling model not maintained. No formal sign-off by CFO each week. | High |
| Expense Reimbursement | Expense Claim & Reimbursement SOP | Claims submitted via email or unstructured forms. No receipt requirement enforced. Reimbursement timing inconsistent. | High |
| VAT Monthly Return | VAT Preparation & Filing SOP | VAT workings built from scratch each month. No standardised workpaper. Filing deadline tracking informal. | High |
| Payroll Processing | Payroll Cycle SOP | Payroll inputs collected informally. No formal cut-off date for changes. HRIS-to-payroll handoff not documented. | Critical |

| Department 2 of 9  —  Human Resources |
| :---- |

### **HR Process Gap**

HR processes have the widest reach in the organisation — every employee experiences them. Inconsistency in onboarding, performance management, or disciplinary processes creates immediate and lasting employee relations risk. Legal exposure from undocumented HR processes is significant.

| Workflow (from Spec) | SOP Required | Current Gap | Priority |
| :---- | :---- | :---- | :---- |
| Recruitment & Offer Process | Recruitment Lifecycle SOP | Job requisition approvals informal. Interview structure varies by hiring manager. Offer letters produced inconsistently. No formal feedback-to-candidate protocol. | Critical |
| 30/60/90-Day Onboarding | Employee Onboarding SOP | No structured onboarding plan per role. New joiner experience depends entirely on the hiring manager. No 30/60/90-day check-in schedule. | Critical |
| Annual Performance Review Cycle | Performance Review Cycle SOP | Review timing, template, rating scale, and calibration process not standardised. Manager discretion dominates. No calibration session. | High |
| Disciplinary & Grievance Process | Disciplinary Procedure SOP | Disciplinary steps not documented. Investigation process ad hoc. Risk of unlawful termination due to missing procedural steps. | Critical |
| Leave Management | Leave Request & Approval SOP | Leave requests via informal channels. Accrual calculations done manually. Leave liability not reported to Finance monthly as required by spec. | High |
| Employee Exit / Offboarding | Offboarding & Exit SOP | Exit checklist does not exist. System access not revoked on defined timeline. Exit interview not standardised. Final pay calculation informal. | High |
| Learning Needs Analysis (TNA) | Annual TNA & L\&D Planning SOP | Training needs assessed informally by managers. No structured TNA questionnaire. L\&D budget allocation not linked to TNA output. | Medium |
| Salary Review & Benchmarking | Annual Compensation Review SOP | Salary review timeline and process not defined. Band adjustments made without a structured process. No benchmark data review step. | High |

| Department 3 of 9  —  Operations |
| :---- |

### **Operations Process Gap**

Operations processes govern procurement, quality, and project delivery — three areas where process breakdown has direct cost and compliance consequences. The authority matrix from the spec must be embedded in every procurement and purchasing SOP.

| Workflow (from Spec) | SOP Required | Current Gap | Priority |
| :---- | :---- | :---- | :---- |
| Procurement Cycle (PO to Payment) | Procurement & Purchase Order SOP | No formal PO requirement below $10K. Authority thresholds not consistently applied. 3-quote requirement for purchases \>$5K not followed. | Critical |
| Supplier Onboarding & Tier Rating | Supplier Onboarding SOP | Vendor tier classification (Strategic/Preferred/Approved/Spot) not applied. No formal onboarding checklist. KYV check not documented. | High |
| Inventory Management & Reorder | Inventory Control & Reorder SOP | ABC analysis not applied. Reorder points not set. Stock counts ad hoc. No cycle count schedule. | High |
| Project Delivery (Charter to Closure) | Project Lifecycle SOP | Projects \>$5K or \>2 weeks not consistently chartered. RAID logs not maintained. RAG status reporting informal. | High |
| Quality Non-Conformance & RCA | NCR & Root Cause Analysis SOP | Non-conformances not formally logged. 5-Why/Fishbone RCA not applied within 5 BD as required. Corrective actions not tracked to closure. | High |
| Facilities & Preventive Maintenance | Preventive Maintenance SOP | Maintenance activities reactive only. No PM schedule. Asset register incomplete (all assets \>$500 must be tagged per spec). | Medium |
| HSE Incident Reporting | Incident Reporting & Investigation SOP | Incidents not reported within 24 hours as required. Investigation depth inconsistent. Near-miss reporting culture absent. | High |
| Process Improvement & Kaizen | Process Improvement Cycle SOP | No structured improvement cadence. Kaizen events not scheduled quarterly as per spec. Process map library does not exist. | Medium |

| Department 4 of 9  —  Marketing |
| :---- |

### **Marketing Process Gap**

Marketing processes govern brand integrity, content quality, and the handoff of qualified leads to Sales. Without an SOP for the MQL handoff, the 1-hour response SLA defined in the spec cannot be enforced — directly impacting revenue.

| Workflow (from Spec) | SOP Required | Current Gap | Priority |
| :---- | :---- | :---- | :---- |
| Campaign Briefing & Approval | Campaign Management SOP | Campaign briefs not required before work begins. No approval gate from CMO before spend is committed. Post-campaign reporting absent. | High |
| Editorial Calendar Management | Content Planning & Publishing SOP | Content calendar is informal or absent. 2-blog/week and daily-social targets not tracked. Approval before publishing not enforced. | High |
| MQL Definition & Handoff to Sales | MQL Qualification & Handoff SOP | MQL definition not formally agreed between Marketing and Sales. The 1-hour handoff SLA from the spec is not measured or enforced. | Critical |
| Brand Review (2 BD SLA) | Brand Compliance Review SOP | Brand review requests submitted informally. 2-business-day SLA not tracked. Brand guidelines not published as a living document. | High |
| Paid Media Budget Management | Paid Media Approval & Reporting SOP | Ad spend authorised informally. No weekly spend-vs-budget review. Platform performance reporting not on defined cadence. | High |
| Quarterly Brand Awareness Survey | Brand Measurement SOP | Brand awareness surveys not conducted quarterly as per spec. No baseline established. | Medium |

| Department 5 of 9  —  Sales & CRM |
| :---- |

### **Sales & CRM Process Gap**

Sales processes directly generate revenue and forecast data. Without SOPs for pipeline management and CRM hygiene, the forecasting and performance reporting that every leadership decision depends on will remain unreliable.

| Workflow (from Spec) | SOP Required | Current Gap | Priority |
| :---- | :---- | :---- | :---- |
| 7-Stage Pipeline Management | CRM Pipeline Management SOP | Pipeline stage definitions not documented. Stage-entry criteria not enforced. Deals moved by gut feel rather than qualification evidence. | Critical |
| MEDDIC Opportunity Qualification | Deal Qualification SOP | MEDDIC framework not consistently applied. No qualification scorecard. Win/loss analysis not conducted post-close. | High |
| 8-Touch/21-Day BDR Outbound Cadence | Outbound Sales Cadence SOP | BDR activities not tracked against 50-daily-activities target. Cadence steps informal. No defined handoff criteria from BDR to AE. | High |
| Weekly Pipeline Review | Sales Pipeline Review SOP | Pipeline review meeting exists but has no defined agenda, no forecast submission format, and no action-capture protocol. | High |
| Account Health Scoring & QBR | Account Management & QBR SOP | Health score (R/A/G) not systematically applied. QBR mandatory threshold (\>$10K ARR) not enforced. No QBR agenda template. | High |
| Renewal Process (90-Day Pre-Expiry) | Contract Renewal SOP | Renewal process not initiated 90 days before expiry as required. Renewal tracking informal. 20% upsell target has no attached process. | Critical |
| CRM Data Quality Maintenance | CRM Data Governance SOP | 95% field-completeness target not measured. Duplicate detection not run weekly. No defined data steward per account segment. | High |

| Department 6 of 9  —  Legal |
| :---- |

### **Legal Process Gap**

Legal process failures carry the highest external consequence — missed filing deadlines, unsigned contracts, or undocumented data subject requests create regulatory, financial, and reputational risk. Every Legal SOP is high priority regardless of frequency.

| Workflow (from Spec) | SOP Required | Current Gap | Priority |
| :---- | :---- | :---- | :---- |
| Contract Review & Approval (5 BD SLA) | Contract Review SOP | Contract review requests submitted informally. 5-business-day SLA not tracked. Standard vs. non-standard triage not documented. Playbook not written. | Critical |
| Contract Authority Matrix Application | Contract Execution Authority SOP | Authority thresholds not consistently applied. Some contracts signed without required countersignature. | Critical |
| Regulatory Filing Calendar | Compliance Calendar Management SOP | Compliance calendar exists informally but has no defined owner per filing, no 30-day advance reminder, and no sign-off confirmation step. | High |
| DPIA Process | DPIA Process SOP | DPIA process not embedded in new project or system intake. High-risk data processing initiated without DPIA. No DPIA register. | High |
| Data Subject Request Response (30 days) | DSR Handling SOP | DSR receipt not formally acknowledged. 30-day response clock not tracked. No defined investigation and response workflow. | High |
| Breach Notification (72-hour requirement) | Data Breach Response SOP | Breach notification process not documented. The 72-hour regulatory notification window is not tracked. Breach log not maintained. | Critical |
| Vendor Data Processing Agreement Review | DPA Management SOP | DPA register incomplete. Not all vendors with data access have a signed DPA on file. Renewal dates not tracked. | High |

| Department 7 of 9  —  IT & Systems |
| :---- |

### **IT & Systems Process Gap**

IT process gaps have a multiplier effect — every other department depends on IT systems being available, secure, and correctly configured. ITSM, change management, and incident response SOPs are pre-requisites for all other department process adoption.

| Workflow (from Spec) | SOP Required | Current Gap | Priority |
| :---- | :---- | :---- | :---- |
| New Employee IT Provisioning | IT Onboarding Provisioning SOP | Access provisioning not triggered automatically from HRIS. Role-based access control templates not defined. Joiner checklist informal. | Critical |
| Employee Exit — Access Revocation | IT Offboarding SOP | System access revocation not on defined timeline. Risk of former employees retaining access post-departure. | Critical |
| IT Helpdesk Triage (3-Tier) | ITSM Incident Management SOP | 3-tier helpdesk not consistently applied. P1/P2 incidents not triggering bridge call within defined response time. SLA compliance not tracked. | Critical |
| Change Management (CAB Process) | IT Change Management SOP | Wednesday CAB not formalised. Changes to production systems made without documented approval. Change log not maintained. Rollback plan not required before deployment. | Critical |
| Patch Management (CVSS thresholds) | Vulnerability & Patch Management SOP | CVSS ≥7.0 patch-within-7-days and CVSS ≥9.0 within-24-hours SLAs not tracked. Vulnerability scanning not on defined cadence. | Critical |
| Business Continuity & DR Test | DR Test & BCP Activation SOP | RTO 4hrs / RPO 1hr targets for critical systems not tested. No annual DR test schedule. BCP not documented for any department. | High |
| Software Development Sprint Process | Sprint Lifecycle SOP | 2-week sprint cadence informal. Sprint ceremonies not standardised. Definition of Done not documented. \>80% unit test coverage not enforced. | High |
| Security Incident Response | Security Incident Response SOP | SIEM alert triage process not documented. Escalation from security alert to incident declaration not defined. Containment steps vary by individual. | Critical |

| Department 8 of 9  —  Strategy & OKRs |
| :---- |

### **Strategy & OKRs Process Gap**

Strategy processes govern how the company sets direction and measures progress. Without a formal OKR cycle SOP, the OKR framework will degrade into a compliance exercise — OKRs set once, never updated, and scored arbitrarily at quarter-end.

| Workflow (from Spec) | SOP Required | Current Gap | Priority |
| :---- | :---- | :---- | :---- |
| Annual Strategic Planning (Oct offsite) | Strategic Planning Cycle SOP | Annual planning process not structured. PESTEL and SWOT inputs not systematically gathered. Offsite outputs not translated into a published strategic plan. | High |
| OKR Setting Cycle (Quarterly) | OKR Setting & Cascade SOP | OKR quality is inconsistent. Company OKRs not formally cascaded to department level. 100% participation target not enforced. | Critical |
| Weekly OKR Progress Updates | OKR Update & Check-In SOP | Weekly updates not enforced. OKR scores stale for multiple weeks. No defined protocol for what triggers an OKR to be marked At Risk. | High |
| Quarterly OKR Review & Scoring | OKR Retrospective SOP | End-of-quarter scoring process not standardised. Lessons-learned discussion absent. No link between OKR scores and next quarter's objective-setting. | High |
| Monthly KPI Dashboard Production | KPI Reporting SOP | KPI dashboard not produced on a defined cadence. KPI definitions vary by person. No single source of truth for any metric. | Critical |
| BI Initiative Intake (\>$25K / \>3 months) | PMO Initiative Intake SOP | Initiatives above threshold not consistently chartered. Benefits realisation review not conducted. Portfolio RAG dashboard informal. | High |

| Department 9 of 9  —  Administration |
| :---- |

### **Administration Process Gap**

Administration processes underpin executive functioning, records integrity, and travel compliance. The records management process gap carries legal risk — without a documented retention schedule, the company cannot demonstrate compliance with statutory record-keeping obligations.

| Workflow (from Spec) | SOP Required | Current Gap | Priority |
| :---- | :---- | :---- | :---- |
| Board Pack Preparation (5 BD before meeting) | Board Pack Production SOP | Board packs assembled informally. No defined content list, section owners, or version control. 5-business-day target not tracked. | High |
| Document Classification & Filing | Records Management SOP | 4-tier classification not applied. Files stored in mixed locations. No naming convention enforced. | High |
| Records Retention & Destruction | Records Retention SOP | 7-year retention schedule not formally applied. Document destruction not authorised. Legal hold process absent. | High |
| General Procurement (Admin Category) | Admin Procurement SOP | PO not required for small purchases despite spec requirement. Authority matrix not consistently followed. | High |
| Travel Request & Booking | Travel Management SOP | 5-business-day lead time not enforced. Economy-for-\<6hrs rule not documented. Business class requires CEO approval — this threshold not communicated. | Medium |
| Expense Claim Submission (5 BD post-return) | Expense Reporting SOP | 5-business-day submission window not enforced. Receipt requirements not standardised. Claims processed outside Finance's main cycle. | Medium |

## **Process Gap — Closing Actions**

| \# | Action | Owner | Prerequisite | Target |
| :---- | :---- | :---- | :---- | :---- |
| P1 | Create and publish the SOP Template — the single format all SOPs must follow. Store in SharePoint/Confluence as the master. | COO \+ CAO | None | Week 1 |
| P2 | Appoint an SOP Owner for each department: the Department Head, or a nominated Manager with sign-off authority. | Each Dept Head | None | Week 1 |
| P3 | Write and sign off Priority 1 SOPs first: Month-End Close, Employee Onboarding, IT Provisioning, MQL Handoff, AP Invoice Processing. These 5 SOPs unblock the most other workflows. | Finance/HR/IT/Mktg/Sales Heads | P1, P2 | End Month 2 |
| P4 | Write all remaining SOPs per the department tables above. Target: all SOPs complete for all 9 departments. | Each Dept Head | P3 | End Month 5 |
| P5 | Deliver role-specific training for every SOP before it goes live. Training records logged in LMS. Completion is a pre-condition for each SOP going live. | CHRO \+ Each Dept Head | P4, LMS live | Within 2 weeks of each SOP |
| P6 | Retire all informal substitutes: shared spreadsheets, email threads, and undocumented tribal processes the SOP replaces. The SOP is the only authorised procedure. | Each Dept Head | P5 | On each go-live date |
| P7 | Manager Accountability: each Department Head reviews SOP compliance monthly in the first 6 months. Non-compliance addressed within 5 BD. Findings logged in the Process Issue Register. | COO \+ Each Dept Head | P5 | Ongoing from Month 2 |
| P8 | SOP Governance: establish the 12-month mandatory review cycle. Changes to a system or workflow trigger an SOP update within 30 days. | COO | P4 | Month 5 (ongoing) |

| GAP 2 | Technology Gap *Systems listed in the data pack do not exist, are not configured, or not integrated* |
| :---: | :---- |

## **Definition & Scope**

| Gap Statement | The Department Operations Specification includes a Data Pack for every operational component across all 9 departments. Each Data Pack lists the systems, tools, and data assets that the component depends on. For most departments, a significant subset of these systems either does not exist in the organisation, exists but is configured for the wrong workflow, or exists as a standalone system not integrated with the other systems that feed or consume its data. |
| :---- | :---- |
| **Three Sub-Types** | Existence Gap: A system listed in the data pack has not been procured and does not exist. | Configuration Gap: A system exists but is not set up to support the workflow described in the spec (e.g. CRM exists but the 7-stage pipeline is not configured). | Integration Gap: Two systems both exist and are individually configured correctly, but do not exchange data — requiring manual re-entry or making real-time automation impossible. |
| **What Closes It** | Technology Audit (assess current state per department). Systems Selection and Procurement (for existence gaps). Configuration (align each system to the spec's workflow design). Integration (connect systems so data flows without manual intervention). User Acceptance Testing and go-live for each system. |
| **Consequence if Ignored** | Every SOP that references a system that is not configured correctly will be followed incorrectly or will be abandoned. KPIs that depend on system-generated data will be manually estimated. Integrations not built mean data re-entered manually — introducing error and making automation permanently impossible without structural rework. |

## **Technology Audit Status Codes**

| Status Code | Meaning | Required Action |
| :---- | :---- | :---- |
| EXISTS & CONFIGURED | System is procured, configured to match the spec workflow, and staff are trained. | Verify integration to adjacent systems. Add to integration map. |
| EXISTS — NEEDS CONFIG | System is procured but configuration does not match the workflow in the spec. | Configuration sprint required. Define config requirements against spec. Re-train users post-config. |
| NEEDS PROCUREMENT | System does not exist. The workflow in the spec cannot be performed without it. | Initiate procurement: requirements → vendor selection → contract → implementation. |
| EXISTS — NOT INTEGRATED | System exists and is configured but does not exchange data with the adjacent systems it must connect to. | Integration design, development, and testing required. Define data flow, API or middleware approach. |

## **Technology Gap — By Department**

| Department 1 of 9  —  Finance |
| :---- |

| System / Tool (from Spec) | Status | Gap Description | Action Required |
| :---- | :---- | :---- | :---- |
| ERP — GL, AP, AR modules | EXISTS — NEEDS CONFIG | ERP may be partially in place but AP 3-way match, AR collections diary, and GL month-end lock date are not configured per the spec. | Configure AP 3-way match workflow. Build AR collections dunning rules. Set GL period lock date to Day 5 post-close. |
| Banking Integration / Bank Feeds | NEEDS PROCUREMENT | Bank feed not connected to ERP. Cash reconciliation is manual. 13-week cash model built in Excel, not integrated with live bank data. | Procure bank API feed or integration middleware. Connect to ERP cash management module. Automate bank reconciliation. |
| Expense Management Platform | NEEDS PROCUREMENT | Expense claims submitted via email. No receipt-capture, approval workflow, or auto-posting to GL. | Procure expense management tool. Configure approval workflow per authority matrix. Integrate with ERP GL. |
| Tax & Compliance Software | NEEDS PROCUREMENT | VAT returns compiled manually in spreadsheets. No tax calculation engine. No audit trail for tax workpapers. | Evaluate tax compliance platform for Kenyan VAT. Integrate with ERP for automated VAT extraction. |
| FP\&A / Budgeting Tool | EXISTS — NEEDS CONFIG | Budget model lives in Excel. No consolidation tool. Version control is manual. Rolling forecast not automated. | Configure FP\&A module within ERP or procure dedicated tool. Connect to GL actuals for automatic variance reporting. |
| Treasury / Cash Management Module | EXISTS — NOT INTEGRATED | Cash management may exist in ERP but is not integrated with bank feeds, making real-time cash position impossible. | Build bank-to-ERP integration for live balance import. Automate 13-week rolling cash forecast from ERP actuals. |

| Department 2 of 9  —  Human Resources |
| :---- |

| System / Tool (from Spec) | Status | Gap Description | Action Required |
| :---- | :---- | :---- | :---- |
| HRIS — Employee Master, Leave, Org Chart | EXISTS — NEEDS CONFIG | Employee records incomplete. Org chart not reflecting spec reporting lines. Leave accrual rules not configured per employment contracts. | Audit and clean all employee records. Configure org chart to match spec. Set up leave accrual rules per contract type. |
| ATS (Applicant Tracking System) | NEEDS PROCUREMENT | No ATS. Recruitment managed via email and spreadsheets. Interview scheduling and offer management are fully manual. | Procure ATS. Configure the full recruitment workflow. Integrate with HRIS. |
| LMS (Learning Management System) | NEEDS PROCUREMENT | No LMS. Training records not maintained. Mandatory training completion cannot be tracked. Onboarding content not digitised. | Procure or activate LMS module. Build mandatory training library. Configure completion tracking. |
| Performance Management Platform | NEEDS PROCUREMENT | Annual performance review conducted via email or paper. No goal-setting module. Rating history not retained. | Procure performance management module. Configure 30/60/90-day and annual review cycles. Connect to OKR platform. |
| Payroll System | EXISTS — NOT INTEGRATED | Payroll system exists but receives inputs manually from HRIS. New joiner and leaver records manually re-entered. | Build HRIS-to-Payroll integration. Automate new joiner and leaver payroll triggers. Test with parallel run before live. |
| Compensation Benchmarking Data | NEEDS PROCUREMENT | No access to market salary benchmarking data. Salary band calibration against market is not possible. | Subscribe to compensation benchmarking dataset. Integrate benchmark data into HRIS salary band configuration. |

| Department 3 of 9  —  Operations |
| :---- |

| System / Tool (from Spec) | Status | Gap Description | Action Required |
| :---- | :---- | :---- | :---- |
| ERP — Procurement & Inventory Modules | EXISTS — NEEDS CONFIG | ERP procurement module not configured with authority matrix thresholds. Inventory module not reflecting ABC classification. Reorder points not set. | Configure PO approval workflows per authority matrix. Set ABC inventory categories and reorder points. Enable 3-way match. |
| Supplier Management System | EXISTS — NEEDS CONFIG | Vendor master exists in ERP but tier classification not applied. No supplier performance scorecard. | Apply tier rating to all active vendors. Build supplier performance scorecard template. Schedule quarterly supplier review workflow. |
| Project Management Tool | EXISTS — NEEDS CONFIG | A project tool exists but project charters are not templates within it. RAID log tracking is manual. RAG status not reported from the tool. | Build project charter template in the tool. Configure RAID log view. Set up automated RAG status report. |
| Quality Management System (QMS) | NEEDS PROCUREMENT | No formal QMS. NCR logging is manual or absent. RCA tracking not systematised. ISO 9001 alignment cannot be demonstrated. | Evaluate QMS platform. Configure NCR workflow: log → assign → RCA (5 BD) → corrective action → closure. |
| Asset Register & Maintenance Scheduler | EXISTS — NEEDS CONFIG | Asset register incomplete — not all assets \>$500 tagged as required. Preventive maintenance schedule not in the system. | Complete asset audit and tag all qualifying assets. Configure PM schedule. Set up maintenance completion alerts. |
| HSE Incident Reporting Tool | NEEDS PROCUREMENT | No digital incident reporting system. The 24-hour reporting SLA in the spec cannot be tracked without a system. | Activate HSE module for incident logging. Configure 24-hour notification trigger. Build monthly HSE dashboard. |

| Department 4 of 9  —  Marketing |
| :---- |

| System / Tool (from Spec) | Status | Gap Description | Action Required |
| :---- | :---- | :---- | :---- |
| Marketing Automation (HubSpot/Marketo) | EXISTS — NEEDS CONFIG | Marketing automation may be in place but MQL scoring rules are not set. Lead source tracking and UTM parameters not standardised. | Define and configure MQL scoring model. Enforce UTM naming convention. Connect email to CRM with bi-directional sync. |
| CMS (Website Content Management) | EXISTS — NEEDS CONFIG | CMS exists but content approval workflow is absent. The 2-business-day brand review SLA cannot be enforced within the CMS. | Configure CMS approval workflow: draft → brand review (2 BD) → publish. Restrict publish rights to approved users only. |
| SEO Platform (Ahrefs/SEMrush) | NEEDS PROCUREMENT | No SEO tracking platform. The top-5-ranking-for-20-keywords target in the spec cannot be measured without it. | Subscribe to SEO platform. Configure keyword tracking for target 20 keywords. Set up weekly rank change alerts. |
| Social Media Scheduling Tool | NEEDS PROCUREMENT | Social posts published manually in real time. No scheduling, approval, or performance tracking. | Procure social scheduling tool. Configure approval workflow before publish. Build performance dashboard. |
| Analytics Platform (GA4 \+ Dashboard) | EXISTS — NEEDS CONFIG | GA4 installed but events not tagged per spec attribution requirements. Conversion goals not configured. CRM and GA4 not linked. | Audit and complete GA4 event tagging. Configure conversion goals per MQL definition. Integrate GA4 data into BI dashboard. |
| CRM Integration (Marketing → Sales) | EXISTS — NOT INTEGRATED | Marketing automation and CRM are not fully synced. MQL handoff is manual. The 1-hour SLA cannot be automated or measured. | Build real-time bi-directional sync. Configure MQL handoff workflow: lead score threshold → auto-assign to BDR in CRM → SLA clock starts. |

| Department 5 of 9  —  Sales & CRM |
| :---- |

| System / Tool (from Spec) | Status | Gap Description | Action Required |
| :---- | :---- | :---- | :---- |
| CRM — 7-Stage Pipeline | EXISTS — NEEDS CONFIG | CRM exists but pipeline does not reflect the 7-stage model. Stage-entry criteria not enforced. Required fields per stage not configured. | Redesign CRM pipeline to the 7-stage model. Configure required fields per stage. Map forecast categories. Test before go-live. |
| Sales Engagement Platform (Outreach/Salesloft) | NEEDS PROCUREMENT | No sales engagement tool. BDR outbound activities tracked manually. 8-touch/21-day cadence cannot be systematised without a sequencing tool. | Procure sales engagement platform. Build the 8-touch/21-day sequence as the default outbound cadence. Connect to CRM. |
| Call Recording & Intelligence (Gong/Chorus) | NEEDS PROCUREMENT | No call recording tool. Sales calls not reviewed. Win/loss analysis cannot incorporate call data. | Procure call intelligence platform. Configure recording for all sales calls. Build coaching dashboard for Sales Managers. |
| Data Enrichment (Apollo/ZoomInfo) | NEEDS PROCUREMENT | No data enrichment tool. BDR prospecting relies on manual research. Contact data quality is inconsistent. | Procure data enrichment platform. Integrate with CRM for one-click contact enrichment. |
| Revenue Intelligence / CRM → ERP | EXISTS — NOT INTEGRATED | CRM and Finance ERP are not integrated. Revenue recognition triggered manually post-deal close. | Build CRM-to-ERP integration for closed-won deals: contract value → revenue recognition schedule in ERP. |
| Customer Health Score Dashboard | NEEDS PROCUREMENT | No customer health scoring system. Account health (R/A/G) is a manual judgement. QBR triggers and renewal flags cannot be automated. | Configure health scoring. Define score inputs (product usage, support tickets, NPS, engagement). Automate RAG assignment. |

| Department 6 of 9  —  Legal |
| :---- |

| System / Tool (from Spec) | Status | Gap Description | Action Required |
| :---- | :---- | :---- | :---- |
| Contract Lifecycle Management (CLM) | NEEDS PROCUREMENT | No CLM system. Contracts stored in email threads and shared drives. Expiry dates not tracked. Contract playbook not enforced. | Procure CLM platform. Migrate all active contracts. Configure expiry alerts (90/30/7 days). Enforce playbook via template library. |
| E-Signature Platform (DocuSign) | NEEDS PROCUREMENT | Contracts signed via printed documents or informal email. No audit trail. Authority matrix routing by value cannot be enforced. | Procure e-signature platform. Integrate with CLM. Configure routing rules per authority matrix thresholds. |
| GRC / Compliance Management Tool | NEEDS PROCUREMENT | Regulatory compliance calendar in spreadsheet. No system ownership of filing deadlines. Compliance evidence not stored centrally. | Evaluate GRC platform. Build regulatory filing calendar with automated 30-day, 7-day, and 1-day reminders. |
| Data Privacy Management Platform | NEEDS PROCUREMENT | No DPIA register. DSR tracking is manual. Breach log absent. DPA register with vendors is a spreadsheet. | Evaluate data privacy platform. Configure DPIA intake, DSR 30-day tracking, breach 72-hour notification, and DPA register. |
| Legal Matter Management | EXISTS — NEEDS CONFIG | Matter tracking informal. Legal spend against external counsel not tracked. Conflict of interest checks not systematised. | Configure matter management. Build spend tracking dashboard. Implement conflict check protocol for new matters. |

| Department 7 of 9  —  IT & Systems |
| :---- |

| System / Tool (from Spec) | Status | Gap Description | Action Required |
| :---- | :---- | :---- | :---- |
| ITSM Platform (ServiceNow/Freshservice) | NEEDS PROCUREMENT | No formal ITSM platform. Helpdesk managed via email. P1/P2 SLA tracking absent. CAB process has no system home. CMDB does not exist. | Procure ITSM platform. Configure 3-tier helpdesk with SLA rules. Build CAB change workflow. Populate CMDB. |
| SIEM | NEEDS PROCUREMENT | No SIEM. Security events not aggregated or correlated. The spec's zero-trust posture cannot be enforced without it. | Procure SIEM. Connect all production systems. Configure alert rules for critical events. |
| Infrastructure Monitoring (Datadog) | EXISTS — NEEDS CONFIG | Monitoring tool may exist but coverage is incomplete. P1 15-minute response and 4-hour RTO SLAs cannot be guaranteed without full-stack observability. | Extend monitoring to all production systems. Configure P1/P2 alert routing. Build uptime SLA dashboard. |
| CI/CD Pipeline | EXISTS — NEEDS CONFIG | \>80% unit test coverage enforcement is not configured. Weekly Friday release cadence not formalised. Pipeline does not fail builds below coverage threshold. | Enforce code coverage threshold (\>80%) as a pipeline gate. Add automated security scan step. Configure Friday release slot. |
| Identity & Access Management \+ SSO | NEEDS PROCUREMENT | No centralised SSO. MFA not enforced on all systems. RBAC not standardised. Provisioning and deprovisioning are manual. | Implement SSO provider. Enforce MFA for all systems. Define RBAC roles per department. Automate provisioning from HRIS. |
| Vulnerability Scanner | NEEDS PROCUREMENT | No systematic vulnerability scanning. CVSS scoring not tracked. The 7-day (≥7.0) and 24-hour (≥9.0) patch SLAs cannot be measured. | Procure vulnerability scanning tool. Schedule weekly scans. Configure CVSS threshold alerts. Build patch compliance dashboard. |
| IaC (Terraform) & Cloud Cost Management | EXISTS — NEEDS CONFIG | Terraform used informally. Not all infrastructure is codified. Cloud cost tagging not enforced — cost per department cannot be attributed. | Mandate IaC for all infrastructure changes. Enforce cloud resource tagging per department cost centre. |

| Department 8 of 9  —  Strategy & OKRs |
| :---- |

| System / Tool (from Spec) | Status | Gap Description | Action Required |
| :---- | :---- | :---- | :---- |
| OKR Platform (Lattice/Perdoo/Ally) | NEEDS PROCUREMENT | No OKR platform. OKRs tracked in a spreadsheet or not at all. Scoring at quarter-end is subjective. Cross-department alignment not visible. | Procure OKR platform. Configure company, department, and team OKR hierarchy. Set weekly check-in reminders. |
| BI Tool (Tableau/Looker/Power BI) | EXISTS — NEEDS CONFIG | A BI tool may be in place but department dashboards are not built. KPI definitions vary. Data sources are not connected. | Map all KPIs from the KPI Library to data sources. Build one dashboard per department. Enforce a single canonical definition per metric. |
| Data Warehouse (Snowflake/BigQuery) | NEEDS PROCUREMENT | No data warehouse. Reporting done from source systems directly. No single source of truth. Historical trend analysis not possible. | Provision data warehouse. Design schema for all 9 departments. Build ETL/ELT pipelines from each source system. |
| PMO Tool (integrated with project mgmt) | EXISTS — NEEDS CONFIG | Project management tool used operationally but PMO portfolio view does not exist. Initiative intake threshold not enforced via the tool. | Configure PMO view. Build initiative intake form with threshold logic. Add RAG status and benefits realisation tracking. |
| Strategy Execution Dashboard | EXISTS — NOT INTEGRATED | Strategic plan exists in a document. Initiatives not tracked against OKRs in a connected system. Progress reported narratively. | Connect OKR platform to BI tool. Build strategic dashboard showing OKR scores, KPI trends, and initiative RAG status. |

| Department 9 of 9  —  Administration |
| :---- |

| System / Tool (from Spec) | Status | Gap Description | Action Required |
| :---- | :---- | :---- | :---- |
| Document Management / Intranet (SharePoint) | EXISTS — NEEDS CONFIG | SharePoint not structured for the 4-tier classification model. Folder structure inconsistent. Naming convention not enforced. SOP library not built. | Implement folder taxonomy per classification tier. Enforce naming convention. Build SOP library section. Set access controls per tier. |
| Board Meeting Management Tool | NEEDS PROCUREMENT | Board packs distributed via email. No version control. Board members cannot annotate or respond digitally. Minutes distribution informal. | Evaluate board management platform or a governed SharePoint structure. Configure 5-BD pre-meeting distribution workflow. |
| Travel Booking & Management Platform | NEEDS PROCUREMENT | Travel booked ad hoc. Policy compliance (economy \<6hrs, 5-BD lead time) cannot be enforced without a booking tool. | Procure travel management platform. Configure policy guardrails (class, lead time, approval chain). Connect to expense management. |
| Fleet Management System | EXISTS — NEEDS CONFIG | Vehicle register exists but not connected to maintenance schedules, usage logs, or fuel cost tracking. | Configure fleet management within asset register or standalone tool. Automate maintenance schedule alerts. |
| Records Retention Automation | EXISTS — NOT INTEGRATED | Retention schedule defined in the spec but document management system has no automated retention enforcement. | Configure retention policies in SharePoint per document type. Automate archival at 7 years. Build legal hold workflow. |

## **Technology Gap — Closing Actions**

| \# | Action | Owner | Prerequisite | Target |
| :---- | :---- | :---- | :---- | :---- |
| T1 | Complete the Technology Readiness Register for all 9 departments. Every system in every data pack assessed against the four status codes. Output is the master technology gap list. | IT Director \+ Each Dept Head | None | End Month 1 |
| T2 | IT and CFO jointly prioritise and sequence procurement decisions. Output: a procurement roadmap with timelines, budgets, and business case for each new system. | IT Director \+ CFO | T1 | End Month 1 |
| T3 | Implement SSO and IAM across all existing systems before any new systems are added. This is the non-negotiable technology foundation. | IT Director | None | End Month 3 |
| T4 | Issue RFPs or vendor assessments for all Needs Procurement systems. Prioritise: ERP → HRIS → CRM → ATS → ITSM → CLM → OKR → BI/Warehouse → remaining. | IT Director \+ Each Dept Head | T2 | Month 1–3 |
| T5 | Configuration sprints for all 'Exists — Needs Config' systems. Each sprint: requirements (from spec) → configuration → UAT signed off by Business System Owner → user training → go-live. | IT \+ Each Dept Head | T3 | Month 3–8 |
| T6 | Integration design and build. Priority integrations: HRIS↔Payroll, CRM↔Marketing Automation, CRM↔ERP Revenue Recognition, ERP↔Bank Feeds, OKR Platform↔BI Tool. | IT Director | T5 (both systems live) | Month 5–9 |
| T7 | User Acceptance Testing (UAT) for every system go-live. UAT must be signed off by the Business System Owner before go-live. No exceptions. | Each Dept Head | T5/T6 | Per go-live |
| T8 | Post-go-live hypercare: 2 weeks of enhanced IT support after each system launch. Issues logged, prioritised, and resolved within agreed SLAs. | IT Director | T7 | Post each go-live |

| GAP 3 | Data Gap *Data assets exist but are not clean, structured, or accessible* |
| :---: | :---- |

## **Definition & Scope**

| Gap Statement | The Department Operations Specification's Data Pack for each component lists the data assets that the component depends on. These assets — the chart of accounts, the employee master, the CRM contact database, the vendor master, the contract register, the asset register, the KPI definitions — exist in various forms across the organisation. For most of them, the data is incomplete, inconsistently defined, held in multiple conflicting sources, or inaccessible to the systems and people that need it. A system that runs on bad data produces outputs that are worse than no outputs at all, because they generate false confidence. |
| :---- | :---- |
| **Three Sub-Types** | Completeness Gap: Records exist but are missing required fields (e.g. employee records missing cost centre codes, contacts in CRM missing company name or deal stage). | Accuracy Gap: Records exist and are complete but contain incorrect values (e.g. vendor tier classification wrong, salary bands misconfigured, asset values outdated). | Accessibility Gap: Data exists and may be clean but is held in a system or format that other systems and analysts cannot access — no API, no export, locked in a spreadsheet or email chain. |
| **What Closes It** | Data Governance Framework: define who owns each data asset, what 'clean' means for each field, and how quality is measured and maintained. Data Cleaning: systematic remediation of known issues in the current data state. Master Data Standards: single authoritative definitions for every entity (employee, vendor, account, product, metric). Automated Data Pipelines: programmatic data flows that move data between systems without manual re-entry, eliminating the primary source of data quality degradation. |
| **Consequence if Ignored** | Every KPI becomes untrustworthy when its source data is dirty. Payroll errors when HRIS is incomplete. Vendor payments duplicated when the vendor master has duplicates. Financial audit findings when the chart of accounts does not match the ERP. Regulatory breach when data protection records are incomplete. The cost of running on bad data compounds every month it is not addressed. |

## **Data Governance Framework**

Before data cleaning begins, the governance structure that will maintain data quality must be defined. Data cleaned without governance degrades back to its prior state within 6 months.

| Governance Component | Definition | Responsibility |
| :---- | :---- | :---- |
| Data Asset Register | A master list of every data asset: name, description, owning department, system of record, related systems, data steward, update frequency, and current quality score. | CSO \+ BI Analyst — maintained in the data warehouse or SharePoint. Updated quarterly. |
| Data Steward (per asset) | The named individual responsible for the quality and completeness of a specific data asset. Stewards are operational roles (not IT) because they understand what the data should contain. | Each Department Head nominates one steward per major data asset in their department. |
| Data Dictionary | For every field in every critical data asset: field name, data type, allowed values, validation rules, definition, and the process that populates it. Stored centrally and linked from each SOP that writes to the field. | BI Analyst \+ Data Steward per asset. |
| Data Quality Scorecard | A monthly measurement of data completeness and accuracy for each critical asset: (records with all required fields populated) / (total records) × 100\. Target: \>95% for all assets within 6 months. | BI Analyst produces. Reviewed by each Dept Head in their monthly KPI review. |
| Master Data Standard | For entities shared across systems (employees, vendors, accounts, products), a single system of record is designated. All other systems receive data from the system of record. No other system may modify master data directly. | IT Director \+ CSO — defines system-of-record map. Enforced via integration design. |
| Data Incident Protocol | When a data quality issue is discovered, it is logged in the Data Incident Register, assigned to the relevant steward, and resolved within the SLA for that asset's criticality tier. | Data Steward logs. BI Analyst tracks. Reviewed monthly in Data Quality Scorecard. |

## **Data Gap — By Department**

| Department 1 of 9  —  Finance |
| :---- |

| Data Asset (from Spec) | Gap Type | Specific Issues | Cleaning Actions Required |
| :---- | :---- | :---- | :---- |
| Chart of Accounts (CoA) | Completeness \+ Accuracy | Inactive GL accounts not archived. Cost centre codes not mapped to all 9 departments. Account descriptions ambiguous. Intercompany accounts not structured. | Archive all accounts with zero transactions in 24 months. Map every cost centre code to a department per the spec. Validate CoA structure against management reporting requirements before ERP go-live. |
| Budget Data (Annual \+ Rolling) | Accessibility | Budget model in Excel. Version history lost. Not all cost lines mapped to CoA accounts. Rolling forecast inputs collected informally. | Migrate budget model to FP\&A tool or ERP. Map every budget line to a CoA account. Build forecast input templates with CoA pre-mapped. Lock prior versions. |
| Accounts Payable Ageing | Completeness \+ Accuracy | Vendor records in ERP missing payment terms. Duplicate vendor records exist. Some invoices coded to incorrect GL accounts. AP ageing not reconciled to vendor statements. | Deduplicate vendor master. Enforce payment term field on all vendors. Run GL re-coding exercise for miscoded invoices. Reconcile AP ageing to vendor statements. |
| Accounts Receivable Ageing | Accuracy | Customer credit limits not set in system. Invoice due dates calculated inconsistently. Some AR balances include unresolved credit notes. | Set credit limits for all customers in ERP. Standardise due-date calculation rules. Apply all pending credit notes against customer balances. |
| Cash Flow Actuals | Accessibility | Cash position pulled manually from bank statements. No bank feed integration. 13-week forecast not linked to ERP actuals. | Connect bank feeds to ERP. Configure automated daily cash position report. Build 13-week rolling model that auto-populates from ERP committed cash flows. |
| Tax Workpapers & Filings | Completeness | Prior VAT filings not stored consistently. Supporting workpapers vary in format and completeness. Reconciliation between VAT return and GL not documented. | Create standardised VAT workpaper template. Reconcile all prior periods to GL. Store all filings with supporting workpapers in a single SharePoint location. |

| Department 2 of 9  —  Human Resources |
| :---- |

| Data Asset (from Spec) | Gap Type | Specific Issues | Cleaning Actions Required |
| :---- | :---- | :---- | :---- |
| Employee Master Record | Completeness \+ Accuracy | Missing: cost centre codes, job grade/band, manager name, employment type, contract end dates for fixed-term staff. Role titles not matching spec. | Audit every employee record. Enforce mandatory fields in HRIS. Correct role titles to match spec. Link every employee to correct reporting line and cost centre. |
| Organisation Chart | Accuracy | Org chart in HRIS does not reflect spec reporting lines. Some positions show incorrect managers. Vacancies not marked. Grade/level not consistently populated. | Update all reporting lines in HRIS to match the spec exactly. Mark all vacancies explicitly. Enforce grade/level population before HRIS go-live. |
| Leave Accrual Balances | Accuracy | Leave balances for long-tenure employees not audited. Some employees have negative balances with no approved agreement. Leave liability not reported to Finance monthly. | Audit all leave balances against contract entitlements. Resolve negative balances via HR-employee agreements. Set up monthly leave liability report from HRIS to Finance. |
| Compensation & Band Data | Completeness | Salary bands (P25–P75 per grade) not documented in HRIS. No market benchmark reference for any band. Bonus eligibility and targets not systematically recorded. | Document all current salary bands per grade. Load into HRIS compensation module. Record individual targets. Connect to performance management platform. |
| Training & Certification Records | Completeness | Training history held in email or personal spreadsheets. No central register. Compliance training completion cannot be verified. Certification expiry dates not tracked. | Migrate all training history to LMS. Tag each record by employee, course, date, and result. Configure expiry date alerts for certifications. |
| Payroll Input Register | Accuracy | Payroll inputs collected via email from managers. No audit trail. Changes not time-stamped. | Build structured payroll input form in HRIS with mandatory fields. All payroll changes submitted via HRIS with effective date. HR Manager approval required before payroll submission. |

| Department 3 of 9  —  Operations |
| :---- |

| Data Asset (from Spec) | Gap Type | Specific Issues | Cleaning Actions Required |
| :---- | :---- | :---- | :---- |
| Vendor Master | Completeness \+ Accuracy | Vendor tier classification not applied. Duplicate vendor records. Payment terms inconsistently recorded. Bank details not verified. Missing tax ID numbers. | Deduplicate vendor records. Apply tier classification to all vendors. Verify and record payment terms, bank details, and tax IDs. Archive inactive vendors. |
| Inventory Master | Accuracy | Stock item descriptions inconsistent. Units of measure mixed. ABC classification not applied. Reorder points not set. Cycle count variances not reconciled. | Standardise all descriptions and units of measure. Apply ABC classification. Set reorder points per ABC class. Reconcile physical count to system balance before ERP go-live. |
| Asset Register | Completeness | Not all assets above $500 are tagged and registered as required by the spec. No depreciation schedule. Maintenance history not linked to asset record. | Conduct physical asset audit. Tag and register all qualifying assets. Load asset values and acquisition dates. Calculate depreciation schedule in ERP. |
| Project Register | Completeness | No formal project register. Active projects not consistently captured. Project budgets, timelines, and owners not in a single system. | Build project register in project management tool. Load all active projects with owner, budget, start date, target completion date, and current RAG status. |
| Quality Non-Conformance Log | Completeness | NCRs not systematically logged. RCA outcomes not recorded. Corrective action owners and due dates absent. | Build NCR register in QMS. Retrospectively log all known NCRs from the past 12 months. Assign corrective actions and track to closure. |
| Supplier Performance Scores | Gap — Does Not Exist | No supplier performance data exists. Tier classification requires evidence-based scoring but no scorecard has been applied. | Design supplier scorecard with 5 dimensions (delivery, quality, price, service, compliance). Score all Strategic and Preferred vendors quarterly. |

| Department 4 of 9  —  Marketing |
| :---- |

| Data Asset (from Spec) | Gap Type | Specific Issues | Cleaning Actions Required |
| :---- | :---- | :---- | :---- |
| Contact Database (Leads) | Completeness \+ Accuracy | Leads in CRM/Marketing platform missing industry, company size, and lifecycle stage. Duplicates present. Lead source not consistently recorded. Consent status absent. | Enrich contacts via data enrichment tool. Deduplicate. Enforce lead source and consent fields as required. Remove all contacts without a valid consent basis. |
| UTM & Campaign Tracking Data | Consistency | UTM parameters applied inconsistently. Some campaigns have no tracking parameters. Attribution data in GA4 is unreliable as a result. | Define and publish UTM naming convention. Audit all active campaign links. Build UTM validation into campaign launch checklist. |
| Content Performance Data | Accessibility | Blog, social, and email performance data held in separate platform dashboards. No consolidated content performance view. | Connect all content platform data to BI tool. Build consolidated content performance dashboard. Track editorial calendar delivery rate weekly. |
| Brand Tracking Metrics | Gap — Does Not Exist | No brand awareness baseline established. The quarterly brand awareness survey required by the spec has never been run. No NPS data exists. | Design brand tracking survey. Establish Q1 baseline. Store all survey results in Marketing BI dataset. Track trend quarterly. |
| MQL Definition & Scoring Model | Gap — Not Agreed | MQL definition not formally agreed between Marketing and Sales. Scoring model does not exist in the marketing automation platform. | Run joint Marketing-Sales workshop to agree MQL definition and scoring model. Document in writing. Configure in marketing automation platform. |

| Department 5 of 9  —  Sales & CRM |
| :---- |

| Data Asset (from Spec) | Gap Type | Specific Issues | Cleaning Actions Required |
| :---- | :---- | :---- | :---- |
| CRM — Account & Contact Records | Completeness \+ Accuracy | Required fields missing (industry, employee count, annual revenue, primary contact role). Duplicate accounts. Last activity date stale for \>50% of records. | Run deduplication tool. Enforce required fields. Archive accounts with no activity in \>180 days. Assign account owner to every active account. |
| Pipeline / Opportunity Records | Accuracy | Opportunities not consistently moving through 7 stages. Stage dates not recorded. Close dates extended repeatedly without a loss reason. Amounts not updated after negotiation. | Reconfigure pipeline to 7-stage model. Enforce required fields per stage. Introduce loss reason as mandatory on all Closed Lost deals. |
| Forecast Data | Accuracy | Forecast categories not mapped to pipeline stages. Commit, Best Case, and Pipeline figures not systematically calculated. Forecast is a manager's weekly estimate, not a data output. | Define forecast categories per pipeline stage in CRM. Configure weighted forecast calculation. Produce first automated forecast report before adopting as the official forecast. |
| Account Health Scores | Gap — Does Not Exist | No account health data exists. The R/A/G health scoring in the spec requires input data (product usage, support tickets, NPS, engagement) that is not currently collected. | Define health score inputs and weights. Build data collection for each input. Configure scoring in CRM or CX platform. |
| Win/Loss Data | Gap — Does Not Exist | Win/loss analysis not conducted. No structured data on why deals are won or lost. Sales improvement decisions made without evidence. | Introduce win/loss interview process for all deals \>$5K. Build structured win/loss form in CRM. Review quarterly in Sales leadership. |

| Department 6 of 9  —  Legal |
| :---- |

| Data Asset (from Spec) | Gap Type | Specific Issues | Cleaning Actions Required |
| :---- | :---- | :---- | :---- |
| Contract Register | Completeness | Not all contracts stored in one place. Key fields missing: counterparty, effective date, expiry date, contract value, auto-renewal clause, governing law, owner. | Audit all contracts. Load every active contract into CLM with mandatory fields. Verify expiry dates. Configure alerts for 90/30/7 days before expiry. |
| Regulatory Filing Calendar | Completeness | Not all statutory filings listed in a single managed calendar. Responsibility for each filing not formally assigned. Evidence of completion not stored. | Build comprehensive compliance calendar covering all applicable Kenyan regulatory filings. Assign owner per filing. Store completion evidence centrally. |
| Data Processing Agreement (DPA) Register | Completeness | Not all vendors with data access have a DPA on file. Register not comprehensive. DPA status not tracked per vendor. | Cross-reference vendor master against all vendors with data access. Obtain DPA from any vendor without one. Load all signed DPAs into CLM. |
| DPIA Register | Gap — Does Not Exist | No DPIA register exists. High-risk data processing activities have not been assessed. POPIA compliance cannot be demonstrated without this record. | Create DPIA register. Retrospectively assess all high-risk processing activities identified in the spec. Log outcomes. Build DPIA intake form. |
| Data Subject Request (DSR) Log | Gap — Does Not Exist | No DSR log exists. 30-day response clock has not been tracked. Cannot demonstrate POPIA compliance. | Create DSR log with fields: request date, subject, request type, assigned investigator, response date, outcome. Retrospectively log all known past DSRs. |

| Department 7 of 9  —  IT & Systems |
| :---- |

| Data Asset (from Spec) | Gap Type | Specific Issues | Cleaning Actions Required |
| :---- | :---- | :---- | :---- |
| CMDB (Configuration Management DB) | Completeness | CMDB does not formally exist or is severely incomplete. Production systems, servers, cloud resources, and network devices not fully inventoried. Dependencies not mapped. | Conduct full infrastructure discovery. Populate CMDB with all production assets. Map service dependencies. Validate with network scan. Integrate CMDB with ITSM. |
| ITSM Ticket History | Accessibility | Historical tickets exist in email or informal systems. No structured dataset. SLA compliance for historical periods cannot be calculated. | Migrate historical ticket data to ITSM. Classify by priority, category, and resolution time. Calculate baseline SLA compliance. Identify top-10 recurring issues for permanent fix. |
| Security & Vulnerability Logs | Completeness \+ Accessibility | Security events dispersed across individual system logs. No aggregated view. Patch compliance not tracked. CVSS scores not associated with open vulnerabilities. | Deploy SIEM. Aggregate all security event logs. Conduct vulnerability scan. Score all open vulnerabilities by CVSS. Build patch compliance register. |
| Cloud Cost & Resource Tagging | Completeness | Cloud resources not consistently tagged by department or project. Cost allocation is estimated. Anomaly detection not possible without clean tagging. | Enforce mandatory tagging policy on all cloud resources (department, project, environment, owner). Retrospectively tag all existing resources. Build cloud cost dashboard by department. |
| Technical Debt Register | Gap — Does Not Exist | No formal technical debt register. The 20% annual debt reduction target in the spec cannot be tracked against an unknown baseline. | Create technical debt register. Engineering team submits all known debt items. Score each item by risk (P1–P4) and effort (days). Establish baseline. Track monthly. |

| Department 8 of 9  —  Strategy & OKRs |
| :---- |

| Data Asset (from Spec) | Gap Type | Specific Issues | Cleaning Actions Required |
| :---- | :---- | :---- | :---- |
| KPI Library | Completeness \+ Accuracy | KPI Library v1.0 does not exist. KPIs defined in the spec are not yet loaded into a canonical register. Multiple definitions exist for the same metric across departments. | Create the KPI Library: every KPI from the spec with canonical definition, data source, calculation, owner, reporting frequency, and current target. Publish and enforce as the single source of truth. |
| OKR Data | Completeness | OKRs exist for some departments in spreadsheets or informally. Progress not systematically tracked. End-of-quarter scores not recorded historically. | Load all current OKRs into OKR platform. Establish a historical record from the current quarter. Configure weekly update requirement. Enforce scoring discipline at quarter-end. |
| Strategic Initiative Tracking | Gap — Does Not Exist | Strategic initiatives not tracked in a single register. Benefits realisation at 6 and 12 months not conducted. Portfolio RAG status cannot be produced. | Build initiative register in PMO tool. Load all active strategic initiatives. Assign benefits owner, target completion date, and benefits realisation dates. |
| Market & Competitive Intelligence | Accessibility | Market research and competitive intelligence held in individual emails, presentations, and individual knowledge. Not centralised or systematically updated. | Create central intelligence repository in SharePoint. Standardise format: competitor, insight, source, date. Schedule quarterly refresh. |
| Historical KPI Trends | Gap — Does Not Exist | No historical KPI trend data exists in a structured form. Baseline for all KPIs is unknown. Trend analysis requires at least 3–4 periods of clean data. | Define data collection start date for all KPIs. Begin collecting from Month 1 of implementation. Accept that trend analysis will only be meaningful after 3 periods. |

| Department 9 of 9  —  Administration |
| :---- |

| Data Asset (from Spec) | Gap Type | Specific Issues | Cleaning Actions Required |
| :---- | :---- | :---- | :---- |
| Document Register | Completeness | No central document register. Documents classified informally. 4-tier classification model not applied. Documents dispersed across personal drives, email, and shared folders. | Implement taxonomy in SharePoint per classification model. Migrate all critical documents. Apply classification labels. Remove documents from personal drives. |
| Contracts (Admin Category) | Completeness | Admin-category contracts (facilities, utilities, service agreements, fleet) not all in CLM. Expiry dates not tracked. Auto-renewal clauses unknown. | Audit all admin-category contracts. Load into CLM with mandatory fields. Flag all auto-renewal clauses with 90-day advance review dates. |
| Travel Spend Data | Accessibility | Travel bookings made through multiple channels. No consolidated travel spend dataset. Policy compliance rate unknown. | Implement single booking channel. Report prior-period travel spend retrospectively from expense claims. Build travel cost dashboard. |
| Asset & Fleet Register | Completeness | Fleet vehicles and office assets registered inconsistently. Some assets missing acquisition date, value, and assigned user. | Audit all fleet and office assets. Complete register with all required fields. Link to maintenance schedule. Assign every asset to a named custodian. |
| Board & Corporate Records | Accessibility | Board minutes, resolutions, and statutory filings held in paper or dispersed digital locations. No structured archive. Retrieval requires significant manual effort. | Create structured Board Records archive in SharePoint. Digitise all historical board minutes and resolutions. Index by date and meeting type. Restrict access to authorised roles. |

## **Data Gap — Closing Actions**

| \# | Action | Owner | Prerequisite | Target |
| :---- | :---- | :---- | :---- | :---- |
| D1 | Publish the Data Governance Framework covering: Data Asset Register, Data Steward appointments, Data Dictionary standard, Data Quality Scorecard methodology, Master Data Standard, and Data Incident Protocol. | CSO \+ IT Director | None | End Month 1 |
| D2 | Appoint Data Stewards for all critical data assets. One steward per major asset per department. Steward is responsible for quality — not IT. | Each Dept Head | D1 | End Month 1 |
| D3 | Complete the Data Quality Assessment for all critical assets in all 9 departments. Measure current completeness rate per asset. Output: a Data Quality Register with current and target scores. | BI Analyst \+ Each Steward | D1, D2 | End Month 2 |
| D4 | Execute data cleaning for Priority 1 assets (Employee Master, Chart of Accounts, Vendor Master, CRM Account/Contact records). These are prerequisites for all system go-lives in Phase 2\. | Each Data Steward \+ IT | D3 | End Month 3 |
| D5 | Execute data cleaning for all remaining assets per the department tables above. Complete before each system's go-live date. | Each Data Steward | D4 (rolling) | By each system go-live |
| D6 | Define the Master Data Standard: designate the system of record for every shared entity (employee → HRIS, vendor → ERP, contact → CRM, asset → ERP, document → SharePoint). All integrations must read from the system of record. No dual-write. | IT Director \+ CSO | D1 | End Month 2 |
| D7 | Build automated data pipelines between all integrated systems. Pipelines must be idempotent (safe to re-run), monitored (alerts on failure), and logged (every transfer recorded with timestamp and record count). | IT Director | T6 (systems live) | Month 5–9 |
| D8 | Publish the KPI Library v1.0 — the canonical source of truth for every metric tracked across all 9 departments. Every KPI: definition, formula, data source, owner, frequency, and current target. | CSO \+ BI Analyst | D3 | End Month 4 |
| D9 | Establish the Monthly Data Quality Review: BI Analyst produces Data Quality Scorecard per department. Dept Heads review scores and sign off remediation plans for any asset below 95% completeness. | CSO \+ Each Dept Head | D3, D7 | Month 3 (ongoing) |

# **Consolidated Priority View — All Three Gaps**

The table below consolidates the highest-priority items across all three gap types and all nine departments. Critical items must be addressed before Phase 2 activation begins. High items must be completed within Phase 2\.

| Item | Department | Priority | Gap Type |
| :---- | :---: | :---: | :---- |
| Month-End Close SOP | Finance | **Critical** | PROCESS GAP |
| Employee Onboarding SOP | HR | **Critical** | PROCESS GAP |
| IT Provisioning & Deprovisioning SOPs | IT | **Critical** | PROCESS GAP |
| MQL Handoff SOP (1-hour SLA) | Marketing | **Critical** | PROCESS GAP |
| AP Invoice Processing SOP | Finance | **Critical** | PROCESS GAP |
| Disciplinary & Grievance SOP | HR | **Critical** | PROCESS GAP |
| Contract Review & Authority SOP | Legal | **Critical** | PROCESS GAP |
| ITSM Incident & Change Management SOPs | IT | **Critical** | PROCESS GAP |
| CRM Pipeline & Renewal SOPs | Sales | **Critical** | PROCESS GAP |
| Data Breach Response SOP | Legal | **Critical** | PROCESS GAP |
| Security Incident Response SOP | IT | **Critical** | PROCESS GAP |
| ERP Finance modules — configuration | Finance | **Critical** | TECHNOLOGY GAP |
| SSO \+ IAM \+ MFA implementation | IT | **Critical** | TECHNOLOGY GAP |
| CRM 7-stage pipeline — configuration | Sales | **Critical** | TECHNOLOGY GAP |
| ITSM platform — procurement & go-live | IT | **Critical** | TECHNOLOGY GAP |
| SIEM — procurement & deployment | IT | **Critical** | TECHNOLOGY GAP |
| CLM — procurement & contract migration | Legal | **Critical** | TECHNOLOGY GAP |
| Employee Master Record — audit & clean | HR | **Critical** | DATA GAP |
| Chart of Accounts — clean & map | Finance | **Critical** | DATA GAP |
| Vendor Master — deduplicate & tier-rate | Operations | **Critical** | DATA GAP |
| KPI Library v1.0 — define & publish | Strategy | **Critical** | DATA GAP |
| CRM Account & Contact data — clean | Sales | **Critical** | DATA GAP |
| Contract Register — all active contracts | Legal | **Critical** | DATA GAP |
| HRIS → Payroll integration | HR/Finance | **High** | TECHNOLOGY GAP |
| Marketing Automation → CRM integration | Marketing | **High** | TECHNOLOGY GAP |
| Bank feeds → ERP integration | Finance | **High** | TECHNOLOGY GAP |
| OKR Platform — procurement & go-live | Strategy | **High** | TECHNOLOGY GAP |
| Data Governance Framework — publish | Strategy | **High** | DATA GAP |
| Data Steward appointments (all depts) | All Depts | **High** | DATA GAP |
| DPIA Register — create & backfill | Legal | **High** | DATA GAP |
| Inventory Master — clean & classify | Operations | **High** | DATA GAP |

# **Closing Principles**

## **Principle 1 — Sequence: Data Before Technology, Technology Before Process**

A process SOP that references a system not configured correctly will be followed incorrectly. A system that runs on uncleaned data produces outputs that are worse than useless. The sequence must be respected:

| STEP 1 Close the Data Gap Clean and govern the data assets that systems depend on. | → | STEP 2 Close the Technology Gap Configure systems against the spec. Build integrations. Test rigorously. | → | STEP 3 Close the Process Gap Write SOPs for the real systems. Train on the real process. |
| :---: | :---: | :---: | :---: | :---: |

## **Principle 2 — Ownership Cannot Be Shared Equally**

| Gap | Primary Owner | What They Own |
| :---- | :---- | :---- |
| Data Gap | Chief Strategy Officer (CSO) \+ nominated Data Steward per asset | Data governance framework, KPI library, data quality scorecard, master data standards. |
| Technology Gap | IT Director, with Business System Owner per department | Technology audit, procurement, configuration, integration, UAT sign-off, post-go-live support. |
| Process Gap | COO (framework) \+ each Department Head (their SOPs) | SOP template, SOP library, training delivery, compliance enforcement, SOP review cycle. |

## **Principle 3 — A Closed Gap Must Be Maintained**

| Gap | Maintenance Mechanism | Cadence |
| :---- | :---- | :---- |
| Data Gap | Monthly Data Quality Scorecard. Data Incident Protocol for issues. Annual data asset register review. | Monthly scorecard. Incident resolution per SLA. Annual register. |
| Technology Gap | Post-go-live hypercare (2 weeks per system). Ongoing ITSM change management. Annual technology roadmap review. | Hypercare per go-live. Continuous change management. Annual roadmap. |
| Process Gap | Monthly SOP compliance spot checks by Department Heads. Process Issue Register. 12-month SOP mandatory review cycle. 30-day update SLA for any process change. | Monthly compliance check. Continuous issue log. 12-month mandatory SOP review. |

|  | *The Department Operations Specification defines the destination. These three gaps define the terrain between here and there. Closing all three — in sequence, with clear ownership, and with maintenance mechanisms in place — is how the spec becomes the organisation.* |
| :---- | :---- |

*Verdant Fields AgriTech Ltd.  |  Operational Gap Analysis: Process · Technology · Data  |  Confidential  |  2025*