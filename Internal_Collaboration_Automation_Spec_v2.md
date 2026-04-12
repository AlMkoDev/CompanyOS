# Internal Collaboration & Customer Update Automation Layer
### Dispute Management System — Feature Specification

| Field | Detail |
|---|---|
| **Document Version** | 2.0 |
| **Status** | Draft — Pending Review |
| **Date** | March 29, 2026 |
| **Owner** | Operations & Technology Team |
| **Classification** | Internal Use Only |
| **Replaces** | Version 1.0 (informal draft) |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Objectives & Success Metrics](#3-objectives--success-metrics)
4. [Scope](#4-scope)
5. [System Architecture](#5-system-architecture)
6. [Core Components](#6-core-components)
7. [Integration Points](#7-integration-points)
8. [User Roles & Permissions](#8-user-roles--permissions)
9. [Technical Requirements](#9-technical-requirements)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Risk Register](#11-risk-register)
12. [Open Questions](#12-open-questions)
13. [Appendix](#13-appendix)

---

## 1. Executive Summary

The dispute management system currently handles six operational stages: dispute intake, evidence capture, the dispute register, resolution controls, analytics, and a customer-facing portal. While the pipeline is structurally complete, it lacks the connective tissue that allows teams to coordinate internally and keeps customers proactively informed throughout the resolution lifecycle.

This document specifies an **Internal Collaboration & Customer Update Automation Layer** — a middleware layer that sits across all existing modules to orchestrate automated customer notifications and structured internal team communication. It replaces ad hoc email chains and manual status calls with trigger-based workflows, templated messaging, and a centralised collaboration thread anchored to each dispute record.

**Expected impact:**
- Resolution cycle time reduced by an estimated 18–25%
- Manual communication effort reduced by ≥5 hours per staff member per week
- Customer satisfaction (CSAT) on dispute handling improved by ≥25 points
- Full audit trail established for every dispute interaction

---

## 2. Problem Statement

Without this layer, the current system has three structural gaps:

**Gap 1 — No automated customer communication.** Status changes in the dispute register do not trigger any outbound notification. Customers must call or log in repeatedly to check progress, generating avoidable inbound volume and eroding trust.

**Gap 2 — No structured internal coordination.** Teams (support, finance, logistics) collaborate through external email threads or verbal handoffs. Context is lost between shifts, decisions are not recorded against the dispute, and there is no accountability trail for internal actions.

**Gap 3 — No unified audit log.** Customer-facing and internal communications exist in separate, disconnected systems. Compliance reviews and post-resolution audits require manual reconstruction of events.

---

## 3. Objectives & Success Metrics

### Primary Objectives

| # | Objective | Definition of Done | Target Metric |
|---|---|---|---|
| O1 | Automate customer status notifications | Customers receive an update at every defined milestone without manual intervention | ≥95% of updates dispatched within 30 minutes of trigger |
| O2 | Centralise internal team collaboration | All internal discussion, task assignment, and file sharing is anchored to the dispute record | Internal handoff time reduced by ≥40% |
| O3 | Establish an immutable audit trail | Every action — view, edit, comment, send — is logged with user, timestamp, and context | 100% of interactions logged; zero gaps in compliance export |
| O4 | Eliminate repetitive manual effort | Templated workflows replace copy-paste updates across email and SMS | ≥5 hours/week saved per operations staff member |
| O5 | Improve customer experience | Customers receive consistent, clear, and timely communication | CSAT on dispute handling improves by ≥25 points |

### Secondary Objectives

- Brand-consistent messaging with dynamic variable insertion across all channels
- Multi-channel delivery: email (primary), SMS (urgent/opt-in), in-app portal notification
- Configurable escalation rules for disputes that breach SLA thresholds
- Real-time communication history visible to any assigned agent

### Out of Scope (v1)

- AI-generated response drafts
- SMS as a primary channel (available Phase 4)
- Multi-language template support
- Integration with third-party CRM platforms

---

## 4. Scope

### In Scope

This specification covers the design and build of the following:

- **Workflow Engine** — rule-based trigger and escalation management
- **Notification Service** — templated, multi-channel customer messaging
- **Collaboration Hub** — internal threaded discussion, @mentions, and task assignment
- **Audit & Logging Service** — immutable interaction ledger with export capability
- **Integration Adapter Layer** — APIs and webhooks connecting the new layer to all six existing modules

### Boundaries

This layer does **not** replace or modify any existing module. It consumes events from and writes status updates back to existing modules via defined integration points (see Section 7). All existing module behaviour remains unchanged.

---

## 5. System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        EXISTING MODULES                          │
│                                                                  │
│   Dispute Intake   ·   Evidence Capture   ·   Dispute Register  │
│   Resolution Controls   ·   Analytics   ·   Customer Portal     │
└───────────────────────────────┬──────────────────────────────────┘
                                │  Events / Webhooks / API calls
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│              AUTOMATION LAYER  (this specification)              │
│                                                                  │
│  ┌─────────────────────┐        ┌──────────────────────────┐    │
│  │   Workflow Engine   │        │   Notification Service   │    │
│  │  · Rule Builder     │───────▶│  · Template Library      │    │
│  │  · Trigger Manager  │        │  · Channel Router        │    │
│  │  · Escalation Logic │        │  · Throttle & Fallback   │    │
│  └──────────┬──────────┘        └──────────────────────────┘    │
│             │                                                    │
│             ▼                                                    │
│  ┌─────────────────────┐        ┌──────────────────────────┐    │
│  │  Collaboration Hub  │        │  Audit & Logging Service │    │
│  │  · Dispute Threads  │───────▶│  · Immutable Ledger      │    │
│  │  · @Mentions        │        │  · Unified Timeline      │    │
│  │  · Task Assignment  │        │  · Compliance Export     │    │
│  │  · Confidential     │        └──────────────────────────┘    │
│  │    Notes Flag       │                                        │
│  └──────────┬──────────┘                                        │
│             │                                                    │
│             ▼                                                    │
│  ┌─────────────────────┐                                        │
│  │  Integration        │                                        │
│  │  Adapter Layer      │                                        │
│  │  · REST / Webhooks  │                                        │
│  │  · OAuth 2.0        │                                        │
│  │  · Rate Limiting    │                                        │
│  └─────────────────────┘                                        │
└───────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                        OUTPUT CHANNELS                           │
│                                                                  │
│   Email (branded, transactional)   ·   SMS (opt-in, critical)   │
│   Portal Notification (in-app)     ·   Internal Dashboard Feed  │
└──────────────────────────────────────────────────────────────────┘
```

### Dispute Lifecycle & Automation Touchpoints

```
Submitted ──▶ Under Review ──▶ Evidence Requested ──▶ Resolution Proposed ──▶ Closed
     │               │                  │                       │                │
     ▼               ▼                  ▼                       ▼                ▼
 Auto-ACK       Internal         Customer nudge           Resolution         Closure
 to customer    task created     if no upload in          summary sent       survey
                                 48 hrs                   to customer        triggered
```

---

## 6. Core Components

### 6.1 Workflow Engine

The workflow engine is the orchestration core. It listens for events from existing modules and executes configured action sequences.

**Capabilities:**
- **Trigger types:** event-based (e.g., `status_changed`), time-based (e.g., `days_in_status > 2`), and manual (agent-initiated)
- **Action types:** send notification, create internal task, reassign dispute, post to collaboration thread, escalate to manager
- **Visual Rule Builder:** drag-and-drop interface so non-technical operations staff can configure and modify workflows without developer intervention
- **Escalation Logic:** if an SLA threshold is breached and no action is taken within a configured window, the dispute automatically escalates to the next role tier

**Default triggers to ship in Phase 1:**

| Trigger ID | Event | Condition | Action |
|---|---|---|---|
| T-001 | `dispute_created` | Always | Send customer acknowledgement email |
| T-002 | `status_changed` to `awaiting_customer_evidence` | Always | Notify customer; create agent follow-up task |
| T-003 | `days_in_status > 2` where status = `awaiting_customer_evidence` | Recurring daily check | Send customer reminder; alert agent |
| T-004 | `resolution_proposed` | Always | Send resolution summary; request customer acceptance |
| T-005 | `dispute_closed` | Always | Send closure confirmation; trigger CSAT survey |

---

### 6.2 Notification Service

Responsible for rendering and dispatching all outbound customer communications.

**Template Library:**
Templates are version-controlled, brand-approved, and use Handlebars-style variable substitution. All templates must pass through an approval workflow before activation (see Section 8).

Example template — status update:

```
Subject: Update on your dispute #{{dispute_id}}

Hi {{customer_name}},

We wanted to let you know that your dispute regarding {{line_item}} 
has moved to: {{new_status}}.

What happens next: {{next_action}}

Expected resolution by: {{sla_date}}

Track your dispute: {{portal_link}}

If you have questions, reply to this email or contact your account manager.
```

**Channel Router logic:**

| Message Type | Primary Channel | Fallback |
|---|---|---|
| Acknowledgement | Email | Portal notification |
| Status update | Email | Portal notification |
| Evidence reminder | Email + Portal | SMS (if opted in) |
| Resolution summary | Email | Email retry × 2 |
| Critical escalation | SMS | Email |

**Additional controls:**
- Frequency caps: no more than 2 automated messages per dispute per 24-hour window
- Quiet hours: configurable per region (default 08:00–18:00 local time)
- Unsubscribe handling: customers can opt out of non-essential communications; critical updates are always sent

---

### 6.3 Collaboration Hub

A structured workspace for internal team coordination, embedded within each dispute record.

**Features:**
- **Dispute Thread:** chronological, threaded comments attached to the specific dispute — not to a separate inbox
- **@Mentions:** tag any system user to request input or action; tagged user receives an in-app notification and optional email alert
- **Task Assignment:** create actionable tasks with assignee, due date, and priority directly from a thread comment
- **Role-Based Visibility:** each role sees only the fields and notes relevant to their function (see Section 8 for detail)
- **Confidential Notes Flag:** any comment can be marked `[INTERNAL ONLY]`, which permanently excludes it from customer-facing exports, the portal, and compliance dossiers sent externally

---

### 6.4 Audit & Logging Service

Every interaction — automated or manual — is written to an immutable audit log.

**Logged events include:** dispute viewed, field edited, comment posted, notification sent, task created or completed, escalation triggered, configuration changed, export generated.

**Each log entry captures:** event type, user ID, role, timestamp (UTC), IP address, dispute ID, and a before/after snapshot for edits.

**Compliance export:** one-click generation of a complete dispute dossier (PDF or JSON) containing the full interaction timeline, all internal notes (excluding `[INTERNAL ONLY]` flagged content where applicable), and all customer communications. Designed for regulatory review, legal discovery, or internal audit.

---

### 6.5 Integration Adapter Layer

Provides the connection between this automation layer and all existing modules.

- **Protocol:** RESTful APIs with OAuth 2.0 authentication for all module-to-module calls
- **Webhooks:** existing modules can push events to the automation layer without polling
- **Rate limiting:** per-module rate limits prevent any single integration from overloading the system
- **Circuit breaker:** if a downstream module is unavailable, the automation layer queues actions and retries on recovery; operations staff are alerted to any queue backlog exceeding a configurable threshold
- **Webhook support for external systems:** the adapter layer can also push events outward to accounting software, CRMs, or logistics platforms via configured outbound webhooks

---

## 7. Integration Points

| Existing Module | Integration Method | Event Direction | Purpose |
|---|---|---|---|
| **Dispute Intake** | Event listener on `dispute_created` | Intake → Automation | Trigger T-001 acknowledgement to customer |
| **Evidence Capture** | Webhook on `evidence_uploaded` | Evidence → Automation | Notify internal reviewer; update customer when evidence set is complete |
| **Dispute Register** | Bidirectional API (read + write) | Register ↔ Automation | Sync all status changes; write communication log entries back to the register |
| **Resolution Controls** | Function call on `resolution_proposed` | Resolution → Automation | Trigger T-004 resolution summary to customer |
| **Analytics** | Aggregated event stream (write-only from automation) | Automation → Analytics | Feed communication latency, escalation rates, and CSAT correlation data into analytics dashboard |
| **Customer Portal** | Embedded widget + bidirectional API | Portal ↔ Automation | Display real-time status and message history; receive customer replies as new internal tasks |

---

## 8. User Roles & Permissions

| Role | Collaboration Hub Access | Notification Access | Configuration Access |
|---|---|---|---|
| **Support Agent** | View and comment on assigned disputes; @mention teammates; create tasks | Send templated updates; view sent message history for assigned disputes | None |
| **Team Lead** | All disputes within their team; assign tasks; override escalations | Approve custom (non-templated) messages; manage team-level templates | Create and edit basic workflow rules |
| **Operations Manager** | Cross-team visibility; full audit log; export dispute dossiers | Configure escalation paths and SLA thresholds; approve new templates | Full workflow builder; channel configuration |
| **Finance / Legal** | Read-only on cost and liability fields; can view but not create `[INTERNAL ONLY]` notes | View communication log for compliance purposes | None |
| **System Admin** | Full access across all disputes | Full access | Template library management; channel configuration; integration setup; RBAC configuration |

**Approval workflow for templates:** any new or modified template must be submitted by an Operations Manager and approved by a second Operations Manager or System Admin before it becomes active in any channel.

---

## 9. Technical Requirements

### 9.1 Infrastructure

| Component | Requirement |
|---|---|
| Hosting | Cloud-native (AWS or Azure); auto-scaling group to handle peak dispute volume |
| Database — operational | PostgreSQL with row-level security for role-based data isolation |
| Database — audit log | Separate WORM (write-once, read-many) compliant table; no delete or update operations permitted |
| Caching | Redis for template rendering, user preference lookups, and notification queue management |
| Message queue | RabbitMQ or AWS SQS for reliable async delivery of notification jobs |

### 9.2 Security & Compliance

| Requirement | Detail |
|---|---|
| Encryption in transit | TLS 1.3 minimum on all internal and external connections |
| Encryption at rest | AES-256 for all stored data |
| PII handling | Automatic redaction of defined sensitive fields (ID numbers, banking details) before log storage; GDPR and POPIA compliant |
| Access control | Role-based access control (RBAC) enforced at the API layer; MFA mandatory for Team Lead and above |
| Penetration testing | Required before Phase 3 go-live; repeated annually |

### 9.3 Performance SLAs

| Metric | Target |
|---|---|
| Notification dispatch latency | < 30 seconds from trigger event |
| Collaboration Hub update latency | < 2 seconds |
| Audit log write latency | < 5 seconds |
| System uptime | 99.9% (excluding scheduled maintenance windows) |
| Scheduled maintenance window | Maximum 2 hours per month; announced 48 hours in advance |

### 9.4 Accessibility & Standards

- WCAG 2.1 AA compliance for all customer-facing notification templates and portal components
- Screen-reader compatible collaboration hub UI
- All date/time values stored in UTC; displayed in user's local timezone

---

## 10. Implementation Roadmap

### Phase 1 — Foundation (Weeks 1–3)

- [ ] Build Workflow Engine with the 5 default triggers (T-001 through T-005)
- [ ] Implement Notification Service with email channel and 5 starter templates
- [ ] Build Collaboration Hub thread UI with @mentions and task assignment
- [ ] Establish audit logging schema and WORM table
- [ ] Define and document all integration contracts (API specs) for existing modules

### Phase 2 — Integration & Testing (Weeks 4–6)

- [ ] Connect Dispute Register and Customer Portal (bidirectional)
- [ ] Connect Dispute Intake, Evidence Capture, and Resolution Controls (event-driven)
- [ ] Connect Analytics module (event stream)
- [ ] Internal QA and user acceptance testing with support team
- [ ] Load testing at 10× peak dispute volume
- [ ] Security penetration review

### Phase 3 — Launch & Optimisation (Weeks 7–8)

- [ ] Gradual rollout: 10% of disputes → 50% → 100%
- [ ] Monitor escalation rates, notification latency, and CSAT daily
- [ ] Tune escalation rules and frequency caps based on observed behaviour
- [ ] Train super-users; publish SOPs and admin documentation
- [ ] Collect structured feedback for Phase 4 backlog

### Phase 4 — Enhancements (Post-Launch, prioritised by feedback)

- [ ] SMS channel integration as primary channel option
- [ ] AI-suggested response drafts (opt-in; human approval required before send)
- [ ] Sentiment analysis on customer portal replies
- [ ] Mobile app push notifications
- [ ] Multi-language template support

---

## 11. Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | **Over-automation** — customers receive too many messages and disengage | Medium | High | Implement frequency caps from day one; A/B test message timing; include one-click opt-down in every email |
| R2 | **Integration failure** — an existing module's API is unavailable | Low | High | Circuit breaker pattern with automatic retry queue; fallback to manual notification queue with agent alert |
| R3 | **Template errors** — incorrect or misleading content sent to customers | Low | High | Version-controlled templates with mandatory two-person approval; staging environment preview before activation |
| R4 | **Data leakage** — `[INTERNAL ONLY]` notes included in customer export | Low | Critical | Field-level permission enforcement at API layer; automated PII scan before any outbound send or export; integration test suite covering this case |
| R5 | **Adoption resistance** — staff continue using email/phone instead of the hub | Medium | Medium | Co-design sessions with support team before build; demonstrate time savings with pilot data; leadership mandate after Phase 3 launch |
| R6 | **Scope creep** — Phase 1 delayed by requests to include Phase 4 features | Medium | Medium | This document defines Phase 1 scope as fixed; all additions go through the formal change request process |

---

## 12. Open Questions

The following items require a decision before Phase 2 integration work begins:

| # | Question | Owner | Required By |
|---|---|---|---|
| Q1 | Which cloud provider — AWS or Azure? This affects infrastructure tooling choices. | CTO | Week 1 |
| Q2 | What is the opt-in mechanism for SMS? Does this require legal review of consent language? | Legal / Ops Manager | Week 2 |
| Q3 | Should `[INTERNAL ONLY]` notes be visible to System Admins in compliance exports? | Legal | Week 2 |
| Q4 | Who owns the template approval workflow — Ops Manager or a dedicated comms role? | Operations | Week 1 |
| Q5 | What is the maximum retention period for audit log data under POPIA? | Legal | Week 3 |

---

## 13. Appendix

### A. Sample Automation Rule (YAML)

```yaml
rule_id: T-003
name: "Evidence Request Follow-up"
description: >
  If a dispute has been awaiting customer evidence for more than 2 days,
  send a reminder to the customer and create an agent follow-up task.
trigger:
  event: "days_in_status_exceeded"
  conditions:
    - field: "status"
      operator: "equals"
      value: "awaiting_customer_evidence"
    - field: "days_in_status"
      operator: "greater_than"
      value: 2
actions:
  - type: "send_notification"
    channel: "email"
    template: "evidence_reminder_v2"
    recipient: "customer_primary"
  - type: "create_internal_task"
    assignee: "original_agent"
    due_in_hours: 24
    description: "Follow up call if customer has not uploaded evidence"
escalation:
  if_no_action_in_hours: 48
  then: "reassign_to_team_lead"
  alert: "operations_manager"
```

---

### B. Template Variable Reference

| Variable | Source Module | Example Value |
|---|---|---|
| `{{customer_name}}` | Dispute Intake | `Thandiwe M.` |
| `{{dispute_id}}` | Dispute Register | `DSP-2026-0842` |
| `{{line_item}}` | Evidence Capture | `Baby Marrow Delivery #BM-441` |
| `{{new_status}}` | Dispute Register | `Under Financial Review` |
| `{{next_action}}` | Workflow Engine | `Awaiting credit note approval` |
| `{{sla_date}}` | Dispute Register | `5 April 2026` |
| `{{portal_link}}` | Customer Portal | `https://portal.example.com/dsp/0842` |
| `{{agent_name}}` | User Management | `Sipho K.` |
| `{{channel_name}}` | Notification Service | `Email` |

---

### C. Notification Frequency Cap Logic

```
Per dispute, per 24-hour window:
  - Maximum 2 automated customer-facing messages
  - No limit on internal collaboration updates
  - Critical escalations (R-level priority) bypass the cap
  - Quiet hours (configurable, default 18:00–08:00 local): queue and send at 08:00
```

---

### D. Compliance Export — Dossier Contents

When an Operations Manager or System Admin generates a dispute dossier, it includes:

1. Dispute summary (ID, dates, parties, current status)
2. Full status change history with timestamps and responsible user
3. All outbound customer communications (subject, channel, timestamp, delivery status)
4. All inbound customer responses received via the portal
5. Internal collaboration thread — excluding `[INTERNAL ONLY]` flagged entries (unless explicitly requested by Legal with appropriate justification logged)
6. All tasks created, assigned, and completed, with timestamps
7. Escalation events and outcomes

---

## Approvals

| Role | Name | Signature | Date |
|---|---|---|---|
| Prepared By | | | |
| Reviewed By (Operations) | | | |
| Reviewed By (Technology) | | | |
| Reviewed By (Legal / Compliance) | | | |
| Approved By (Leadership) | | | |

---

*This is a living document. Schedule a review after each phase completion and at minimum once per quarter. All changes must be version-controlled and re-approved by the relevant signatories.*
