# Release 1 Gate Checklist

This checklist is the release gate for the Release 1 operational-core slice on branch `codex/release1-operational-core`.

Release 1 scope:

- platform trust layer
- deterministic company setup
- department operating model
- tasks execution backbone
- dashboard truth layer
- HRIS baseline
- access-control enforcement for daily-use modules

Release 1 explicitly excludes:

- production finance operations
- AP and AR production controls
- payroll as a production payroll engine
- full CRM-to-cash and procurement-to-pay maturity

## 1. Automated Verification

Run the scripted Release 1 verification from the repo root:

```powershell
& 'C:\Program Files\PowerShell\7\pwsh.exe' -File .\scripts\release1-verify.ps1
```

Passing criteria:

- backend Release 1 smoke suite passes
- backend production build passes
- frontend production build passes

Scripted checks included:

- [`backend/package.json`](/C:/CompanyOS/backend/package.json) `test:release1`
- [`backend/package.json`](/C:/CompanyOS/backend/package.json) `build`
- [`frontend/package.json`](/C:/CompanyOS/frontend/package.json) `build:release1`

## 2. Release 1 Backend Smoke Scope

The Release 1 smoke suite currently validates:

- auth session bootstrap and company setup hydration
- company setup progress merge and selected-department creation
- backend-owned department template application
- task creation and status audit behavior
- HRIS employee lifecycle creation and termination
- onboarding and offboarding task synchronization into main tasks

Covered spec files:

- [`auth.service.spec.ts`](/C:/CompanyOS/backend/src/modules/auth/auth.service.spec.ts)
- [`company.service.spec.ts`](/C:/CompanyOS/backend/src/modules/company/company.service.spec.ts)
- [`departments.service.spec.ts`](/C:/CompanyOS/backend/src/modules/departments/departments.service.spec.ts)
- [`tasks.service.spec.ts`](/C:/CompanyOS/backend/src/modules/tasks/tasks.service.spec.ts)
- [`hris.service.spec.ts`](/C:/CompanyOS/backend/src/modules/hris/hris.service.spec.ts)
- [`onboarding.service.spec.ts`](/C:/CompanyOS/backend/src/modules/onboarding/onboarding.service.spec.ts)

## 3. Manual Release Gate Checks

These checks remain manual and must pass in staging before a Release 1 sign-off.

### Auth and session

- register a new company and super-admin account
- log in with valid credentials
- complete MFA setup where required
- complete MFA login verification
- refresh the browser on a protected route
- confirm `/dashboard` loads for authenticated users
- confirm expired or invalid session routes back to `/login`

### Setup and company initialization

- complete setup from:
  - `/setup/identity`
  - `/setup/departments`
  - `/setup/configure/:id`
  - `/setup/org-chart`
  - `/setup/access`
- verify selected departments are created once
- verify refresh during setup restores backend-owned setup state
- verify returning users are not redirected into setup unintentionally

### Departments and operating model

- open a configured department from `/departments/:id`
- confirm mandate, roles, routines, activities, communication lines, and data pack render
- edit department configuration through `/setup/configure/:id`
- verify KPI definitions persist and appear in the KPI registry
- verify workflow definitions persist and rehydrate in the wizard

### Tasks and dashboard

- create a task with a due date
- move a task between supported statuses
- confirm failed task updates recover UI state cleanly
- confirm dashboard core KPI cards render live-backed or explicit safe states
- confirm dashboard exception behavior does not show misleading partial success

### HRIS and lifecycle operations

- create an employee record
- confirm onboarding artifacts and related main tasks are created
- complete an onboarding task and confirm the linked main task updates
- terminate an employee and confirm offboarding artifacts and related main tasks are created
- update offboarding deprovisioning and confirm the related main task mirrors the status

### Access control

- confirm `dashboard` is reachable for authenticated users
- confirm `tasks` is reachable for authenticated users
- confirm `hris` is blocked for unauthorized roles
- confirm restricted modules show an explicit unauthorized state

## 4. Sign-off Criteria

Release 1 is ready only if all of the following are true:

- automated Release 1 verification passes without modification
- no missing-table or missing-column failures occur in core Release 1 flows
- auth, MFA, and session restore behave consistently in staging
- setup completes without dashboard-side repair logic
- departments render consistent persisted state across setup, dashboard, and department views
- department KPI and workflow edits persist correctly
- tasks support due dates and state transitions without silent failure
- HRIS lifecycle actions publish onboarding and offboarding work into the main task flow
- unauthorized access is blocked cleanly on protected Release 1 modules

## 5. Current Known Gaps

These do not block Release 1 by definition, but they remain outside the release boundary:

- full centralized record-scope filtering across every module
- frontend browser-automation smoke coverage
- finance production controls
- payroll production hardening
- cross-department enterprise workflow inbox maturity

