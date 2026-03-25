# Release 1 Staging Sign-off

This worksheet is the execution log for the manual staging gate defined in:

- [`RELEASE1_GATE_CHECKLIST.md`](/C:/CompanyOS/RELEASE1_GATE_CHECKLIST.md)

Use this file during staging validation. Do not mark Release 1 ready without completing this record.

## 1. Run Metadata

| Field | Value |
|---|---|
| Staging URL |  |
| Build / commit |  |
| Date |  |
| Operator |  |
| Reviewer |  |
| Result | `Pending` |

## 2. Test Accounts

| Account purpose | Email / identifier | Role | Notes |
|---|---|---|---|
| New company admin |  | Super Admin |  |
| Authenticated standard user |  | Contributor / equivalent |  |
| HRIS-authorized user |  | HR / Manager |  |
| HRIS-unauthorized user |  | Contributor / equivalent |  |

## 3. Auth And Session Checks

| Check | Expected result | Status | Evidence / notes |
|---|---|---|---|
| Register new company | Registration succeeds and creates company/admin/setup state |  |  |
| Login | Valid credentials authenticate successfully |  |  |
| MFA setup | MFA setup succeeds where required |  |  |
| MFA login verify | User completes MFA login challenge successfully |  |  |
| Refresh on protected route | Session survives refresh and `/dashboard` loads |  |  |
| Invalid/expired session | User is redirected to `/login` without stale auth UI |  |  |

## 4. Setup And Initialization Checks

| Check | Expected result | Status | Evidence / notes |
|---|---|---|---|
| `/setup/identity` | Identity step saves successfully |  |  |
| `/setup/departments` | Department selections save successfully |  |  |
| `/setup/configure/:id` | Department config saves successfully |  |  |
| `/setup/org-chart` | Org chart reflects selected departments |  |  |
| `/setup/access` | Access setup completes successfully |  |  |
| Department creation once-only | Selected departments are created once with no duplicates |  |  |
| Setup refresh recovery | Setup state restores from backend after refresh |  |  |
| Returning user routing | Returning users are not forced back into setup |  |  |

## 5. Department Operating Model Checks

| Check | Expected result | Status | Evidence / notes |
|---|---|---|---|
| Department detail render | Mandate, roles, routines, activities, comms, and data pack render |  |  |
| KPI persistence | KPI edits persist and appear in KPI registry |  |  |
| Workflow persistence | Workflow edits persist and rehydrate in wizard |  |  |
| Department consistency | Setup, dashboard, and department views show the same persisted department state |  |  |

## 6. Tasks And Dashboard Checks

| Check | Expected result | Status | Evidence / notes |
|---|---|---|---|
| Task creation with due date | Task saves and due date renders correctly |  |  |
| Task status transition | Status changes persist correctly |  |  |
| Failed task update recovery | UI recovers cleanly from task update failure |  |  |
| Dashboard KPI behavior | Core cards are live-backed or explicitly unavailable |  |  |
| Dashboard exception behavior | No misleading partial-success state during failures |  |  |

## 7. HRIS And Lifecycle Checks

| Check | Expected result | Status | Evidence / notes |
|---|---|---|---|
| Employee creation | Employee record saves successfully |  |  |
| Onboarding artifact creation | Onboarding plan and linked main tasks are created |  |  |
| Onboarding task sync | Completing onboarding task updates linked main task |  |  |
| Employee termination | Offboarding artifacts and main tasks are created |  |  |
| Deprovision sync | Deprovisioning update mirrors to related main task |  |  |

## 8. Access Control Checks

| Check | Expected result | Status | Evidence / notes |
|---|---|---|---|
| Dashboard access | Authenticated user can access dashboard |  |  |
| Tasks access | Authenticated user can access tasks |  |  |
| HRIS protected route | Unauthorized user is blocked from HRIS |  |  |
| Unauthorized state UX | Restricted modules show explicit unauthorized state |  |  |

## 9. Blocking Issues

| Severity | Area | Issue | Owner | Status |
|---|---|---|---|---|
|  |  |  |  |  |

## 10. Waivers

| Item | Reason | Approved by | Date |
|---|---|---|---|
|  |  |  |  |

## 11. Final Decision

| Decision | Approver | Date | Notes |
|---|---|---|---|
| `Go` / `No-Go` |  |  |  |
