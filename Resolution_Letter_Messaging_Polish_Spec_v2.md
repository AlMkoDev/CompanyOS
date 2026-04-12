# Resolution-Letter Generation & Customer Milestone Messaging Polish
### Dispute Management System — Module B Specification

| Field | Detail |
|---|---|
| **Document Version** | 2.0 |
| **Status** | Draft — Pending Review |
| **Date** | March 29, 2026 |
| **Owner** | Customer Experience & Legal Compliance Team |
| **Classification** | Internal Use Only |
| **Predecessor** | Internal Collaboration & Customer Update Automation Layer (v2.0) |
| **Replaces** | Module B v1.0 (informal draft) |

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

The Internal Collaboration & Automation Layer (Module A) established the *infrastructure* for timely, triggered customer communication and structured internal team coordination. Module B — the **Resolution-Letter Generation & Customer Milestone Messaging Polish** layer — addresses what that infrastructure delivers: the quality, legal soundness, and human clarity of every outbound message and every formal resolution document.

This module focuses on the "last mile" of the dispute lifecycle. It replaces bare status strings with context-rich, empathetic messaging; generates legally vetted, branded PDF resolution letters automatically on dispute closure; restructures the customer portal timeline into a readable, threaded history; and introduces a formal closure acceptance flow to prevent disputes from being incorrectly reopened.

**Strategic value:**

- **Brand Trust** — Professional, consistent communication reduces escalations and customer churn
- **Legal Compliance** — Standardised, auditable resolution letters reduce liability exposure
- **Customer Clarity** — Contextual milestone messages reduce "where is my dispute?" support tickets
- **Closure Integrity** — Formal acceptance workflows create an auditable record and reduce erroneous reopening

---

## 2. Problem Statement

Module A ensures that customers are notified promptly when something changes. It does not control what those notifications say, how formally a dispute is closed, or how a customer makes sense of their history in the portal.

Three specific gaps remain:

**Gap 1 — No formal resolution documentation.** When a dispute is closed, no official document is generated. Customers receive a generic status update; there is no PDF record, no reference to applicable consumer protection legislation, and no legally defensible record of the terms under which the dispute was resolved.

**Gap 2 — Status labels, not explanations.** Customers see raw system states such as "Awaiting Finance" or "Under Review" with no context about what those states mean, how long they typically last, or what action, if any, is expected from them. This generates avoidable inbound support contact.

**Gap 3 — No structured closure process.** For disputes resolved via settlement or waiver, there is no mechanism to obtain and record explicit customer acceptance. Without this, disputes can be reopened based on misunderstanding, and the company has no documented evidence of the customer's agreement to the resolution terms.

---

## 3. Objectives & Success Metrics

### Primary Objectives

| # | Objective | Definition of Done | Target Metric |
|---|---|---|---|
| O1 | Auto-generate resolution letters | A legally vetted, branded PDF letter is generated for every dispute closure without manual intervention | 100% of closed disputes have a generated letter within 5 minutes of closure event |
| O2 | Enrich milestone messaging | Every status update includes a plain-language explanation and a "what happens next" statement | Support tickets related to status confusion reduced by ≥30% within 60 days of launch |
| O3 | Restructure portal history | The customer portal timeline presents events in threaded, grouped cards rather than a raw chronological log | Customer Portal NPS increases by ≥15 points within 90 days of launch |
| O4 | Formalise dispute closure | Customers explicitly acknowledge settlement resolutions via a digital acceptance flow | Dispute reopen rate for settled cases reduced to <5% |

### Secondary Objectives

- Support dynamic branding (logo, colour palette, signatory) per business unit in resolution letters
- Enable "Plain Language" summaries alongside legal clause text in all letters
- Allow customers to self-serve download of their full dispute dossier (PDF) from the portal
- Template architecture ready for multi-language support (Phase 4)

### Out of Scope (v1)

- Multi-language resolution letters
- AI-generated tone suggestions
- Integration with third-party e-signature platforms (DocuSign, etc.)
- Automated reopen request workflow (Phase 4)

---

## 4. Scope

### In Scope

This specification covers the design and build of:

- **Resolution Letter Engine** — dynamic PDF generation, clause library, plain-language summary, digital signature stamping, and version control
- **Message Polish Service** — context injection for status updates, tone configuration, and action-oriented message structure
- **Portal History Presentation** — threaded timeline grouping, visibility filtering, document hub, and in-portal search
- **Closure & Acceptance Flow** — explicit acceptance for settlements, cooling-off period enforcement, post-acceptance survey, and closure receipt

### Boundaries

This module does not replace any component of Module A. It consumes events generated by Module A and the existing dispute modules via defined integration points. All existing module behaviour remains unchanged. The Letter Engine does not alter the Dispute Register directly; it writes a `letter_generated` event that the Dispute Register consumes.

---

## 5. System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│             MODULE A — Automation & Collaboration Layer          │
│        (triggers: resolution_proposed · dispute_closed)          │
└───────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│        MODULE B — Resolution & Messaging Polish (this spec)      │
│                                                                  │
│  ┌──────────────────────┐      ┌──────────────────────────┐     │
│  │  Resolution Letter   │      │   Message Polish Service │     │
│  │  Engine              │      │                          │     │
│  │  · PDF Generation    │      │  · Context Injector      │     │
│  │  · Clause Library    │      │  · Tone Profiles         │     │
│  │  · Plain Language    │      │  · Action Orientation    │     │
│  │  · Digital Signature │      └──────────────────────────┘     │
│  │  · Version Control   │                                       │
│  └──────────┬───────────┘                                       │
│             │                                                    │
│             ▼                                                    │
│  ┌──────────────────────┐      ┌──────────────────────────┐     │
│  │  Portal History      │      │   Closure & Acceptance   │     │
│  │  Presentation        │      │   Flow                   │     │
│  │  · Threaded Timeline │      │  · Explicit Acceptance   │     │
│  │  · Visibility Badges │      │  · Cooling-Off Period    │     │
│  │  · Document Hub      │      │  · Post-Acceptance Survey│     │
│  │  · In-Portal Search  │      │  · Closure Receipt       │     │
│  └──────────┬───────────┘      └──────────┬───────────────┘     │
│             │                             │                     │
└─────────────┼─────────────────────────────┼─────────────────────┘
              │                             │
              ▼                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                        CUSTOMER OUTPUT                           │
│                                                                  │
│  Formal Resolution Letter (PDF)   ·   Contextual Email / SMS    │
│  Portal Timeline (Threaded)       ·   Digital Acceptance Receipt │
└──────────────────────────────────────────────────────────────────┘
```

### Dispute Lifecycle — Module B Touchpoints

```
Resolution Proposed ──▶ Letter Draft Generated ──▶ Team Lead Approval
         │                                                 │
         │                                                 ▼
         │                                        Letter Sent to Customer
         │                                                 │
         ▼                                                 ▼
  Milestone Update                             Customer Accepts / Rejects
  (Context-Enriched)                                       │
         │                               ┌─────────────────┴──────────────┐
         ▼                               ▼                                ▼
  Portal Timeline                   Accepted                          Rejected
  Updated (Threaded)          14-day lock applied              Dispute escalated
                              Closure receipt sent             to Team Lead
                              CSAT survey triggered
```

---

## 6. Core Components

### 6.1 Resolution Letter Engine

Automatically generates a formal, print-ready PDF upon the `dispute_closed` event. Every letter is stored immutably and linked to the dispute record.

**PDF Generation:**
- Server-side rendering (Puppeteer or equivalent) for pixel-perfect, consistent output across all environments
- Branded header: logo, colour palette, and signatory name configurable per business unit
- Generated within 10 seconds of the closure event; cached thereafter to prevent redundant regeneration

**Clause Library:**
Modular legal clauses inserted based on dispute type. Each clause is maintained in a version-controlled library and requires Legal/Compliance sign-off before activation.

| Clause ID | Dispute Resolution Type | Trigger Condition |
|---|---|---|
| `REFUND_STD_04` | Full refund issued | `resolution_type = "full_refund"` |
| `CREDIT_PARTIAL_02` | Partial service credit applied | `resolution_type = "partial_credit"` |
| `NO_ACTION_01` | Dispute not upheld | `resolution_type = "rejected"` |
| `SETTLEMENT_WAIVER_03` | Final settlement with waiver | `resolution_type = "settlement"` |
| `GOODWILL_01` | Goodwill gesture (no admission) | `resolution_type = "goodwill"` |

**Plain Language Summary:**
A mandatory section at the top of every letter, written in under 100 words, explaining the outcome in plain terms before any legal clause text appears. Derived directly from the applicable clause to prevent contradiction.

**Digital Signature Stamping:**
Authorised signatory is auto-applied based on the dispute's resolution value:

| Resolution Value | Required Signatory |
|---|---|
| < R5,000 | Senior Support Agent |
| R5,000 – R50,000 | Operations Manager |
| > R50,000 | Head of Disputes |

**Version Control:**
Every generated letter is stamped with a template version ID (e.g., `v2.1_legal`) and stored immutably. If a correction is required after issue, a new letter version must be generated and approved; the original cannot be altered.

---

### 6.2 Message Polish Service

Transforms raw system state labels into context-rich, human-readable milestone messages before they are dispatched through Module A's Notification Service.

**Context Injection:**
A mapping layer converts internal state strings into customer-appropriate explanations.

| System State | Raw Label | Polished Message |
|---|---|---|
| `awaiting_finance` | "Awaiting Finance" | "We're finalising the credit note with our finance team. This usually takes 24 hours. No action is needed from you." |
| `under_review` | "Under Review" | "Our disputes team is reviewing the information submitted. We aim to update you within 2 business days." |
| `evidence_requested` | "Evidence Requested" | "We need one more document from you to proceed. Please check the portal for details and upload when ready." |
| `resolution_proposed` | "Resolution Proposed" | "We've reached a resolution on your dispute. Please review the details below and let us know if you accept." |

**Tone Profiles:**
Configurable per dispute severity. Defaults applied automatically; Team Leads can override.

| Profile | When Applied | Characteristics |
|---|---|---|
| Empathetic | High-value disputes; long-running disputes (>14 days) | Acknowledges inconvenience; warmer language; proactive reassurance |
| Formal | Legal/compliance-sensitive disputes; settlement closures | Precise language; references applicable legislation; measured tone |
| Direct | Low-value, simple disputes | Concise; outcome-first; minimal narrative |

**Action Orientation:**
Every message generated by this service must close with one of two statements — either a clearly worded "what happens next" or an explicit "no action required from you." Messages that end on a passive or ambiguous note are rejected by validation before dispatch.

---

### 6.3 Portal History Presentation

Restructures the customer-facing portal timeline from a raw chronological event log into a grouped, readable, searchable history.

**Threaded Timeline:**
Related events within a configurable time window are grouped into a single expandable card. This prevents the timeline from becoming a wall of low-signal entries.

Example grouping:
```
▶ Evidence Submitted  [April 1, 2026]
   └── You uploaded 3 files (expand to view)
   └── Our team has been notified and will review within 24 hours
```

**Visibility Filtering:**
- All events are tagged as either `customer_visible` or `internal_only` at the point of creation (inherited from Module A's collaboration hub)
- `internal_only` events are completely hidden from the customer view — not greyed out, not labelled, simply absent
- Agents and above see a toggle to view both layers simultaneously

**Document Hub:**
A dedicated section within the portal timeline that surfaces all downloadable artifacts associated with the dispute, including resolution letters, closure receipts, and any evidence files the customer submitted. Download links use pre-signed URLs with a 30-day expiry; the document itself is stored permanently.

**In-Portal Search:**
Customers can search their own dispute timeline by keyword (e.g., "refund", "credit", "evidence"). Results highlight matching cards without leaving the timeline view.

---

### 6.4 Closure & Acceptance Flow

Governs the formal end-state of a dispute, with particular attention to settlement cases where customer acknowledgement has legal significance.

**Explicit Acceptance:**
For disputes resolved via settlement or waiver (`resolution_type = "settlement"`), customers must complete a digital acceptance step before the case is locked:
- Checkbox: "I accept this resolution and confirm no further claims will be made regarding this incident"
- Date-stamped and stored immutably against the dispute record
- Acceptance constitutes a binding record for compliance and legal purposes

For standard closures (refund, credit, rejection), acceptance is optional but offered — customers can acknowledge receipt without it being mandatory.

**Cooling-Off Period:**
After a dispute is closed, a 14-day lock is applied. During this period, the customer cannot self-serve reopen the dispute. A "Reopen Request" button is available but routes to a manager review queue rather than reopening the case directly. After 14 days, self-serve reopen is permitted once; a second reopen request always requires manager approval.

**Post-Acceptance Survey:**
A single-question micro-survey is presented immediately after acceptance or closure acknowledgement:

> *"On a scale of 1–5, how fairly do you feel your dispute was handled?"*

Response is optional, anonymous, and feeds directly into the Analytics module. No follow-up action is triggered by the rating; the data is aggregated for reporting only.

**Closure Receipt:**
An automated email is sent within 2 minutes of closure confirmation containing the case reference number, resolution type, and a link to download the formal resolution letter. This is the permanent record the customer retains.

---

## 7. Integration Points

| Module | Integration Method | Event Direction | Purpose |
|---|---|---|---|
| **Module A — Automation Layer** | Event listener on `resolution_proposed` and `dispute_closed` | Automation → Letter Engine | Trigger letter draft generation and closure flow |
| **Collaboration Hub** | Read API on internal notes (filtered) | Hub → Letter Engine | Extract decision rationale for plain-language summary; PII-scrubbed before use |
| **Dispute Register** | Write API on `letter_generated` and `closure_accepted` events | Module B → Register | Update record status; store letter reference ID |
| **Evidence Capture** | Read API on final evidence set | Evidence → Letter Engine | Reference submitted evidence in resolution letter (filenames and dates only; not re-embedded) |
| **Customer Portal** | UI component replacement + read API | Module B → Portal | Render threaded timeline; expose document hub; present acceptance flow |
| **Analytics** | Write event stream | Module B → Analytics | Feed acceptance rates, time-to-accept, survey scores, and letter download rates |

---

## 8. User Roles & Permissions

| Role | Letter Engine Access | Message Polish Config | Portal History View | Closure Override |
|---|---|---|---|---|
| **Support Agent** | Trigger draft; edit plain-language summary only | None | Full view (both layers visible via toggle) | None |
| **Team Lead** | Approve and send final letter; reject draft with comments | Edit tone profile per dispute | Full view | Reopen a closed dispute within 7 days |
| **Legal / Compliance** | Audit clause library; flag clauses for review; cannot edit live clauses | Approve legal text changes | Audit view (full history including internal) | None |
| **Operations Manager** | Manage clause library; approve template changes; view all letters | Configure default tone rules; manage context injection mappings | Full view | Force-close a disputed reopen request |
| **Customer** | Download their own final resolution letter | Receive polished messages via email/portal | Customer view only (internal events hidden) | Accept or reject proposed resolution |
| **System Admin** | Full template management; version control administration | Full configuration access | Debug view (all layers, all metadata) | Force-close; force-reopen (with logged justification) |

---

## 9. Technical Requirements

### 9.1 Infrastructure

| Component | Requirement |
|---|---|
| PDF Engine | Server-side rendering via Puppeteer (Node.js) or wkhtmltopdf; containerised for horizontal scaling |
| Document Storage | AWS S3 or Azure Blob Storage with server-side encryption; pre-signed URLs for customer downloads (30-day expiry); permanent retention for compliance |
| Caching | Rendered PDF cached on first generation; cache invalidated only if a new version is explicitly issued |
| Message queue | Inherits Module A's queue infrastructure; Letter Engine subscribes to `dispute_closed` events |

### 9.2 Security & Compliance

| Requirement | Detail |
|---|---|
| Letter immutability | Once a resolution letter is sent, the stored document cannot be altered or deleted. Corrections require issuance of a new versioned letter with an amendment notice |
| PII scrubbing | Internal notes pulled into the letter engine are passed through an automated PII filter (staff names, internal IDs, cost figures not intended for disclosure) before use in any customer-facing output |
| Acceptance records | Digital acceptance records are stored in the WORM audit table (inherited from Module A) with timestamp, user ID, IP address, and full acceptance text at time of signing |
| Encryption | TLS 1.3 in transit; AES-256 at rest; pre-signed download URLs scoped to authenticated customer session only |
| Accessibility | All generated PDFs must be tagged for screen reader compatibility; portal timeline components must meet WCAG 2.1 AA |

### 9.3 Performance SLAs

| Metric | Target |
|---|---|
| Letter generation time | < 10 seconds from `dispute_closed` event |
| Portal timeline load | < 1.5 seconds |
| Closure acceptance processing | < 2 seconds |
| Closure receipt email dispatch | < 2 minutes from closure confirmation |
| Document download link generation | < 1 second |

### 9.4 Localisation Readiness

- All template text stored as i18n key-value pairs from day one — English values only in v1, but the architecture supports additional languages without structural changes
- UTF-8 encoding enforced across all generated documents and portal components
- Date and currency formatting driven by locale settings on the dispute record (default: `en-ZA`)

---

## 10. Implementation Roadmap

### Phase 1 — Letter Engine Core (Weeks 1–3)

- [ ] Build PDF generation pipeline with base template (header, plain-language section, clause block, signature, footer)
- [ ] Implement clause library with 5 initial clause types (Refund, Partial Credit, Rejected, Settlement, Goodwill)
- [ ] Implement digital signature stamping with value-threshold routing
- [ ] Connect Letter Engine to `dispute_closed` event from Module A
- [ ] Store generated letters in document storage; write `letter_generated` event to Dispute Register
- [ ] Legal review of all 5 initial clause texts

### Phase 2 — Message Polish & Portal Timeline (Weeks 4–6)

- [ ] Build Context Injector mapping layer for the 8 most common system states
- [ ] Implement tone profile selection logic (Empathetic / Formal / Direct)
- [ ] Validate action-orientation rule on all outbound messages before dispatch
- [ ] Redesign portal timeline component (threaded grouping, visibility toggle, document hub)
- [ ] Implement in-portal keyword search
- [ ] User testing with 5 customers and 3 support agents on message clarity and portal usability

### Phase 3 — Closure Flow & Compliance (Weeks 7–8)

- [ ] Build explicit acceptance flow for settlement resolutions
- [ ] Implement 14-day cooling-off period lock and reopen request routing
- [ ] Implement post-acceptance micro-survey and Analytics integration
- [ ] Generate and dispatch closure receipt email
- [ ] Legal review of acceptance wording for all closure types
- [ ] Full integration testing across all 6 existing modules + Module A

### Phase 4 — Optimisation (Post-Launch)

- [ ] A/B test tone profiles against CSAT outcomes; auto-select winning profile per dispute type
- [ ] Multi-language resolution letter support (starting with Zulu and Afrikaans)
- [ ] Automate reopen request workflow (routing, SLA, notification)
- [ ] Business unit branding self-service configuration panel

---

## 11. Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | **Legal liability from letter wording** — incorrect or ambiguous clause language creates grounds for dispute escalation or lawsuit | Low | Critical | All clause templates require Legal/Compliance sign-off before activation; version control enforced; no live edits permitted |
| R2 | **Plain language contradicts legal text** — simplified summary misrepresents the legal clause it summarises | Low | High | Plain summaries must be derived directly from the corresponding clause; reviewed as a pair during legal sign-off; flagged in QA testing |
| R3 | **Portal timeline clutter** — grouping logic fails or is misconfigured, producing a wall of unrelated events in a single card | Medium | Medium | Grouping rules unit-tested with edge case data; max 5 events per card enforced; QA sign-off on timeline component before Phase 2 launch |
| R4 | **Acceptance friction** — customers refuse or delay clicking "Accept" on settlement cases, stalling resolution | Medium | Medium | Acceptance is mandatory only for settlement/waiver resolutions; a 7-day reminder sequence is triggered if no response; after 14 days, Operations Manager is alerted to pursue direct contact |
| R5 | **PDF delivery failure** — customer cannot retrieve the resolution letter | Low | High | Email attachment fallback on letter dispatch failure; permanent portal storage as secondary access point; pre-signed URL regeneration available to support agents |
| R6 | **PII leakage into letters** — internal notes pulled into the Letter Engine contain staff-sensitive or confidential cost data | Low | Critical | Automated PII filter on all internal note content before Letter Engine ingestion; filter coverage tested against known sensitive field patterns; manual review step for letters above R50,000 |

---

## 12. Open Questions

The following require a decision before Phase 2 begins:

| # | Question | Owner | Required By |
|---|---|---|---|
| Q1 | Which PDF engine — Puppeteer (Node.js) or wkhtmltopdf? Affects infrastructure team and container sizing. | CTO / Tech Lead | Week 1 |
| Q2 | What is the legally required retention period for signed acceptance records under POPIA? | Legal | Week 2 |
| Q3 | Should the plain-language summary be authored by the Letter Engine automatically or reviewed by a Support Agent before dispatch for high-value disputes? | Ops Manager + Legal | Week 2 |
| Q4 | Is the 14-day cooling-off period aligned with any statutory obligation, or is it an internal policy decision that can be adjusted? | Legal | Week 1 |
| Q5 | Which business units require distinct branding in Phase 1, and who owns brand asset approval for each? | Marketing / BU Leads | Week 3 |
| Q6 | Should the post-acceptance survey response be visible to the assigned agent, or aggregated only at the team level? | Ops Manager | Week 3 |

---

## 13. Appendix

### A. Resolution Letter JSON Schema

Defines the structure passed to the PDF rendering engine.

```json
{
  "letter_id": "LTR-2026-0842",
  "dispute_id": "DSP-2026-0842",
  "template_version": "v2.1_legal",
  "generated_at": "2026-04-01T09:14:22Z",
  "business_unit": "Fresh Produce Division",
  "signatory": {
    "name": "Sipho Khumalo",
    "title": "Head of Disputes",
    "signature_asset_id": "SIG-SK-001"
  },
  "sections": [
    {
      "type": "header",
      "content": "Official Dispute Resolution — Case #DSP-2026-0842"
    },
    {
      "type": "plain_summary",
      "content": "We reviewed your dispute regarding Baby Marrow Delivery #BM-441. We found that an error occurred on our side and have issued a full refund of R320.00. No action is needed from you."
    },
    {
      "type": "legal_clause",
      "clause_id": "REFUND_STD_04",
      "clause_version": "v3.0",
      "content": "Pursuant to Section 54 of the Consumer Protection Act 68 of 2008, you are entitled to a full refund where goods delivered did not conform to the agreed specification..."
    },
    {
      "type": "next_steps",
      "content": "Funds will appear in your account within 3–5 business days. Your case reference is DSP-2026-0842."
    },
    {
      "type": "signature",
      "signatory_name": "Sipho Khumalo",
      "title": "Head of Disputes",
      "date": "2026-04-01"
    }
  ]
}
```

---

### B. Portal Timeline Grouping Logic (YAML)

```yaml
grouping_rule_id: GRP-001
name: "Evidence Submission Window"
trigger_event: "evidence_uploaded"
grouping_window_hours: 4
max_events_per_card: 5

behaviour:
  multiple_uploads_in_window:
    display: "You submitted {n} files"
    expandable: true
    show_file_list_on_expand: true

  internal_note_in_window:
    visibility: "internal_only"
    customer_display: hidden

  status_change_in_window:
    behaviour: "start_new_card_group"
    carry_forward_context: false

overflow:
  if_events_exceed_max: "collapse_oldest_into_summary_card"
  summary_label: "Earlier activity in this group ({n} items)"
```

---

### C. Context Injector — Full Mapping (v1)

| System State | Customer-Facing Message | Tone Override |
|---|---|---|
| `dispute_created` | "We've received your dispute and assigned it reference #{{dispute_id}}. You'll hear from us within 2 business days." | None |
| `under_review` | "Our team is reviewing your submission. We aim to update you within 2 business days. No action is needed from you." | None |
| `awaiting_customer_evidence` | "We need one document to continue. Please check the portal for details and upload at your earliest convenience." | Empathetic |
| `awaiting_finance` | "We're finalising the financial details internally. This usually takes up to 24 hours. No action needed." | None |
| `resolution_proposed` | "We've reached a resolution. Please review the details in your portal and let us know if you accept." | Formal |
| `awaiting_acceptance` | "Your resolution is waiting for your confirmation. Please log in to accept or raise any concerns." | Direct |
| `closed_accepted` | "Your dispute is now closed. A formal resolution letter has been sent to your email for your records." | None |
| `closed_rejected` | "We understand you may be disappointed with this outcome. If you'd like to discuss further, please contact your account manager." | Empathetic |

---

### D. Closure Acceptance Wording

**Standard Closure (Acceptance Optional):**

> *"Your case has been resolved. We hope this outcome meets your expectations. Your reference number is #DSP-2026-0842. A formal resolution letter has been emailed to you."*
>
> `[ Acknowledge & Close ]` ← optional; case closes automatically after 14 days if no response

---

**Settlement Closure (Acceptance Mandatory):**

> *"This resolution includes a final settlement. Please read the resolution letter in full before accepting.*
>
> *By clicking 'Accept', you confirm that this resolves the matter in full and that no further claims will be made regarding this incident.*
>
> `[ ] I have read the resolution letter and accept this settlement`
>
> `[ Accept Resolution ]` ← disabled until checkbox is ticked

---

**Rejection Closure (No Acceptance Required):**

> *"We reviewed your dispute and were unable to uphold it on this occasion. A formal letter explaining our decision has been sent to your email. If you believe there are grounds to reconsider, please contact your account manager within 14 days."*

---

## Approvals

| Role | Name | Signature | Date |
|---|---|---|---|
| Prepared By | | | |
| Reviewed By (Customer Experience) | | | |
| Reviewed By (Legal / Compliance) | | | |
| Reviewed By (Technology) | | | |
| Approved By (Leadership) | | | |

---

*This is a living document. Review after each phase completion, after any legal clause update, and at minimum once per quarter. All changes must increment the version number and be re-approved by the relevant signatories.*
