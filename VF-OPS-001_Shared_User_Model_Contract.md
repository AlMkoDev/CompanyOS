# VF-OPS-001 — Shared User Model Contract

## Document Control
- **Version:** 1.0
- **Status:** Draft
- **Sprint:** 0
- **Owners:** PPM Team, CLM Team (VF-LEG-001)
- **Date:** 2026-03-15

---

## 1. Purpose

This document defines the interface between the Project & Portfolio Management (PPM) module and the shared User/Employee model from VF-LEG-001 (CLM). It prevents data duplication and ensures consistent authentication/authorization across both modules.

---

## 2. Shared User Model

### 2.1 Base Employee Model (from VF-LEG-001)

The `Employee` model is owned by VF-LEG-001 and serves as the authoritative source for user data:

```prisma
model Employee {
  id               String    @id @default(uuid()) @db.Uuid
  emp_no           String    @unique
  first_name       String
  last_name        String
  email            String    @unique
  phone            String?
  national_id      String?
  kra_pin          String?
  status           String    @default("active") // active, probation, terminated
  hire_date        DateTime
  termination_date DateTime?
  company_id       String    @db.Uuid
  department_id    String?   @db.Uuid
  position_id      String?   @db.Uuid
  manager_id       String?   @db.Uuid
  employment_type  String    @default("full-time")
  salary_grade     String?
  avatar_url       String?
  created_at       DateTime  @default(now())
  updated_at       DateTime  @updatedAt
  
  // Relations
  company      Company             @relation(fields: [company_id], references: [id])
  department   Department?         @relation(fields: [department_id], references: [id])
  manager      Employee?           @relation("ManagerReports", fields: [manager_id], references: [id])
  reports      Employee[]          @relation("ManagerReports")
  position     Position?           @relation(fields: [position_id], references: [id])
  
  // PPM-specific relations (added for VF-OPS-001)
  ownedProjects        Project[]              @relation("ProjectOwner")
  assignedTasks        ProjectTask[]          @relation("TaskAssignee")
  resourceAssignments  ResourceAssignment[]   @relation("ResourceAssignee")
  gateApprovals        GateReview[]           @relation("GateApprover")
  decisionRecords      DecisionRecord[]       @relation("DecisionApprover")
}
```

### 2.2 PPM Extensions

PPM adds the following relations to the Employee model but **does not duplicate any base fields**:

#### New Relations (PPM-specific):
```prisma
// In Employee model (added to existing CLM schema)
ownedProjects: Project[]           // Projects where user is Owner
assignedTasks: ProjectTask[]       // Tasks assigned to user
resourceAssignments: ResourceAssignment[]  // Resource allocations
gateApprovals: GateReview[]        // Gate review approvals
decisionRecords: DecisionRecord[]  // Decision approvals
```

---

## 3. Role Enumerations

### 3.1 Shared Roles (from VF-LEG-001)

These roles are defined in VF-LEG-001 and reused in PPM:

```typescript
enum UserRole {
  ADMIN           // Full system access
  MANAGER         // Department/team management
  EMPLOYEE        // Standard user access
  STAKEHOLDER     // Limited read-only access
}
```

### 3.2 PPM-Specific Roles

PPM introduces additional role enumerations specific to project management:

```prisma
enum ProjectRole {
  PMO_ADMIN       // PMO team - full portfolio access
  PROJECT_MANAGER // Can create/manage own projects
  TEAM_MEMBER     // Can work on assigned tasks
  STAKEHOLDER     // Read-only viewer (external/internal)
  FINANCE         // Budget management access
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  BLOCKED
  DONE
}

enum RAGStatus {
  GREEN
  AMBER
  RED
}

enum RAIDType {
  RISK
  ACTION
  ISSUE
  DECISION
}

enum Priority {
  CRITICAL
  HIGH
  MEDIUM
  LOW
}

enum GateStatus {
  PENDING
  PASSED
  FAILED
  WAIVED
}
```

---

## 4. JWT Claims Structure

### 4.1 Token Payload

The JWT token issued by the shared auth service (VF-LEG-001) includes:

```typescript
interface JWTPayload {
  sub: string;           // User ID (Employee.id)
  email: string;         // Employee.email
  firstName: string;     // Employee.first_name
  lastName: string;      // Employee.last_name
  companyId: string;     // Employee.company_id
  role: UserRole;        // Shared role from VF-LEG-001
  projectRoles?: Array<{  // PPM-specific project assignments
    projectId: string;
    role: ProjectRole;
  }>;
  iat: number;
  exp: number;
}
```

### 4.2 Authorization Guards

PPM implements the following NestJS guards based on JWT claims:

```typescript
// Guard Hierarchy
AdminGuard        // Requires role === UserRole.ADMIN
PMOGuard          // Requires role === UserRole.ADMIN OR ProjectRole.PMO_ADMIN
ProjectManagerGuard // Requires ProjectRole.PROJECT_MANAGER or owner
MemberGuard       // Requires ProjectRole.TEAM_MEMBER or assigned
StakeholderGuard  // Requires ProjectRole.STAKEHOLDER or UserRole.STAKEHOLDER
FinanceGuard      // Requires ProjectRole.FINANCE or UserRole.ADMIN
```

---

## 5. Data Ownership & Boundaries

### 5.1 Owned by VF-LEG-001 (CLM)
- Employee CRUD operations
- User authentication & JWT issuance
- Base UserRole enum
- Company, Department, Position models

### 5.2 Owned by VF-OPS-001 (PPM)
- Project, ProjectTask, RAIDItem models
- ProjectRole enum
- ResourceAssignment model
- GateReview, DecisionRecord models
- All PPM-specific enums

### 5.3 Shared Access Patterns
- PPM reads Employee data via Prisma relations (no duplication)
- PPM writes only to PPM-specific models
- Employee updates flow through CLM APIs only
- PPM listens to Employee events (hire, termination, role change) via notification service

---

## 6. API Contracts

### 6.1 User Lookup Endpoints (CLM → PPM)

PPM exposes these endpoints for CLM to query user project associations:

```typescript
GET /ops/users/:userId/projects
// Returns: Array<{ projectId, projectName, role: ProjectRole }>

GET /ops/users/:userId/capacity
// Returns: { 
//   allocatedHours: number, 
//   availableHours: number, 
//   overallocated: boolean 
// }
```

### 6.2 Notification Service Integration

PPM subscribes to these events from CLM:

```typescript
// Event: Employee.created
{
  type: 'EMPLOYEE_CREATED',
  payload: { id, email, firstName, lastName, companyId }
}

// Event: Employee.terminated
{
  type: 'EMPLOYEE_TERMINATED',
  payload: { id, companyId, terminationDate }
}

// Event: UserRole.changed
{
  type: 'ROLE_CHANGED',
  payload: { userId, oldRole, newRole }
}
```

---

## 7. Migration Strategy

### 7.1 Database Schema Updates

When deploying PPM alongside CLM:

1. **Expand-contract pattern:** Add nullable columns first, backfill data, then make non-nullable
2. **No breaking changes:** Existing CLM queries must continue working
3. **Foreign key validation:** All new FK constraints validated in staging before production

### 7.2 Rollback Plan

If PPM deployment fails:
1. Disable ENABLE_PPM feature flag
2. Remove PPM-specific relations from Employee model (nullable fields only)
3. Restore CLM-only schema state
4. Verified rollback script tested in staging before production

---

## 8. Security & Access Control

### 8.1 Data Isolation

- Users see only projects they're assigned to unless Admin/PMO
- Query filters applied at repository layer (not just service layer)
- Return 404 (not 403) for unauthorized project access to prevent enumeration

### 8.2 Audit Requirements

All PPM actions logged to `ProjectAuditLog` include:
- `userId` (Employee.id)
- `action` (CREATE, UPDATE, DELETE, STATE_CHANGE)
- `previousValue` (JSON)
- `newValue` (JSON)
- `timestamp`
- `ipAddress`

---

## 9. Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| PPM Lead | _TBD_ | _Pending_ | ⏳ |
| CLM Lead | _TBD_ | _Pending_ | ⏳ |
| Backend Architect | _TBD_ | _Pending_ | ⏳ |
| DBA | _TBD_ | _Pending_ | ⏳ |

---

## 10. Next Steps

1. ✅ Schedule contract review meeting (CLM + PPM teams)
2. ✅ Finalize Employee model extensions
3. ✅ Agree on JWT claim structure
4. ✅ Document notification service event contracts
5. ✅ Sign off before Sprint 1 begins

---

**This document is confidential and intended for internal use only.**  
*VF-OPS-001 v1.0 — CompanyOS Project & Portfolio Management*
