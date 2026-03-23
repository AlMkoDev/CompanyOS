# Incident Runbook

This runbook is for production and staging incidents involving authentication abuse, MFA failures, cookie/session issues, and related access disruptions in CompanyOS.

Use it alongside [DEPLOYMENT_CHECKLIST.md](/C:/CompanyOS/DEPLOYMENT_CHECKLIST.md), [SECURITY_OVERVIEW.md](/C:/CompanyOS/SECURITY_OVERVIEW.md), and [`backend/.env.example`](/C:/CompanyOS/backend/.env.example).

## 1. Quick Triage

When an auth or session incident is reported:

1. Confirm impact scope.
2. Identify whether the issue is:
   - abuse or brute-force activity
   - a user-specific MFA problem
   - a broader cookie/session outage
   - a deployment or environment regression
3. Check the most recent deploy and env changes first.

Primary signals to review:

- `auth.login.failed`
- `auth.mfa.verify.failed`
- `auth.mfa.login.failed`
- `auth.mfa.setup.failed`
- `auth.mfa.setup.verify.failed`
- `auth.rate_limit.hit`
- backend startup failures
- reverse-proxy / ingress logs
- frontend login/session error reports

## 2. Auth Abuse / Brute-Force Response

Symptoms:

- repeated `auth.rate_limit.hit`
- repeated `auth.login.failed`
- bursts of failures from one IP or IP block
- many accounts targeted from a single source

Immediate checks:

- identify top offending IPs or forwarded IPs
- identify whether the attempts target one account or many
- confirm whether the rate-limit guard is returning `429`
- check whether the login endpoint is still healthy for normal traffic

Containment actions:

- block the abusive IP or IP range at the edge, proxy, WAF, or load balancer if available
- tighten upstream access rules temporarily if the attack is broad
- keep the app rate limits enabled; do not remove them as a workaround

Escalate if:

- the same source hits many accounts quickly
- abusive traffic is saturating the app or proxy
- there is evidence of successful compromise, not just failed attempts

After containment:

- review whether privileged accounts have MFA enabled
- review alert thresholds if the attack was noisy but not caught early enough
- document the observed IPs, account targets, and time window

## 3. User Locked Out By MFA Or Login Flow

Symptoms:

- user reports valid password but cannot complete login
- repeated `auth.mfa.login.failed`
- repeated `auth.mfa.setup.verify.failed`
- privileged user stuck in bootstrap MFA setup flow

Immediate checks:

- confirm whether the user is in a role covered by `REQUIRED_MFA_ROLES`
- confirm whether the user has `mfa_enabled` set and whether `mfa_secret` exists
- confirm whether the reported failure is:
  - expired MFA token
  - invalid MFA setup token
  - invalid TOTP code
  - device clock drift on the user’s authenticator device

Safe recovery options:

- have the user retry with a fresh login flow before changing backend data
- verify the authenticator device clock is set automatically
- if the account is misconfigured, reset MFA state for that user in a controlled admin process

Use caution:

- do not disable MFA globally to recover one user
- do not widen `REQUIRED_MFA_ROLES` exceptions during an incident unless leadership explicitly approves the risk

Post-incident follow-up:

- record whether the failure was user error, config drift, or real app defect
- review whether an internal admin MFA-reset procedure should be documented separately

## 4. Cookie / Session Outage

Symptoms:

- users can log in but are immediately treated as logged out
- `GET /auth/me` fails unexpectedly after refresh
- login succeeds in one environment but not another
- issues appear only behind one proxy or one hostname

Immediate checks:

- verify:
  - `AUTH_COOKIE_SAME_SITE`
  - `AUTH_COOKIE_SECURE`
  - `AUTH_COOKIE_DOMAIN`
  - `AUTH_COOKIE_MAX_AGE_MS`
  - `FRONTEND_ORIGIN`
  - `ENABLE_HSTS`
- confirm the frontend is using the correct API base URL
- confirm cookies are present in browser devtools
- confirm the proxy is not stripping or rewriting cookies
- confirm HTTPS termination and forwarded headers are correct

Fast diagnosis path:

1. Login in the affected environment.
2. Inspect the `Set-Cookie` header.
3. Refresh and call `/auth/me`.
4. Compare working versus failing environments.

Common causes:

- `SameSite=None` without usable HTTPS
- incorrect cookie domain for the deployed host
- cross-site origin mismatch
- proxy rewriting headers or dropping cookies
- HSTS enabled too early on a partially HTTPS setup

Recovery actions:

- correct cookie/env settings and redeploy
- roll back the most recent auth/session env change if needed
- if proxy behavior changed, restore the last known good proxy config first

## 5. Startup Failure Due To Security Validation

Symptoms:

- backend fails to boot
- deploy rolls back immediately
- logs show env validation errors

Immediate checks:

- inspect the exact validation error first
- compare env values against [`backend/.env.example`](/C:/CompanyOS/backend/.env.example)
- check for:
  - missing `JWT_SECRET`
  - invalid `FRONTEND_ORIGIN`
  - invalid cookie settings
  - partial `S3_*`, `SMTP_*`, or `AT_*` config
  - invalid feature flag or `ENABLE_HSTS` values

Recovery actions:

- fix the env var rather than weakening validation
- redeploy with the corrected env values
- if the change was part of a rushed release, restore the last known good env set

## 6. Security Header / Browser Protection Regression

Symptoms:

- Swagger docs break unexpectedly
- browser-side requests or embeds behave differently after deploy
- security scans report missing headers

Immediate checks:

- confirm these headers are present on normal API routes:
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `Cross-Origin-Opener-Policy`
  - `Content-Security-Policy`
- confirm Swagger still loads under `/api/docs`
- confirm the reverse proxy is not removing or overriding headers

Recovery actions:

- if a proxy override is the problem, fix the proxy first
- if a route is broken because of CSP assumptions, adjust carefully and narrowly
- do not disable all security headers as a blanket workaround

## 7. Communications Guidance

When users are affected:

- acknowledge whether the issue is account-specific or broad
- avoid promising a root cause before confirming it
- if abuse is suspected, tell users whether resets or re-authentication are required
- if cookies/sessions are affected, tell users whether a full browser restart or fresh login is expected after the fix

## 8. Post-Incident Checklist

After the incident is stable:

1. Document timeline, root cause, and impact.
2. Record affected users, companies, and environments.
3. Note whether the issue was caught by:
   - alerting
   - user report
   - deploy monitoring
4. Add a regression test or config check if one was missing.
5. Update:
   - [SECURITY_OVERVIEW.md](/C:/CompanyOS/SECURITY_OVERVIEW.md)
   - [DEPLOYMENT_CHECKLIST.md](/C:/CompanyOS/DEPLOYMENT_CHECKLIST.md)
   - this runbook

## 9. Quick Reference

High-priority auth signals:

- more than 10 `auth.rate_limit.hit` events from one IP in 15 minutes
- more than 20 `auth.login.failed` events for one account in 15 minutes
- more than 10 MFA failure events for one account in 15 minutes
- any sudden multi-account auth failure burst from the same IP block

Key config values to verify during session incidents:

- `AUTH_COOKIE_SAME_SITE`
- `AUTH_COOKIE_SECURE`
- `AUTH_COOKIE_DOMAIN`
- `AUTH_COOKIE_MAX_AGE_MS`
- `FRONTEND_ORIGIN`
- `ENABLE_HSTS`
- `REQUIRED_MFA_ROLES`
