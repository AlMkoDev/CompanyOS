# Deployment Checklist

This checklist is for staging and production deployments of CompanyOS after the recent auth, MFA, session, validation, and tenant-scoping hardening work.

Use this document before any production launch, environment cutover, or major infrastructure change.

## 1. Environment And Secrets

- Set a strong `JWT_SECRET`.
- Set `FRONTEND_ORIGIN` to the real frontend origin, or a comma-separated list of allowed origins.
- Set `MFA_ISSUER` to the real company or product name shown in authenticator apps.
- Review `REQUIRED_MFA_ROLES` and confirm the enforced privileged-role policy matches your deployment expectations.
- Review and set auth cookie env vars in [`backend/.env.example`](/C:/CompanyOS/backend/.env.example):
  `AUTH_COOKIE_NAME`, `AUTH_COOKIE_SAME_SITE`, `AUTH_COOKIE_SECURE`, `AUTH_COOKIE_MAX_AGE_MS`, and optionally `AUTH_COOKIE_DOMAIN`.
- Set `PORT` explicitly in each deployed backend environment.
- Review feature flags and set them intentionally:
  `ENABLE_SUPPLY_CHAIN`, `ENABLE_PPM`, `ENABLE_ANALYTICS`.

## 2. Cookie And Session Security

- In production, set `AUTH_COOKIE_SECURE=true`.
- If frontend and backend are cross-site, set `AUTH_COOKIE_SAME_SITE=none` and use HTTPS everywhere.
- If frontend and backend are same-site, prefer `AUTH_COOKIE_SAME_SITE=lax`.
- Only set `ENABLE_HSTS=true` when production traffic is fully HTTPS end to end.
- If you use a custom cookie domain, verify `AUTH_COOKIE_DOMAIN` matches the deployed host pattern.
- Confirm logout clears the auth cookie on the exact deployed domain and path combination.
- Verify session restore works through `GET /auth/me` after a full browser refresh.

## 3. MFA Readiness

- Test the full MFA flow in staging:
  login, MFA setup, MFA verify, MFA login challenge, MFA login verify, privileged-role MFA bootstrap, logout.
- Confirm the issuer label shown in authenticator apps matches `MFA_ISSUER`.
- Verify the setup screen at [`frontend/src/app/setup/access/page.tsx`](/C:/CompanyOS/frontend/src/app/setup/access/page.tsx) can enable MFA for a real account.
- Confirm MFA-enabled users no longer receive a direct access token path at login.
- Confirm users in roles listed by `REQUIRED_MFA_ROLES` cannot complete normal login until MFA has been enabled.

## 4. Frontend Deployment Checks

- Set the frontend API base URL used by [`frontend/src/lib/api.ts`](/C:/CompanyOS/frontend/src/lib/api.ts).
- Verify the frontend uses cookie-backed auth after:
  login, refresh, direct deep-link navigation, and logout.
- Confirm no environment still depends on persisted bearer tokens in browser storage.
- Run frontend lint before release:

```powershell
& 'C:\nvm4w\nodejs\npm.cmd' run lint
```

## 5. Backend Validation And Startup

- Confirm backend startup succeeds with the intended env values.
- Confirm startup fails when critical env values are invalid or missing:
  `JWT_SECRET`, cookie settings, partial S3 config, partial SMTP config, invalid feature flags, invalid origins.
- Review the shared env helpers in:
  [`backend/src/common/env.ts`](/C:/CompanyOS/backend/src/common/env.ts)
  [`backend/src/common/env.validation.ts`](/C:/CompanyOS/backend/src/common/env.validation.ts)

## 6. Storage, Email, And SMS

- If using object storage, set the full `S3_*` block and verify upload, download, and delete behavior.
- If not using object storage yet, leave the full `S3_*` block unset.
- If using SMTP, set the full `SMTP_*` block and send a real test message in staging.
- If not using SMTP yet, leave the full `SMTP_*` block unset.
- If using Africa’s Talking, set both `AT_USERNAME` and `AT_API_KEY` and test with non-production recipients first.
- If not using SMS yet, leave the full `AT_*` block unset.

## 7. Database And Release Safety

- Run Prisma migrations in staging before production.
- Back up production before first deploy of auth/session or schema-sensitive changes.
- Confirm composite company-scoped uniqueness still matches live expectations.
- Validate that seeded or reference data required by finance, HR, and supply-chain modules exists in the target environment.

## 8. Reverse Proxy And Platform Configuration

- Ensure HTTPS termination is correct.
- Ensure forwarded headers are trustworthy and consistent.
- Confirm cookies are not stripped or rewritten unexpectedly by the proxy or platform.
- Confirm CORS allows only intended frontend origins.
- Confirm security headers are preserved as expected, especially `X-Content-Type-Options`, `Content-Security-Policy`, and optional `Strict-Transport-Security`.
- If using multiple subdomains, verify cookie domain and same-site behavior carefully.

## 9. Security Smoke Tests In Staging

- Auth:
  login, logout, refresh, direct page load, `/auth/me`.
- MFA:
  setup, verification, login challenge, login verification.
- Company setup:
  identity, access, configure flow.
- DMS:
  explorer, document detail, add version, legal hold, delete.
- Onboarding:
  create plan, task update, exit interview, deprovisioning update.
- Accounting:
  accounts, post journal entry, reverse journal entry, close period.
- Cashflow:
  create forecast, add item, populate, sign off.
- Supply-chain:
  PO document access, goods receipt detail, supplier/product views.

## 10. Tenant-Boundary Verification

- Verify a user from Company A cannot access Company B resources by guessing IDs.
- Focus spot checks on:
  DMS documents and folders
  onboarding plans and tasks
  payroll runs and payslips
  accounting journal entries
  OKR cycles, objectives, and key results
  contracts and approvals
  supply-chain PO and GR records

## 11. Automated Verification

- Run backend tests before deployment:

```powershell
& 'C:\nvm4w\nodejs\npm.cmd' test -- --runInBand
```

- Current expected baseline after the hardening sweep:
  65 test suites passed
  194 tests passed

- Review these high-value integration specs if behavior changes:
  [`backend/src/modules/auth/auth.controller.integration.spec.ts`](/C:/CompanyOS/backend/src/modules/auth/auth.controller.integration.spec.ts)
  [`backend/src/modules/company/company.controller.integration.spec.ts`](/C:/CompanyOS/backend/src/modules/company/company.controller.integration.spec.ts)
  [`backend/src/modules/onboarding/onboarding.controller.integration.spec.ts`](/C:/CompanyOS/backend/src/modules/onboarding/onboarding.controller.integration.spec.ts)
  [`backend/src/modules/accounting/accounting.controller.integration.spec.ts`](/C:/CompanyOS/backend/src/modules/accounting/accounting.controller.integration.spec.ts)
  [`backend/src/modules/dms/dms.controller.integration.spec.ts`](/C:/CompanyOS/backend/src/modules/dms/dms.controller.integration.spec.ts)

## 12. Logging And Monitoring

- Monitor startup failures caused by env validation.
- Monitor auth and MFA failures for abnormal spikes.
- Monitor `auth.rate_limit.hit` events for repeated brute-force or credential-stuffing patterns.
- Monitor these structured auth-security events specifically:
  `auth.login.failed`,
  `auth.mfa.verify.failed`,
  `auth.mfa.login.failed`,
  `auth.mfa.setup.failed`,
  `auth.mfa.setup.verify.failed`,
  `auth.rate_limit.hit`.
- Monitor 4xx and 5xx rates on protected routes.
- Watch for unexpected `NotFound` or `BadRequest` spikes after deployment, especially on recently hardened tenant-scoped modules.
- If centralized logging is available, add first-pass alerts for:
  more than 10 `auth.rate_limit.hit` events from one IP in 15 minutes,
  more than 20 `auth.login.failed` events for one account in 15 minutes,
  and repeated MFA failure events for the same account.
- Keep [INCIDENT_RUNBOOK.md](/C:/CompanyOS/INCIDENT_RUNBOOK.md) available to on-call responders for auth abuse, MFA lockout, and session/cookie incidents.

## 13. Final Go-Live Sequence

1. Fill out environment values from [`backend/.env.example`](/C:/CompanyOS/backend/.env.example).
2. Deploy backend and frontend to staging with HTTPS enabled.
3. Run backend tests and frontend lint.
4. Execute the auth, MFA, company, DMS, onboarding, accounting, cashflow, and supply-chain smoke tests.
5. Verify tenant-boundary protections with cross-company ID checks.
6. Confirm storage, email, and SMS integrations behave correctly if enabled.
7. Back up production.
8. Deploy to production.
9. Re-run the critical smoke tests immediately after release.
10. Monitor auth, session, and protected-route behavior closely during the first release window.
