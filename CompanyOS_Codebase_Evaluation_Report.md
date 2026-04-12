# CompanyOS Codebase Evaluation Report

This report implements the evaluation framework described in `CompanyOS_Codebase_Eval.md`. Generated from repository analysis (architecture review, file sampling, and automated searches).

---

## Executive Summary

CompanyOS is a **modular NestJS + Prisma backend** with a **Next.js 16 App Router frontend**, aligned with a shared-database multi-tenant model (`company_id` on entities, enforced in services). The backend shows **mature security investment**: global `ValidationPipe` with whitelist/forbid, CORS allowlisting, optional HSTS, security headers/CSP, MFA and cookie-aware JWT extraction, rate limiting on auth routes, and **~66 Jest spec files** across domains. Gaps include **no PostgreSQL RLS in migrations** (despite RLS being described in specs), **no CI workflow in-repo** (`.github` absent), **no frontend automated tests**, **Swagger exposed at `/api/docs`** in production unless gated, and **inconsistent `req.user` shape** (`userId` vs `sub`) that weakens audit attribution in places. **Docker Compose** still ships placeholder secrets (`JWT_SECRET`, DB password), which is fine for local dev but risky if copied to production verbatim.

**Readiness Score: 6.5/10** — Strong application-layer security and test breadth for the backend, but missing defense-in-depth at the DB layer, thin DevOps automation in-repo, and frontend/ops gaps keep it short of “production-grade” without additional hardening and process.

---

## Strengths

- **Clear modular monolith**: `AppModule` wires many domain modules (`AccountingModule`, `ArModule`, `DmsModule`, `SupplyChainModule`, etc.) in `backend/src/app.module.ts`, which supports team parallelization and bounded contexts.
- **Central API hardening**: `main.ts` applies JSON body limits, strict CORS, global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`), and `applySecurityHeaders` with env-driven HSTS.
- **Auth model**: `JwtStrategy` supports bearer + HTTP-only cookie extraction; payload carries `companyId` for tenant context (`backend/src/modules/auth/jwt.strategy.ts`).
- **Documented security program**: `SECURITY_OVERVIEW.md` gives an honest “done / mostly / partly” matrix and lists hardened areas (MFA, tenant scoping sweeps, upload policy, rate limits).
- **Backend test surface**: Dozens of `*.spec.ts` files under `backend/src` (controllers, services, integration specs, `env.validation.spec.ts`, `security-headers.spec.ts`).
- **Large typed data model**: ~**100 Prisma models** (`backend/prisma/schema.prisma`), indicating serious domain modeling for an SME ERP-style product.
- **Frontend structure**: App Router with route groups `(ops)`, `(auth)`, `setup` — many feature pages under `frontend/src/app/`, matching the product scope.

---

## Critical Issues (Require Immediate Attention)

1. **DB-level tenant isolation not evidenced**: No `ROW LEVEL SECURITY` in SQL migrations (grep over `*.sql`). Reliance on application `company_id` filters is strong but **one missed clause in a new query is a tenant leak**; RLS or strict repository pattern enforcement is the usual fix.
2. **Audit middleware user id may be wrong**: `AuditLogMiddleware` uses `user?.sub` (`backend/src/common/middleware/audit-log.middleware.ts`), while `JwtStrategy.validate` returns `userId`, not `sub`. Successful writes may log **without user id** or be inconsistent with controllers that use `req.user.userId`.
3. **Inconsistent `req.user` usage**: e.g. `goods-receipt.controller.ts` uses `req.user.sub` while most controllers use `req.user.userId` — invites bugs and bypassed audits.
4. **No in-repo CI/CD**: No `.github/workflows` (or similar). Quality depends on local discipline; regressions in tenant scoping or auth are higher risk without automated gates.
5. **Swagger in production**: `SwaggerModule.setup('api/docs', ...)` in `main.ts` — API surface documentation should be **disabled or auth-gated** in production.
6. **Compose secrets**: `infrastructure/docker/compose.yml` uses weak default `JWT_SECRET` and DB password — must be **externalized/overridden** for any shared environment.

---

## Detailed Analysis by Dimension

### 1. Architecture & Design

**Rating: Good**

- **Key observations**: NestJS feature modules, Prisma as single data access layer, Next.js App Router for UI. Modular monolith fits MVP velocity.
- **Concrete examples**: `backend/src/app.module.ts` imports; domain folders under `backend/src/modules/*`; `frontend/src/app/(ops)/` for operational surfaces.
- **Actionable recommendations**: Introduce a **documented boundary** for “all DB reads/writes must include `company_id`” (interceptor, base repository, or Prisma middleware). Consider **extracting shared “finance core”** if `company.service` / accounting files grow further (large service files suggest hotspot risk).

### 2. Code Quality & Readability

**Rating: Fair–Good**

- **Key observations**: Generally consistent Nest patterns; some very large services increase review burden.
- **Concrete examples**: Guards under `backend/src/modules/supply-chain/guards/`; DTO usage noted in `SECURITY_OVERVIEW.md`.
- **Actionable recommendations**: Normalize **`req.user` type** (single interface: `userId`, `companyId`, `email`, `roles`) and fix `sub` vs `userId` drift. Split mega-services where boundaries are clear.

### 3. Maintainability & Extensibility

**Rating: Fair**

- **Key observations**: Env validation exists (`validateEnvironment`, specs). Backend README is still **stock NestJS boilerplate**; frontend README is **stock create-next-app** — weak onboarding signal.
- **Concrete examples**: `backend/src/common/env.validation.ts` (referenced in `main.ts`); `backend/package.json` scripts for targeted test subsets (`test:release1`, `test:finance-release`).
- **Actionable recommendations**: Replace READMEs with **CompanyOS-specific** setup (env vars, migrations, seed, how to run backend+frontend). Add **architecture decision notes** for tenant scoping and auth cookies.

### 4. Performance & Scalability

**Rating: Fair** (limited runtime evidence)

- **Key observations**: Redis in compose suggests sessions/queues; BullMQ in dependencies. No systematic caching strategy visible from quick pass.
- **Concrete examples**: `infrastructure/docker/compose.yml` Redis service; `@nestjs/bullmq` in `backend/package.json`.
- **Actionable recommendations**: Add **query profiling** on heavy dashboards; index review for `company_id` composite indexes on hot tables; define **SLOs** (e.g. dashboard &lt;2s) with measurement (APM or structured timing middleware).

### 5. Security & Compliance

**Rating: Good** (application layer), **Fair** (defense in depth)

- **Key observations**: Strong controls: validation pipe, CORS, headers, MFA, rate limits, tenant-scoping work per `SECURITY_OVERVIEW.md`. Missing RLS; Swagger may expose attack surface; audit user linkage bug.
- **Concrete examples**: `main.ts` (CORS, validation, headers); `jwt.strategy.ts`; `SECURITY_OVERVIEW.md` tables.
- **Actionable recommendations**: **RLS policies** or equivalent DB enforcement; **lock down Swagger** by env; fix audit middleware to use `userId`; periodic **authorization regression tests** (cross-tenant IDs).

### 6. Testing & Reliability

**Rating: Good** (backend), **Poor** (frontend)

- **Key observations**: ~66 `*.spec.ts` files under `backend/src`. No frontend `*.spec` files found.
- **Concrete examples**: `release1.smoke.spec.ts`, module controller/service specs, `auth.controller.integration.spec.ts`.
- **Actionable recommendations**: Add **Playwright/Cypress** smoke for auth + one cross-module flow; keep **integration tests** for tenant isolation (negative cases). Wire **CI** to run `npm test` / `npm run lint` for both packages.

### 7. Documentation & Developer Experience

**Rating: Fair**

- **Key observations**: Rich **design/spec markdown** in repo (`CompanyOS_Technical_Specification.md`, `SECURITY_OVERVIEW.md`); READMEs in apps are generic.
- **Actionable recommendations**: Single **root README** with monorepo layout, ports, and env table; link to Swagger only for dev.

### 8. Dependencies & Ecosystem

**Rating: Good**

- **Key observations**: Modern stack: Nest 11, Prisma 6, Next 16, React 19. Caret ranges allow drift; Dependabot/Renovate not visible in-repo.
- **Actionable recommendations**: Enable **automated dependency PRs** + periodic `npm audit` review for backend/frontend.

### 9. DevOps & CI/CD

**Rating: Poor** (in-repo automation)

- **Key observations**: Docker Compose for local stack; **no GitHub Actions** (or other) in workspace. Lint scripts exist (`eslint` in both packages).
- **Actionable recommendations**: Add pipeline: **install → lint → test → build** for `backend` and `frontend`; optional **Docker image build** on tags.

---

## Technical Debt Matrix

| Issue | Impact (H/M/L) | Effort (H/M/L) | Suggested Fix |
|-------|------------------|----------------|----------------|
| No PostgreSQL RLS | H | H | Add RLS policies + session `company_id`, or strict Prisma extension |
| `req.user.sub` vs `userId` inconsistency | H | L | Single user type; grep-fix controllers; fix audit middleware |
| Audit logs missing user id | M | L | Use `req.user.userId` in `AuditLogMiddleware` |
| Swagger on in prod | M | L | Disable or protect when `NODE_ENV=production` |
| No CI | H | M | GitHub Actions (or existing host) for lint/test/build |
| No frontend tests | M | M | Playwright critical paths + component tests for auth |
| Generic READMEs | L | L | Replace with project setup docs |
| Large service classes | M | M | Extract helpers/services by subdomain |
| Compose default secrets | M | L | Document `.env` overrides; never use defaults in shared envs |

---

## Prioritized Roadmap

### Short-term (0–2 weeks)

- Unify `req.user` shape and fix `AuditLogMiddleware` user extraction.
- Gate or disable Swagger outside development.
- Add minimal CI (lint + backend Jest + frontend build).
- Add cross-tenant **negative** tests for 2–3 high-risk modules (DMS, AR, company).

### Medium-term (1–3 months)

- PostgreSQL **RLS** (or audited alternative) for tenant tables.
- Frontend E2E smoke + expand integration coverage for finance flows.
- Performance baseline: slow-query log review and dashboard timing.

### Long-term / Architecture

- If scaling past modular monolith pain: **extract** a high-load bounded context (e.g. documents, notifications) behind a clear API, keeping shared DB or eventing as appropriate.
- Formal **SRE/ops runbook** (backups, rotation, incident response) aligned with SME deployment targets.

---

## Limitations

- **Load/performance** was not measured (no profiling runs).
- **Dependency vulnerability posture** (`npm audit`) was not run as part of this evaluation.
- **Full authorization review** of every route was not feasible; `SECURITY_OVERVIEW.md` and sampling were used.
