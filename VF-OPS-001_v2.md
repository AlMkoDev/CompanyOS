

| VERDANT FIELDS |
| :---: |
| **VF-OPS-001** |
| **Project & Delivery Management** |

| Status | Priority | Target |
| :---- | :---- | :---- |
| Draft — v2.0 | **High** | Q3 2026 |
| **Owner** | **Stack** | **Epic** |
| Operations & Engineering | NestJS · Next.js · Prisma · PostgreSQL · S3 | Operational Excellence |

*Dependencies: VF-LEG-001 (CLM), VF-LEG-002 (Compliance)*

*Relations: Shared User Model, Shared Notification Service*

# **Table of Contents**

| 1\. Executive Summary |
| :---- |

The Project & Delivery Management module provides a robust Portfolio & Project Management (PPM) framework for Verdant Fields, centred on on-time delivery, RAID log orchestration, and RAG status reporting. This document consolidates the full technical design, premium capability roadmap, identified specification gaps, and implementation task list into a single authoritative reference.

## **1.1 Key Value Propositions**

| Pillar | Description |
| :---- | :---- |
| Visibility | Real-time Portfolio Dashboard with RAG heatmaps, Gantt timelines, and delivery gauges for executive decision-making. |
| Accountability | Clear task ownership, RAID log tracking, and milestone gate reviews to mitigate and govern delivery risks. |
| Financial Control | Budget tracking against actual spend, variance alerts, and receipt-backed audit trails to prevent cost overruns. |
| Strategic Alignment | OKR linkage and portfolio prioritisation scoring to ensure every project connects to business objectives. |
| Predictive Delivery | Monte Carlo forecasting and velocity analytics to surface delivery risk before it becomes a crisis. |

| 2\. Specification Gaps & Required Fixes |
| :---- |

*The following gaps were identified in the original v1 draft. All items in this section are blockers that must be resolved before development begins.*

## **2.1 Critical Blockers**

### **2.1.1 Database Schema is Missing**

| BLOCKER  The Prisma schema section in v1 shows only line numbers 1–133 with no actual code. Every downstream decision — API shape, frontend state, and migrations — depends on this. It must be authored and included before any other work begins. |
| :---- |

### **2.1.2 No API Contracts**

Endpoint paths are listed but there are no request/response payloads. Developers cannot build against endpoints without knowing the body shape, response structure, and error codes. The following six endpoints are the minimum that need OpenAPI definitions before Sprint 1:

* GET /ops/portfolio/health — response shape for RAG heatmap aggregation

* POST /ops/projects — request body, required fields, owner assignment rules

* PATCH /ops/projects/:id/tasks/:taskId/move — Kanban move body (fromColumn, toColumn, blockerCheck)

* POST /ops/projects/:id/raid — RAID item creation payload and priority validation

* PATCH /ops/projects/:id/budget — spend update body and receipt attachment requirement

* GET /ops/projects/:id/export — query params for format (PDF/CSV), field selection, access control

### **2.1.3 RAG Logic Edge Cases**

The GREEN/AMBER/RED rules are ambiguous in three scenarios that will produce inconsistent behaviour if left unresolved:

| Scenario | Current spec | Required behaviour |
| :---- | :---- | :---- |
| Multiple conditions trigger simultaneously | Undefined | RED takes precedence over AMBER. AMBER takes precedence over GREEN. Apply highest severity. |
| Project at creation | No initial state defined | Set RAG to GREEN on creation. Log to ProjectAuditLog with reason 'Initial state'. |
| RED condition is resolved | Undefined auto-revert behaviour | System auto-reverts on next recalculation cycle. Admin may require manual acknowledgement per config flag. |
| Budget variance in AMBER tier | No budget condition in AMBER rule | Intentional omission — confirm. Recommend: Budget variance 5–10% triggers AMBER; \>10% triggers RED. |

## **2.2 Significant Weaknesses**

### **2.2.1 Non-Functional Requirements Absent**

The spec mentions performance optimisation but provides no measurable targets. The following NFRs must be defined before any load or capacity planning:

| Requirement | Proposed Target | Notes |
| :---- | :---- | :---- |
| Portfolio Dashboard load | \< 2s P95 | Aggregate query cached; recalculate on change only |
| RAG recalculation latency | \< 500ms | Triggered on task/RAID change; cache hit target 80% |
| Notification delivery SLA | \< 5 minutes | Task overdue and RAID critical alerts |
| Max projects per portfolio | 500 active | Stress-test at 1000 |
| Max tasks per project | 2000 | Pagination required above 200 in Kanban view |
| Export generation time | \< 30s | PDF export for large projects with attachments |

### **2.2.2 Shared Dependency Contracts Undefined**

VF-LEG-001 and VF-LEG-002 are listed as dependencies but the interfaces are undefined. The following must be documented before Sprint 1:

* Shared User Model — does PPM extend the existing Prisma model? What fields does it add? What role enum values are shared vs PPM-specific?

* Shared Notification Service — is this an internal NestJS service or a separate microservice? What is its API contract? Does it support templating? What is its SLA?

* Shared Auth — does PPM rely on the same JWT guard as CLM? Are role claims included in the token payload?

### **2.2.3 RBAC Matrix Incomplete**

Three roles are named but their permissions are not comprehensively mapped. This table is the authoritative RBAC reference and must be reviewed and signed off by the Head of Operations before development of SEC-01 begins:

| Action | Admin/PMO | Project Manager | Team Member | Stakeholder |
| :---- | :---- | :---- | :---- | :---- |
| Create / archive project | Yes | Yes | No | No |
| Edit project details | Yes | Yes | No | No |
| View project (own assigned) | Yes | Yes | Yes | Yes |
| Create / move tasks | Yes | Yes | Yes | No |
| View / edit budget | Yes | Yes | No | No |
| Log RAID items | Yes | Yes | Yes | No |
| Approve milestone gates | Yes | Yes | No | No |
| Manual RAG override | Yes (+ audit) | No | No | No |
| Export reports | Yes | Yes | No | Yes (own projects) |
| View audit log | Yes | No | No | No |
| Manage team members | Yes | Yes | No | No |

### **2.2.4 Kanban State Machine Incomplete**

The v1 spec defines only TODO → IN\_PROGRESS → DONE. The following full state map is required:

| State | Valid transitions to | Conditions | Backwards? |
| :---- | :---- | :---- | :---- |
| TODO | IN\_PROGRESS | None | N/A |
| IN\_PROGRESS | IN\_REVIEW, BLOCKED, TODO | None | Yes → TODO |
| IN\_REVIEW | DONE, IN\_PROGRESS | None | Yes → IN\_PROGRESS |
| BLOCKED | IN\_PROGRESS | Blocker must be resolved first | Yes → IN\_PROGRESS |
| DONE | IN\_PROGRESS (reopen) | PM or Admin only; requires reason | Yes — reopen only |

### **2.2.5 Additional Lower-Priority Gaps**

* File attachments — permitted file types, size limit per file, size limit per project, versioning policy, and deletion-on-archive behaviour must all be specified.

* Export endpoint — fields included in PDF/CSV, formatting standards, file size limits, and who can trigger exports must be defined.

* Error handling strategy — validation errors, S3 upload failures, and async notification failures must surface to the user consistently. A global error response schema (code, message, field) must be defined.

* Migration rollback plan — OPS-02 has no rollback procedure. A zero-downtime migration plan with a tested rollback script must be produced before production deployment.

* Sprint allocation — story point estimates are not validated against team velocity. Velocity baseline must be established in Sprint Planning before accepting the proposed sprint allocation.

| 3\. Premium Capability Tiers |
| :---- |

*The following five tiers define the components required to elevate VF-OPS-001 from a basic execution tracker to a premium Portfolio & Project Management platform competitive with Jira Advanced Roadmaps, Monday.com, and Smartsheet. Each tier builds on the one before it — lower tiers deliver diminishing value without the tiers preceding them.*

| Priority recommendation  Implement Tier 1 (strategic planning) and Tier 3 (delivery intelligence) before Tier 2, 4, or 5\. The portfolio roadmap and cross-project dependency graph are the two features most requested by PMOs and deliver the highest adoption value at enterprise scale. |
| :---- |

## **Tier 1 — Strategic Planning Layer**

The most significant gap in the current spec. The system tracks execution but has no concept of why a project exists or how it connects to business strategy.

### **T1.1 OKR Alignment**

Every project links to a company objective with a contribution score. Without this, PMs cannot justify prioritisation decisions and executives cannot determine whether the portfolio is aligned to company strategy.

* New models: Objective (title, owner, quarter), KeyResult (target, current, unit), ProjectObjectiveLink (projectId, objectiveId, contributionScore 0–100)

* UI: OKR selector on project creation wizard. Portfolio dashboard shows OKR coverage heat — projects with no objective link are flagged.

* API: GET /ops/objectives/coverage — returns % of active projects linked to at least one OKR.

### **T1.2 Portfolio Roadmap (Gantt-style)**

A cross-project timeline showing milestones, phases, and inter-project sequencing. This is the number one feature request from PMOs and the most visible gap in the current spec, which has no time-axis view.

* **New models required:** Milestone (projectId, title, targetDate, achievedDate), ProjectPhase (projectId, name, startDate, endDate), ProjectBaseline (snapshot of bar positions at approval date).

* Rendering approach: Custom SVG/Canvas rendering is strongly preferred over third-party library wrappers (react-gantt, dhtmlx-gantt). Libraries impose their own visual language and resist customisation. Custom rendering gives full control over premium signals.

Premium Gantt signals (each differentiates from commodity implementations):

| Signal | Description | Data source |
| :---- | :---- | :---- |
| Forecast vs plan separation | Dashed slip zone extends past milestone diamond when velocity data predicts a late delivery. Renders automatically — no PM input required. | SprintRecord \+ CycleTimeLog |
| Progress fill layer | Completion baked into bar as a fill at 35% opacity. Eliminates need to read % numbers — scannable across 50+ projects at a glance. | Task.status aggregation |
| RAID risk flags on timeline | High-priority RAID items render as vertical flags pinned to the date they were logged. Hover reveals risk summary. Direct visual link between risk and milestone proximity. | RAIDItem.loggedDate \+ priority |
| Dependency curves | Cubic Bezier paths connecting bars — not straight lines. Routes cleanly between any two positions. Carries dependency type (FTS, STS). | ProjectDependency model |
| Today line \+ milestone diamonds | Vertical red today-line as 'you are here' anchor. Rotated diamond (industry convention) for milestones. Diamond pulses when today-line passes an unachieved milestone. | System date \+ Milestone model |
| Baseline ghost bars | Thin outline behind current bar shows original planned position. Prevents PMs from hiding slippage by dragging bars forward. | ProjectBaseline snapshot |
| Semantic filter pills | One-click 'At risk' filter collapses portfolio to Amber/Red only. Monday morning risk review with no configuration. | Project.ragStatus |

Drag-to-reschedule with constraint propagation: When a bar is dragged, the system performs a topological sort of the dependency graph and cascades date changes to all downstream-dependent projects. This is the hardest engineering challenge in Gantt implementation and should be scoped as a separate story (BE-GANTT-01) with dedicated spike time.

Critical path highlighting: On milestone hover/click, the longest dependency chain leading to that point highlights in a distinct colour inline on the chart — not in a separate view.

### **T1.3 Prioritisation Scoring**

A weighted matrix that produces a numeric score for backlog projects, enabling defensible go/no-go decisions.

* New model: ProjectScorecard (projectId, valueScore, effortScore, strategicFitScore, riskScore, weightConfig — configurable coefficients per organisation)

* UI: Value vs effort 2x2 matrix view on portfolio dashboard. Projects plotted as bubbles, sized by budget.

* Score \= (value × wV \+ strategicFit × wS − risk × wR) / effort × wE — coefficients configurable by PMO Admin.

## **Tier 2 — Resource Intelligence Layer**

The current spec stores ResourceAssignment.allocationPercent but never uses it. Tier 2 operationalises this data.

### **T2.1 Capacity Planning**

* New model: Capacity (userId, weekStart, availableHours, allocatedHours derived from ResourceAssignment aggregation)

* View: Weekly grid showing each person's allocated % vs available hours across all their projects. Overallocation (\>100%) highlighted in red.

* Integration point: Connects to leave management system in Phase 4 to adjust available hours automatically.

### **T2.2 Skills Matrix**

* New model: UserSkill (userId, skillId, proficiencyLevel: BEGINNER | PRACTITIONER | EXPERT | LEAD)

* Use case: When a project needs a senior React developer, PM searches the bench by skill and proficiency. Surfaces available people rather than guessing.

* Also supports succession planning: flag key-person dependencies where only one person holds a critical skill.

### **T2.3 Utilisation Heatmap**

* Portfolio-level counterpart to the RAG heatmap. Shows the portfolio's human cost, not just delivery status.

* Colour encoding: \>100% allocated \= red, 80–100% \= amber, 50–80% \= green, \<50% \= blue (underutilised).

* Without this view the ResourceAssignment feature in the current spec is effectively a stub — it stores data with no consumer.

## **Tier 3 — Delivery Intelligence Layer**

Moves the system from reactive (what is red now?) to predictive (will we be late?).

### **T3.1 Cross-Project Dependency Graph**

The current RAID log captures blockers within a project. There is no model for project A is blocked by project B. This is the most critical architectural gap for portfolio-level risk management.

* New model: ProjectDependency (fromProjectId, toProjectId, dependencyType: FINISH\_TO\_START | START\_TO\_START | FINISH\_TO\_FINISH, lagDays)

* Visual: Directed graph view on portfolio dashboard alongside the Gantt. Nodes coloured by RAG status. Edges weighted by lag.

* Alert: When an upstream project's forecast slips, automatically notify owners of all downstream dependents.

* Without this model, the portfolio view misses cascading risk entirely — a RED project may be causing three AMBER projects that appear unrelated.

### **T3.2 Monte Carlo Delivery Forecasting**

The feature that elevates the tool from a tracker to a decision-support system. Uses historical task completion rates to simulate thousands of possible futures and produce a probability distribution of delivery dates.

* Required models: SprintRecord (projectId, sprintNumber, plannedPoints, completedPoints, startDate, endDate), CycleTimeLog (taskId, startedAt, completedAt)

* Algorithm: Sample from historical throughput distribution N=10,000 times to produce P50, P85, P95 delivery date estimates.

* UI: Probability bar on Gantt (e.g. 65% confidence Q3, 95% confidence Q4). Tooltip shows distribution chart.

* Background job: Recalculate nightly or on sprint completion. Store results in ProjectForecast model.

### **T3.3 Velocity Analytics**

* Sprint-over-sprint throughput charts, cycle time distributions, and lead time trends.

* Purpose: Feedback loop that allows teams to improve estimation accuracy over time. Without retrospective data the same estimation errors repeat indefinitely.

* Charts: Throughput trend (bar), cycle time scatter plot (identify outliers), cumulative flow diagram (identify bottlenecks by Kanban column).

## **Tier 4 — Stakeholder Engagement Layer**

Different audiences need different views of the same underlying data. Tier 4 builds the presentation layer for non-PM consumers.

### **T4.1 Status Page Builder**

* Configurable external-facing page (shareable via link or embeddable) showing sanitised, narrative-driven project status.

* Auto-populated from project data — no manual update required. PM adds optional commentary per milestone.

* Access model: Public link with optional password, or SSO-authenticated for internal stakeholders.

* Design reference: Notion's published pages aesthetic — clean, no toolbar, mobile-friendly.

### **T4.2 Decision Register**

The 'D' in RAID is typically the weakest part of any RAID log implementation. A dedicated register creates an immutable governance trail, which is a prerequisite for regulated-industry adoption.

* New model: DecisionRecord (projectId, title, context, optionsConsidered: JSON\[\], chosenOption, rationale, approvedById, approvedAt, status: PROPOSED | APPROVED | SUPERSEDED)

* Critical for: Legal, compliance, and financial projects where audit trails of key decisions are required by regulation.

### **T4.3 Milestone Gate Reviews**

* Structured approval workflows at key project phases (Discovery Complete, Design Approved, Ready to Launch).

* New model: GateReview (projectId, gateId, entryCriteria: JSON\[\], exitCriteria: JSON\[\], requiredApprovers: userId\[\], status: PENDING | PASSED | FAILED | WAIVED, outcome)

* Each gate pass/fail recorded to ProjectAuditLog. Failed gates block downstream phase progression unless waived by Admin.

* This transforms the tool from a tracker into a governance framework — the adoption unlock for enterprise customers and regulated industries.

## **Tier 5 — Intelligence & Automation Layer**

Converts accumulated project data into forward-looking value. Tier 5 components require sufficient historical data from Tiers 1–4 to be meaningful — do not implement before 6+ months of portfolio data exists.

### **T5.1 AI Risk Detection**

* Pattern matching on project data to surface early warnings that rule-based RAG cannot detect.

* Example signals: Three projects with similar profiles slipped in Q2 — this project matches that pattern at week 4\. Task estimates on this project are consistently 40% under actuals — the stated deadline is likely optimistic.

* New model: ProjectInsight (projectId, insightType, confidence, description, detectedAt, acknowledged)

* Scheduled analysis job: Runs nightly. Surfaces top-3 insights per project in Project Header.

### **T5.2 Lessons Learned Capture**

* Structured retrospective module that closes the loop on completed projects. Each lesson links back to a RAID item or milestone.

* New model: Lesson (projectId, category: PROCESS | TECHNICAL | PEOPLE | RISK, title, description, recommendation, raidItemId?, milestoneId?)

* Over time becomes a searchable organisational knowledge base. Surface relevant lessons when a new project of similar type is created.

### **T5.3 Composite Health Scoring**

* Continuous 0–100 project health index replacing binary RAG. Combines: RAG status weight (40%), budget variance weight (25%), schedule performance index (20%), RAID density (15%).

* Enables trending: this project has been declining for 3 weeks even though it is still Amber.

* Portfolio view: Sortable by health score. Sparkline showing 4-week trend alongside score.

| 4\. Technical Specifications |
| :---- |

## **4.1 Module Structure (NestJS Backend)**

| Module | Responsibility |
| :---- | :---- |
| portfolio/ | Aggregate health, dashboard data, OKR coverage, Monte Carlo results |
| projects/ | CRUD, lifecycle, baseline snapshots, gate reviews |
| tasks/ | Kanban logic, state machine, assignments, cycle time logging |
| raid/ | Risk, Action, Issue, Decision management |
| budget/ | Financial tracking, variance calculation, receipt management |
| resources/ | Capacity planning, skills matrix, utilisation aggregation |
| roadmap/ | Gantt data, dependency graph, forecast calculation |
| reports/ | PDF/CSV export, status page content, analytics |
| notifications/ | Shared notification service integration, preference management |

## **4.2 RAG Calculation Engine**

Trigger: On task status change, task due date pass, RAID item creation/update, or budget variance change.

| Status | Conditions (evaluated in priority order) | Action |
| :---- | :---- | :---- |
| RED | \> 3 overdue tasks OR 1+ Critical RAID items OR Budget variance \> 10% | Set ragStatus \= RED. Log to ProjectAuditLog with triggering condition. |
| AMBER | 1–3 overdue tasks OR 1+ High Priority RAID items OR Budget variance 5–10% | Set ragStatus \= AMBER. Log to ProjectAuditLog. |
| GREEN | 0 overdue tasks AND no Critical/High RAID items AND budget variance \< 5% | Set ragStatus \= GREEN. Log only if previous status was not GREEN. |

| Note  RED takes priority over AMBER when multiple conditions are simultaneously true. System auto-reverts on next recalculation cycle when conditions are resolved. Manual override requires Admin role and mandatory audit log entry. |
| :---- |

## **4.3 API Endpoints (REST)**

| Method | Endpoint | Auth Required | Description |
| :---- | :---- | :---- | :---- |
| GET | /ops/portfolio/health | Admin / PMO | Aggregate RAG heatmap, OKR coverage, utilisation summary |
| POST | /ops/projects | PM / Admin | Create project with budget and team |
| GET | /ops/projects/:id | Assigned user | Full project detail including RAG, tasks, budget |
| PATCH | /ops/projects/:id/tasks/:taskId/move | PM / Member | Kanban drag-and-drop with blocker validation |
| POST | /ops/projects/:id/raid | PM / Member | Log Risk, Action, Issue, or Decision |
| PATCH | /ops/projects/:id/budget | PM / Finance | Update actual spend, trigger variance check |
| GET | /ops/projects/:id/export | PM / Stakeholder | PDF or CSV report generation |
| GET | /ops/portfolio/roadmap | Admin / PMO / PM | Gantt data for all visible projects |
| GET | /ops/portfolio/dependencies | Admin / PMO | Cross-project dependency graph data |
| GET | /ops/projects/:id/forecast | PM / Admin | Monte Carlo P50/P85/P95 delivery estimates |
| POST | /ops/projects/:id/gates/:gateId/review | PM / Admin | Submit gate review outcome |

## **4.4 Frontend Routes & Components**

| Route | Key Components |
| :---- | :---- |
| /app/(ops)/portfolio/dashboard | RAGHeatmap, DeliveryGauge, BudgetOverview, OKRCoverageRing, UtilisationHeatmap, PrioritisationMatrix |
| /app/(ops)/portfolio/roadmap | GanttChart (custom SVG), DependencyGraph, TimeScaleToggle, SemanticFilterPills, TodayLine, CriticalPathHighlight |
| /app/(ops)/projects/\[id\] | ProjectHeader (RAG, owner, dates, health score), KanbanBoard, RAIDLog, BudgetChart, FilesPanel, GateReviewPanel, DecisionRegister |
| /app/(ops)/projects/new | ProjectWizard (Details → OKR → Budget → Team → Gates) |
| /app/(ops)/resources | CapacityPlanningGrid, SkillsMatrix, UtilisationHeatmap |
| /app/(ops)/projects/\[id\]/status | PublicStatusPage (configurable, shareable) |

| 5\. Implementation Task List |
| :---- |

*SP \= Story Points (1 \= trivial, 13 \= very large). Priority: P0 \= release blocker, P1 \= high, P2 \= nice-to-have. Role: BE \= Backend, FE \= Frontend, DB \= Database, QA \= Quality Assurance, DEVOPS \= Infrastructure.*

## **Epic 1 — Foundation & Database Setup**

| ID | Title | Acceptance Criteria | Role | SP | P |
| :---- | :---- | :---- | :---- | :---- | :---- |
| DB-01 | Prisma schema (base PPM models) | Project, Task, RAIDItem, Budget, ResourceAssignment migrate successfully. Enums defined. | DB | 5 | P0 |
| DB-02 | Prisma schema (premium models) | Milestone, ProjectDependency, GateReview, DecisionRecord, SprintRecord, CycleTimeLog, ProjectForecast, ProjectInsight migrate. | DB | 8 | P1 |
| DB-03 | Seed initial data | prisma db seed populates lookup tables and sample projects. | DB | 2 | P1 |
| INF-01 | S3 configuration | projects/attachments/ folder created. IAM policies applied. Public access blocked. | DEVOPS | 2 | P0 |
| INF-02 | Notification service setup | Test email sends successfully. Contract with VF-LEG-001 shared service documented. | BE | 3 | P1 |

## **Epic 2 — Backend Core Logic**

| ID | Title | Acceptance Criteria | Role | SP | P |
| :---- | :---- | :---- | :---- | :---- | :---- |
| BE-01 | Project CRUD | POST/GET/PATCH/DELETE endpoints work. Owner assignment enforced. Baseline snapshot created on approval. | BE | 5 | P0 |
| BE-02 | RAG calculation engine | Priority order correct. Initial state GREEN. Auto-revert on resolution. Budget AMBER/RED thresholds applied. | BE | 8 | P0 |
| BE-03 | Kanban state machine | Full 5-state machine implemented. Backwards transitions allowed per matrix. Blocker validation enforced on DONE. | BE | 5 | P0 |
| BE-04 | RAID log management | CRUD for R/A/I/D items. Priority sorting. Decision register fields included. | BE | 5 | P1 |
| BE-05 | Budget tracking service | Variance calculated correctly. AMBER/RED thresholds trigger alerts. Receipt upload required above configurable threshold. | BE | 5 | P1 |
| BE-06 | Resource assignment | Users linked to projects. Allocation % stored. Overallocation flag computed. | BE | 3 | P1 |
| BE-07 | File attachment service | S3 upload. Permitted types enforced. Size limits applied. URL stored in DB. | BE | 5 | P0 |
| BE-08 | Audit logging interceptor | Every state change creates immutable log entry. No DELETE/PUT exposed on AuditLog. | BE | 5 | P1 |
| BE-09 | Portfolio aggregation API | Returns cached aggregate stats. RAG heatmap, OKR coverage, utilisation summary all returned in single call. | BE | 5 | P0 |
| BE-10 | Gantt data API | Returns project bars, milestones, dependency edges, forecast zones, and RAID flags for all visible projects. | BE | 8 | P1 |
| BE-11 | Cross-project dependency engine | ProjectDependency CRUD. Topological sort on date change. Cascade notification to downstream owners. | BE | 8 | P1 |
| BE-12 | Monte Carlo forecast service | P50/P85/P95 computed from SprintRecord history. Stored in ProjectForecast. Nightly recalculation job. | BE | 13 | P1 |
| BE-13 | Gate review workflow | GateReview CRUD. Required approvers enforced. Failed gate blocks downstream progression. Audit logged. | BE | 8 | P1 |
| BE-14 | Capacity planning service | Weekly allocation aggregated per user across all projects. Overallocation threshold configurable. | BE | 5 | P2 |

## **Epic 3 — Frontend Implementation**

| ID | Title | Acceptance Criteria | Role | SP | P |
| :---- | :---- | :---- | :---- | :---- | :---- |
| FE-01 | Portfolio dashboard | RAG heatmap, delivery gauge, budget overview, OKR coverage ring all render. Filter pills functional. | FE | 8 | P0 |
| FE-02 | Project workspace layout | Tabbed navigation (Kanban, RAID, Budget, Files, Gates). Header shows RAG, health score, forecast. | FE | 5 | P0 |
| FE-03 | Kanban board | @dnd-kit drag-and-drop. 5 columns per state machine. Blocker indicator. Optimistic UI update. | FE | 13 | P0 |
| FE-04 | Gantt chart (custom SVG) | Bar rendering, today line, milestone diamonds, progress fill, slip zones, RAID flags, dependency Bezier curves. Time scale toggle. | FE | 21 | P0 |
| FE-05 | Gantt drag-to-reschedule | Bar drag cascades to downstream dependents via topological sort. Constraint violation shown before confirm. | FE | 13 | P1 |
| FE-06 | RAID log data grid | Filters by Type, Priority, Status. Inline status editing. Decision register tab included. | FE | 8 | P1 |
| FE-07 | Budget chart component | Line chart planned vs actual. Variance highlighted \>5% amber, \>10% red. Receipt upload link. | FE | 5 | P1 |
| FE-08 | Project creation wizard | 5-step form: Details → OKR → Budget → Team → Gates. All steps validate before advance. | FE | 8 | P0 |
| FE-09 | Task detail modal | Opens from Kanban card. State transition buttons. Comments. Attachments. Cycle time display. | FE | 5 | P1 |
| FE-10 | RBAC guards | Frontend buttons and routes hidden per permission matrix in §2.2.3. Tested for all 4 roles. | FE | 5 | P0 |
| FE-11 | File upload component | Drag-and-drop zone. Upload progress. File type/size validation client-side. File list updates on success. | FE | 3 | P1 |
| FE-12 | Capacity planning grid | Weekly view per person. Overallocation highlighted. Skill badges displayed. | FE | 8 | P2 |
| FE-13 | Dependency graph view | Directed graph alongside Gantt. Nodes coloured by RAG. Critical path highlight on hover. | FE | 13 | P1 |
| FE-14 | Status page builder | Configurable public page. Auto-populated from project data. Shareable link. Optional password. | FE | 8 | P2 |
| FE-15 | Gate review panel | Gate criteria checklist. Approve/Fail/Waive actions. Approver list with status. | FE | 5 | P1 |

## **Epic 4 — Security & Compliance**

| ID | Title | Acceptance Criteria | Role | SP | P |
| :---- | :---- | :---- | :---- | :---- | :---- |
| SEC-01 | API role guards | NestJS guards enforce RBAC matrix §2.2.3. Unauthorised requests return 403\. | BE | 5 | P0 |
| SEC-02 | Budget data access control | API returns 403 for non-Finance/PM roles. Verified for all 4 roles. | BE | 3 | P1 |
| SEC-03 | Audit log integrity | No DELETE/PUT endpoints exposed. Audit entries are immutable. Verified via pen test. | BE | 2 | P0 |
| SEC-04 | Data isolation | Users see only assigned projects unless Admin/PMO. Query filters verified in integration tests. | BE | 5 | P0 |
| SEC-05 | API contract validation | OpenAPI spec generated and published for all 11 endpoints in §4.3. Request/response schemas validated. | BE | 5 | P0 |

## **Epic 5 — Quality Assurance & Testing**

| ID | Title | Acceptance Criteria | Role | SP | P |
| :---- | :---- | :---- | :---- | :---- | :---- |
| QA-01 | RAG logic unit tests | All edge cases in §2.1.3 covered. Code coverage \>80% for RAG engine. | QA/BE | 5 | P1 |
| QA-02 | Kanban state machine tests | All 5-state transitions and backward transitions tested. Blocker validation tested. | QA/BE | 3 | P1 |
| QA-03 | Integration tests | Flow: Create Project → Add Task → Overdue → RAG changes. Flow: Update Budget → Exceed threshold → Alert triggered. | QA/BE | 8 | P1 |
| QA-04 | E2E Kanban test | Playwright: Login → Move Task → Verify DB. Drag task with blocker → Confirm blocked. | QA | 5 | P1 |
| QA-05 | E2E Gantt test | Playwright: Create project → Set milestone → Verify Gantt renders correctly. Verify RAID flag appears. | QA | 5 | P1 |
| QA-06 | Security pen test | Attempt budget access without permission. Attempt manual RAG override without Admin. Audit log tampering attempt. | QA/SEC | 5 | P0 |
| QA-07 | Performance testing | Portfolio dashboard \< 2s P95. RAG recalc \< 500ms. Tested at 500 projects. | QA/DEVOPS | 5 | P1 |
| QA-08 | UAT: Project Managers | PMs create real projects, track tasks, log RAID, use Gantt. Sign-off from Head of Operations. | QA/PM | 3 | P0 |

## **Epic 6 — Deployment & Rollout**

| ID | Title | Acceptance Criteria | Role | SP | P |
| :---- | :---- | :---- | :---- | :---- | :---- |
| OPS-01 | Feature flag setup | ENABLE\_PPM flag wraps entire module. Invisible when false. Tested in staging. | DEVOPS | 2 | P0 |
| OPS-02 | Production migration \+ rollback plan | Prisma migrations run on Prod. Rollback script tested in staging. Zero downtime confirmed. | DEVOPS | 5 | P0 |
| OPS-03 | Performance monitoring | Alert triggers if RAG calc query \>500ms. Dashboard query \>2s. Dashboards in monitoring tool. | DEVOPS | 3 | P1 |
| OPS-04 | User training | Workshop for PMs covering Kanban, RAID, Gantt, Gate Reviews. Training materials produced. | PM | 3 | P1 |

| 6\. Risks & Mitigation |
| :---- |

| Risk | Impact | Likelihood | Mitigation |
| :---- | :---- | :---- | :---- |
| RAG manipulation by PMs | High | Medium | Auto-calculate from data only. Manual override requires Admin role \+ mandatory audit log entry with reason code. |
| Budget data integrity | High | Low | Require receipt upload for spend above configurable threshold. Audit log all budget changes. SEC-02 enforces role access. |
| Gantt drag propagation complexity | High | High | Scope as dedicated spike (BE-GANTT-01). Topological sort must be proven in isolation before integration. Gate this feature behind a separate release flag. |
| Monte Carlo data starvation | Medium | High | Requires 3+ sprints of SprintRecord data before forecast is meaningful. Display confidence indicator. Suppress forecast UI until minimum data threshold met. |
| Shared dependency interface mismatch (VF-LEG-001) | High | Medium | Contract meeting between PPM and CLM teams in Sprint 0\. Document shared User Model and Notification Service API before any Sprint 1 work begins. |
| Notification fatigue | Medium | High | Allow per-user notification preferences (instant vs daily digest). PM can configure project-level alert thresholds. |
| Kanban WIP chaos | Medium | Medium | Enforce optional WIP limits per column. PM configurable. Default: no limit (to avoid blocking adoption). |
| Sprint over-allocation | High | Medium | Story point estimates are not validated against team velocity. Run velocity baseline exercise in Sprint Planning before accepting sprint allocation. |

| 7\. Migration & Rollout |
| :---- |

| Phase | Scope | Activities & Exit Criteria |
| :---- | :---- | :---- |
| 1 | Engineering pilot | Enable for Engineering team only. Migrate active projects via CSV import. Collect velocity data for Monte Carlo baseline. Exit: 10+ projects tracked for 3+ sprints. |
| 2 | PMO enablement | Enable for Project Management Office. Configure budget tracking and gate review workflows. Train PMs. Exit: Head of Operations sign-off on UAT-QA-08. |
| 3 | Company-wide | Open to all departments. Enable RAID logging. Portfolio roadmap Gantt live. Exit: \>80% of active projects migrated to PPM. |
| 4 | Finance integration | Connect to Finance System for actual spend automation. Enable Monte Carlo forecasting (data threshold met). Enable AI risk detection (Tier 5). Exit: Finance team confirms spend data reconciliation accurate. |

| 8\. Suggested Sprint Allocation |
| :---- |

| Note  The following allocation is indicative only. Story points must be validated against team velocity in Sprint Planning before commitment. Run a velocity baseline exercise using completed work from the CLM module before accepting these estimates. |
| :---- |

| Sprint | Epics & Focus | Key Deliverables |
| :---- | :---- | :---- |
| 0 | Pre-sprint: Dependency contracts, schema authoring | Shared User Model contract signed off. Notification Service API documented. Full Prisma schema written and reviewed. RBAC matrix approved by Head of Operations. |
| 1 | Epic 1 (DB/Infra) \+ Epic 2 BE-01/03 \+ Epic 4 SEC-01/03/04 | Database migrated. Project CRUD working. Kanban state machine complete. API guards enforced. |
| 2 | Epic 2 BE-02/04/05/09 \+ Epic 3 FE-01/02/03 | RAG engine live. RAID log working. Portfolio dashboard and Kanban board usable. |
| 3 | Epic 2 BE-10/11 \+ Epic 3 FE-04/06/07/10 \+ Epic 5 QA-01–04 | Gantt chart (static). Budget chart. Project wizard. Core test suite passing. |
| 4 | Epic 2 BE-12/13 \+ Epic 3 FE-05/08/13/15 \+ Epic 5 QA-05–08 | Gantt drag-to-reschedule. Gate reviews. Dependency graph. UAT with PMs. |
| 5 | Epic 6 (Deployment) \+ P2 backlog \+ Bug fixes | Production migration. Monitoring live. Training conducted. Phase 1 rollout to Engineering. |

| 9\. Definition of Done |
| :---- |

For any task to be considered complete, all of the following conditions must be met:

1. Code is merged to the develop branch via an approved pull request.

2. Unit and integration tests pass in the CI pipeline with no new test failures.

3. Code reviewed and approved by at least one senior engineer.

4. SAST and DAST security scans pass with no high-severity findings.

5. Feature verified in the Staging environment against the acceptance criteria in this document.

6. OpenAPI documentation updated for any new or modified endpoint.

7. Audit log entries verified for any state-changing operation.

8. RBAC verified — all four roles tested against the permissions matrix in §2.2.3.

| *VF-OPS-001 v2.0 — Verdant Fields Confidential* | *Operational Excellence · Q3 2026 Target* |
| :---- | ----: |

