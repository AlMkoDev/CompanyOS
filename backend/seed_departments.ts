import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const departmentsData = [
  {
    template_key: 'fin',
    name: 'Finance',
    description: 'Accounting, Budgeting & P&L',
    icon: 'Wallet',
    color: 'bg-amber-600',
    mandate: {
      mission: 'To ensure financial integrity, optimize resource allocation, and provide strategic financial insights that drive sustainable growth and operational excellence across the organization.',
      objectives: ['Financial planning & analysis', 'Budget management and forecasting', 'Accounts payable/receivable operations'],
      scope: 'Global'
    },
    core_responsibilities: 'Financial planning & analysis, Budget management and forecasting, Accounts payable/receivable operations, Financial reporting & compliance, Risk management and internal controls, Treasury and cash flow management, Tax planning and regulatory filings.',
    deliverables: 'Monthly Financial Close, Accounts Payable Processing, Accounts Receivable Management, Budget Planning & Monitoring.',
    kpis: [
      { name: 'Operating Margin', target: '15', unit: '%' },
      { name: 'Net Profit Margin', target: '12', unit: '%' },
      { name: 'Budget Variance', target: '±5', unit: '%' },
      { name: 'Days Sales Outstanding (DSO)', target: '45', unit: 'Days' },
      { name: 'Days Payable Outstanding (DPO)', target: '45', unit: 'Days' },
      { name: 'Month-End Close Time', target: '5', unit: 'Business Days' },
      { name: 'Forecast Accuracy', target: '95', unit: '%' },
      { name: 'Cash Flow Forecast Accuracy', target: '±3', unit: '%' },
      { name: 'Audit Compliance Score', target: '100', unit: '%' },
      { name: 'Cost Reduction Target (YoY)', target: '8', unit: '%' }
    ],
    roles: [
      { title: 'Chief Financial Officer (CFO)', hc: 1, level: 'Executive', reportsTo: 'CEO / Board of Directors', responsibilities: 'Oversee all financial operations; provide strategic guidance; ensure regulatory compliance; approve budgets and policies' },
      { title: 'Finance Director', hc: 1, level: 'Senior Management', reportsTo: 'CFO', responsibilities: 'Manage day-to-day finance operations; supervise managers; ensure timely close processes; coordinate audits' },
      { title: 'Financial Controller', hc: 1, level: 'Senior Management', reportsTo: 'CFO', responsibilities: 'Oversee accounting operations; ensure accurate reporting; manage month-end/year-end close; supervise accounting staff' },
      { title: 'Finance Manager', hc: 2, level: 'Management', reportsTo: 'Finance Director', responsibilities: 'Prepare reports, forecasts, budgets; analyze variances; supervise junior staff; ensure accounting standards compliance' },
      { title: 'Accounting Manager', hc: 1, level: 'Management', reportsTo: 'Financial Controller', responsibilities: 'Manage daily accounting; supervise team; review journal entries; ensure GAAP compliance' },
      { title: 'Senior Financial Analyst', hc: 3, level: 'Senior IC', reportsTo: 'Finance Manager', responsibilities: 'Complex financial modeling; management reports; budgeting support; strategic recommendations; mentor junior analysts' },
      { title: 'Financial Analyst', hc: 5, level: 'Individual Contributor', reportsTo: 'Finance Manager / Senior Financial Analyst', responsibilities: 'Prepare financial reports and variance analysis; support budgeting; maintain financial databases' },
      { title: 'Tax Specialist', hc: 1, level: 'Senior IC', reportsTo: 'Finance Director / CFO', responsibilities: 'Prepare and file tax returns; ensure tax compliance; research regulations; support tax planning' },
      { title: 'Compliance Officer', hc: 1, level: 'Senior IC', reportsTo: 'CFO (dotted line: Audit Committee)', responsibilities: 'Monitor regulatory compliance; develop policies; conduct internal audits; train staff' },
      { title: 'Treasury Analyst', hc: 2, level: 'Individual Contributor', reportsTo: 'CFO / Treasury Manager', responsibilities: 'Cash flow forecasting; manage banking relationships; execute investment transactions; monitor FX exposure' },
      { title: 'Budget Analyst', hc: 2, level: 'Individual Contributor', reportsTo: 'Finance Manager', responsibilities: 'Develop and monitor departmental budgets; analyze variances; prepare budget reports' },
      { title: 'Internal Auditor', hc: 2, level: 'Senior IC', reportsTo: 'Audit Committee (functional) / CFO (admin)', responsibilities: 'Conduct internal audits; evaluate controls; identify risks; prepare audit reports; SOX compliance' },
      { title: 'Accounts Payable Specialist', hc: 3, level: 'Individual Contributor', reportsTo: 'Accounting Manager', responsibilities: 'Process vendor invoices; verify accuracy; manage payment runs; reconcile AP accounts' },
      { title: 'Accounts Receivable Specialist', hc: 3, level: 'Individual Contributor', reportsTo: 'Accounting Manager', responsibilities: 'Generate customer invoices; monitor receivables; apply payments; follow up on delinquent accounts' },
      { title: 'Payroll Coordinator', hc: 2, level: 'Individual Contributor', reportsTo: 'Accounting Manager (functional: HR)', responsibilities: 'Process payroll; calculate wages/deductions; ensure tax compliance; coordinate with HR' }
    ],
    operational_routines: {
      daily: ['Cash position review and short-term cash forecast update', 'Post authorized journal entries, review overnight bank transactions', 'Invoice receipt, validation, and PO matching', 'Apply customer payments, review unapplied cash', 'Bank balance monitoring, daily cash position report'],
      weekly: ['Pipeline and revenue forecast update with Sales', 'AP/AR sub-ledger reconciliation review', 'Payment run (Thursday), aging review, vendor query resolution', 'AR aging review, collections follow-ups', '13-week cash forecast update, CFO cash review meeting'],
      monthly: ['Management pack production and distribution (Day 1–5 post close)', 'Full close process — Day 1–5, BS reconciliations Day 3–6, sign-off Day 5', 'AP sub-ledger close, vendor statement reconciliations', 'AR close, customer statement reconciliations, bad debt provision review', 'Bank reconciliations (all accounts), FX exposure report', 'VAT/WHT returns, payroll tax filings'],
      quarterly: ['Rolling forecast refresh and board presentation', 'Fixed asset physical count and depreciation review', 'Vendor master data audit — remove inactive/duplicate vendors', 'Credit limit review for top 20 customers', 'Banking relationship review, investment portfolio review', 'Provisional corporate tax payment'],
      annually: ['Full budget cycle (Sep–Nov), 3-year strategic plan update', 'External audit preparation, year-end close, financial statements', 'Annual tax return, TP documentation, statutory audit']
    },
    data_pack: [
      { id: 1, asset: 'Chart of Accounts (ERP)' },
      { id: 2, asset: 'Budget templates (Excel/Anaplan)' },
      { id: 3, asset: 'Actuals feed from GL' },
      { id: 4, asset: 'Headcount data from HRIS' },
      { id: 5, asset: 'Revenue pipeline from CRM' },
      { id: 6, asset: 'Prior-period comparatives' },
      { id: 7, asset: 'Board-approved budget baseline' },
      { id: 8, asset: 'General Ledger (ERP — SAP/NetSuite)' },
      { id: 9, asset: 'Sub-ledger feeds (AP, AR, Payroll)' },
      { id: 10, asset: 'Bank statement feeds' },
      { id: 11, asset: 'Fixed Asset Register' },
      { id: 12, asset: 'Depreciation schedules' }
    ],
    activities: [
      { 
        component: 'Financial Planning & Analysis (FP&A)',
        sections: [
          { name: 'Annual Budget Cycle', detail: 'September–November each year. FP&A distributes templates, consolidates submissions from all 9 departments, models assumptions, and presents a board-ready budget by 30 November.' },
          { name: 'Rolling 12-Month Forecast', detail: 'Updated every quarter. Replaces the static annual budget with a live view of expected P&L, cash flow, and capex.' },
          { name: 'Management Reporting Pack', detail: 'Distributed within 5 business days of month-end. Contains: P&L vs. budget, balance sheet, cash flow statement, headcount report, KPI dashboard, and variance commentary.' }
        ]
      },
      {
        component: 'Accounting & General Ledger',
        sections: [
          { name: 'Month-End Close', detail: 'Target: 5 business days. Sequence: sub-ledger close → accruals → prepayments → depreciation → intercompany → TB review → sign-off.' },
          { name: 'Balance Sheet Reconciliation', detail: 'Every balance sheet account reconciled monthly with supporting documentation uploaded to the document management system.' }
        ]
      },
      {
        component: 'Accounts Payable (AP)',
        sections: [
          { name: 'Invoice Processing', detail: '3-way match: PO → goods receipt → invoice. Invoices without a PO require retrospective approval from budget holder.' },
          { name: 'Payment Runs', detail: 'Weekly payment runs every Thursday. Emergency payments require CFO approval and processed same-day.' }
        ]
      },
      {
        component: 'Accounts Receivable (AR)',
        sections: [
          { name: 'Invoicing', detail: 'Invoices raised within 24 hours of goods/service delivery. Electronic invoicing preferred. All invoices include payment terms (Net 30 default).' },
          { name: 'Collections', detail: 'Day 15: first reminder. Day 25: second reminder. Day 35: formal notice. Day 45+: escalate to Finance Manager and legal hold.' }
        ]
      }
    ],
    communication_lines: [
      { from: 'CFO', to: 'CEO/Board', content: 'Monthly financial reporting, budget approvals, strategic financial briefings' },
      { from: 'CFO', to: 'Finance Director', content: 'Daily operational oversight, policy directives, escalations' },
      { from: 'Finance Director', to: 'Finance Managers', content: 'Daily workflow management, report reviews, variance escalation' },
      { from: 'Accounting Manager', to: 'AP/AR/Payroll', content: 'Transaction processing, reconciliation approvals, deadline management' }
    ],
    budget_allocation: 3850000
  },
  {
    template_key: 'hr',
    name: 'Human Resources',
    description: 'Talent, Payroll & Culture',
    icon: 'Users',
    color: 'bg-blue-600',
    mandate: {
      mission: 'To attract, develop, and retain exceptional talent while fostering a culture of engagement, equity, and continuous growth that drives organizational success.',
      objectives: ['Talent acquisition and recruitment', 'Employee onboarding and orientation', 'Performance management and development'],
      scope: 'Global'
    },
    core_responsibilities: 'Talent acquisition, Employee onboarding, Performance management, Compensation and benefits, Employee relations, HR compliance, Learning and development.',
    deliverables: 'Employee Onboarding, Recruitment & Hiring, Performance Review Cycle, Offboarding Process, Benefits Administration.',
    kpis: [
      { name: 'Employee Turnover Rate', target: '10', unit: '%' },
      { name: 'Time to Fill Positions', target: '35', unit: 'Days' },
      { name: 'Employee Engagement Score', target: '85', unit: '%' },
      { name: 'Training Hours per Employee', target: '40', unit: 'Hours/Year' },
      { name: 'Offer Acceptance Rate', target: '90', unit: '%' },
      { name: 'Employee Net Promoter Score (eNPS)', target: '45', unit: 'Score' },
      { name: 'Absenteeism Rate', target: '3', unit: '%' },
      { name: 'Performance Review Completion', target: '100', unit: '%' },
      { name: 'Diversity Hiring Rate', target: '40', unit: '%' },
      { name: 'Internal Promotion Rate', target: '30', unit: '%' }
    ],
    roles: [
      { title: 'Chief Human Resources Officer (CHRO)', hc: 1, level: 'Executive', reportsTo: 'CEO / Board of Directors', responsibilities: 'Lead HR strategy; advise executive team; oversee all HR functions; drive organizational culture' },
      { title: 'HR Director', hc: 1, level: 'Senior Management', reportsTo: 'CHRO', responsibilities: 'Manage HR operations; supervise managers; ensure policy compliance; drive strategic HR initiatives' },
      { title: 'HR Manager', hc: 2, level: 'Management', reportsTo: 'HR Director', responsibilities: 'Oversee employee relations; manage HR team; implement policies; handle complex employee issues' },
      { title: 'Talent Acquisition Manager', hc: 1, level: 'Management', reportsTo: 'HR Director', responsibilities: 'Lead recruitment strategy; manage recruiting team; build talent pipelines; optimize hiring processes' },
      { title: 'HR Business Partner', hc: 3, level: 'Senior IC', reportsTo: 'HR Director / HR Manager', responsibilities: 'Partner with department leaders; provide HR guidance; manage employee relations; drive engagement' },
      { title: 'Recruiter', hc: 4, level: 'Individual Contributor', reportsTo: 'Talent Acquisition Manager', responsibilities: 'Source candidates; conduct interviews; manage candidate experience; coordinate hiring activities' },
      { title: 'Compensation & Benefits Specialist', hc: 2, level: 'Individual Contributor', reportsTo: 'HR Manager', responsibilities: 'Administer benefits; conduct compensation analysis; manage open enrollment; ensure market competitiveness' },
      { title: 'Learning & Development Manager', hc: 1, level: 'Management', reportsTo: 'HR Director', responsibilities: 'Design training programs; manage LMS; conduct needs assessments; measure training effectiveness' },
      { title: 'Training Coordinator', hc: 2, level: 'Individual Contributor', reportsTo: 'Learning & Development Manager', responsibilities: 'Coordinate training sessions; track participation; maintain records; support onboarding programs' },
      { title: 'HRIS Analyst', hc: 2, level: 'Individual Contributor', reportsTo: 'HR Manager / HR Director', responsibilities: 'Manage HR systems; generate reports; ensure data accuracy; support HR technology initiatives' },
      { title: 'Employee Relations Specialist', hc: 2, level: 'Individual Contributor', reportsTo: 'HR Manager', responsibilities: 'Handle employee concerns; conduct investigations; mediate conflicts; promote positive workplace culture' },
      { title: 'Onboarding Coordinator', hc: 2, level: 'Individual Contributor', reportsTo: 'HR Manager', responsibilities: 'Facilitate new hire orientation; coordinate onboarding activities; ensure smooth employee integration' },
      { title: 'HR Compliance Officer', hc: 1, level: 'Senior IC', reportsTo: 'HR Director', responsibilities: 'Ensure labor law compliance; conduct audits; update policies; manage compliance risk' },
      { title: 'HR Generalist', hc: 3, level: 'Individual Contributor', reportsTo: 'HR Manager', responsibilities: 'Support all HR functions; assist employees; maintain records; handle administrative HR tasks' },
      { title: 'Payroll Specialist', hc: 2, level: 'Individual Contributor', reportsTo: 'Accounting Manager (functional: HR)', responsibilities: 'Process payroll; ensure accuracy; handle payroll inquiries; maintain payroll records and systems' }
    ],
    operational_routines: {
      daily: ['ATS pipeline review, candidate communications', 'Hiring manager pipeline meeting per open role', 'HR Manager stand-up', 'Case reviews'],
      weekly: ['New starter welcome, buddy check-ins for first 30 days', 'Recruitment pipeline reviews', 'Employee relations check-ins'],
      monthly: ['Headcount movement report (joiners, leavers, transfers)', 'Recruitment metrics report (time-to-fill, source quality, offer acceptance)', 'Benefit provider reconciliation'],
      quarterly: ['Performance check-in reminders, development plan reviews', 'Employer brand review, salary band review', 'Compliance audits'],
      annually: ['Full performance review cycle, promotion round', 'Annual training needs assessments', 'Open enrollment for benefits (November)']
    },
    data_pack: [
      { id: 1, asset: 'ATS (Greenhouse/Lever)' },
      { id: 2, asset: 'Headcount plan (from FP&A)' },
      { id: 3, asset: 'Job description library' },
      { id: 4, asset: 'Salary bands and benchmarks' },
      { id: 5, asset: 'Interview scorecard templates' },
      { id: 6, asset: 'Offer letter templates' },
      { id: 7, asset: 'Background check integrations' },
      { id: 8, asset: 'HRIS (employee master record)' },
      { id: 9, asset: 'Onboarding checklist tracker' },
      { id: 10, asset: 'Performance review platform (Lattice/Leapsome)' }
    ],
    activities: [
      {
        component: 'Talent Acquisition',
        sections: [
          { name: 'Job Requisition Management', detail: 'All new roles require a signed headcount approval form countersigned by Finance (budget check) before posting. Tracked in the ATS.' },
          { name: 'Sourcing Strategy', detail: 'Tiered approach: (1) Internal mobility first, (2) Employee referrals, (3) LinkedIn/job boards, (4) Specialist recruiters for senior roles.' },
          { name: 'Interview Framework', detail: 'Structured competency-based interviews. All panellists trained on bias-aware interviewing. Minimum 2-stage process for all roles.' }
        ]
      },
      {
        component: 'Employee Lifecycle Management',
        sections: [
          { name: 'Pre-boarding & Onboarding', detail: 'Offer accepted to Day 1: contracts, equipment, system access, buddy assignment. Day 1–90: structured onboarding plan with 30/60/90-day check-ins.' },
          { name: 'Performance Management', detail: 'Annual cycle: Q1 goal-setting → Q2 mid-year check-in → Q4 annual review. Ratings linked to compensation. Poor performance managed via PIP process.' }
        ]
      },
      {
        component: 'Compensation & Benefits',
        sections: [
          { name: 'Salary Bands & Benchmarking', detail: 'Bands reviewed annually against Mercer/Radford or local equivalent. Positions mapped to job families with clear band ranges (P25–P75).' },
          { name: 'Benefits Administration', detail: 'Medical, pension/NSSF, leave management, group life cover. Annual open enrollment in November for changes effective January.' }
        ]
      }
    ],
    communication_lines: [
      { from: 'CHRO', to: 'CEO', content: 'Workforce strategy, people risk, culture reports, executive hiring' },
      { from: 'HR Director', to: 'CHRO', content: 'Operations reporting, policy updates, ER escalations' },
      { from: 'HR Business Partner', to: 'Department Heads', content: 'Embedded advisory; attend dept leadership meetings' },
      { from: 'Talent Acquisition Mgr', to: 'Hiring Managers', content: 'Weekly pipeline reviews, interview scheduling, offer approval' }
    ],
    budget_allocation: 3250000
  },
  {
    template_key: 'ops',
    name: 'Operations',
    description: 'Processes & Supply Chain',
    icon: 'Settings',
    color: 'bg-emerald-600',
    mandate: {
      mission: 'To design, optimize, and oversee all operational processes that enable the organization to deliver products and services efficiently, reliably, and at the highest quality standards.',
      objectives: ['Business process design', 'Supply chain management', 'Vendor and contract management'],
      scope: 'Global'
    },
    core_responsibilities: 'Business process design, Supply chain management, Vendor management, Facilities management, Quality assurance, Operational risk.',
    deliverables: 'Procurement Cycle, Supply Chain Management, Quality Assurance Process, Vendor Management.',
    kpis: [
      { name: 'Operational Efficiency Rate', target: '92', unit: '%' },
      { name: 'On-Time Delivery Rate', target: '98', unit: '%' },
      { name: 'Process Cycle Time Reduction', target: '15', unit: '%' },
      { name: 'Vendor On-Time Delivery', target: '95', unit: '%' },
      { name: 'Defect / Error Rate', target: '<2', unit: '%' },
      { name: 'Procurement Cost Savings', target: '10', unit: '%' },
      { name: 'Business Continuity Readiness', target: '100', unit: '%' },
      { name: 'Asset Utilization Rate', target: '85', unit: '%' },
      { name: 'Safety Incident Rate', target: '0', unit: 'Incidents/Quarter' }
    ],
    roles: [
      { title: 'Chief Operating Officer (COO)', hc: 1, level: 'Executive', reportsTo: 'CEO / Board of Directors', responsibilities: 'Oversee all operational functions; drive efficiency strategy; partner with CEO on execution; manage operational risk' },
      { title: 'Operations Director', hc: 1, level: 'Senior Management', reportsTo: 'COO', responsibilities: 'Direct daily operations; supervise operations managers; ensure cross-functional alignment; deliver on operational targets' },
      { title: 'Operations Manager', hc: 3, level: 'Management', reportsTo: 'Operations Director', responsibilities: 'Manage specific operational units; implement processes; monitor KPIs; resolve operational bottlenecks' },
      { title: 'Supply Chain Manager', hc: 1, level: 'Management', reportsTo: 'Operations Director / COO', responsibilities: 'Manage end-to-end supply chain; coordinate procurement; optimize inventory levels; manage supplier relationships' },
      { title: 'Procurement Specialist', hc: 3, level: 'Individual Contributor', reportsTo: 'Supply Chain Manager', responsibilities: 'Source and evaluate vendors; negotiate contracts; process purchase orders; ensure timely procurement' },
      { title: 'Logistics Coordinator', hc: 3, level: 'Individual Contributor', reportsTo: 'Supply Chain Manager / Operations Manager', responsibilities: 'Coordinate outbound/outbound logistics; manage shipping schedules; track deliveries; resolve logistics issues' },
      { title: 'Quality Assurance Analyst', hc: 2, level: 'Individual Contributor', reportsTo: 'Operations Manager', responsibilities: 'Conduct quality audits; identify defects; develop QA procedures; report on quality metrics' },
      { title: 'Process Improvement Analyst', hc: 2, level: 'Senior IC', reportsTo: 'Operations Director / COO', responsibilities: 'Map business processes; identify inefficiencies; design improvements; implement Lean/Six Sigma methodologies' },
      { title: 'Facilities Manager', hc: 1, level: 'Management', reportsTo: 'Operations Director', responsibilities: 'Manage office/facility operations; oversee maintenance; ensure safety compliance; manage facility vendors' },
      { title: 'Project Coordinator', hc: 3, level: 'Individual Contributor', reportsTo: 'Operations Manager / PMO Lead', responsibilities: 'Coordinate project activities; track milestones; manage project documentation; communicate progress to stakeholders' },
      { title: 'Business Continuity Planner', hc: 1, level: 'Senior IC', reportsTo: 'COO / Operations Director', responsibilities: 'Develop BCP and disaster recovery plans; conduct drills; assess operational risks; maintain continuity documentation' },
      { title: 'HSE Officer', hc: 1, level: 'Individual Contributor', reportsTo: 'Facilities Manager / Operations Manager', responsibilities: 'Enforce health, safety, and environmental standards; conduct risk assessments; deliver safety training; manage incident reporting' }
    ],
    operational_routines: {
      daily: ['Operations Director stand-up', 'Escalations and resource requests', 'Invoice receipt, validation, and PO matching'],
      weekly: ['Operations Managers team stand-up', 'Project status update', 'Issue log review', 'Quality metrics and non-conformance reports', 'Project status report distribution', 'Risk log and milestone updates'],
      monthly: ['COO cross-functional operations council', 'Spend analysis and PO approvals', 'Vendor payment status review', 'HSE monthly safety report and incident review'],
    },
    data_pack: [
      { id: 1, asset: 'Purchase Orders (ERP)' },
      { id: 2, asset: 'Goods Receipt Notes' },
      { id: 3, asset: 'Vendor invoices (scanned/email)' },
      { id: 4, asset: 'Vendor master database' },
      { id: 5, asset: 'Bank payment templates' },
      { id: 6, asset: 'AP aging report' },
      { id: 7, asset: 'Three-way match exception log' }
    ],
    activities: [
      {
        component: 'Procurement Cycle',
        sections: [
          { name: 'Identification & Requisition', detail: 'Identify need → Raise purchase requisition → Vendor selection.' },
          { name: 'Order & Receipt', detail: 'Negotiate & issue PO → Receive goods/services → Invoice matching → Payment authorization.' }
        ]
      },
      {
        component: 'Supply Chain Management',
        sections: [
          { name: 'Planning & Ordering', detail: 'Demand forecasting → Inventory planning → Supplier orders → Inbound logistics.' },
          { name: 'Inventory & Replenishment', detail: 'Goods receipt & inspection → Stock management → Replenishment.' }
        ]
      },
      {
        component: 'Quality Assurance Process',
        sections: [
          { name: 'Standards & Inspection', detail: 'Define quality standards → Conduct inspections → Identify non-conformances.' },
          { name: 'Improvement & Closure', detail: 'Root cause analysis → Corrective actions → Re-inspection → Close out.' }
        ]
      }
    ],
    communication_lines: [
      { from: 'COO', to: 'CEO', content: 'Weekly operational review, KPI dashboard, strategic execution updates' },
      { from: 'Operations Director', to: 'COO', content: 'Daily stand-up, escalations, resource requests' },
      { from: 'Supply Chain Manager', to: 'Finance', content: 'Monthly spend analysis, PO approvals, vendor payment status' },
      { from: 'HSE Officer', to: 'COO/Legal', content: 'Monthly safety report, incident reports, regulatory compliance updates' }
    ],
    budget_allocation: 3400000
  },
  {
    template_key: 'mkt',
    name: 'Marketing',
    description: 'Brand & Content Calendar',
    icon: 'Megaphone',
    color: 'bg-purple-600',
    mandate: {
      mission: 'To build brand awareness, generate qualified leads, and nurture customer relationships through compelling content, data-driven campaigns, and consistent brand storytelling.',
      objectives: ['Brand strategy', 'Digital marketing', 'Content creation'],
      scope: 'Global'
    },
    core_responsibilities: 'Brand strategy, Digital marketing, Content creation, Lead generation, Social media strategy, Market research, Campaign planning.',
    deliverables: 'Campaign Planning & Execution, Content Calendar Management, Lead Generation Process, Social Media Management.',
    kpis: [
      { name: 'Marketing Qualified Leads (MQLs)', target: '250', unit: 'Per Month' },
      { name: 'Lead-to-Opportunity Conversion Rate', target: '30', unit: '%' },
      { name: 'Cost per Lead (CPL)', target: '25', unit: 'USD' },
      { name: 'Website Traffic Growth', target: '15', unit: '% MoM' },
      { name: 'Email Open Rate', target: '28', unit: '%' },
      { name: 'Email Click-Through Rate', target: '5', unit: '%' },
      { name: 'Social Media Engagement Rate', target: '4', unit: '%' },
      { name: 'Content Pieces Published', target: '20', unit: 'Per Month' },
      { name: 'Brand Awareness Score', target: '75', unit: '%' },
      { name: 'Customer Acquisition Cost (CAC)', target: '120', unit: 'USD' }
    ],
    roles: [
      { title: 'Chief Marketing Officer (CMO)', hc: 1, level: 'Executive', reportsTo: 'CEO / Board of Directors', responsibilities: 'Lead marketing strategy; build brand; oversee all marketing functions; align with revenue goals; represent brand externally' },
      { title: 'Marketing Director', hc: 1, level: 'Senior Management', reportsTo: 'CMO', responsibilities: 'Manage marketing operations; supervise team leads; drive campaign strategy; report on marketing performance' },
      { title: 'Brand Manager', hc: 1, level: 'Management', reportsTo: 'Marketing Director', responsibilities: 'Maintain brand identity; develop brand guidelines; review all brand touchpoints; manage brand partnerships' },
      { title: 'Digital Marketing Manager', hc: 1, level: 'Management', reportsTo: 'Marketing Director', responsibilities: 'Lead digital campaigns; manage SEO/SEM; oversee paid media; optimize digital performance' },
      { title: 'Content Marketing Manager', hc: 1, level: 'Management', reportsTo: 'Marketing Director', responsibilities: 'Lead content strategy; manage editorial calendar; ensure brand voice consistency; oversee content production' },
      { title: 'SEO/SEM Specialist', hc: 2, level: 'Individual Contributor', reportsTo: 'Digital Marketing Manager', responsibilities: 'Conduct keyword research; optimize web content; manage paid search campaigns; track and report performance' },
      { title: 'Social Media Specialist', hc: 2, level: 'Individual Contributor', reportsTo: 'Content Marketing Manager', responsibilities: 'Manage social platforms; create and schedule content; monitor engagement; respond to community interactions' },
      { title: 'Content Writer / Copywriter', hc: 3, level: 'Individual Contributor', reportsTo: 'Content Marketing Manager', responsibilities: 'Create blog posts, case studies, whitepapers; write ad copy; develop email content; maintain brand voice' },
      { title: 'Graphic Designer', hc: 2, level: 'Individual Contributor', reportsTo: 'Brand Manager / Marketing Director', responsibilities: 'Design marketing assets; create visual content; develop campaign materials; maintain brand standards' },
      { title: 'Email Marketing Specialist', hc: 1, level: 'Individual Contributor', reportsTo: 'Digital Marketing Manager', responsibilities: 'Design and deploy email campaigns; manage subscriber lists; A/B test content; analyze email performance' },
      { title: 'Marketing Analyst', hc: 2, level: 'Individual Contributor', reportsTo: 'Marketing Director', responsibilities: 'Analyze campaign performance; build dashboards; provide data-driven insights; support marketing strategy with metrics' },
      { title: 'Market Research Analyst', hc: 1, level: 'Individual Contributor', reportsTo: 'Marketing Director', responsibilities: 'Conduct market research; analyze competitive landscape; gather customer insights; support product and strategy teams' },
      { title: 'Event & PR Coordinator', hc: 1, level: 'Individual Contributor', reportsTo: 'Marketing Director', responsibilities: 'Coordinate marketing events; manage PR outreach; develop press releases; build media relationships' }
    ],
    operational_routines: {
      daily: ['Marketing operations review', 'Budget tracking', 'Team performance monitoring'],
      weekly: ['Pipeline review and lead quality feedback', 'Campaign alignment session with Sales', 'MQL handoff and feedback loop'],
      monthly: ['Marketing performance report', 'Campaign approvals and brand strategy updates', 'Brand standards enforcement and asset distribution'],
    },
    data_pack: [
      { id: 1, asset: 'Campaign Planning & Execution data' },
      { id: 2, asset: 'Content Calendar Management data' },
      { id: 3, asset: 'Lead Generation Process data' },
      { id: 4, asset: 'Social Media Management data' },
      { id: 5, asset: 'Brand Review & Approval records' },
      { id: 6, asset: 'SEO Optimization reports' },
      { id: 7, asset: 'Email Campaign Workflow data' },
      { id: 8, asset: 'Event Management details' }
    ],
    activities: [
      {
        component: 'Campaign Planning & Execution',
        sections: [
          { name: 'Definition & Briefing', detail: 'Define objectives & audience → Develop creative brief → Design assets.' },
          { name: 'Launch & Optimization', detail: 'Build campaign → Set up tracking → Launch → Monitor performance → Report & optimize.' }
        ]
      },
      {
        component: 'Content Calendar Management',
        sections: [
          { name: 'Ideation & Planning', detail: 'Monthly planning session → Topic ideation → Assign writers/designers.' },
          { name: 'Production & Analysis', detail: 'Draft & review → Approval → Schedule & publish → Promote → Analyze performance.' }
        ]
      },
      {
        component: 'Lead Generation Process',
        sections: [
          { name: 'Segment & Capture', detail: 'Identify target segments → Create lead magnets → Build landing pages.' },
          { name: 'Qualify & Handoff', detail: 'Drive traffic → Capture leads → Qualify MQLs → Hand off to sales.' }
        ]
      }
    ],
    communication_lines: [
      { from: 'CMO', to: 'CEO', content: 'Monthly marketing performance report, campaign approvals, brand strategy updates' },
      { from: 'CMO', to: 'CRO (Sales)', content: 'Weekly pipeline review, lead quality feedback, campaign alignment' },
      { from: 'Marketing Director', to: 'CMO', content: 'Daily marketing operations, budget tracking, team performance' },
      { from: 'Brand Manager', to: 'All Depts', content: 'Brand standards enforcement, creative asset distribution, campaign reviews' }
    ],
    budget_allocation: 3000000
  },
  {
    template_key: 'sales',
    name: 'Sales & CRM',
    description: 'Revenue, Clients & Pipeline',
    icon: 'Target',
    color: 'bg-rose-600',
    mandate: {
      mission: 'To drive sustainable revenue growth through strategic customer acquisition, relationship management, and data-driven sales operations while ensuring customer success and long-term value.',
      objectives: ['Revenue growth and target attainment', 'Customer relationship management', 'Sales pipeline optimization'],
      scope: 'Global'
    },
    core_responsibilities: 'Revenue growth, Customer acquisition, Pipeline management, CRM administration, Account management, Sales forecasting, Sales enablement.',
    deliverables: 'Lead to Opportunity Flow, Sales Forecasting & Pipeline Management, Revenue Performance Reporting, Strategic Account Plans.',
    kpis: [
      { name: 'Monthly Recurring Revenue (MRR)', target: '850000', unit: 'USD' },
      { name: 'Average Deal Size', target: '45000', unit: 'USD' },
      { name: 'Sales Cycle Length', target: '60', unit: 'Days' },
      { name: 'Win Rate', target: '25', unit: '%' },
      { name: 'Quota Attainment', target: '85', unit: '%' },
      { name: 'Pipeline Coverage Ratio', target: '3x', unit: 'Ratio' },
      { name: 'Customer Lifetime Value (CLV)', target: '150000', unit: 'USD' },
      { name: 'Net Retention Rate (NRR)', target: '110', unit: '%' },
      { name: 'SDR to AE Conversion Rate', target: '20', unit: '%' },
      { name: 'Churn Rate', target: '<5', unit: '%' }
    ],
    roles: [
      { title: 'Chief Revenue Officer (CRO)', hc: 1, level: 'Executive', reportsTo: 'CEO / Board of Directors', responsibilities: 'Lead all revenue-generating functions; drive sales strategy; oversee Sales, Marketing, and CS alignment; responsible for top-line growth' },
      { title: 'Sales Director', hc: 1, level: 'Senior Management', reportsTo: 'CRO', responsibilities: 'Manage sales teams; drive revenue targets; oversee pipeline health; coach sales managers; align with Marketing on lead flow' },
      { title: 'Sales Manager', hc: 2, level: 'Management', reportsTo: 'Sales Director', responsibilities: 'Manage AE/SDR teams; conduct weekly pipeline reviews; close key deals; monitor individual performance' },
      { title: 'Account Executive (AE)', hc: 8, level: 'Individual Contributor', reportsTo: 'Sales Manager', responsibilities: 'Source and close new business; manage sales cycle from discovery to close; exceed individual quotas' },
      { title: 'Sales Development Rep (SDR)', hc: 5, level: 'Individual Contributor', reportsTo: 'Sales Manager / SDR Lead', responsibilities: 'Prospect and qualify leads; book discovery calls for AEs; maintain top-of-funnel pipeline' },
      { title: 'Account Manager', hc: 4, level: 'Individual Contributor', reportsTo: 'Sales Director / CS Lead', responsibilities: 'Manage existing client relationships; drive upsells/cross-sells; ensure client retention; manage renewals' },
      { title: 'Sales Operations Manager', hc: 1, level: 'Management', reportsTo: 'Sales Director / CRO', responsibilities: 'Manage sales tools and CRM; optimize sales processes; handle commission reporting; provide sales data analysis' },
      { title: 'Sales Enablement Specialist', hc: 1, level: 'Individual Contributor', reportsTo: 'Sales Operations Manager', responsibilities: 'Develop sales training and materials; manage sales playbook; onboard new sales hires; equip team with sales tools' },
      { title: 'CRM Administrator', hc: 1, level: 'Individual Contributor', reportsTo: 'Sales Operations Manager', responsibilities: 'Maintain CRM data hygiene; manage CRM permissions/workflows; generate CRM reports; support users' },
      { title: 'Revenue Analyst', hc: 2, level: 'Individual Contributor', reportsTo: 'Sales Operations Manager', responsibilities: 'Analyze revenue data; build forecast models; monitor sales performance metrics; identify growth opportunities' }
    ],
    operational_routines: {
      daily: ['Sales operations review', 'Pipeline management stand-up', 'CRM data hygiene checks', 'High-priority lead follow-up review'],
      weekly: ['CRO-CMO pipeline review', 'Lead quality and source feedback loop', 'Sales forecast alignment meeting'],
      monthly: ['Revenue performance report and variance analysis', 'Quota attainment and commission review', 'CRM systems and process audit'],
      quarterly: ['Strategic account planning and QBRs', 'Sales training and enablement workshops', 'Market trend and competitive intelligence briefing'],
      annually: ['Sales quota setting and territory planning', 'Sales incentive plan (SIP) review and rollout']
    },
    data_pack: [
      { id: 1, asset: 'Sales Pipeline (CRM — Salesforce/HubSpot)' },
      { id: 2, asset: 'Lead assignment rules and distribution logic' },
      { id: 3, asset: 'Sales playbook, scripts, and battlecards' },
      { id: 4, asset: 'Pricing & Discount Matrix' },
      { id: 5, asset: 'Contract templates (DocuSign integration)' },
      { id: 6, asset: 'Revenue forecast models' },
      { id: 7, asset: 'Commission calculator' },
      { id: 8, asset: 'Strategic Account Plans' }
    ],
    activities: [
      {
        component: 'Lead to Opportunity Flow',
        sections: [
          { name: 'Qualification & Discovery', detail: 'Lead qualification (SDR) → Discovery call (AE) → Needs analysis.' },
          { name: 'Proposal & negotiation', detail: 'Proposal/Quote creation → Stakeholder review → Negotiation & Close.' }
        ]
      },
      {
        component: 'Sales Forecasting & Pipeline Management',
        sections: [
          { name: 'Forecast Review', detail: 'Weekly pipeline review by stage → Adjust probability weightings.' },
          { name: 'Forecasting', detail: 'Update forecast categories: Pipeline, Best Case, Commit → Aggregate to CRO.' }
        ]
      },
      {
        component: 'System & Process Support',
        sections: [
          { name: 'CRM & Tools', detail: 'Maintain CRM as the single source of truth for all customer interactions.' },
          { name: 'Sales Enablement', detail: 'Iterative updates to the sales playbook based on win/loss analysis.' }
        ]
      }
    ],
    communication_lines: [
      { from: 'CRO', to: 'CEO', content: 'Revenue forecast, growth strategy, market trends, competitive intelligence' },
      { from: 'Sales Director', to: 'CMO', content: 'Lead quality feedback, campaign ROI, alignment on MQL definitions' },
      { from: 'Account Manager', to: 'Customer', content: 'Strategic relationship management, quarterly business reviews, upsell/cross-sell' },
      { from: 'Sales Ops', to: 'CRO', content: 'Pipeline hygiene, tool stack performance, commission reporting' }
    ],
    budget_allocation: 4200000
  },
  {
    template_key: 'leg',
    name: 'Legal',
    description: 'Contracts & Compliance',
    icon: 'Shield',
    color: 'bg-slate-700',
    mandate: {
      mission: 'To protect the organization from legal risk, ensure regulatory compliance, and provide timely, practical legal guidance that enables the business to operate with confidence and integrity.',
      objectives: ['Contract drafting and management', 'Regulatory and statutory compliance', 'Intellectual property protection'],
      scope: 'Global'
    },
    core_responsibilities: 'Contract drafting, Regulatory and statutory compliance, Intellectual property management, Corporate governance, Employment law advisory, Risk management.',
    deliverables: 'Contract Review & Approval, Regulatory Compliance Monitoring, Data Privacy Incident Management, IP Portfolio Management.',
    kpis: [
      { name: 'Contract Turnaround Time', target: '5', unit: 'Business Days' },
      { name: 'Compliance Incident Rate', target: '0', unit: 'Incidents/Year' },
      { name: 'Contract Renewal Rate', target: '95', unit: '%' },
      { name: 'Audit Compliance Score', target: '100', unit: '%' },
      { name: 'On-time Regulatory Filings', target: '100', unit: '%' },
      { name: 'Litigation Resolution Rate', target: '80', unit: '%' },
      { name: 'Data Privacy Impact Assessment Completion', target: '100', unit: '%' },
      { name: 'Legal Spend vs Budget Variance', target: '±5', unit: '%' },
      { name: 'Ethics Training Completion Rate', target: '100', unit: '%' },
      { name: 'Board Reporting Accuracy', target: '100', unit: '%' }
    ],
    roles: [
      { title: 'General Counsel', hc: 1, level: 'Executive', reportsTo: 'CEO / Board of Directors', responsibilities: 'Lead all legal matters; advise board and CEO; manage legal risk; oversee external counsel; ensure corporate governance' },
      { title: 'Deputy General Counsel', hc: 1, level: 'Senior Management', reportsTo: 'General Counsel', responsibilities: 'Support General Counsel; manage legal team; oversee major transactions; lead complex negotiations' },
      { title: 'Corporate Lawyer', hc: 2, level: 'Senior IC', reportsTo: 'General Counsel / Deputy General Counsel', responsibilities: 'Handle corporate transactions; support M&A activities; manage corporate governance; prepare board resolutions' },
      { title: 'Commercial Contracts Lawyer', hc: 2, level: 'Senior IC', reportsTo: 'General Counsel / Deputy General Counsel', responsibilities: 'Draft and negotiate commercial contracts; review vendor and customer agreements; maintain contract templates' },
      { title: 'Compliance Manager', hc: 1, level: 'Management', reportsTo: 'General Counsel', responsibilities: 'Develop and implement compliance programs; monitor regulatory changes; conduct compliance training; manage compliance risk register' },
      { title: 'Data Privacy Officer (DPO)', hc: 1, level: 'Senior IC', reportsTo: 'General Counsel / Board (functional)', responsibilities: 'Ensure data protection compliance; conduct privacy impact assessments; manage data breaches; liaise with regulators' },
      { title: 'Employment Lawyer', hc: 1, level: 'Senior IC', reportsTo: 'General Counsel / Deputy General Counsel', responsibilities: 'Advise on employment law matters; handle disciplinary and grievance processes; support HR on complex employee matters' },
      { title: 'IP Specialist', hc: 1, level: 'Individual Contributor', reportsTo: 'General Counsel', responsibilities: 'Manage trademark and patent portfolios; file IP applications; monitor IP infringement; maintain IP register' },
      { title: 'Legal Operations Analyst', hc: 1, level: 'Individual Contributor', reportsTo: 'General Counsel / Deputy General Counsel', responsibilities: 'Manage legal matter tracking; administer contract management system; generate legal reports; coordinate with external counsel' },
      { title: 'Paralegal', hc: 3, level: 'Individual Contributor', reportsTo: 'Assigned Lawyer', responsibilities: 'Assist lawyers with drafting; conduct legal research; manage document review; organize legal files; coordinate court filings' },
      { title: 'Contract Administrator', hc: 2, level: 'Individual Contributor', reportsTo: 'Legal Operations Analyst', responsibilities: 'Maintain contract database; track expiry dates and renewals; ensure signed copies filed; support contract negotiations' }
    ],
    operational_routines: {
      daily: ['Case reviews', 'Legal team stand-up', 'Urgent contract intake review'],
      weekly: ['Contract status updates', 'Regulatory updates and news scan', 'Issue log review'],
      monthly: ['Compliance report to executive team', 'Board pack preparation', 'Incident reporting review', 'Legal spend vs. budget analysis'],
      quarterly: ['Policy reviews and updates', 'IP portfolio audit', 'Regulatory risk assessments', 'Corporate governance audit'],
      annually: ['Statutory reporting and filings', 'Board evaluation process', 'Annual compliance certification rollout']
    },
    data_pack: [
      { id: 1, asset: 'Contract templates (NDA, MSA, SOW)' },
      { id: 2, asset: 'Regulatory compliance calendar' },
      { id: 3, asset: 'IP Register (Trademarks, Patents)' },
      { id: 4, asset: 'Corporate Governance Framework' },
      { id: 5, asset: 'Data Privacy Impact Assessments (DPIA)' },
      { id: 6, asset: 'Legal entity documents (Articles of Association, etc.)' },
      { id: 7, asset: 'Board minutes and resolutions' },
      { id: 8, asset: 'Insurance policies and coverage details' }
    ],
    activities: [
      {
        component: 'Contract Review & Approval',
        sections: [
          { name: 'Intake & Review', detail: 'Intake request → Legal review vs. standard terms → Negotiation.' },
          { name: 'Approval & Filing', detail: 'Final internal approval → External signature → File in CLM.' }
        ]
      },
      {
        component: 'Regulatory Compliance Monitoring',
        sections: [
          { name: 'Identification & Audit', detail: 'Identify applicable regulations → Map to internal owners → Conduct periodic audits.' },
          { name: 'Remediation', detail: 'Identify gaps → Remediate → Verify.' }
        ]
      },
      {
        component: 'Data Privacy Incident Management',
        sections: [
          { name: 'Report & Assess', detail: 'Receive report → Triage → Assess risk (DPO).' },
          { name: 'Mitigation & Reporting', detail: 'Contain & Mitigate → Communicate (if required) → Post-incident review.' }
        ]
      }
    ],
    communication_lines: [
      { from: 'General Counsel', to: 'CEO', content: 'Legal risk profile, major litigation updates, strategic legal advice' },
      { from: 'Compliance Manager', to: 'General Counsel', content: 'Compliance audit results, regulatory change alerts, risk register' },
      { from: 'Contract Administrator', to: 'Finance/Sales', content: 'Contract signature alerts, expiry warnings, renewal triggers' },
      { from: 'DPO', to: 'CEO/Board', content: 'Data privacy status, breach reporting, DPIA summaries' }
    ],
    budget_allocation: 3000000
  },
  {
    template_key: 'it',
    name: 'IT & Systems',
    description: 'Assets & Technical Debt',
    icon: 'Cpu',
    color: 'bg-indigo-600',
    mandate: {
      mission: 'To provide secure, reliable, and scalable technology infrastructure that enables organizational productivity, supports digital transformation, and minimizes technical risk across the enterprise.',
      objectives: ['IT infrastructure and network management', 'Cybersecurity and data protection', 'Enterprise software systems management'],
      scope: 'Global'
    },
    core_responsibilities: 'IT infrastructure and network management, Cybersecurity, Software development, IT helpdesk, Data management, Cloud architecture.',
    deliverables: 'Network Management, Hardware Provisioning, Software Deployment, Security Monitoring, IT Support Services.',
    kpis: [
      { name: 'System Uptime (Critical Apps)', target: '99.9', unit: '%' },
      { name: 'Mean Time to Resolve (MTTR) - Tickets', target: '4', unit: 'Hours' },
      { name: 'Cybersecurity Incident Rate', target: '0', unit: 'Incidents/Quarter' },
      { name: 'Software Deployment Success Rate', target: '98', unit: '%' },
      { name: 'Hardware Refresh Compliance', target: '100', unit: '%' },
      { name: 'Backup Recovery Success Rate', target: '100', unit: '%' },
      { name: 'Employee IT Satisfaction Score', target: '90', unit: '%' },
      { name: 'Security Awareness Training Completion', target: '100', unit: '%' },
      { name: 'Network Latency (Avg)', target: '<20', unit: 'ms' },
      { name: 'IT Spend vs Budget Variance', target: '±3', unit: '%' }
    ],
    roles: [
      { title: 'Chief Technology Officer (CTO) / CIO', hc: 1, level: 'Executive', reportsTo: 'CEO / Board of Directors', responsibilities: 'Define technology vision; oversee IT and engineering; drive digital transformation; manage IT governance and risk' },
      { title: 'IT Director', hc: 1, level: 'Senior Management', reportsTo: 'CTO / CIO', responsibilities: 'Manage IT operations; supervise IT managers; ensure infrastructure reliability; drive technology strategy execution' },
      { title: 'IT Manager', hc: 2, level: 'Management', reportsTo: 'IT Director', responsibilities: 'Manage IT teams; oversee helpdesk and infrastructure; manage vendors; ensure SLA compliance; handle escalations' },
      { title: 'Head of Software Engineering', hc: 1, level: 'Management', reportsTo: 'CTO / CIO', responsibilities: 'Lead development team; oversee software delivery; manage technical architecture; drive agile development practices' },
      { title: 'Senior Software Engineer', hc: 4, level: 'Senior IC', reportsTo: 'Head of Software Engineering', responsibilities: 'Design and build complex software; conduct code reviews; mentor junior developers; contribute to architecture decisions' },
      { title: 'Software Engineer', hc: 6, level: 'Individual Contributor', reportsTo: 'Head of Software Engineering / Senior Software Engineer', responsibilities: 'Develop and test software features; fix bugs; write technical documentation; participate in agile ceremonies' },
      { title: 'DevOps Engineer', hc: 2, level: 'Individual Contributor', reportsTo: 'Head of Software Engineering / IT Manager', responsibilities: 'Manage CI/CD pipelines; automate deployments; maintain cloud infrastructure; monitor system performance' },
      { title: 'Cybersecurity Analyst', hc: 2, level: 'Individual Contributor', reportsTo: 'IT Director / IT Manager', responsibilities: 'Monitor for security threats; conduct vulnerability assessments; manage SIEM tools; respond to security incidents' },
      { title: 'Network Administrator', hc: 2, level: 'Individual Contributor', reportsTo: 'IT Manager', responsibilities: 'Manage network infrastructure; configure routers and switches; monitor network performance; troubleshoot connectivity issues' },
      { title: 'Systems Administrator', hc: 2, level: 'Individual Contributor', reportsTo: 'IT Manager', responsibilities: 'Manage servers and operating systems; perform patching; manage user accounts; ensure system availability' },
      { title: 'IT Helpdesk Technician', hc: 4, level: 'Individual Contributor', reportsTo: 'IT Manager', responsibilities: 'Provide tier-1 and tier-2 support; resolve hardware/software issues; manage service tickets; escalate complex issues' },
      { title: 'Data Engineer', hc: 2, level: 'Individual Contributor', reportsTo: 'Head of Software Engineering / IT Director', responsibilities: 'Build and maintain data pipelines; manage data warehouse; ensure data quality; support business intelligence needs' },
      { title: 'IT Procurement & Asset Manager', hc: 1, level: 'Individual Contributor', reportsTo: 'IT Director', responsibilities: 'Manage IT asset inventory; coordinate hardware procurement; track software licenses; oversee asset disposal' }
    ],
    operational_routines: {
      daily: ['Security log monitoring and threat detection', 'IT helpdesk ticket triage and assignment', 'Critical system health checks and monitoring alerts'],
      weekly: ['Hardware provisioning for new hires/upgrades', 'Software patch and update deployment', 'IT team stand-up and project progress', 'Backup verification and log reviews'],
      monthly: ['Vulnerability scans and remediation', 'Access reviews and IAM audit', 'IT spend analysis and budget tracking', 'IT vendor performance review'],
      quarterly: ['Disaster Recovery (DR) and BCP drills', 'Technical debt audit and prioritization', 'Strategic IT roadmap review session', 'Security awareness training rollout'],
      annually: ['Hardware refresh cycle planning', 'IT budget development', 'Comprehensive annual security audit', 'Enterprise software license review']
    },
    data_pack: [
      { id: 1, asset: 'IT Asset Register (Hardware/Software)' },
      { id: 2, asset: 'Network Architecture Diagrams' },
      { id: 3, asset: 'Identity & Access Management (IAM) policies' },
      { id: 4, asset: 'Backup & Disaster Recovery (BDR) logs' },
      { id: 5, asset: 'Service Level Agreements (SLAs) with vendors' },
      { id: 6, asset: 'Vulnerability Assessment reports' },
      { id: 7, asset: 'Software license keys and expiry dates' },
      { id: 8, asset: 'IT Helpdesk Ticket logs (Jira/ServiceNow)' }
    ],
    activities: [
      {
        component: 'Network Management',
        sections: [
          { name: 'Monitoring & Maintenance', detail: 'Monitor network uptime → Proactively identify bottlenecks' },
          { name: 'Resolution', detail: 'Troubleshoot connectivity issues → Optimize performance.' }
        ]
      },
      {
        component: 'Hardware Provisioning',
        sections: [
          { name: 'Procure & Setup', detail: 'Procurement according to standard spec → Setup & imaging (Standard Image).' },
          { name: 'Delivery', detail: 'Handover to employee & enrollment in MDM.' }
        ]
      },
      {
        component: 'Software Deployment',
        sections: [
          { name: 'Packaging & Distribution', detail: 'Package applications for deployment → Distribute via MDM (e.g., Jamf, Intune).' },
          { name: 'Verification', detail: 'Verify installation and license compliance.' }
        ]
      },
      {
        component: 'Security Monitoring',
        sections: [
          { name: 'Detection & Analysis', detail: 'Log analysis → Detect anomalies → Threat analysis.' },
          { name: 'Response', detail: 'Incident response protocol → Containment & Mitigation.' }
        ]
      }
    ],
    communication_lines: [
      { from: 'CIO/CTO', to: 'CEO', content: 'Tech debt status, security posture, innovation roadmap, IT budget' },
      { from: 'IT Manager', to: 'All Staff', content: 'Scheduled maintenance, security alerts, IT policy updates' },
      { from: 'IT Support Lead', to: 'IT Manager', content: 'Ticket trends, MTTR reports, recurring hardware failure rates' },
      { from: 'Security Lead', to: 'CIO/CTO', content: 'Real-time threat alerts, vulnerability assessment results, compliance gaps' }
    ],
    budget_allocation: 7000000
  },
  {
    template_key: 'stg',
    name: 'Strategy & OKRs',
    description: 'Roadmaps & Goal Tracking',
    icon: 'Target',
    color: 'bg-cyan-600',
    mandate: {
      mission: 'To define and drive organizational strategy, ensuring alignment of objectives and key results (OKRs) across all departments through rigorous planning and data-driven performance management.',
      objectives: ['Long-term strategic planning', 'OKR framework governance', 'Market and competitive intelligence management'],
      scope: 'Global'
    },
    core_responsibilities: 'Strategic planning, Goal alignment, Performance tracking, Market analysis, OKR governance, Strategic initiative management.',
    deliverables: 'Quarterly Strategic Reviews, OKR Setting Workshops, Strategic Roadmap, Market Intelligence Reports.',
    kpis: [
      { name: 'OKR Achievement Rate', target: '80', unit: '%' },
      { name: 'Strategic Initiative Completion', target: '90', unit: '%' },
      { name: 'Objective Alignment Score', target: '100', unit: '%' },
      { name: 'Market Insight Timeliness', target: '100', unit: '%' },
      { name: 'Dashboard Utilization Rate', target: '85', unit: '%' },
      { name: 'Strategy Execution Index', target: '90', unit: 'Score' },
      { name: 'Board Reporting Satisfaction', target: '95', unit: '%' },
      { name: 'Innovation Pipeline Velocity', target: '15', unit: '%' },
      { name: 'Cross-functional Synergy Score', target: '80', unit: '%' },
      { name: 'Strategic Risk Mitigation Rate', target: '100', unit: '%' }
    ],
    roles: [
      { title: 'Chief Strategy Officer (CSO)', hc: 1, level: 'Executive', reportsTo: 'CEO / Board of Directors', responsibilities: 'Lead organizational strategy; facilitate long-term planning; advise CEO and board; drive innovation agenda; manage strategic partnerships' },
      { title: 'Head of Strategy', hc: 1, level: 'Senior Management', reportsTo: 'CSO', responsibilities: 'Manage strategy function; lead strategic planning process; coordinate cross-functional strategy; produce executive reporting' },
      { title: 'OKR Program Manager', hc: 1, level: 'Management', reportsTo: 'Head of Strategy / CSO', responsibilities: 'Design and govern OKR framework; facilitate OKR cycles; coach departments on goal-setting; track and report on company-wide OKR progress' },
      { title: 'Strategy Analyst', hc: 3, level: 'Individual Contributor', reportsTo: 'Head of Strategy', responsibilities: 'Conduct market and competitive research; build strategic models; support business case development; prepare strategy presentations' },
      { title: 'Business Intelligence Analyst', hc: 2, level: 'Individual Contributor', reportsTo: 'Head of Strategy', responsibilities: 'Build executive dashboards; automate performance reporting; analyze business data; deliver insights to leadership team' },
      { title: 'Innovation Manager', hc: 1, level: 'Management', reportsTo: 'CSO / Head of Strategy', responsibilities: 'Identify innovation opportunities; manage innovation pipeline; facilitate design thinking workshops; pilot new business ideas' },
      { title: 'Project Management Office (PMO) Lead', hc: 1, level: 'Management', reportsTo: 'CSO / COO', responsibilities: 'Govern project portfolio; ensure strategic alignment of projects; manage PMO standards; track initiative delivery' },
      { title: 'PMO Analyst', hc: 2, level: 'Individual Contributor', reportsTo: 'PMO Lead', responsibilities: 'Track strategic project status; maintain project registers; support PMO governance; prepare portfolio dashboards' },
      { title: 'Change Management Specialist', hc: 2, level: 'Individual Contributor', reportsTo: 'Head of Strategy / OKR Program Manager', responsibilities: 'Manage organizational change communications; develop change plans; train staff; monitor adoption of strategic changes' }
    ],
    operational_routines: {
      daily: ['Strategy operations review', 'High-priority metric tracking and anomaly detection'],
      weekly: ['Strategy team stand-up', 'Strategic initiative status updates', 'Risk log and blocker review'],
      monthly: ['Executive strategy review session', 'Monthly OKR progress dashboard distribution', 'Market and competitive analysis update report'],
      quarterly: ['OKR setting workshops with all departments', 'Strategic roadmap refresh and alignment', 'Board strategy presentation preparation'],
      annually: ['Annual strategic planning cycle (Jul–Sep)', '3-year strategic plan update', 'Strategic planning board retreat coordination']
    },
    data_pack: [
      { id: 1, asset: 'Enterprise OKR Tracker (Lattice/WorkBoard)' },
      { id: 2, asset: 'Strategic Roadmap (Productboard/Miro)' },
      { id: 3, asset: 'Market Intelligence reports' },
      { id: 4, asset: 'Competitive Analysis database' },
      { id: 5, asset: 'Board Strategy decks' },
      { id: 6, asset: 'Strategic Initiative Project logs' },
      { id: 7, asset: 'Financial models for 3-year plan' },
      { id: 8, asset: 'Quarterly Business Review (QBR) templates' }
    ],
    activities: [
      {
        component: 'OKR Cycle Management',
        sections: [
          { name: 'Planning & Workshops', detail: 'Readiness assessment → Alignment workshops → Final OKR setting.' },
          { name: 'Review & Reporting', detail: 'Mid-cycle review → Final review & scoring → Board reporting.' }
        ]
      },
      {
        component: 'Strategic Initiative Tracking',
        sections: [
          { name: 'Definition & Governance', detail: 'Define initiative → Assign executive owners → Set milestones.' },
          { name: 'Reporting', detail: 'Fortnightly status reporting → Escalation to Executive Strategy Review.' }
        ]
      },
      {
        component: 'Market & Competitive Intelligence',
        sections: [
          { name: 'Collection & Analysis', detail: 'Primary/Secondary research → Data collection → SWOT analysis.' },
          { name: 'Distribution', detail: 'Synthesis & reporting → Strategic implications briefing for leadership.' }
        ]
      }
    ],
    communication_lines: [
      { from: 'CSO', to: 'CEO/Board', content: 'Long-term strategy, market shifts, strategic goal achievement, partnership strategy' },
      { from: 'Head of Strategy', to: 'CSO', content: 'Initiative tracking reports, strategic risk alerts, performance variances' },
      { from: 'OKR Program Mgr', to: 'Dept Heads', content: 'OKR alignment workshops, dependency management, scoring guidance' },
      { from: 'BI Analyst', to: 'Exec Team', content: 'Performance dashboards, data-driven insights, trend analysis' }
    ],
    budget_allocation: 2500000
  },
  {
    template_key: 'adm',
    name: 'Administration',
    description: 'Records & Procurement',
    icon: 'Clipboard',
    color: 'bg-teal-600',
    mandate: {
      mission: 'To ensure smooth daily operations through effective facility management, rigorous record keeping, and high-quality administrative support services that enable organizational focus.',
      objectives: ['Facility and office management', 'Corporate record keeping and compliance', 'Executive and team administrative support'],
      scope: 'Global'
    },
    core_responsibilities: 'Facility management, Record keeping, Administrative support, Internal communications, Office procurement, Fleet management.',
    deliverables: 'Facility Maintenance log, Record Archiving, Event Coordination, Travel & Logistics Management.',
    kpis: [
      { name: 'Facility Satisfaction Score', target: '90', unit: '%' },
      { name: 'Record Retrieval Time', target: '5', unit: 'Minutes' },
      { name: 'Administrative Support Rating', target: '95', unit: '%' },
      { name: 'Facility Service Request Closure', target: '48', unit: 'Hours' },
      { name: 'Office Spend Variance', target: '±5', unit: '%' },
      { name: 'Travel Policy Compliance', target: '98', unit: '%' },
      { name: 'Health & Safety Audit Score', target: '100', unit: '%' },
      { name: 'Visitor Satisfaction Score', target: '90', unit: '%' },
      { name: 'Space Utilization Efficiency', target: '80', unit: '%' },
      { name: 'Fleet Availability Rate', target: '95', unit: '%' }
    ],
    roles: [
      { title: 'Chief Administrative Officer (CAO)', hc: 1, level: 'Executive', reportsTo: 'CEO / Board of Directors', responsibilities: 'Oversee all administrative functions; ensure operational efficiency; manage cross-functional support services; report to CEO' },
      { title: 'Administration Manager', hc: 1, level: 'Management', reportsTo: 'CAO', responsibilities: 'Manage admin team; oversee day-to-day office operations; coordinate facilities and services; ensure policy compliance' },
      { title: 'Executive Assistant (CEO/Board)', hc: 2, level: 'Senior IC', reportsTo: 'CEO / CAO', responsibilities: 'Support CEO and board; manage executive calendars; coordinate board meetings; prepare executive correspondence and reports' },
      { title: 'Administrative Coordinator', hc: 4, level: 'Individual Contributor', reportsTo: 'Administration Manager', responsibilities: 'Provide department administrative support; manage scheduling; coordinate meetings; prepare reports; handle correspondence' },
      { title: 'Records Manager', hc: 1, level: 'Individual Contributor', reportsTo: 'Administration Manager', responsibilities: 'Develop and enforce records management policies; oversee document filing systems; manage archive retrieval; ensure compliance' },
      { title: 'Procurement Officer', hc: 2, level: 'Individual Contributor', reportsTo: 'Administration Manager', responsibilities: 'Source and purchase general office goods and services; manage vendor relationships; process purchase orders; track spending' },
      { title: 'Travel & Logistics Coordinator', hc: 2, level: 'Individual Contributor', reportsTo: 'Administration Manager', responsibilities: 'Book employee travel; manage travel policies; track travel expenses; coordinate visas and accommodations; manage travel vendors' },
      { title: 'Receptionist / Front Office Officer', hc: 2, level: 'Individual Contributor', reportsTo: 'Administration Manager / Office Manager', responsibilities: 'Manage reception; greet visitors; handle incoming calls; manage mail and courier; support office administration' },
      { title: 'Fleet Administrator', hc: 1, level: 'Individual Contributor', reportsTo: 'Administration Manager', responsibilities: 'Manage company vehicle fleet; coordinate maintenance schedules; track fuel usage; manage driver records; ensure vehicle compliance' },
      { title: 'Office Manager', hc: 1, level: 'Management', reportsTo: 'Administration Manager', responsibilities: 'Manage daily office operations; coordinate facilities; manage office supplies; ensure clean and organized work environment; health and safety liaison' }
    ],
    operational_routines: {
      daily: ['Front office operations and reception management', 'Direct mail and courier handling/dispatch', 'Daily office and facility walk-around and check'],
      weekly: ['Office supply inventory review and replenishment', 'Travel booking review for upcoming week', 'Fleet status and maintenance check'],
      monthly: ['Monthly office spend and budget variance report', 'Vendor performance review (Facilities, Travel, Courier)', 'Space utilization audit and report'],
      quarterly: ['Physical asset audit and registry update', 'BCP administrative and facility drill', 'Health & Safety inspection and remediation'],
      annually: ['Annual facility maintenance plan development', 'Corporate insurance renewal review', 'Office lease and facility contract review']
    },
    data_pack: [
      { id: 1, asset: 'Facility Maintenance log' },
      { id: 2, asset: 'Office supply inventory system' },
      { id: 3, asset: 'Record management index (Physical/Digital)' },
      { id: 4, asset: 'Travel booking records' },
      { id: 5, asset: 'Fleet management log (Fuel, Maintenance)' },
      { id: 6, asset: 'Visitor log records' },
      { id: 7, asset: 'Administrative policy manual' },
      { id: 8, asset: 'Vendor contracts (Facilities, Travel, Courier)' }
    ],
    activities: [
      {
        component: 'Facility Management',
        sections: [
          { name: 'Daily Checks & Incident Reports', detail: 'Daily checks (HVAC, Lighting, Access) → Log incidents → Contractor dispatch.' },
          { name: 'Facility Maintenance', detail: 'Scheduled preventative maintenance → Ad-hoc repairs → Sign-off.' }
        ]
      },
      {
        component: 'Record Keeping',
        sections: [
          { name: 'Document Lifecycle', detail: 'Intake document → Categorization & filing → Retention monitoring.' },
          { name: 'Archive & Disposal', detail: 'Archive retrieval requests → Periodic disposal per retention policy.' }
        ]
      },
      {
        component: 'Administrative Support',
        sections: [
          { name: 'Calendar & Travel', detail: 'Calendar management (CSO/CAO) → Meeting coordination → Travel booking (Flight/Hotel).' },
          { name: 'Post-Travel', detail: 'Travel expense reconciliation support.' }
        ]
      }
    ],
    communication_lines: [
      { from: 'CAO', to: 'CEO', content: 'Administrative efficiency reports, facility risks, corporate insurance status' },
      { from: 'Admin Manager', to: 'CAO', content: 'Daily operations report, spend alerts, facility maintenance issues' },
      { from: 'Records Manager', to: 'Legal', content: 'Record retention compliance, audit support, discovery requests' },
      { from: 'Fleet Admin', to: 'Finance', content: 'Fleet costs, fuel usage reports, maintenance forecasts' }
    ],
    budget_allocation: 1850000
  }
];

async function main() {
  const adminUser = await prisma.user.findUnique({
    where: { email: 'manager@verdant.com' }
  });

  if (!adminUser) {
    console.error('Admin user not found!');
    process.exit(1);
  }

  const companyId = adminUser.company_id;

  // Update company identity
  await prisma.company.update({
    where: { id: companyId },
    data: {
      tagline: 'Empowering Growth through Technology',
      description: 'Verdant Fields AgriTech Ltd. is dedicated to driving sustainable growth and operational excellence through innovative financial integrity and resource optimization.',
      brand_colors: { primary: '#0F172A', secondary: '#B8860B' }
    }
  });

  console.log('Updated Company Identity');

  // Upsert all 9 departments
  for (const deptData of departmentsData) {
    const existing = await prisma.department.findFirst({
      where: {
        company_id: companyId,
        template_key: deptData.template_key
      }
    });

    if (existing) {
      await prisma.department.update({
        where: { id: existing.id },
        data: {
          name: deptData.name,
          description: deptData.description,
          icon: deptData.icon,
          color: deptData.color,
          mandate: deptData.mandate,
          core_responsibilities: deptData.core_responsibilities,
          deliverables: deptData.deliverables,
          roles: deptData.roles,
          operational_routines: deptData.operational_routines,
          data_pack: deptData.data_pack,
          activities: deptData.activities,
          communication_lines: deptData.communication_lines,
          budget_allocation: deptData.budget_allocation,
        }
      });
      console.log(`Updated department: ${deptData.name}`);
    } else {
      await prisma.department.create({
        data: {
          company_id: companyId,
          template_key: deptData.template_key,
          name: deptData.name,
          description: deptData.description,
          icon: deptData.icon,
          color: deptData.color,
          mandate: deptData.mandate,
          core_responsibilities: deptData.core_responsibilities,
          deliverables: deptData.deliverables,
          roles: deptData.roles,
          operational_routines: deptData.operational_routines,
          data_pack: deptData.data_pack,
          activities: deptData.activities,
          communication_lines: deptData.communication_lines,
          budget_allocation: deptData.budget_allocation,
        }
      });
      console.log(`Created department: ${deptData.name}`);
    }
  }

  // Update setup state
  await prisma.companySetup.upsert({
    where: { company_id: companyId },
    update: {
      current_step: 4,
      steps_config: { completed: ['identity', 'departments', 'configure'] },
      completed_steps: [1, 2, 3]
    },
    create: {
      company_id: companyId,
      current_step: 4,
      steps_config: { completed: ['identity', 'departments', 'configure'] },
      completed_steps: [1, 2, 3]
    }
  });

  console.log('Updated CompanySetup progress to Step 4');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
