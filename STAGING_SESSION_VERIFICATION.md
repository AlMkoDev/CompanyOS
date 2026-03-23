# Staging Session Verification

This document is the working checklist for closing item 1 in [GAP_CLOSURE_PLAN.md](/C:/CompanyOS/GAP_CLOSURE_PLAN.md):

- Production Cookie / Session Verification

The goal is to prove that the cookie-backed auth/session model works correctly in a staging environment that matches the intended production proxy, domain, HTTPS, and CORS setup.

## 1. Verification Goal

We want one known-good staging configuration with:

- correct cookie behavior
- correct cross-origin behavior
- correct refresh/session restore behavior
- correct logout behavior
- correct security-header behavior

This should be treated as a deployment proof, not just a code check.

## 2. Status

Current status: `Open`

Change to:

- `In Progress` when staging values are filled in
- `Done` when all checks pass and final values are documented

## 3. Environment Matrix

Fill this out with the actual staging values before testing.

| Setting | Expected Staging Value | Actual Value | Verified |
| --- | --- | --- | --- |
| Frontend URL | `https://companyos-staging.vercel.app` |  |  |
| Backend URL | `https://companyos-api-staging.onrender.com` |  |  |
| `NEXT_PUBLIC_API_BASE_URL` | `https://companyos-api-staging.onrender.com` |  |  |
| `FRONTEND_ORIGIN` | `https://companyos-staging.vercel.app` |  |  |
| `AUTH_COOKIE_NAME` | `companyos_auth` |  |  |
| `AUTH_COOKIE_DOMAIN` | blank for the first staging pass |  |  |
| `AUTH_COOKIE_SAME_SITE` | `none` |  |  |
| `AUTH_COOKIE_SECURE` | `true` |  |  |
| `AUTH_COOKIE_MAX_AGE_MS` | `1800000` |  |  |
| `ENABLE_HSTS` | `false` for the first verification pass |  |  |
| Proxy / ingress | forwards cookies and preserves security headers |  |  |
| HTTPS termination point | documented and known |  |  |

## 4. Pre-Check Assumptions

Before testing, confirm:

- backend is running with the intended staging env values
- frontend is using the intended staging API base URL
- no local dev proxy behavior is masking real cross-origin behavior
- browser cache from older cookie settings is cleared before the final pass

## 5. Core Session Checks

Run these in order.

### A. Login

Steps:

1. Open the staging frontend in a clean browser session.
2. Log in with a normal user account.
3. Inspect the network response for the login request.
4. Confirm a `Set-Cookie` header is returned.

Expected:

- login succeeds
- auth cookie is set
- cookie flags match the intended env values

Record:

- pass / fail
- actual cookie attributes observed

### B. Refresh And Session Restore

Steps:

1. After successful login, refresh the app.
2. Observe whether the app restores the user session.
3. Verify `/auth/me` succeeds from the refreshed state.

Expected:

- user remains logged in
- no unexpected redirect to login
- cookie-backed session restore works without stored bearer token behavior

### C. Deep-Link Navigation

Steps:

1. While authenticated, open a protected route directly in a new tab.
2. Test at least:
   - dashboard
   - one DMS page
   - one setup or admin page

Expected:

- deep-link load succeeds
- session is restored from cookie-backed auth
- no intermittent unauthorized redirect appears

### D. Logout

Steps:

1. Log out from the authenticated session.
2. Inspect the logout response.
3. Refresh the app after logout.

Expected:

- cookie is cleared
- `/auth/me` no longer restores a session
- user stays logged out after refresh

## 6. MFA Session Checks

Run these after the basic session flow works.

### A. MFA-Enabled User

Steps:

1. Log in as an MFA-enabled user.
2. Confirm the password step does not issue a normal session directly.
3. Complete the MFA challenge.

Expected:

- login returns MFA challenge first
- session cookie is only established after successful MFA verification

### B. Privileged-Role MFA Bootstrap

Steps:

1. Log in as a user whose role is covered by `REQUIRED_MFA_ROLES` and who does not yet have MFA enabled.
2. Confirm the app enters the bootstrap MFA setup flow.
3. Complete setup and verification.

Expected:

- privileged user cannot complete normal login without enabling MFA
- setup flow succeeds
- final session is created only after successful verification

## 7. Cross-Origin And Cookie Attribute Checks

Confirm the cookie attributes match the deployment model.

### Cross-Site Staging

For the recommended free-host setup:

- frontend: `*.vercel.app`
- backend: `*.onrender.com`

This is cross-site staging, so verify:

- `AUTH_COOKIE_SAME_SITE=none`
- `AUTH_COOKIE_SECURE=true`
- browser accepts the cookie over HTTPS
- CORS allows the frontend origin with credentials enabled

## 8. Security Header Checks

Check one normal API route and one Swagger route.

### Normal API Route

Expected headers:

- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Cross-Origin-Opener-Policy`
- `Content-Security-Policy`

### Swagger

Expected:

- `/api/docs` still loads
- Swagger is not broken by the baseline CSP logic

## 9. Failure Diagnosis Guide

If login appears to succeed but the user is logged out after refresh:

- inspect `Set-Cookie`
- inspect `AUTH_COOKIE_SAME_SITE`
- inspect `AUTH_COOKIE_SECURE`
- inspect `AUTH_COOKIE_DOMAIN`
- inspect `FRONTEND_ORIGIN`
- verify browser is actually storing the cookie
- verify proxy is not stripping cookie headers

If `/auth/me` fails after login:

- confirm cookie is present on the request
- confirm backend sees the correct domain/origin/proxy headers
- confirm CORS is allowing credentials

If cross-site staging fails:

- verify `AUTH_COOKIE_SAME_SITE=none`
- verify `AUTH_COOKIE_SECURE=true`
- verify full HTTPS
- verify frontend origin exactly matches `FRONTEND_ORIGIN`

## 10. Completion Criteria

This item can be marked `Done` in [GAP_CLOSURE_PLAN.md](/C:/CompanyOS/GAP_CLOSURE_PLAN.md) when:

- the environment matrix is filled with real staging values
- all core session checks pass
- MFA and privileged-role bootstrap checks pass
- security-header checks pass
- the final known-good staging values are captured for production rollout

## 11. Final Notes

When this verification is complete, update:

- [GAP_CLOSURE_PLAN.md](/C:/CompanyOS/GAP_CLOSURE_PLAN.md)
- [DEPLOYMENT_CHECKLIST.md](/C:/CompanyOS/DEPLOYMENT_CHECKLIST.md)
- [INCIDENT_RUNBOOK.md](/C:/CompanyOS/INCIDENT_RUNBOOK.md)

with any staging-specific lessons learned.
