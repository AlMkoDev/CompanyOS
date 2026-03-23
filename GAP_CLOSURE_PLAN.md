# Gap Closure Plan

This plan tracks the remaining high-value security and operational gaps after the CompanyOS hardening sweep.

The goal is to close the remaining risks in a controlled order, with each item having a clear outcome and verification target.

Use this document together with:

- [RELEASE_SUMMARY.md](/C:/CompanyOS/RELEASE_SUMMARY.md)
- [SECURITY_OVERVIEW.md](/C:/CompanyOS/SECURITY_OVERVIEW.md)
- [DEPLOYMENT_CHECKLIST.md](/C:/CompanyOS/DEPLOYMENT_CHECKLIST.md)
- [INCIDENT_RUNBOOK.md](/C:/CompanyOS/INCIDENT_RUNBOOK.md)
- [REVIEW_HANDOFF.md](/C:/CompanyOS/REVIEW_HANDOFF.md)

## Status Key

- `Open`: not started yet
- `In Progress`: actively being worked
- `Blocked`: waiting on a policy or environment decision
- `Done`: completed and verified

## Priority Order

1. Production cookie/session verification
2. MFA policy finalization and recovery process
3. Negative-path cross-tenant integration coverage
4. File/document downstream handling review
5. Secret and infrastructure operations hardening
6. Authorization drift prevention guardrails

## 1. Production Cookie / Session Verification

Status: `In Progress`

Why this matters:

- cookie and session behavior now depends heavily on correct production proxy, domain, HTTPS, and CORS configuration
- a misconfigured deployment can look like random auth breakage even when the code is correct

Target outcome:

- one known-good staging configuration is documented and verified end to end

Tasks:

- stand up or use a staging environment that matches the real proxy/domain setup
- verify:
  - `AUTH_COOKIE_SAME_SITE`
  - `AUTH_COOKIE_SECURE`
  - `AUTH_COOKIE_DOMAIN`
  - `AUTH_COOKIE_MAX_AGE_MS`
  - `FRONTEND_ORIGIN`
  - `ENABLE_HSTS`
- test:
  - login
  - refresh
  - `/auth/me`
  - deep-link navigation
  - logout
- capture the exact known-good env values in deployment notes

Success criteria:

- cookie-backed auth works correctly in staging with the intended domain/proxy setup
- the final deployment values are documented and repeatable

Working document:

- [STAGING_SESSION_VERIFICATION.md](/C:/CompanyOS/STAGING_SESSION_VERIFICATION.md)

## 2. MFA Policy Finalization And Recovery

Status: `Open`

Why this matters:

- MFA now exists technically, but its real protection level still depends on the production policy and operational recovery process

Target outcome:

- privileged-account MFA policy is explicit, enforced, and operationally supportable

Tasks:

- review the real production role names
- finalize `REQUIRED_MFA_ROLES`
- decide whether MFA remains privileged-role only or expands further
- define an MFA reset/recovery procedure for administrators
- add the recovery procedure to the incident runbook or a dedicated admin runbook
- smoke-test privileged-user bootstrap and recovery

Success criteria:

- the final role list is documented
- privileged users cannot bypass MFA
- a safe admin recovery path exists for lockouts or broken MFA state

## 3. Negative-Path Cross-Tenant Integration Coverage

Status: `Open`

Why this matters:

- we improved a lot of tenant-scoping logic, but the remaining risk is future gaps or unverified modules

Target outcome:

- more HTTP-level tests prove that one tenant cannot access another tenant’s records in additional high-risk modules

Priority targets:

- finance
- HRIS
- ATS
- CRM
- supply-chain nested routes

Tasks:

- add integration tests for “Company A cannot access Company B record” scenarios
- prefer HTTP-level tests over only service-level tests
- extract a reusable test pattern if duplication gets high

Success criteria:

- at least 3 more high-risk modules have explicit cross-tenant integration coverage
- the test pattern is straightforward for future additions

## 4. File / Document Downstream Handling Review

Status: `Open`

Why this matters:

- upload validation is stronger now, but document safety also depends on how files are rendered, downloaded, and consumed downstream

Target outcome:

- document handling is reviewed end to end, especially for browser rendering and any future inline viewers

Tasks:

- review all current frontend document views and download paths
- verify where inline rendering is used versus forced download
- restrict inline rendering to clearly safe types if needed
- confirm external URLs are never treated as managed storage
- decide whether malware or antivirus scanning is required for real-world uploads
- decide whether company-level file quotas or retention limits are needed

Success criteria:

- document rendering/download behavior is intentionally defined
- no known unsafe inline document path remains
- any future scanning or quota decision is explicitly documented

## 5. Secret And Infrastructure Operations Hardening

Status: `Open`

Why this matters:

- env validation in code helps, but real production security still depends on how secrets are stored, rotated, and deployed

Target outcome:

- operational secret handling is documented and managed outside the app safely

Tasks:

- confirm where secrets are stored in each environment
- define rotation steps for:
  - `JWT_SECRET`
  - `S3_*`
  - `SMTP_*`
  - `AT_*`
- define who can change auth- and proxy-sensitive env values
- document rollback steps for cookie/proxy/env changes

Success criteria:

- secret storage and rotation are documented
- risky env changes have an owner and rollback path

## 6. Authorization Drift Prevention Guardrails

Status: `Open`

Why this matters:

- the remaining authorization risk is mostly about future regressions rather than already-known gaps

Target outcome:

- new authenticated routes are less likely to reintroduce bare-ID access patterns

Tasks:

- add a review rule: authenticated endpoints must use company-scoped record resolution
- document the preferred helper pattern for company-owned lookups
- add a reviewer note or checklist entry to [REVIEW_HANDOFF.md](/C:/CompanyOS/REVIEW_HANDOFF.md) or team process docs
- periodically scan for new bare-ID lookup patterns

Success criteria:

- reviewers have a concrete rule to apply
- the preferred company-scoping pattern is documented

## Suggested Execution Sequence

1. Close production cookie/session verification first.
2. Finalize MFA policy and recovery next.
3. Add cross-tenant integration coverage for 3 high-risk modules.
4. Review document rendering and downstream file handling.
5. Document secret rotation and env ownership.
6. Add authorization drift guardrails for future development.

## Tracking Notes

- Update each section status as work starts or completes.
- When an item is completed, add a short note with:
  - what changed
  - how it was verified
  - where the final documentation lives
