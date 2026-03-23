# CompanyOS User Workflow Guide

## Complete User Journey: From Onboarding to Daily Operations

---

## **PART 1: FIRST-TIME ONBOARDING FLOW** 🚀

### **Overview**
The onboarding process consists of **5 main wizard steps** with detailed sub-steps for department configuration. Total setup time: 45-90 minutes depending on organizational complexity.

```
Registration → Identity Setup → Department Selection → Department Configuration (per dept) → Org Structure Review → Dashboard
```

---

### **Step 1: Account Registration** (`/auth/register`)

#### **User Actions:**
1. Navigate to registration page
2. Enter required information:
   - **Company Name** (e.g., "Verdant Fields AgriTech Ltd")
   - **First Name** & **Last Name** (Admin user)
   - **Admin Email Address** (becomes login credential)
   - **Password** (secure authentication)

#### **System Process:**
- Creates company record in database
- Creates admin user with Level 1 access
- Auto-generates JWT authentication token
- Automatically logs in user
- Redirects to Setup Wizard Step 1

#### **UI Elements:**
- Premium glass-card design
- Form validation
- Loading state: "Initializing..."
- CTA: "Construct Company"

---

### **Step 2: Company Identity Setup** (`/setup/identity`)

**Wizard Progress:** Step 1 of 5

#### **User Actions:**
1. **Define Visual Identity:**
   - Enter **Company Tagline** (e.g., "Operating at the Speed of Thought")
   - Select **Primary Brand Color** using color picker (default: Navy `#0F172A`)
   - Select **Secondary Accent Color** (default: Gold `#B8860B`)
   
2. **Document Strategic Identity:**
   - Write **Company Description/Mission** in rich text editor
   - Example: "Empowering businesses through innovative technology solutions..."

3. **Review Live Preview:**
   - Sidebar shows real-time dashboard mockup
   - Displays how brand colors and tagline will appear

#### **System Process:**
- Saves company profile with brand configuration
- Stores colors in `brand_colors` object
- Updates company mission statement
- Validates minimum setup requirements

#### **Navigation:**
- **Back**: Not available (first step)
- **Next**: "Confirm & Continue" → Departments Selection
- **Save Draft**: Available but doesn't advance wizard

#### **Data Saved:**
```typescript
{
  tagline: string,
  industry: string,
  description: string,
  brand_colors: {
    primary: "#0F172A",
    secondary: "#B8860B"
  }
}
```

---

### **Step 3: Department Selection** (`/setup/departments`)

**Wizard Progress:** Step 2 of 5

#### **Available Department Templates:**

| Department | Icon Color | Default Focus |
|------------|-----------|---------------|
| **Finance** | Amber (`#B8860B`) | Accounting, Budgeting & P&L |
| **Human Resources** | Blue (`#3B82F6`) | Talent, Payroll & Culture |
| **Operations** | Emerald (`#10B981`) | Processes & Supply Chain |
| **Marketing** | Purple (`#8B5CF6`) | Brand & Content Calendar |
| **Sales & CRM** | Rose (`#EF4444`) | Leads & Deal Pipelines |
| **Legal** | Slate (`#64748b`) | Contracts & Compliance |
| **IT & Systems** | Indigo (`#6366f1`) | Assets & Technical Debt |
| **Strategy & OKRs** | Cyan (`#06b6d4`) | Roadmaps & Goal Tracking |
| **Administration** | Teal (`#14b8a6`) | Records & Procurement |
| **Custom Department** | Gray (`#94a3b8`) | Build from scratch |

#### **User Actions:**
1. **Select Departments** (minimum 1 required):
   - Click on department cards to toggle selection
   - Each card shows:
     - Department name
     - Icon with first letter
     - Brief description
     - Color coding
   
2. **Review Selection Count:**
   - Floating badge shows: "X Departments Selected"
   - Visual checkmarks appear on selected cards

3. **Proceed to Configuration:**
   - Button updates: "Configure Selected Departments (X) →"

#### **System Process:**
- Stores selected department IDs in auth state
- Tracks in `setup.selectedDepartments` array
- Maintains order of selection
- Validates at least one department chosen

#### **Navigation:**
- **Back**: "← Back to Identity"
- **Next**: Disabled until ≥1 department selected
- **Validation**: Alert if attempting to proceed with 0 selections

---

### **Step 4: Department Configuration Hub** (`/setup/configure`)

**Wizard Progress:** Step 3 of 5

#### **User Actions:**
1. **View Selected Departments List:**
   - Each department shows:
     - Colored icon
     - Department name
     - Status: "⚙️ Configuration Pending" or "✅ Implementation Finalized"
   
2. **Configure Each Department** (sequential or parallel):
   - Click "Begin Wizard" for incomplete departments
   - Opens detailed configuration wizard at `/setup/configure/[id]`
   - Must complete ALL departments before proceeding

3. **Monitor Progress:**
   - Visual status indicators per department
   - Completion tracking in sidebar

#### **System Process:**
- Checks completion status from `setup.completedDepartments`
- Routes to appropriate template based on department ID
- Auto-saves progress at each sub-step
- Marks department complete only when wizard finished

#### **Navigation Rules:**
- Cannot proceed to Step 5 until ALL selected departments configured
- Can revisit completed departments via "Edit Config"
- Back button returns to department selection

---

## **DEPARTMENT CONFIGURATION WIZARD** (Deep Dive)

Each department has a **9-sub-step wizard** experience:

### **Sub-Step 1: Department Identity** 🎨

#### **User Actions:**
- **Set Department Name**: Customize from template (e.g., "Finance" → "Financial Operations")
- **Choose Signature Color**: Select from 10-color palette
  - Palette: Gold, Emerald, Blue, Red, Purple, Amber, Pink, Indigo, Teal, Navy
  - Visual preview with live feedback
  - Color appears in all department UI elements

#### **Data Structure:**
```typescript
{
  name: string,
  color: hex_color
}
```

---

### **Sub-Step 2: Strategic Mandate** 🎯

#### **User Actions:**
- **Write Department Mandate** using rich text editor
- Guiding question: *"What is the single, absolute reason this department exists?"*
- Example for Finance:
  > "The mandate of the Finance department is to ensure long-term solvency through strategic capital allocation, rigorous financial controls, and proactive risk management."

#### **Features:**
- Rich text formatting (bold, italic, lists)
- HTML storage for formatting preservation
- Character limit: None (recommend 2-4 sentences)

---

### **Sub-Step 3: Core Responsibilities** 📋

#### **User Actions:**
- **Define Accountability Pillars** using rich text editor
- Guiding question: *"What are the non-negotiable pillars of accountability?"*
- Example for HR:
  > - End-to-end talent acquisition and onboarding
  > - Employee relations and performance management
  > - Compensation and benefits administration
  > - Organizational culture and engagement

#### **Storage:**
- Stored as formatted HTML
- Displayed in department charter
- Used for role definition alignment

---

### **Sub-Step 4: Key Deliverables** 📦

#### **User Actions:**
- **Document Tangible Outputs** using rich text editor
- Guiding question: *"What specific, measurable artifacts does this department produce?"*
- Examples:
  - **Finance**: Monthly P&L statements, Annual budgets, Cash flow forecasts
  - **Marketing**: Campaign reports, Content calendars, Lead generation metrics
  - **IT**: System uptime reports, Asset registers, Incident resolution summaries

---

### **Sub-Step 5: Success Indicators (KPIs)** 📊

#### **User Actions:**
1. **Add KPIs** (Key Performance Indicators):
   - Click "+ Add Success Indicator"
   - For each KPI, define:
     - **Name**: Descriptive title (e.g., "Operating Margin")
     - **Target**: Numerical goal (e.g., "25")
     - **Unit**: Measurement type (e.g., "%", "R", "units")

2. **Example KPIs by Department:**

| Department | KPI Name | Target | Unit |
|------------|----------|--------|------|
| Finance | Monthly Revenue | 450000 | R |
| Finance | Operating Expenses | 180000 | R |
| HR | Employee Retention Rate | 92 | % |
| HR | Time to Hire | 21 | Days |
| Marketing | Lead Conversion Rate | 18 | % |
| IT | System Uptime | 99.9 | % |
| Sales | Deals Closed per Quarter | 45 | Count |

3. **Manage KPIs:**
   - Edit inline
   - Delete unwanted KPIs
   - Add unlimited KPIs

#### **Data Structure:**
```typescript
kpi: {
  name: string,
  target: string,
  unit: string
}[]
```

---

### **Sub-Step 6: Core Positions (Roles)** 👥

#### **User Actions:**
1. **Add Department Roles:**
   - Click "+ Add Key Position"
   - Template roles pre-populated (editable)
   
2. **For Each Role, Define:**
   - **Role Title** (e.g., "Chief Financial Officer")
   - **Reports To** (e.g., "CEO")
   - **Key Responsibilities** (rich text)
   - **Level** (auto-assigned based on hierarchy)

3. **Template Roles by Department:**

**Finance:**
- Chief Financial Officer → reports to CEO
- Head of Accounting → reports to CFO

**HR:**
- HR Director → reports to CEO
- Recruitment Manager → reports to HR Director

**Operations:**
- Operations Manager → reports to CEO
- Logistics Coordinator → reports to Operations Manager

**Marketing:**
- Marketing Lead → reports to CEO

4. **Role Management:**
   - Remove positions with trash icon
   - Edit responsibilities in rich text
   - Reorder as needed

#### **Data Structure:**
```typescript
role: {
  title: string,
  responsibilities: string, // HTML
  reportsTo: string,
  level?: string // auto-assigned
}[]
```

---

### **Sub-Step 7: Financial Allocation** 💰

#### **User Actions:**
- **Enter Annual Budget**: Large numeric input field
- Format: South African Rand (R) - adaptable to other currencies
- Example entries:
  - Finance: R 2,500,000
  - Marketing: R 1,800,000
  - IT: R 3,200,000
  
#### **Visual Feedback:**
- Budget utilization gauge (displays after data entry)
- Comparison to company total budget
- Quarterly breakdown hint

#### **Data Storage:**
```typescript
budget_allocation: number // stored as integer
```

---

### **Sub-Step 8: Operational Workflows** ⚡

#### **User Actions:**
1. **Define Sequential Steps:**
   - Click "+ Add Functional Step"
   - Enter workflow steps in order
   - Numbered automatically (1, 2, 3...)

2. **Example Workflows:**

**Finance Month-End:**
1. Accounts payable reconciliation
2. Accounts receivable aging review
3. Fixed assets depreciation calculation
4. Trial balance verification
5. Financial statement generation

**Recruitment Workflow:**
1. Requisition approval
2. Job posting and sourcing
3. Candidate screening
4. Interview coordination
5. Offer negotiation
6. Onboarding initiation

3. **Workflow Management:**
   - Reorder by deleting and re-adding
   - Hover to reveal delete button
   - Unlimited steps supported

#### **Data Structure:**
```typescript
workflows: string[] // ordered array of step descriptions
```

---

### **Sub-Step 9: Completion** ✅

#### **User Experience:**
- **Celebration Animation**: Bouncing icon with confetti effect
- **Completion Message**: 
  > "The [Department Name] department is now structurally and strategically codified."
  
- **Final Action**: "Finalize [Department Name] Configuration →"

#### **System Process:**
- Saves all configuration data to database
- Marks department as complete in auth store
- Updates `setup.completedDepartments` array
- Returns to configuration hub

---

### **Post-Configuration Hub Actions**

After completing ALL departments:

1. **Status Check**: All departments show "✅ Implementation Finalized"
2. **Next Button Activates**: "Review Corporate Structure →"
3. **Proceed to Step 5**: Organizational Chart Review

---

### **Step 5: Organizational Structure Review** (`/setup/org-chart`)

**Wizard Progress:** Step 4 of 5

#### **User Actions:**
1. **Review Auto-Generated Org Chart:**
   - Visual hierarchy showing all departments
   - Reporting lines based on "Reports To" definitions
   - Department heads highlighted
   
2. **Verify Structure:**
   - Check department names and colors
   - Confirm role assignments
   - Validate reporting chains

3. **Make Adjustments** (if needed):
   - Drag-and-drop to reorder (future feature)
   - Return to department config for edits

#### **System Process:**
- Generates org chart from department/role data
- Displays leadership structure
- Shows headcount per department
- Calculates total budget allocation

---

### **Step 6: Governance Setup** (Optional/Future)

**Wizard Progress:** Step 5 of 5

*Note: This step may be skipped in current implementation*

#### **Planned Features:**
- Define executive leadership team
- Set up board reporting structure
- Configure compliance oversight
- Establish audit committees

---

### **Setup Completion** 🎉

#### **System Actions:**
1. **Mark Setup Complete:**
   - Sets `setup.is_complete = true`
   - Or `setup.current_step >= 4`
   
2. **Update User Context:**
   - Refreshes auth store with full company data
   - Stores complete department registry
   
3. **Redirect to Dashboard:**
   - Automatic navigation to `/dashboard`
   - Full platform access granted

#### **User Sees:**
- Welcome dashboard with company branding
- All configured departments accessible
- Initial task boards ready
- KPI tracking active

---

## **PART 2: DAILY LOGIN WORKFLOW** 📅

---

### **Login Process** (`/auth/login`)

#### **Returning User Actions:**
1. **Enter Credentials:**
   - Email address (registered admin email)
   - Password
   
2. **Submit:**
   - Button: "Enter Ecosystem"
   - Loading state: "Authenticating..."

#### **System Process:**
1. **Authentication:**
   - POST to `/auth/login`
   - Validates credentials against database
   - Returns JWT token + user object
   
2. **Session Setup:**
   - Stores token in auth store
   - Persists to localStorage (via Zustand)
   - Sets `isAuthenticated = true`

3. **Smart Routing Logic:**
   ```typescript
   if (setup.is_complete || setup.current_step >= 4) {
     router.push('/dashboard');
   } else {
     router.push('/setup/identity'); // Resume incomplete setup
   }
   ```

#### **Error Handling:**
- Invalid credentials: "Invalid credentials" error message
- Network failure: Console error, retry option
- Expired session: Redirect to login

---

### **Dashboard Experience** (`/dashboard`)

**The Command Center for Daily Operations**

---

#### **Section 1: Signboard Header** 🏢

**Visual Elements:**
- **Background**: Navy blue gradient with gold accents
- **Company Name**: Dynamic from user email domain (e.g., "VERDANT FIELDS AGRITECH LTD")
- **Tagline**: Italic quote from company profile
- **System Status**: Green pulsing indicator = "OPTIMIZED"

**Information Display:**
```
Welcome to [COMPANY NAME]
"[Company Tagline]"
SYSTEM STATUS: ● OPTIMIZED
```

---

#### **Section 2: Operational Gap Tracking** 📊

**Purpose:** Monitor department readiness and system maturity

**Components:**
- **Phase Indicator**: "Phase 1/3" badge
- **Gap Status Cards** per department:
  - Technology gaps (red/amber/green)
  - Data completeness scores
  - Operational readiness percentage

**User Actions:**
- Click department to view detailed gap analysis
- Track improvement over time
- Prioritize system implementations

---

#### **Section 3: Corporate Schematic** 🏗️

**Interactive Department Visualizer:**

**Features:**
- **Visual Layout**: Hexagonal or circular arrangement
- **Per Department Node**:
  - Department color
  - Name abbreviation
  - Status indicator (active/inactive)
  - KPI summary (mini sparklines)
  
- **Hover Effects**:
  - Expands to show full name
  - Displays headcount
  - Shows budget utilization
  
- **Click Actions**:
  - Navigate to department detail page
  - Quick actions menu appears

**Technical Implementation:**
- SVG-based responsive design
- Real-time data refresh
- Animation on state changes

---

#### **Section 4: Active Workflows** ✅

**Task Management Preview:**

**Display:**
- Grid of recent tasks (4 shown, more via "View All")
- Each task card shows:
  - **Title**: Task name
  - **Department**: Colored badge
  - **Priority**: Color-coded (Critical=Red, High=Orange, Medium=Blue, Low=Gray)
  - **Status**: In Progress, Pending, Complete

**User Actions:**
- Click task to open detail view
- Filter by department
- Sort by priority/date
- "Create your first task" if empty

**Data Source:**
```typescript
tasks: Array<{
  id: string,
  title: string,
  department_id: string,
  status: string,
  priority: 'Critical' | 'High' | 'Medium' | 'Low',
  due_date?: string
}>
```

---

#### **Section 5: Performance Analytics** 📈

**Master KPI Dashboard:**

**Layout:**
- Right sidebar panel
- 3-4 high-level company KPIs

**Example Metrics:**
1. **Monthly Revenue**: R450k (75% of target)
   - Progress bar: 75% filled (gold color)
   
2. **Task Velocity**: 85% completion rate
   - Progress bar: 85% filled
   
3. **Compliance Score**: 98% adherence
   - Progress bar: 98% filled (green)

**Visual Design:**
- Clean typography
- Animated progress bars
- Color-coded thresholds (red < 50%, amber 50-80%, green > 80%)

---

#### **Section 6: Audit Trail** 📝

**Activity Feed:**

**Recent Events** (last 3-5 items):
```
2m ago   | Status Change    | Task #104 moved to DONE
15m ago  | Config Update    | Finance mandate revised
1h ago   | User Access      | New member John invited
```

**Format:**
- Timestamp (relative: "2m ago")
- Event category (bold)
- Description (truncated if long)

**Purpose:**
- Compliance tracking
- Change management visibility
- Security monitoring

---

### **Daily Navigation Patterns**

---

#### **Accessing Departments** 🎯

**Path:** Dashboard → Click Department Node → `/departments/[id]`

**Department Detail Page Features:**

**Header:**
- Department name and color
- Back to dashboard button
- "Reconfigure" button (opens setup wizard for edits)
- Export Charter.pdf option

**Tabbed Interface** (6 tabs):

---

**Tab 1: Strategy & Mandate** 🛡️

**Content:**
- **Strategic Mandate**: Mission statement with objectives
- **Command Structure**: 
  - Visual hierarchy (4 levels: Executive, Management, IC, Senior IC)
  - Role cards with:
    - Title
    - Reports to relationship
    - Headcount (if applicable)
    - Level badge
    - Responsibilities (HTML-rendered)

**User Actions:**
- Review department purpose
- Understand reporting lines
- See role distribution

---

**Tab 2: Operational Routines** ⏰

**Content:**
- Recurring activities table
- Frequency (daily, weekly, monthly)
- Owner role assignment
- Duration estimates
- Dependencies

**Example:**
| Routine | Frequency | Owner | Duration |
|---------|-----------|-------|----------|
| Bank Reconciliation | Daily | Accountant | 2 hours |
| Team Standup | Daily | Manager | 15 min |
| Budget Review | Monthly | CFO | 4 hours |

---

**Tab 3: Detailed Activities** 🔗

**Content:**
- Component activities breakdown
- Input/output specifications
- Resource requirements
- Risk assessments

**Visualization:**
- Flowchart or list view
- Dependency mapping
- Critical path highlighting

---

**Tab 4: SOP Library** 📚

**Content:**
- Standard Operating Procedures
- Version-controlled documents
- Approval workflows
- Training materials

**Features:**
- Search functionality
- Category filters
- Last updated timestamps
- Owner assignments

---

**Tab 5: Performance & KPIs** 📊

**Content:**
- Department-specific KPI registry
- Historical performance charts
- Target vs actual comparisons
- Trend analysis

**Visual Elements:**
- Line charts for trends
- Gauge meters for targets
- Heat maps for variance
- Leaderboards (if team-based)

---

**Tab 6: Network & Assets** 🌐

**Content:**
- **Communication Lines**: Who talks to whom, cadence, medium
- **Infrastructure Data Packs**: Systems used, data flows
- **Asset Registry**: Equipment, software licenses, facilities

**Network Map:**
- Nodes = stakeholders/systems
- Edges = communication channels
- Thickness = frequency/importance

---

**Sidebar Components** (always visible):

**Budget Allocation Panel:**
```
Treasury Allocation
OpEx Budget
R 2,500,000
Authorized Quarterly Drawdown

Utilization Efficiency: 94.2%
[████████████░░░░] 94.2%
```

**Quick Actions:**
- Incident Report (rose icon)
- Asset Requisition (navy icon)
- Strategic Update (gold icon)

---

#### **Task Management** ✅

**Path:** Dashboard → "View All TaskBoards" → `/tasks`

**Features:**
- Kanban board per department
- Drag-and-drop status changes
- Filter by assignee, priority, due date
- Create new tasks inline
- Comment threads
- Attachment support

---

#### **Project Portfolio** 📁

**Path:** `/projects`

**Capabilities:**
- Project listing with status
- Gantt chart timeline
- Resource allocation view
- Budget tracking per project
- Risk register
- Stakeholder map

---

#### **Strategy Modules** 🎯

**OKR Dashboard** (`/strategy/okr/dashboard`):
- Company-level objectives
- Key results with confidence scores
- Check-in history
- Alignment visualization

**CLM (Contract Lifecycle Management)** (`/strategy/clm/registry`):
- Contract repository
- Renewal alerts
- Party management
- Clause library

**Compliance Calendar** (`/strategy/compliance/calendar`):
- Regulatory deadlines
- Policy review schedule
- Audit preparation tasks
- Training requirements

---

#### **Financial Operations** 💰

**Accounting Hub** (`/accounting`):
- Chart of accounts
- Journal entries
- Bank imports
- Financial reports

**Accounts Payable** (`/ap/invoices`):
- Vendor invoice processing
- Payment run scheduling
- Aging reports

**Accounts Receivable** (`/ar/invoices`):
- Customer invoicing
- Collections tracking
- Revenue recognition

---

#### **Human Capital** 👥

**HRIS** (`/hris/employees`):
- Employee directory
- Organizational chart
- Position management
- Onboarding plans

**ATS** (`/hr/ats/candidates`):
- Recruitment pipeline
- Candidate profiles
- Interview scheduling
- Offer management

**Performance** (`/hr/performance`):
- Review cycles
- 360-degree feedback
- Goal setting
- Competency frameworks

---

### **End-of-Day Workflow** 🌙

#### **User Actions:**
1. **Review Task Board:**
   - Move completed tasks to "Done"
   - Update task statuses
   - Add comments for collaborators

2. **Check Notifications:**
   - `/notifications` page
   - System alerts
   - Assignment updates
   - Mention responses

3. **Plan Tomorrow:**
   - Review upcoming deadlines
   - Schedule focus blocks
   - Prioritize critical items

#### **System Behaviors:**
- Auto-save all changes
- Queue notifications for recipients
- Update audit trail
- Sync to mobile app (if installed)

---

## **PART 3: ADVANCED WORKFLOWS** 🔧

---

### **Department Reconfiguration** 🔄

**Scenario:** Need to modify department structure after initial setup

**Steps:**
1. Navigate to department detail page
2. Click "Reconfigure" button (top right)
3. Opens full 9-step wizard with existing data pre-filled
4. Make desired changes
5. Complete wizard → "Finalize Updates"
6. System saves new configuration
7. Updates reflected across all modules

**Use Cases:**
- Department rename
- KPI target adjustments
- Role restructuring
- Budget reallocation
- Workflow optimization

---

### **Adding New Departments Post-Launch** ➕

**Process:**
1. Dashboard → Settings → "Add Department"
2. Select from templates or create custom
3. Goes through full 9-step wizard
4. Appears in org chart immediately
5. Users granted access based on role

---

### **User Access Management** 🔐

**Three-Level RBAC:**

**Level 1: Company Access**
- Who can log in
- Managed via user directory
- Employment status linkage

**Level 2: Department Access**
- Which departments user can enter
- Cross-functional access requires explicit grant
- Multi-department users supported

**Level 3: Privilege Roles**
- **Admin**: Full configuration rights
- **Manager**: Approve/review within scope
- **Contributor**: Create/edit own content
- **Viewer**: Read-only access

**Access Request Flow:**
1. User requests access via UI
2. Department admin receives notification
3. Reviews and approves/denies
4. Permissions updated in real-time
5. Audit trail logged

---

### **Data Export & Reporting** 📤

**Available Exports:**
- Department Charters (PDF)
- KPI Reports (Excel/CSV)
- Task Lists (CSV)
- Org Charts (PNG/PDF)
- Audit Logs (PDF)

**Scheduled Reports:**
- Weekly performance summaries
- Monthly operational reviews
- Quarterly strategic updates
- Automated email delivery

---

## **PART 4: TECHNICAL SPECIFICATIONS** ⚙️

---

### **Authentication Architecture**

**Token Management:**
- JWT bearer tokens
- 24-hour expiration
- Refresh token rotation
- Secure HTTP-only cookies (optional)

**State Persistence:**
- Zustand store with localStorage middleware
- Key: `'companyos-auth'`
- Includes: user, token, setup progress

**Security Features:**
- Password hashing (bcrypt)
- Rate limiting on login attempts
- Session invalidation on logout
- CSRF protection

---

### **Data Models**

**Company Schema:**
```prisma
model Company {
  id          String   @id @default(uuid())
  name        String
  tagline     String?
  industry    String?
  description String?
  brand_colors Json?   // { primary: "#0F172A", secondary: "#B8860B" }
  setup       Json?    // { is_complete: false, current_step: 2, ... }
  departments Department[]
  users       User[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Department Schema:**
```prisma
model Department {
  id                 String   @id @default(uuid())
  template_key       String   // 'fin', 'hr', 'ops', etc.
  name               String
  color              String
  mandate            Json?    // { mission: "", objectives: [] }
  core_responsibilities String? @db.Text
  deliverables       String?  @db.Text
  kpis               Json?    // [{ name, target, unit }]
  roles              Json?    // [{ title, responsibilities, reportsTo }]
  budget_allocation  Int?
  workflows          String?  @db.Text // JSON array
  companyId          String
  company            Company  @relation(fields: [companyId], references: [id])
  tasks              Task[]
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

---

### **API Endpoints**

**Authentication:**
```
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/refresh
```

**Company:**
```
GET    /company
PATCH  /company
```

**Departments:**
```
GET    /departments
GET    /departments/:id
PATCH  /departments/:id/config
GET    /departments/template/:templateKey
POST   /departments
```

**Tasks:**
```
GET    /tasks
POST   /tasks
PATCH  /tasks/:id
DELETE /tasks/:id
```

---

### **Frontend Architecture**

**State Management:**
- Zustand for global state
- React Query for server state
- LocalStorage for persistence

**Routing:**
- Next.js App Router
- Protected routes via middleware
- Dynamic segments for `[id]` params

**Styling:**
- Tailwind CSS utility classes
- Custom component library
- Responsive design (mobile-first)
- Dark mode support (planned)

---

## **PART 5: BEST PRACTICES** 💡

---

### **Onboarding Recommendations**

**Before Starting:**
1. Gather executive team input on company mission
2. Collect department head candidates
3. Prepare initial budget allocations
4. Document key processes (if exist)
5. Identify must-have KPIs

**During Setup:**
1. Start with 3-5 core departments (don't boil the ocean)
2. Use template defaults as starting point
3. Keep mandates concise (2-3 sentences max)
4. Limit KPIs to 5-7 per department initially
5. Define clear role boundaries to avoid overlap

**After Completion:**
1. Conduct training sessions for department heads
2. Import existing employee data
3. Migrate active projects/tasks
4. Schedule weekly review cadence
5. Iterate and refine quarterly

---

### **Daily Usage Tips**

**Morning Routine:**
1. Check dashboard for overnight alerts
2. Review task priorities
3. Update task statuses from yesterday
4. Scan audit trail for anomalies

**Weekly Cadence:**
- Monday: Plan week, set priorities
- Wednesday: Mid-week progress check
- Friday: Close tasks, prepare status reports

**Monthly Reviews:**
- KPI target vs actual analysis
- Budget utilization review
- Process improvement identification
- Team recognition for wins

---

### **Common Pitfalls to Avoid**

❌ **Over-engineering on Day 1**
- Start simple, add complexity gradually
- Don't create 20 KPIs per department

❌ **Ignoring change management**
- Train users before go-live
- appoint department champions

❌ **Setting and forgetting**
- Review configurations quarterly
- Update KPIs as business evolves

❌ **Siloed departments**
- Map cross-functional workflows
- Establish communication protocols

✅ **Do:**
- Celebrate small wins publicly
- Share success stories across teams
- Recognize power users
- Solicit feedback continuously

---

## **APPENDIX A: QUICK REFERENCE CARDS** 📇

---

### **Keyboard Shortcuts**

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Global search |
| `Ctrl/Cmd + N` | New task/project |
| `Ctrl/Cmd + /` | Open keyboard shortcuts |
| `G then D` | Go to Dashboard |
| `G then T` | Go to Tasks |
| `Esc` | Close modal/dropdown |

---

### **Status Legend**

**Task Statuses:**
- 🔴 **Critical**: Drop everything, act now
- 🟠 **High**: Priority attention needed
- 🔵 **Medium**: Normal priority
- ⚪ **Low**: Nice-to-have, backlog

**Department Health:**
- 🟢 **Green**: On track, no issues
- 🟡 **Amber**: Attention needed, minor delays
- 🔴 **Red**: At risk, intervention required

---

### **Email Templates**

**Invitation to Join CompanyOS:**
```
Subject: Welcome to [Company] on CompanyOS

Hi [Name],

You've been added to [Company]'s operating system! 

Your login: [email]
Temporary password: [password]

Get started here: [link]

Let me know if you have questions.

Best,
[Admin]
```

---

## **APPENDIX B: TROUBLESHOOTING GUIDE** 🔧

---

### **Login Issues**

**Problem:** "Invalid credentials"
- **Solution:** Reset password via forgot-password flow
- **Prevention:** Use password manager

**Problem:** Session expires frequently
- **Solution:** Check browser cookie settings
- **Workaround:** Enable "Remember me" option

---

### **Department Configuration**

**Problem:** Can't save department wizard
- **Cause:** Missing required fields (mandate, KPIs)
- **Fix:** Complete all sub-steps before finishing

**Problem:** Changes not reflecting
- **Cause:** Browser cache
- **Fix:** Hard refresh (Ctrl/Cmd + Shift + R)

---

### **Performance**

**Problem:** Dashboard loads slowly
- **Cause:** Too many active tasks/KPIs
- **Fix:** Archive completed items, filter views

**Problem:** Charts not rendering
- **Cause:** Missing data points
- **Fix:** Populate KPI targets first

---

## **APPENDIX C: VERSION HISTORY** 📝

- **v1.0** (Initial Release): Core setup wizard, 10 department templates, task management
- **v1.1**: Enhanced KPI dashboards, org chart editor
- **v1.2**: Mobile app launch, offline mode
- **v2.0** (Planned): AI-powered insights, predictive analytics, advanced automation

---

## **CONCLUSION** 🎯

CompanyOS transforms organizational complexity into structured, actionable workflows. The onboarding process ensures every department is intentionally designed with clear mandates, measurable outcomes, and defined roles. Daily usage provides visibility into operations, alignment with strategy, and acceleration of execution.

**Remember:** The system is only as effective as the discipline behind it. Consistent usage, regular reviews, and continuous improvement are the keys to unlocking its full potential.

---

**Document Version:** 2.0  
**Last Updated:** March 2026  
**Maintained By:** CompanyOS Product Team
