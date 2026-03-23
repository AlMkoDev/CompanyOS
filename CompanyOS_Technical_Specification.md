            
**CompanyOS**  
Virtual Company Operating System

**FULL TECHNICAL SPECIFICATION**  
*SaaS Platform Architecture · Database Design · API Blueprint · RBAC Model · MVP Roadmap*

| Document Type Technical Specification | Version 1.0 — MVP | Classification Confidential |
| :---- | :---- | :---- |

*2026 · Prepared for Engineering Team & Investors*

# **Table of Contents**

**1\. Executive Summary**

CompanyOS is a next-generation SaaS platform that allows entrepreneurs and organizations to digitally construct, configure, and operate a fully functioning virtual representation of their company. The platform bridges the gap between physical corporate infrastructure and its digital equivalent — acting as an operating system for the entire organization.

*Rather than managing disconnected tools for tasks, documents, HR, finance, and operations, CompanyOS centralizes these inside a structured, department-based virtual corporate environment. Each company is guided through a setup wizard to construct its organizational identity, department architecture, role hierarchy, and operational workflows — before entering a fully functional operations environment.*

## **1.1 Problem Statement**

Modern organizations struggle with:

* Fragmented tooling — project management, HR, finance, and documents spread across 10+ disconnected platforms

* No structured digital representation of their organizational hierarchy

* Poor RBAC implementation leading to data leakage and compliance failures

* Time-consuming onboarding of new hires to understand the company structure

* Difficulty scaling digital operations across departments in a unified way

## **1.2 Value Proposition**

| *CompanyOS is the world's first platform to model the company structure itself — not just the tasks within it. Users experience their organization as a navigable digital building with departments, roles, and operational workflows exactly mirroring the physical corporate world.* |
| :---- |

## **1.3 Target Market**

| Segment | Description | Priority |
| :---- | :---- | :---- |
| SMEs (10–200 employees) | Businesses needing structured digital ops without enterprise cost | Primary |
| Startups | Founders building company infrastructure from scratch | Primary |
| Enterprises | Large orgs digitizing existing structures | Secondary |
| Consultants / Agencies | Multi-client management environments | Tertiary |

## **1.4 Success Criteria**

* Administrator completes full company setup in under 60 minutes via guided wizard

* Zero unauthorized access to Setup Mode — all structural changes logged immutably

* RBAC system supports minimum 5 permission levels with inheritance

* Department dashboards load operational data in under 2 seconds

* Platform supports minimum 100 concurrent users across 20 departments without degradation

**2\. Product Vision & User Personas**

## **2.1 Product Concept**

CompanyOS operates in two distinct modes that together deliver a complete corporate digital lifecycle:

| Mode | Name | Access Level | Purpose |
| :---- | :---- | :---- | :---- |
| Mode 1 | Company Architecture Mode | Super Administrator Only | Design and construct the company structure using guided wizards |
| Mode 2 | Operations Mode | All Authorized Users | Perform daily business activities within the constructed structure |

## **2.2 User Personas**

**1\. Founder / Super Administrator**

Has exclusive access to Mode 1\. Constructs the entire company structure, configures departments, roles, and RBAC settings. Primary decision-maker for the digital organizational architecture.

**2\. CEO / Executive**

Cross-functional visibility in Mode 2\. Views all departments, approves workflows, monitors KPIs and analytics. Uses the Corporate Landing Page as primary operational hub.

**3\. Department Head / Manager**

Manages their assigned department in Mode 2\. Creates tasks, manages team members, monitors departmental KPIs, and generates reports.

**4\. Employee / Contributor**

Assigned to one or more departments. Performs daily operational work — updating tasks, collaborating on documents, submitting records — within their permission scope.

**5\. External Consultant / Guest**

Read-only or limited contributor access to specific departments. Cannot access Setup Mode or administration panels.

**3\. System Architecture**

## **3.1 Architecture Overview**

CompanyOS is built as a Modular Monolith for the MVP phase, transitioning to microservices as scale demands. This approach prioritizes development velocity and cohesion during early growth while preserving the structural foundation for future decomposition.

| *Architecture Decision: Modular Monolith is chosen over microservices for MVP. Microservices introduce premature DevOps complexity. The modular design allows later extraction of services without major refactoring.* |
| :---- |

## **3.2 High-Level Layer Diagram**

| ┌─────────────────────────────────────────────────────────┐ │                     USER LAYER                          │ │         Browser / Mobile Web Application                │ └───────────────────────────┬─────────────────────────────┘                             │ HTTPS ┌───────────────────────────▼─────────────────────────────┐ │                   CDN / EDGE LAYER                      │ │            Static Assets · API Rate Limiting            │ └───────────────────────────┬─────────────────────────────┘                             │ ┌───────────────────────────▼─────────────────────────────┐ │               FRONTEND APPLICATION                      │ │           Next.js (App Router) · Tailwind               │ └───────────────────────────┬─────────────────────────────┘                             │ REST / GraphQL ┌───────────────────────────▼─────────────────────────────┐ │                API GATEWAY / BACKEND                    │ │                    NestJS (TypeScript)                  │ ├──────────┬──────────┬──────────┬──────────┬────────────┤ │  Auth    │  Company │   Dept   │   RBAC   │  Workflow  │ │  Module  │  Module  │  Module  │  Module  │  Module    │ └──────────┴──────────┴──────────┴──────────┴────────────┘                             │ ┌───────────────────────────▼─────────────────────────────┐ │                   DATA LAYER                            │ │     PostgreSQL (Primary)  ·  Redis (Cache/Queue)        │ │             Object Storage (Documents/Media)            │ └─────────────────────────────────────────────────────────┘ |
| :---- |

## **3.3 Backend Module Architecture**

| Module | Responsibility | Key Dependencies |
| :---- | :---- | :---- |
| Auth Module | Login, JWT issuance, OAuth, session management, MFA | Passport.js, JWT, bcrypt |
| Tenant Module | Multi-company isolation, tenant context injection | PostgreSQL, Request scoping |
| Company Module | Company identity CRUD, setup wizard tracking | Tenant Module |
| Department Module | Dept creation, config, dashboard data | Company Module, RBAC Module |
| User Module | User CRUD, profile management, department membership | Auth, RBAC, Department |
| RBAC Module | Roles, permissions, access guards, inheritance | All modules |
| Workflow Module | Workflow engine, task orchestration, automation rules | Task, Notification |
| Task Module | Task CRUD, assignment, status tracking, due dates | Workflow, Department |
| Document Module | Upload, version control, folder structure per department | Storage, Department |
| Analytics Module | KPI computation, reporting, dashboard metrics | All data modules |
| Notification Module | In-app, email, push notifications for events | BullMQ, SendGrid |
| Audit Module | Immutable activity logs, compliance trails | All modules (middleware) |

## **3.4 Frontend Architecture**

| frontend/ ├── app/                    \# Next.js App Router pages │   ├── (auth)/             \# Login, Register, MFA │   ├── (setup)/            \# Company Architecture Mode wizard │   │   ├── identity/       \# Step 1: Company Identity │   │   ├── departments/    \# Step 2: Department Selection │   │   ├── configure/      \# Step 3: Department Configuration │   │   ├── org-chart/      \# Step 4: Org Structure Preview │   │   └── access/         \# Step 5: RBAC Setup │   ├── (ops)/              \# Operations Mode │   │   ├── dashboard/      \# Corporate Landing Page │   │   ├── departments/    \# Department Workspaces │   │   ├── tasks/          \# Task Management │   │   └── documents/      \# Document Management │   └── admin/              \# Administration Console ├── components/             \# Shared UI components │   ├── ui/                 \# shadcn/ui base components │   ├── charts/             \# Recharts data visualizations │   ├── navigation/         \# Sidebar, topbar, breadcrumbs │   └── rbac/               \# Permission-aware wrappers ├── services/               \# API client functions ├── hooks/                  \# useAuth, useDepartments, useRBAC ├── store/                  \# Zustand global state └── utils/                  \# Permissions, formatters, helpers |
| :---- |

**4\. Mode 1 — Company Architecture Mode**

| *Mode 1 is exclusively accessible to Super Administrators. It is gated by MFA authentication and a dedicated privilege check middleware. All actions in this mode are recorded to an immutable audit log.* |
| :---- |

## **4.1 Setup Wizard — Step 1: Company Identity**

The wizard opens with a full-screen branded interface styled as the "exterior" of the company headquarters. The administrator is guided to configure:

* Company Name (required, used as tenant identifier)

* Company Logo (uploaded, stored in object storage, served via CDN)

* Brand Colors (primary, secondary — applied throughout the company's theme)

* Corporate Tagline

* Physical Address

* Contact Details (email, phone, website)

* Industry Classification

* Company Description / Summary

Output: The Corporate Landing Page — the first screen all users see after login — is automatically generated and styled from these inputs, resembling the entrance to a physical corporate headquarters.

## **4.2 Setup Wizard — Step 2: Department Selection**

The administrator selects from predefined department templates and/or creates custom departments:

| Template Department | Default Modules Included | Default KPIs |
| :---- | :---- | :---- |
| Finance | Budget Tracker, Invoice Register, Expense Reports, P\&L Dashboard | Revenue, Expenses, Cash Flow, Budget Utilization |
| Human Resources | Employee Registry, Leave Management, Recruitment Pipeline | Headcount, Turnover Rate, Time-to-Hire |
| Operations | Process Register, SOP Library, Operational Tasks | Efficiency Rate, Downtime, Throughput |
| Marketing | Campaign Tracker, Content Calendar, Lead Pipeline | Leads Generated, Conversion Rate, Campaign ROI |
| Sales | CRM, Deal Pipeline, Quotation Manager | Revenue Target, Deals Closed, Win Rate |
| Legal / Compliance | Contract Register, Regulatory Tracker, Policy Library | Open Cases, Compliance Score, Pending Reviews |
| IT | Asset Register, Ticket System, System Health | Uptime %, Ticket Resolution Time, Asset Count |
| Strategy | OKR Tracker, Initiative Register, Board Reports | OKR Completion, Strategic Goal Progress |
| Administration | Meeting Scheduler, Facility Register, Procurement | Meeting Efficiency, Procurement Cycle Time |
| Custom | Configured by administrator | Defined by administrator |

## **4.3 Setup Wizard — Step 3: Department Configuration**

Each department receives a dedicated configuration dashboard where the administrator defines:

* Department Name and Description

* Departmental Mandate and strategic objectives

* KPI definitions and target thresholds

* Roles within the department (custom titles mapped to RBAC privilege levels)

* Department Head assignment

* Operational workflow templates to activate

* Budget allocation parameters

* Compliance and regulatory flags

* Integration points with other departments

## **4.4 Setup Wizard — Step 4: Organizational Structure**

Once departments are configured, the system automatically generates:

* A dynamic Organizational Chart visualizing department hierarchy and reporting lines

* A Leadership Structure view mapping department heads to executive leadership

* A Department Relationship Map showing cross-functional dependencies

The org chart is interactive — administrators can drag and drop to reorder reporting lines. All changes are reflected immediately in the RBAC configuration.

## **4.5 Setup Wizard — Step 5: Access Control Setup**

The final setup step configures the Role-Based Access Control system across three levels:

| Level | Scope | Configuration |
| :---- | :---- | :---- |
| Level 1 — Company Access | Who can log into the platform | Managed via master user directory; linked to active employment status; SSO/OAuth integration |
| Level 2 — Department Access | Which departments each user can access | Assign users to one, multiple, or all departments; cross-departmental access requires explicit grant |
| Level 3 — Privilege Roles | What actions users can perform within departments | Admin, Manager, Contributor, Viewer — per department per user |

**5\. Mode 2 — Operations Mode**

Operations Mode is the daily working environment for all authorized users. The system enforces RBAC at every data access point — users see only departments they are authorized for and only perform actions their role permits.

## **5.1 Corporate Landing Page**

The primary entry point after login. Styled to resemble the lobby of the company's headquarters. Displays:

* Company logo, name, and tagline (from identity configuration)

* Corporate signage and branded color scheme

* Quick-navigation tiles for departments the user has access to

* Company-wide announcements and notifications

* Summary KPI widgets (role-dependent visibility)

* Recent activity feed

## **5.2 Department Workspace**

Each department operates as a fully isolated workspace. The department dashboard is the operational hub for all department-level activity:

| Dashboard Component | Description | Access Level |
| :---- | :---- | :---- |
| KPI Metrics Panel | Real-time department KPIs with trend indicators vs target | Viewer and above |
| Task Board | Kanban-style task management with status columns | Contributor and above |
| Document Library | Version-controlled document store with folder structure | Viewer and above |
| Operational Reports | Auto-generated periodic reports from department data | Manager and above |
| Team Members | Directory of department members with roles and contact info | Viewer and above |
| Workflow Panel | Active workflow instances, approvals pending, automation status | Contributor and above |
| Analytics Summary | Charts and trend analysis for department performance | Manager and above |
| Audit Trail | Record of all department actions and data changes | Admin only |

## **5.3 Operations Mode Features**

* Task Management: Create, assign, track, and complete tasks with due dates, priorities, and status workflows

* Document Management: Upload, version, and share documents with department-scoped access control

* Workflow Automation: Trigger automated sequences on events (e.g., task completion notifies manager)

* Cross-Departmental Collaboration: Permission-aware data sharing and inter-departmental task referral

* Reporting Engine: Generate and export PDF/Excel reports from department data

* Notification System: In-app and email notifications for assignments, approvals, and mentions

* Search: Cross-department search scoped to the user's permission profile

**6\. Role-Based Access Control (RBAC) Model**

## **6.1 Permission Inheritance Model**

| RBAC Hierarchy Super Administrator   └─ Full system access (Mode 1 \+ Mode 2, all companies) Company Admin   └─ Full access across all departments (Mode 2 only) Department Admin   └─ Full CRUD within assigned department(s) Department Manager   └─ Edit operational data, approve workflows, manage team tasks Department Contributor   └─ Create and update records within assigned scope Department Viewer   └─ Read-only access to dashboards, reports, documents Guest   └─ Time-limited read access to specified resources only |
| :---- |

## **6.2 Permission Matrix**

| Permission | Super Admin | Dept Admin | Manager | Contributor | Viewer |
| :---- | :---- | :---- | :---- | :---- | :---- |
| Access Setup Mode | ✓ | ✗ | ✗ | ✗ | ✗ |
| Create Departments | ✓ | ✗ | ✗ | ✗ | ✗ |
| Modify Org Structure | ✓ | ✗ | ✗ | ✗ | ✗ |
| Manage Company RBAC | ✓ | ✓ | ✗ | ✗ | ✗ |
| Invite Users | ✓ | ✓ | ✓ | ✗ | ✗ |
| Create Tasks | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit Dept Data | ✓ | ✓ | ✓ | ✓ | ✗ |
| View Dashboards | ✓ | ✓ | ✓ | ✓ | ✓ |
| Generate Reports | ✓ | ✓ | ✓ | ✗ | ✗ |
| Delete Records | ✓ | ✓ | ✗ | ✗ | ✗ |
| View Audit Logs | ✓ | ✓ | ✗ | ✗ | ✗ |
| Approve Workflows | ✓ | ✓ | ✓ | ✗ | ✗ |

## **6.3 RBAC Implementation Guards**

Every API endpoint is protected by layered guards implemented in NestJS:

* JwtAuthGuard — verifies token validity and user session

* TenantGuard — ensures the resource belongs to the requesting company (prevents cross-tenant access)

* RolesGuard — verifies the user holds the required company-level role

* DepartmentAccessGuard — confirms the user is a member of the target department

* PermissionsGuard — validates the user's role within that department grants the required permission

**7\. Database Architecture**

## **7.1 Multi-Tenant Strategy**

| *Strategy: Shared Database with Tenant ID (company\_id). Recommended for MVP — simplest to implement, cheapest to operate, and easily upgradeable. All tables include a company\_id foreign key. Row-Level Security (RLS) in PostgreSQL provides additional isolation guarantees.* |
| :---- |

## **7.2 Entity Relationship Overview**

| companies    │    ├── users (company\_id FK)    │      └── department\_members (user\_id FK)    │    ├── departments (company\_id FK)    │      └── department\_members (department\_id FK)    │    ├── roles (company\_id FK)    │      └── role\_permissions (role\_id FK)    │    ├── tasks (company\_id FK, department\_id FK)    │    ├── documents (company\_id FK, department\_id FK)    │    ├── workflows (company\_id FK)    │      └── workflow\_steps    │    ├── company\_setup (company\_id FK) — wizard progress    │    └── activity\_logs (company\_id FK) |
| :---- |

## **7.3 Core Table Definitions**

**companies**

| CREATE TABLE companies (     id           UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),     name         VARCHAR(255) NOT NULL,     slug         VARCHAR(255) UNIQUE NOT NULL,     logo\_url     TEXT,     industry     VARCHAR(120),     brand\_colors JSONB,          \-- { primary, secondary }     tagline      TEXT,     address      JSONB,          \-- structured address object     contact      JSONB,          \-- { email, phone, website }     description  TEXT,     created\_by   UUID,     created\_at   TIMESTAMP DEFAULT NOW(),     updated\_at   TIMESTAMP DEFAULT NOW() ); CREATE INDEX idx\_companies\_slug ON companies(slug); |
| :---- |

**users**

| CREATE TABLE users (     id            UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),     company\_id    UUID REFERENCES companies(id) ON DELETE CASCADE,     first\_name    VARCHAR(120),     last\_name     VARCHAR(120),     email         VARCHAR(255) UNIQUE NOT NULL,     password\_hash TEXT,     company\_role  VARCHAR(50) DEFAULT 'employee', \-- super\_admin|admin|employee|guest     status        VARCHAR(50) DEFAULT 'active',   \-- active|suspended|archived     mfa\_enabled   BOOLEAN DEFAULT FALSE,     last\_login\_at TIMESTAMP,     created\_at    TIMESTAMP DEFAULT NOW(),     updated\_at    TIMESTAMP DEFAULT NOW() ); CREATE INDEX idx\_users\_company ON users(company\_id); CREATE INDEX idx\_users\_email   ON users(email); |
| :---- |

**departments**

| CREATE TABLE departments (     id              UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),     company\_id      UUID REFERENCES companies(id) ON DELETE CASCADE,     name            VARCHAR(255) NOT NULL,     description     TEXT,     template\_type   VARCHAR(100), \-- finance|hr|operations|custom etc.     head\_user\_id    UUID REFERENCES users(id),     kpis            JSONB,        \-- array of KPI definitions     modules         JSONB,        \-- active module configuration     sort\_order      INT DEFAULT 0,     created\_at      TIMESTAMP DEFAULT NOW() ); CREATE INDEX idx\_departments\_company ON departments(company\_id); |
| :---- |

**department\_members**

| CREATE TABLE department\_members (     id             UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),     department\_id  UUID REFERENCES departments(id) ON DELETE CASCADE,     user\_id        UUID REFERENCES users(id)       ON DELETE CASCADE,     role\_id        UUID REFERENCES roles(id),     joined\_at      TIMESTAMP DEFAULT NOW() ); CREATE UNIQUE INDEX idx\_dept\_member\_unique ON department\_members(department\_id, user\_id); |
| :---- |

**roles & permissions**

| CREATE TABLE roles (     id          UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),     company\_id  UUID REFERENCES companies(id) ON DELETE CASCADE,     name        VARCHAR(120) NOT NULL,   \-- Admin|Manager|Contributor|Viewer     description TEXT,     is\_default  BOOLEAN DEFAULT FALSE,     created\_at  TIMESTAMP DEFAULT NOW() ); CREATE TABLE permissions (     id          UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),     name        VARCHAR(150) UNIQUE NOT NULL, \-- e.g. create\_task, view\_reports     description TEXT,     module      VARCHAR(80)  \-- e.g. tasks, documents, workflows ); CREATE TABLE role\_permissions (     role\_id        UUID REFERENCES roles(id)       ON DELETE CASCADE,     permission\_id  UUID REFERENCES permissions(id) ON DELETE CASCADE,     PRIMARY KEY (role\_id, permission\_id) ); |
| :---- |

**tasks**

| CREATE TABLE tasks (     id             UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),     company\_id     UUID REFERENCES companies(id)    ON DELETE CASCADE,     department\_id  UUID REFERENCES departments(id)  ON DELETE SET NULL,     title          VARCHAR(255) NOT NULL,     description    TEXT,     created\_by     UUID REFERENCES users(id),     assigned\_to    UUID REFERENCES users(id),     status         VARCHAR(50) DEFAULT 'open',  \-- open|in\_progress|review|done     priority       VARCHAR(50),                 \-- low|medium|high|urgent     due\_date       TIMESTAMP,     metadata       JSONB,     created\_at     TIMESTAMP DEFAULT NOW(),     updated\_at     TIMESTAMP DEFAULT NOW() ); CREATE INDEX idx\_tasks\_company    ON tasks(company\_id); CREATE INDEX idx\_tasks\_department ON tasks(department\_id); CREATE INDEX idx\_tasks\_assigned   ON tasks(assigned\_to); |
| :---- |

**activity\_logs**

| CREATE TABLE activity\_logs (     id           UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),     company\_id   UUID REFERENCES companies(id),     user\_id      UUID REFERENCES users(id),     action       VARCHAR(255),       \-- e.g. department.created, task.deleted     entity\_type  VARCHAR(120),       \-- e.g. department, task, user     entity\_id    UUID,     metadata     JSONB,              \-- contextual snapshot of the change     ip\_address   INET,     created\_at   TIMESTAMP DEFAULT NOW() ); CREATE INDEX idx\_activity\_company ON activity\_logs(company\_id); CREATE INDEX idx\_activity\_user    ON activity\_logs(user\_id); |
| :---- |

**company\_setup wizard tracking**

| CREATE TABLE company\_setup (     company\_id                 UUID PRIMARY KEY REFERENCES companies(id),     identity\_complete          BOOLEAN DEFAULT FALSE,     departments\_created        BOOLEAN DEFAULT FALSE,     departments\_configured     BOOLEAN DEFAULT FALSE,     org\_structure\_reviewed     BOOLEAN DEFAULT FALSE,     rbac\_configured            BOOLEAN DEFAULT FALSE,     completed                  BOOLEAN DEFAULT FALSE,     completed\_at               TIMESTAMP ); |
| :---- |

**8\. API Architecture**

## **8.1 API Design Principles**

* RESTful design with resource-oriented URLs

* All endpoints require Bearer JWT authentication (except /auth/\*)

* Tenant context automatically injected from JWT claims (no manual company\_id in body)

* Standard HTTP status codes; consistent error response envelope

* API versioning via URL prefix: /api/v1/

* Rate limiting: 1000 req/min per tenant; 100 req/min per user

## **8.2 Endpoint Reference**

| Method | Endpoint | Description | Auth Level |
| :---- | :---- | :---- | :---- |
| POST | /api/v1/auth/register | Register new company and super admin | Public |
| POST | /api/v1/auth/login | Authenticate user, receive JWT | Public |
| POST | /api/v1/auth/refresh | Refresh access token | Refresh Token |
| POST | /api/v1/auth/logout | Invalidate session | Any Auth |
| POST | /api/v1/auth/mfa/enable | Enable MFA for user | Any Auth |
| GET | /api/v1/company | Get company profile | Any Auth |
| PUT | /api/v1/company | Update company identity | Super Admin |
| GET | /api/v1/company/setup | Get wizard completion state | Super Admin |
| PATCH | /api/v1/company/setup/:step | Mark setup step complete | Super Admin |
| GET | /api/v1/departments | List accessible departments | Any Auth |
| POST | /api/v1/departments | Create new department | Super Admin |
| GET | /api/v1/departments/:id | Get department details | Dept Member |
| PUT | /api/v1/departments/:id | Update department config | Super Admin |
| DELETE | /api/v1/departments/:id | Archive department | Super Admin |
| GET | /api/v1/departments/:id/dashboard | Get dashboard metrics | Dept Member |
| GET | /api/v1/users | List company users | Admin |
| POST | /api/v1/users/invite | Invite user to company | Admin |
| GET | /api/v1/users/:id | Get user profile | Admin or Self |
| PUT | /api/v1/users/:id | Update user | Admin or Self |
| DELETE | /api/v1/users/:id | Deactivate user | Admin |
| GET | /api/v1/roles | List company roles | Admin |
| POST | /api/v1/roles | Create custom role | Admin |
| POST | /api/v1/roles/:id/permissions | Assign permissions to role | Admin |
| POST | /api/v1/departments/:id/members | Add user to department with role | Dept Admin |
| GET | /api/v1/tasks | List tasks (dept-scoped) | Contributor+ |
| POST | /api/v1/tasks | Create task | Contributor+ |
| PUT | /api/v1/tasks/:id | Update task | Contributor+ |
| DELETE | /api/v1/tasks/:id | Delete task | Dept Admin |
| GET | /api/v1/org-chart | Get org chart data | Any Auth |
| GET | /api/v1/audit-logs | Retrieve audit logs | Admin |

## **8.3 Response Envelope Standard**

| // Success {   "success": true,   "data": { ... },   "meta": { "page": 1, "total": 42, "limit": 20 } } // Error {   "success": false,   "error": {     "code": "UNAUTHORIZED",     "message": "You do not have permission to access this department.",     "details": {}   } } |
| :---- |

**9\. Security Architecture**

## **9.1 Authentication**

| Mechanism | Implementation | Notes |
| :---- | :---- | :---- |
| Primary Auth | Email \+ Password (bcrypt, cost 12\) | Rate-limited login attempts |
| Token | JWT (RS256 asymmetric signing) | 15-min access token; 7-day refresh token |
| MFA | TOTP (Google Authenticator compatible) | Required for Super Admin accounts |
| OAuth / SSO | Google Workspace, Microsoft Entra ID | Auth.js provider integration |
| Session | Stateless JWT; refresh token stored server-side (Redis) | Enables instant revocation |

## **9.2 Authorization**

Authorization is enforced at multiple layers — never relying solely on the UI to restrict access:

* API Gateway: Rate limiting and IP allowlisting for administrative endpoints

* Middleware: JWT validation, tenant extraction, session verification

* Guards: Role, department membership, and permission guards per endpoint (NestJS guards)

* Database: Row-level security policies in PostgreSQL as a defense-in-depth measure

## **9.3 Data Security**

* All data in transit: TLS 1.3 enforced

* Database at rest: AES-256 encryption (AWS RDS encryption enabled)

* Passwords: bcrypt with salt (cost factor 12\)

* Document storage: Per-company encryption keys in AWS KMS

* PII fields: Additional application-level encryption for email, phone, address

## **9.4 Audit & Compliance**

* Every write operation in Mode 1 (Setup) produces an immutable audit\_log entry

* Mode 2 operations also audited for Admin-level actions

* Logs include: user, timestamp, action, previous state, new state, IP address

* POPIA / GDPR: Data subject access requests supported via export API; right to erasure implemented

* SOC 2 Type II alignment: Audit controls, access reviews, and change management procedures documented

**10\. Multi-Tenant SaaS Architecture**

## **10.1 Tenancy Model Comparison**

| Strategy | Isolation Level | Cost | Complexity | Recommended Phase |
| :---- | :---- | :---- | :---- | :---- |
| Shared DB \+ Tenant ID | Low-Medium | Low | Low | MVP → 10k tenants ✓ |
| Schema-per-Tenant | Medium-High | Medium | Medium | Post-Series A |
| DB-per-Tenant | High (full isolation) | High | High | Enterprise tier |

| *Recommendation: Begin with Shared DB \+ Tenant ID (company\_id). At 10k+ tenants, introduce schema-per-tenant for enterprise clients who require compliance-grade data isolation, while retaining shared-DB for standard tier.* |
| :---- |

## **10.2 Tenant Isolation Implementation**

Every API request carrying a valid JWT automatically has the company\_id injected into the request context by the TenantMiddleware. All Prisma repository queries include a mandatory where: { company\_id: ctx.tenantId } clause. Database-level RLS policies provide a secondary enforcement layer.

## **10.3 Cloud Infrastructure (AWS)**

| AWS Architecture (MVP) Route 53 (DNS)   └── CloudFront CDN (static assets \+ API edge cache)          └── Application Load Balancer                 ├── ECS Fargate (Frontend — Next.js containers)                 └── ECS Fargate (Backend — NestJS containers)                        ├── RDS PostgreSQL (Multi-AZ)                        ├── ElastiCache Redis (sessions \+ queues)                        └── S3 (document \+ media storage) Secrets Manager (JWT keys, DB credentials) KMS (encryption keys per tenant) CloudWatch (logs \+ monitoring \+ alerts) |
| :---- |

**11\. Recommended Technology Stack**

| Layer | Technology | Rationale |
| :---- | :---- | :---- |
| Frontend Framework | Next.js 14 (App Router) | SSR \+ CSR hybrid, built-in routing, API routes, SEO, excellent developer experience |
| UI Component Library | shadcn/ui \+ Tailwind CSS | Unstyled composable components; Tailwind for rapid custom styling aligned to brand colors |
| Data Visualization | Recharts | React-native charting for KPI dashboards; customizable and performant |
| State Management | Zustand | Lightweight, flexible; ideal for auth state, user context, RBAC permissions cache |
| Backend Framework | NestJS (TypeScript) | Enterprise-grade modular architecture; dependency injection; guards for RBAC; scales cleanly |
| ORM | Prisma | Type-safe database access; excellent migration tooling; native PostgreSQL support |
| Database | PostgreSQL 16 | Proven relational DB; JSONB for flexible metadata; Row-Level Security for tenant isolation |
| Cache / Queue | Redis \+ BullMQ | Session caching, dashboard data caching, background job processing (reports, notifications) |
| Authentication | Auth.js (NextAuth v5) | Supports OAuth, credentials, JWT; easily extensible for MFA |
| File Storage | AWS S3 \+ CloudFront | Scalable object storage; CDN delivery for documents and media |
| Email | SendGrid / Resend | Transactional email for invitations, notifications, password reset |
| DevOps / CI-CD | GitHub Actions | Automated test, build, and deploy pipeline |
| Containerization | Docker \+ ECS Fargate | Consistent deployment; serverless container management |
| Monitoring | CloudWatch \+ Sentry | Infrastructure monitoring \+ application error tracking |
| IaC | Terraform | Reproducible infrastructure; version-controlled cloud resources |

**12\. UX Architecture & Screen Inventory**

## **12.1 Navigation Hierarchy**

| CompanyOS Navigation Structure ├── /auth │     ├── /login                  Login page │     ├── /register               Company \+ Super Admin registration │     └── /mfa                    MFA verification ├── /setup  \[Super Admin only\] │     ├── /setup/identity         Step 1: Company Identity │     ├── /setup/departments      Step 2: Department Selection │     ├── /setup/configure/:id    Step 3: Department Configuration │     ├── /setup/org-chart        Step 4: Org Structure Review │     └── /setup/access           Step 5: RBAC Configuration └── /  \[Operations Mode\]       ├── /dashboard              Corporate Landing Page       ├── /departments       │     └── /:deptId          Department Workspace       │           ├── /tasks      Task Board       │           ├── /documents  Document Library       │           ├── /kpis       KPI Dashboard       │           ├── /reports    Reports       │           └── /team       Team Directory       ├── /org-chart              Organization Chart       ├── /tasks                  My Tasks (cross-dept)       ├── /documents              My Documents (cross-dept)       ├── /notifications          Notification Center       └── /admin                  Admin Console             ├── /admin/users      User Management             ├── /admin/rbac       Role & Permission Management             ├── /admin/audit      Audit Logs             └── /admin/settings   Company Settings |
| :---- |

## **12.2 Key Screen Descriptions**

| Screen | Purpose | Key Components |
| :---- | :---- | :---- |
| Login Page | User authentication entry point | Email/password form; SSO buttons; MFA prompt; branded with company logo if tenant slug detected in URL |
| Company Registration | New company onboarding | Company name, super admin details, plan selection; triggers company\_setup record creation |
| Setup Wizard | Step-by-step company construction | Progress indicator (5 steps); wizard panels; preview sidebar showing structure building in real-time |
| Corporate Landing Page | Post-login home for all users | Company signboard with logo/colors; department tiles; announcements; KPI summary; recent activity |
| Department Workspace | Operational hub per department | KPI metrics cards; Kanban task board; document library; workflow status; team directory; report generator |
| Organization Chart | Visual company hierarchy | Interactive tree diagram; department nodes; reporting lines; leader cards; click to view dept detail |
| RBAC Console | Role and permission management | User list with dept assignments; role editor; permission checkboxes; department access matrix table |
| Audit Log Viewer | Compliance and governance | Filterable timeline of all system actions; export to PDF/CSV; user and action filters |
| Admin Console | Platform administration | User invitation management; role configuration; company settings; billing (future); integrations |

**13\. Codebase Architecture**

| companyos/ ├── frontend/                         \# Next.js Application │   ├── app/ │   │   ├── (auth)/login/page.tsx │   │   ├── (auth)/register/page.tsx │   │   ├── (setup)/identity/page.tsx │   │   ├── (setup)/departments/page.tsx │   │   ├── (setup)/configure/\[id\]/page.tsx │   │   ├── (setup)/org-chart/page.tsx │   │   ├── (setup)/access/page.tsx │   │   ├── (ops)/dashboard/page.tsx │   │   ├── (ops)/departments/\[id\]/page.tsx │   │   └── admin/page.tsx │   ├── components/ │   │   ├── ui/         \# shadcn base components │   │   ├── charts/     \# KPI chart components │   │   ├── wizard/     \# Setup wizard steps │   │   ├── rbac/       \# \<PermissionGate\> wrappers │   │   └── navigation/ │   ├── services/       \# API client (axios/fetch wrappers) │   ├── hooks/          \# useAuth, useDepts, useTasks, useRBAC │   ├── store/          \# Zustand: authStore, companyStore │   └── utils/ ├── backend/                          \# NestJS Application │   └── src/ │       ├── modules/ │       │   ├── auth/ │       │   │   ├── auth.controller.ts │       │   │   ├── auth.service.ts │       │   │   ├── jwt.strategy.ts │       │   │   └── auth.module.ts │       │   ├── company/ │       │   ├── departments/ │       │   ├── users/ │       │   ├── rbac/ │       │   ├── tasks/ │       │   ├── documents/ │       │   ├── workflows/ │       │   ├── analytics/ │       │   ├── notifications/ │       │   └── audit/ │       ├── common/ │       │   ├── guards/    \# JwtAuthGuard, RolesGuard, TenantGuard │       │   ├── middleware/ \# TenantMiddleware │       │   └── decorators/ \# @Roles(), @Permissions() │       ├── database/     \# Prisma client and schema │       └── main.ts ├── database/ │   ├── migrations/     \# Prisma migration files │   └── seeds/          \# Seed: default roles, permissions, dept templates ├── infrastructure/ │   ├── docker/         \# Dockerfile.frontend, Dockerfile.backend, compose.yml │   ├── terraform/      \# AWS infrastructure as code │   └── k8s/            \# Kubernetes manifests (Phase 3\) └── docs/     ├── architecture/     ├── api/     └── runbooks/ |
| :---- |

**14\. Development Roadmap**

## **Phase 1 — MVP (Weeks 1–10)**

| Week | Focus | Deliverables |
| :---- | :---- | :---- |
| 1–2 | Platform Foundation | Monorepo setup; NestJS \+ Next.js scaffold; PostgreSQL schema; Docker; CI/CD pipeline; auth system (JWT \+ bcrypt \+ refresh tokens) |
| 3–4 | Company Builder | Company registration; setup wizard Step 1 (Identity); Corporate Landing Page generated; company\_setup tracking |
| 5–6 | Department Engine | Department CRUD; predefined templates; department dashboard scaffold; wizard Steps 2 & 3 |
| 7 | Org Chart \+ RBAC | Org chart visualization; RBAC module; role/permission CRUD; wizard Steps 4 & 5; all guards wired |
| 8–9 | Operations Mode | Task management (Kanban); document upload; department workspace operational; notification system basic |
| 10 | Polish & Testing | End-to-end tests; performance optimization; accessibility review; security audit; deployment to staging |

## **Phase 2 — Production Platform (Months 3–5)**

* Analytics engine — KPI computation, trend analysis, department performance reports

* Workflow automation engine — trigger/action rule builder

* Advanced document management — version control, collaborative editing integration

* Enhanced RBAC — time-limited access, delegated permissions, access review workflows

* Billing and subscription management — Stripe integration, plan-based feature gating

* Mobile-responsive design refinement

* Public API for third-party integrations

## **Phase 3 — Enterprise SaaS Platform (Months 6–12)**

* Multi-tenancy upgrade — schema-per-tenant option for enterprise clients

* SSO/SAML enterprise integration (Okta, Azure AD)

* Microservices extraction — Auth, Analytics, Notifications as independent services

* Event-driven architecture with Apache Kafka for high-throughput operations

* Elasticsearch integration for cross-departmental full-text search

* AI Company Assistant — natural language queries over company data, automated report drafting

* Integration Marketplace — Slack, MS Teams, Zapier, accounting software connectors

* SOC 2 Type II audit completion and certification

**15\. Scalability & Performance Strategy**

## **15.1 MVP Capacity**

The MVP architecture handles:

| Metric | MVP Target | Architecture Trigger for Upgrade |
| :---- | :---- | :---- |
| Concurrent Users | 500 | ECS horizontal scaling at 70% CPU |
| Companies (Tenants) | 10,000 | Schema-per-tenant option above 10k |
| Total Users | 500,000 | Read replicas for analytical queries |
| Departments per Company | Unlimited | No architectural constraint |
| Tasks per Company | 1,000,000+ | Partitioned by company\_id at scale |
| Document Storage | 1 TB / tenant | S3 lifecycle policies for archival |

## **15.2 Scaling Mechanisms**

* Horizontal scaling: ECS Fargate auto-scaling on CPU/memory thresholds

* Database read replicas: PostgreSQL read replica for all analytical/reporting queries

* Caching: Redis layer for department dashboard data (5-minute TTL), user permission profiles, org chart

* Background processing: BullMQ for report generation, email dispatch, analytics computation

* CDN: CloudFront for all static assets and document delivery

* Connection pooling: PgBouncer for database connection management at scale

## **15.3 Future Architecture Evolution**

| Phase 3 Microservices Target Architecture                     API Gateway (Kong / AWS API GW)                            │           ┌────────────────┼────────────────┐           ▼                ▼                ▼     Auth Service    Department Service   Analytics Service           │                │                │           └────────────────┼────────────────┘                     Kafka Event Bus                            │           ┌────────────────┼────────────────┐           ▼                ▼                ▼    Notification Svc  Search Svc (ES)  Workflow Engine |
| :---- |

**16\. Future Expansion Features**

| Feature | Description | Phase |
| :---- | :---- | :---- |
| AI Company Assistant | Natural language interface for querying company data, generating reports, and drafting communications | 3 |
| Predictive Analytics | ML-powered KPI forecasting and anomaly detection across departments | 3 |
| Workflow Marketplace | Library of pre-built workflow templates for common business processes | 2 |
| Integration Marketplace | Plug-and-play connectors for Slack, Teams, QuickBooks, Xero, Salesforce | 3 |
| Virtual Board Room | Executive-level consolidated view with board report generation and meeting management | 3 |
| Compliance Engine | Automated regulatory compliance tracking with deadline alerts and audit-ready reporting | 2 |
| Employee Self-Service | Leave requests, expense claims, HR document access within the platform | 2 |
| Multi-Language Support | Internationalization for global enterprise clients | 3 |
| White-Label / Reseller | Partner program enabling agencies to deploy branded CompanyOS instances | 3 |
| API Ecosystem | Public REST/GraphQL API with developer documentation for third-party app development | 3 |

| *Strategic Note: The most defensible competitive advantage is CompanyOS's unique positioning as a platform that models the company structure itself — not just tasks or documents within it. No major competitor (Notion, Monday.com, Odoo) starts with the organizational graph as a first-class entity. This is the core differentiation to protect and deepen.* |
| :---- |

**Appendix A: Seed Data — Default Permissions**

The following permissions are seeded into the database at platform initialization and are available for assignment to any custom role:

| Permission Name | Module | Description |
| :---- | :---- | :---- |
| create\_department | Company | Create new departments (Setup Mode only) |
| edit\_department | Company | Modify department configuration |
| delete\_department | Company | Archive/delete departments |
| invite\_user | Users | Send user invitations to company |
| manage\_roles | RBAC | Create and modify roles and permissions |
| create\_task | Tasks | Create new tasks within department |
| edit\_task | Tasks | Update task details and status |
| delete\_task | Tasks | Delete tasks permanently |
| assign\_task | Tasks | Assign tasks to team members |
| view\_reports | Analytics | Access department reports and analytics |
| generate\_reports | Analytics | Generate and export reports |
| manage\_documents | Documents | Upload, organize, and delete documents |
| view\_audit\_logs | Audit | Read-only access to activity logs |
| approve\_workflows | Workflows | Approve or reject workflow steps |
| manage\_workflows | Workflows | Configure workflow automation rules |

**Appendix B: Glossary**

| Term | Definition |
| :---- | :---- |
| Tenant | A single company registered on the CompanyOS platform; all data is isolated per tenant |
| Super Administrator | The highest-privilege role; only user who can access Mode 1 (Setup Mode) |
| Mode 1 | Company Architecture Mode — the guided wizard for constructing company structure |
| Mode 2 | Operations Mode — the daily working environment for all authorized users |
| RBAC | Role-Based Access Control — the permission system governing all data access |
| Modular Monolith | A backend architecture style combining modular domain separation with single-service deployment |
| Tenant ID | The company\_id field present on every database record to ensure data isolation between companies |
| JWT | JSON Web Token — the signed authentication token issued upon login |
| KPI | Key Performance Indicator — measurable metric for tracking department performance |
| Org Chart | Organization Chart — the visual hierarchy of departments and leadership |

