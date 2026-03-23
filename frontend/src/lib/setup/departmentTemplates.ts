export interface DepartmentTemplateKPI {
  name: string;
  target: string;
  unit: string;
}

export interface DepartmentTemplateRole {
  title: string;
  responsibilities: string;
  reportsTo: string;
}

export interface DepartmentQuickStartTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  mandate: string;
  coreResponsibilities: string;
  deliverables: string;
  kpis: DepartmentTemplateKPI[];
  roles: DepartmentTemplateRole[];
  budget: string;
  workflows: string[];
}

export const departmentQuickStartTemplates: Record<string, DepartmentQuickStartTemplate> = {
  fin: {
    id: 'fin',
    name: 'Finance',
    description: 'Accounting, Budgeting & P&L',
    icon: 'Wallet',
    color: '#B8860B',
    mandate:
      'To ensure financial integrity, optimize resource allocation, and provide strategic financial insight that drives sustainable growth and operational excellence.',
    coreResponsibilities:
      'Financial planning and analysis, budget management and forecasting, accounts payable and receivable operations, financial reporting and compliance, treasury and cash flow management, tax and audit readiness.',
    deliverables:
      'Monthly management accounts, accounts payable processing, receivables management, budget planning and monitoring, cash flow forecasts, audit-ready reporting packs.',
    kpis: [
      { name: 'Operating Margin', target: '15', unit: '%' },
      { name: 'Budget Variance', target: '5', unit: '%' },
      { name: 'Cash Flow Forecast Accuracy', target: '95', unit: '%' },
    ],
    roles: [
      {
        title: 'Chief Financial Officer',
        responsibilities: 'Oversee all financial operations, set financial strategy, and ensure compliance and capital discipline.',
        reportsTo: 'CEO / Board',
      },
      {
        title: 'Finance Manager',
        responsibilities: 'Run budgeting, reporting, and management accounting across the company.',
        reportsTo: 'CFO',
      },
      {
        title: 'Accounts Payable & Receivable Lead',
        responsibilities: 'Manage invoice processing, collections, reconciliations, and payment control workflows.',
        reportsTo: 'Finance Manager',
      },
    ],
    budget: '3850000',
    workflows: [
      'Daily cash position review and payment prioritization',
      'Weekly AP and AR reconciliation review',
      'Month-end close, variance analysis, and management reporting',
    ],
  },
  hr: {
    id: 'hr',
    name: 'Human Resources',
    description: 'Talent, Payroll & Culture',
    icon: 'Users',
    color: '#4682B4',
    mandate:
      'To attract, develop, and retain exceptional talent while building a culture of engagement, fairness, and high performance.',
    coreResponsibilities:
      'Talent acquisition, employee onboarding, performance management, compensation and benefits, employee relations, learning and development, HR compliance.',
    deliverables:
      'Recruitment pipelines, onboarding programs, performance review cycles, benefits administration, offboarding workflows, workforce reporting.',
    kpis: [
      { name: 'Employee Turnover Rate', target: '10', unit: '%' },
      { name: 'Time to Fill Positions', target: '35', unit: 'Days' },
      { name: 'Employee Engagement Score', target: '85', unit: '%' },
    ],
    roles: [
      {
        title: 'Chief Human Resources Officer',
        responsibilities: 'Lead workforce strategy, culture, and organizational development.',
        reportsTo: 'CEO / Board',
      },
      {
        title: 'HR Manager',
        responsibilities: 'Manage employee lifecycle operations, policy implementation, and HR team coordination.',
        reportsTo: 'CHRO',
      },
      {
        title: 'Talent Acquisition Lead',
        responsibilities: 'Drive hiring pipelines, structured interviews, and onboarding handoff.',
        reportsTo: 'HR Manager',
      },
    ],
    budget: '3250000',
    workflows: [
      'Weekly recruitment pipeline review with hiring managers',
      'Structured onboarding from offer acceptance through 90-day review',
      'Quarterly performance and development plan check-ins',
    ],
  },
  ops: {
    id: 'ops',
    name: 'Operations',
    description: 'Processes & Supply Chain',
    icon: 'Settings',
    color: '#2E7D32',
    mandate:
      'To design, optimize, and oversee the operating systems that let the company deliver reliably, efficiently, and at a consistently high quality standard.',
    coreResponsibilities:
      'Business process design, supply chain management, vendor coordination, quality assurance, facilities oversight, operational risk management.',
    deliverables:
      'Procurement cycles, supply chain visibility, quality assurance workflows, vendor management processes, operational reporting dashboards.',
    kpis: [
      { name: 'Operational Efficiency Rate', target: '92', unit: '%' },
      { name: 'On-Time Delivery Rate', target: '98', unit: '%' },
      { name: 'Vendor On-Time Delivery', target: '95', unit: '%' },
    ],
    roles: [
      {
        title: 'Chief Operating Officer',
        responsibilities: 'Own execution quality, operational scaling, and cross-functional delivery alignment.',
        reportsTo: 'CEO / Board',
      },
      {
        title: 'Operations Manager',
        responsibilities: 'Coordinate day-to-day workflows, remove bottlenecks, and manage KPI performance.',
        reportsTo: 'COO',
      },
      {
        title: 'Supply Chain Manager',
        responsibilities: 'Manage procurement, inventory, vendors, and logistics flow.',
        reportsTo: 'Operations Manager',
      },
    ],
    budget: '4100000',
    workflows: [
      'Daily operations stand-up and issue escalation review',
      'Weekly procurement and vendor performance review',
      'Monthly quality, safety, and efficiency dashboard review',
    ],
  },
  mkt: {
    id: 'mkt',
    name: 'Marketing',
    description: 'Brand & Content Calendar',
    icon: 'Megaphone',
    color: '#C2185B',
    mandate:
      'To build the company brand, generate qualified demand, and create a consistent market narrative that supports growth.',
    coreResponsibilities:
      'Brand management, campaign planning, content creation, market messaging, lead generation support, marketing analytics.',
    deliverables:
      'Campaign calendars, brand assets, thought leadership content, performance reports, lead-generation initiatives.',
    kpis: [
      { name: 'Marketing Qualified Leads', target: '120', unit: 'Per Month' },
      { name: 'Campaign ROI', target: '4', unit: 'x' },
      { name: 'Content Production Cadence', target: '8', unit: 'Assets / Month' },
    ],
    roles: [
      {
        title: 'Marketing Director',
        responsibilities: 'Own brand, pipeline contribution, and campaign strategy.',
        reportsTo: 'CEO',
      },
      {
        title: 'Content Marketing Lead',
        responsibilities: 'Manage editorial planning, storytelling, and campaign content execution.',
        reportsTo: 'Marketing Director',
      },
      {
        title: 'Growth Marketing Specialist',
        responsibilities: 'Run digital campaigns, attribution, and lead-generation experiments.',
        reportsTo: 'Marketing Director',
      },
    ],
    budget: '1800000',
    workflows: [
      'Quarterly campaign planning and calendar approval',
      'Weekly content sprint review and publishing schedule',
      'Monthly funnel and attribution performance review',
    ],
  },
  sls: {
    id: 'sls',
    name: 'Sales & CRM',
    description: 'Leads & Deal Pipelines',
    icon: 'TrendingUp',
    color: '#EF4444',
    mandate:
      'To convert demand into revenue through disciplined pipeline management, strong customer relationships, and accurate sales forecasting.',
    coreResponsibilities:
      'Lead qualification, deal progression, account management, forecasting, CRM hygiene, renewal and expansion planning.',
    deliverables:
      'Qualified pipelines, forecast calls, customer account plans, renewal trackers, weekly deal reviews.',
    kpis: [
      { name: 'Pipeline Coverage', target: '3', unit: 'x' },
      { name: 'Win Rate', target: '28', unit: '%' },
      { name: 'Forecast Accuracy', target: '90', unit: '%' },
    ],
    roles: [
      {
        title: 'Sales Director',
        responsibilities: 'Lead revenue strategy, forecasting, and team performance.',
        reportsTo: 'CEO',
      },
      {
        title: 'Account Executive',
        responsibilities: 'Own opportunities, demos, negotiation, and closing.',
        reportsTo: 'Sales Director',
      },
      {
        title: 'CRM & Revenue Operations Analyst',
        responsibilities: 'Maintain CRM quality, reporting, and pipeline visibility.',
        reportsTo: 'Sales Director',
      },
    ],
    budget: '2400000',
    workflows: [
      'Weekly pipeline review and stage progression',
      'Monthly forecast submission and variance review',
      'Quarterly account planning for top customers',
    ],
  },
  leg: {
    id: 'leg',
    name: 'Legal',
    description: 'Contracts & Compliance',
    icon: 'Shield',
    color: '#455A64',
    mandate:
      'To protect the company through sound contract governance, regulatory compliance, and practical legal risk management.',
    coreResponsibilities:
      'Contract review, regulatory tracking, policy governance, legal risk assessment, internal advisory, records of obligation management.',
    deliverables:
      'Contract templates, review workflows, compliance calendars, legal risk registers, policy updates, approval records.',
    kpis: [
      { name: 'Contract Turnaround Time', target: '5', unit: 'Business Days' },
      { name: 'Compliance Deadline Completion', target: '100', unit: '%' },
      { name: 'Outstanding Legal Risk Actions', target: '0', unit: 'Critical Items' },
    ],
    roles: [
      {
        title: 'General Counsel',
        responsibilities: 'Lead legal strategy, risk posture, and executive advisory.',
        reportsTo: 'CEO / Board',
      },
      {
        title: 'Legal Counsel',
        responsibilities: 'Review contracts, support negotiations, and manage compliance obligations.',
        reportsTo: 'General Counsel',
      },
      {
        title: 'Compliance Officer',
        responsibilities: 'Track regulatory deadlines, evidence, and audit readiness.',
        reportsTo: 'General Counsel',
      },
    ],
    budget: '1600000',
    workflows: [
      'Contract intake, review, approval, and execution workflow',
      'Monthly compliance calendar review and evidence collection',
      'Quarterly policy review and risk register refresh',
    ],
  },
  it: {
    id: 'it',
    name: 'IT & Systems',
    description: 'Assets & Technical Debt',
    icon: 'Cpu',
    color: '#512DA8',
    mandate:
      'To build, operate, and secure the technology systems that keep the company productive, resilient, and ready to scale.',
    coreResponsibilities:
      'Service desk operations, asset management, systems administration, cybersecurity hygiene, knowledge base upkeep, change control.',
    deliverables:
      'IT ticket workflows, asset registers, knowledge articles, change logs, uptime and security status reporting.',
    kpis: [
      { name: 'First Response SLA', target: '95', unit: '%' },
      { name: 'Critical Asset Coverage', target: '100', unit: '%' },
      { name: 'Change Success Rate', target: '98', unit: '%' },
    ],
    roles: [
      {
        title: 'Head of IT & Systems',
        responsibilities: 'Own IT strategy, service reliability, and systems governance.',
        reportsTo: 'COO',
      },
      {
        title: 'Systems Administrator',
        responsibilities: 'Manage infrastructure, identity, access, and endpoint reliability.',
        reportsTo: 'Head of IT & Systems',
      },
      {
        title: 'IT Support Lead',
        responsibilities: 'Coordinate service desk tickets, end-user support, and knowledge management.',
        reportsTo: 'Head of IT & Systems',
      },
    ],
    budget: '2100000',
    workflows: [
      'Daily ticket triage and SLA review',
      'Weekly asset and patch management review',
      'Monthly change advisory and incident trend analysis',
    ],
  },
  stg: {
    id: 'stg',
    name: 'Strategy & OKRs',
    description: 'Roadmaps & Goal Tracking',
    icon: 'Target',
    color: '#E64A19',
    mandate:
      'To translate company ambition into measurable goals, coordinated initiatives, and high-quality decision support for leadership.',
    coreResponsibilities:
      'OKR design, strategic planning, initiative tracking, executive reporting, roadmap governance, performance synthesis.',
    deliverables:
      'Quarterly OKR cycles, strategy review decks, roadmap dashboards, initiative scorecards, leadership insight briefs.',
    kpis: [
      { name: 'OKR Completion Rate', target: '80', unit: '%' },
      { name: 'Initiative On-Time Delivery', target: '90', unit: '%' },
      { name: 'Leadership Reporting Cadence', target: '100', unit: '%' },
    ],
    roles: [
      {
        title: 'Chief of Strategy',
        responsibilities: 'Lead strategic planning, CEO support, and goal-setting governance.',
        reportsTo: 'CEO',
      },
      {
        title: 'OKR Program Manager',
        responsibilities: 'Run quarterly goal cycles, check-ins, and alignment rituals.',
        reportsTo: 'Chief of Strategy',
      },
      {
        title: 'Business Intelligence Analyst',
        responsibilities: 'Build dashboards, synthesize performance data, and support decision-making.',
        reportsTo: 'Chief of Strategy',
      },
    ],
    budget: '1450000',
    workflows: [
      'Quarterly OKR planning and alignment sessions',
      'Bi-weekly initiative and milestone reviews',
      'Monthly executive dashboard and insights briefing',
    ],
  },
  adm: {
    id: 'adm',
    name: 'Administration',
    description: 'Records & Procurement',
    icon: 'Clipboard',
    color: '#689F38',
    mandate:
      'To maintain the administrative backbone of the company through disciplined records, coordination, office support, and governance routines.',
    coreResponsibilities:
      'Records administration, office coordination, executive support, vendor documentation, procurement support, policy and calendar administration.',
    deliverables:
      'Document control, meeting coordination, procurement records, executive calendar support, filing and retention workflows.',
    kpis: [
      { name: 'Records Retrieval Accuracy', target: '100', unit: '%' },
      { name: 'Admin Request Turnaround', target: '2', unit: 'Business Days' },
      { name: 'Procurement Documentation Completeness', target: '98', unit: '%' },
    ],
    roles: [
      {
        title: 'Head of Administration',
        responsibilities: 'Own administrative discipline, office governance, and support operations.',
        reportsTo: 'COO',
      },
      {
        title: 'Executive Assistant',
        responsibilities: 'Coordinate executive schedules, meetings, and key administrative follow-through.',
        reportsTo: 'Head of Administration',
      },
      {
        title: 'Records & Procurement Coordinator',
        responsibilities: 'Manage records integrity, procurement paperwork, and retention controls.',
        reportsTo: 'Head of Administration',
      },
    ],
    budget: '950000',
    workflows: [
      'Daily records intake and filing control',
      'Weekly office operations and procurement coordination review',
      'Monthly policy, retention, and document integrity checks',
    ],
  },
};

export const selectableDepartmentTemplates = [
  { id: 'fin', name: 'Finance' },
  { id: 'hr', name: 'Human Resources' },
  { id: 'ops', name: 'Operations' },
  { id: 'mkt', name: 'Marketing' },
  { id: 'sls', name: 'Sales & CRM' },
  { id: 'leg', name: 'Legal' },
  { id: 'it', name: 'IT & Systems' },
  { id: 'stg', name: 'Strategy & OKRs' },
  { id: 'adm', name: 'Administration' },
] as const;
