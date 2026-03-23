VF-LEG-002: Regulatory & Compliance Calendar  
Status  
Draft  
Priority  
High  
Owner  
Legal & Compliance  
Stack  
NestJS, Next.js, Prisma, PostgreSQL, S3  
Target  
Q3 Release  
Epic  
Legal Operations & Risk Management  
Dependency  
VF-LEG-001 (CLM)  
Relation  
Shared S3 Bucket, Shared User Model  
1\. Executive Summary  
The Compliance module ensures the organization stays ahead of statutory and regulatory deadlines (Tax, Labour, Industry-specific) through a centralized calendar, proactive alerts, and a verified filing repository. This system mitigates regulatory risk, prevents penalties, and ensures audit readiness by maintaining an immutable history of filings.  
Key Value Propositions:  
Risk Mitigation: Proactive alerts prevent missed statutory deadlines.  
Audit Readiness: Centralized repository of proof of filing (certificates, receipts).  
Accountability: Clear ownership of compliance tasks across departments.  
2\. Technical Specifications  
2.1 Database Schema (Prisma)  
Refinement: Added Recurrence Logic, Proof Storage, and Audit Trails.  
prisma  
123456789101112131415161718192021222324252627282930313233343536373839404142434445464748495051525354555657585960616263

2.2 Backend (NestJS)  
Refinement: Recurrence Engine, Notification Service, Shared S3.  
Module Structure:  
compliance/  
deadlines/ (CRUD \+ Recurrence Logic)  
assignments/ (Ownership Management)  
proofs/ (S3 Upload/Download)  
notifications/ (Cron \+ Email)  
reports/ (Audit Export)  
Key Service Logic:  
Recurrence Engine:  
When a deadline is marked FILED, automatically calculate and create the nextOccurrence based on recurrence type.  
Example: If YEARLY and filed 2023-03-01, create new instance for 2024-03-01.  
Reminder Service (Cron):  
Runs daily at 09:00.  
Query: dueDate IN (Today \+ 30, Today \+ 14, Today \+ 7).  
Action: Send Email \+ In-App Notification to ComplianceAssignment users.  
Overdue Check: Query dueDate \< Today AND status \!= FILED. Mark as OVERDUE.  
Proof Repository:  
Reuse S3 bucket from VF-LEG-001 but separate folder structure: /compliance/proofs/{deadlineId}/.  
Validate file types (PDF, PNG, JPG only). Max size 10MB.  
Audit Trail:  
Log every status change and file upload to ComplianceAuditLog.  
API Endpoints (REST):  
GET /compliance/calendar?month=YYYY-MM (Get deadlines for view)  
POST /compliance/deadlines (Create obligation)  
PATCH /compliance/deadlines/:id/status (Mark as Filed/Overdue)  
POST /compliance/deadlines/:id/proof (Upload certificate)  
GET /compliance/reports/audit (Export audit log for external auditors)  
2.3 Frontend (Next.js)  
Refinement: Calendar Integration, Dashboard Widgets.  
Routes & Pages:  
/app/(ops)/strategy/compliance/dashboard  
Component: ComplianceStats (Cards: Overdue, Due This Month, Completed).  
Component: DeadlineList (Sorted by urgency).  
/app/(ops)/strategy/compliance/calendar  
Component: InteractiveCalendar (FullCalendar or similar).  
Feature: Click event opens "Filing Wizard" modal.  
Visuals: Color-coded dots on dates (Red=Overdue, Green=Filed).  
/app/(ops)/strategy/compliance/filing-wizard (Modal)  
Step 1: Confirm Filing Date.  
Step 2: Upload Proof (Drag & Drop).  
Step 3: Add Notes/Reference Number.  
Action: Submits to Backend, triggers status change to FILED.  
Security Implementation:  
RBAC: Compliance Officers (Full Access), Department Heads (View Own Category), Staff (No Access).  
File Security: Presigned URLs for proof downloads (same as CLM).  
3\. Verification & Quality Plan  
3.1 Automated Testing  
Unit Tests (Jest):  
RecurrenceService: Verify next date calculation (handle leap years, month ends).  
NotificationService: Verify email triggers on T-30, T-14, T-7.  
Integration Tests (Supertest):  
Flow: Create Deadline → Upload Proof → Mark Filed → Verify Next Occurrence Created.  
Security: Verify unauthorized users cannot upload proofs.  
E2E Tests (Playwright):  
Navigate to Calendar → Click Date → Upload Proof → Verify Status Change.  
3.2 Manual Verification (UAT)  
Setup: Create "VAT Submission" (Monthly) and "Annual Return" (Yearly).  
Alerts: Manually adjust date to trigger T-7 alert. Verify Email received.  
Filing: Upload a dummy PDF proof. Verify it downloads correctly.  
Recurrence: Mark Monthly task as Filed. Verify new task appears for next month.  
Audit: Export Audit Log. Verify it contains user stamps for all actions.  
3.3 Performance & Security  
Storage: Ensure S3 bucket policies match CLM standards (Encryption, No Public Access).  
Load: Test calendar loading with 500+ historical deadlines.  
Privacy: Ensure sensitive tax data is accessible only by authorized roles.  
4\. Risks & Mitigation  
Risk  
Impact  
Mitigation  
Missed Alert  
High  
Dual channel notifications (Email \+ In-App). Escalate to Manager if overdue \> 3 days.  
Recurrence Logic Error  
High  
Unit test edge cases (e.g., Jan 31st → Feb 28th). Manual review of generated instances.  
Lost Proof  
Medium  
S3 Versioning enabled. Audit log tracks upload metadata.  
False Compliance  
High  
Require "Proof Upload" to change status to FILED (cannot mark filed without proof).  
5\. Migration & Rollout  
Phase 1 (Data Entry): Compliance Team manually inputs all known statutory deadlines for the current fiscal year.  
Phase 2 (Alerts): Enable email notifications for internal team.  
Phase 3 (Proofs): Enforce mandatory proof upload for all new filings.  
Phase 4 (Audit): Enable external audit export feature.  
VF-LEG-002: Regulatory & Compliance Calendar \- Implementation Task List  
This task list breaks down the Technical Design Document into actionable tickets. Tasks are organized by Epic/Phase.  
Legend:  
SP: Story Points (Effort Estimate: 1=Small, 13=Large)  
Role: BE (Backend), FE (Frontend), DB (Database), QA (Quality Assurance), DEVOPS (Infrastructure)  
Priority: P0 (Critical), P1 (High), P2 (Medium)  
📦 Epic 1: Foundation & Database Setup  
Goal: Establish the data model for compliance tracking.  
ID  
Task Title  
Description  
Acceptance Criteria  
Role  
SP  
Priority  
DB-01  
Update Prisma Schema for Compliance  
Implement models: ComplianceDeadline, ComplianceAssignment, ComplianceProof, ComplianceAuditLog. Add Enums.  
Schema migrates successfully. Relations to User model verified.  
DB  
3  
P0  
DB-02  
Seed Initial Compliance Categories  
Create seed script for default categories (Tax, Labour, B-BBEE, Industry).  
Running prisma db seed populates categories.  
DB  
2  
P1  
INF-01  
Configure S3 Folder Structure  
Create /compliance/proofs/ folder in existing CLM S3 bucket. Update IAM policies.  
Backend can write to new folder. Public access remains blocked.  
DEVOPS  
2  
P0  
INF-02  
Setup Notification Service  
Configure Email Service (SMTP/SendGrid) for compliance alerts.  
Test email sends successfully from backend.  
BE  
3  
P1  
⚙️ Epic 2: Backend Core Logic  
Goal: Implement API endpoints, recurrence logic, and cron jobs.  
ID  
Task Title  
Description  
Acceptance Criteria  
Role  
SP  
Priority  
BE-01  
Implement Deadline CRUD  
Create endpoints to create, read, update, delete Compliance Deadlines.  
POST/GET/PUT endpoints work. Recurrence rules validated.  
BE  
5  
P0  
BE-02  
Recurrence Engine Logic  
Implement logic to generate nextOccurrence when a deadline is marked FILED.  
Marking Jan deadline as Filed creates Feb deadline automatically.  
BE  
8  
P0  
BE-03  
Assignment Management  
Implement endpoints to assign Users to Deadlines (ComplianceAssignment).  
Users can be added/removed. Notifications target assigned users.  
BE  
3  
P1  
BE-04  
Proof Upload Service  
Implement S3 upload logic for proofs. Validate file types (PDF/Img) and size.  
File uploads to S3. URL stored in DB. Invalid files rejected.  
BE  
5  
P0  
BE-05  
Reminder Cron Job  
Implement daily job to check T-30, T-14, T-7 dates and send emails.  
Job runs daily. Emails sent to correct users.  
BE  
5  
P0  
BE-06  
Overdue Status Automation  
Implement logic to auto-mark deadlines as OVERDUE if dueDate passes.  
Job runs daily. Status updates correctly.  
BE  
3  
P1  
BE-07  
Audit Logging Interceptor  
Create NestJS Interceptor to log all actions to ComplianceAuditLog.  
Every change creates an immutable log entry.  
BE  
5  
P1  
BE-08  
Secure Proof Retrieval  
Implement endpoint to generate Presigned S3 URLs for proofs.  
URL expires after 15 mins. Direct S3 access denied.  
BE  
3  
P0  
🎨 Epic 3: Frontend Implementation  
Goal: Build user interfaces for calendar management and filing.  
ID  
Task Title  
Description  
Acceptance Criteria  
Role  
SP  
Priority  
FE-01  
Compliance Dashboard  
Build /strategy/compliance/dashboard with stats cards (Overdue, Due Soon).  
Stats match backend data. Cards color-coded.  
FE  
5  
P0  
FE-02  
Interactive Calendar View  
Build /strategy/compliance/calendar using calendar library.  
Deadlines display on correct dates. Color-coded by status.  
FE  
8  
P0  
FE-03  
Filing Wizard Modal  
Build modal for marking deadlines as Filed \+ Uploading Proof.  
Form validates input. File upload shows progress. Submits correctly.  
FE  
8  
P0  
FE-04  
Deadline Detail View  
Build view to see history, proofs, and audit log for a specific deadline.  
Timeline shows all uploads and status changes.  
FE  
5  
P1  
FE-05  
Assignment UI  
Allow users to add/remove owners on a deadline via UI.  
Dropdown selects users. Changes reflect in DB.  
FE  
3  
P1  
FE-06  
Notification Center  
Display compliance alerts in global app notification bell.  
Alerts appear when T-7/T-14 triggers fire.  
FE  
3  
P1  
FE-07  
RBAC Implementation  
Implement Frontend Guards based on User Role (Compliance, Manager).  
Buttons hidden for unauthorized users.  
FE  
5  
P0  
FE-08  
Audit Export View  
Build simple table view for Audit Logs with "Export CSV" button.  
CSV downloads correctly with all log data.  
FE  
3  
P2  
🛡️ Epic 4: Security & Compliance  
Goal: Ensure data protection and regulatory integrity.  
ID  
Task Title  
Description  
Acceptance Criteria  
Role  
SP  
Priority  
SEC-01  
API Role Guards  
Implement NestJS Guards (ComplianceOfficerGuard).  
Unauthorized requests return 403\.  
BE  
3  
P0  
SEC-02  
File Type Validation  
Enforce strict MIME type checking on proof uploads.  
Executables/Scripts rejected.  
BE  
2  
P0  
SEC-03  
Audit Log Integrity  
Ensure Audit Logs cannot be modified via API.  
No DELETE/PUT endpoints exposed for AuditLog.  
BE  
2  
P0  
SEC-04  
Data Retention Policy  
Implement soft-delete for Deadlines (keep for audit history).  
Deleted items marked archived not removed from DB.  
BE  
3  
P1  
🧪 Epic 5: Quality Assurance & Testing  
Goal: Verify functionality, recurrence logic, and security.  
ID  
Task Title  
Description  
Acceptance Criteria  
Role  
SP  
Priority  
QA-01  
Unit Tests (Recurrence)  
Write Jest tests for date calculation (Month ends, Leap years).  
Code coverage \>80% for recurrence logic.  
QA/BE  
5  
P1  
QA-02  
Integration Tests  
Test API flows: Create → Assign → Upload Proof → File → Verify Next Instance.  
All endpoints return expected status codes.  
QA/BE  
8  
P1  
QA-03  
E2E Calendar Test  
Playwright script: Login → Open Calendar → Click Date → File → Verify Update.  
Script passes consistently in Staging.  
QA  
5  
P1  
QA-04  
Security Pen-Test  
Attempt to upload malicious file types. Attempt to access other dept deadlines.  
System rejects files and access attempts.  
QA/SEC  
5  
P0  
QA-05  
UAT: Compliance Team  
Compliance Officer inputs real deadlines and simulates filing.  
Sign-off from Compliance Head confirming workflow.  
QA/PM  
3  
P0  
🚀 Epic 6: Deployment & Rollout  
Goal: Safe release to production.  
ID  
Task Title  
Description  
Acceptance Criteria  
Role  
SP  
Priority  
OPS-01  
Feature Flag Setup  
Wrap Compliance module in ENABLE\_COMPLIANCE feature flag.  
Module is invisible/off when flag is false.  
DEVOPS  
2  
P0  
OPS-02  
Production Migration  
Run Prisma migrations on Prod DB.  
Zero downtime or scheduled maintenance completed.  
DEVOPS  
3  
P0  
OPS-03  
Cron Job Monitoring  
Setup alerts if Cron Job fails to run for 24 hours.  
Alert triggers on job failure.  
DEVOPS  
3  
P1  
OPS-04  
User Training  
Conduct workshop with Compliance Team on using the Calendar.  
Team confirms understanding of workflow.  
PM  
3  
P1  
📋 Definition of Done (DoD)  
For any task to be considered complete:  
Code is merged to develop branch.  
Unit/Integration tests pass in CI pipeline.  
Code reviewed by at least one senior engineer.  
Security checks (SAST/DAST) pass.  
Feature verified in Staging environment.  
📅 Suggested Sprint Allocation  
Sprint 1: Epic 1 (DB/Infra) \+ Epic 2 (BE CRUD/Upload) \+ Epic 4 (Security Basics).  
Sprint 2: Epic 2 (Recurrence/Cron) \+ Epic 3 (FE Dashboard/Calendar).  
Sprint 3: Epic 3 (FE Wizard/Details) \+ Epic 5 (Testing) \+ Epic 6 (Deploy Prep).  
Sprint 4: UAT, Bug Fixes, Production Rollout, Training.  
