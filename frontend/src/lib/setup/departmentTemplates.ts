export interface DepartmentTemplateKPI {
  name: string;
  target: string;
  unit: string;
}

export interface DepartmentTemplateRole {
  title: string;
  responsibilities: string;
  reportsTo: string;
  level?: string;
  hc?: number;
}

export interface DepartmentRoutineGroup {
  cadence: string;
  items: string[];
}

export interface DepartmentActivityComponent {
  component: string;
  owner: string;
  summary: string;
  sections: string[];
}

export interface DepartmentCommunicationLine {
  channel: string;
  purpose: string;
}

export interface DepartmentDataPackItem {
  order: number;
  system: string;
}

export interface DepartmentBudgetLine {
  category: string;
  amount: string;
  percentage: string;
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
  budgetLines: DepartmentBudgetLine[];
  workflows: string[];
  operationalRoutines: DepartmentRoutineGroup[];
  dataPack: DepartmentDataPackItem[];
  activities: DepartmentActivityComponent[];
  communicationLines: DepartmentCommunicationLine[];
}

const cadence = (daily: string[], weekly: string[], monthly: string[]) => [
  { cadence: 'Daily', items: daily },
  { cadence: 'Weekly', items: weekly },
  { cadence: 'Monthly', items: monthly },
];

export const departmentQuickStartTemplates: Record<string, DepartmentQuickStartTemplate> = {
  fin: {
    id: 'fin',
    name: 'Finance',
    description: 'Accounting, Budgeting & P&L',
    icon: 'Wallet',
    color: '#B8860B',
    mandate: 'Ensure financial integrity, optimize resource allocation, and provide strategic financial insight for sustainable growth.',
    coreResponsibilities: 'FP&A, budgeting and forecasting, AP/AR, financial reporting, treasury and cash flow, tax and controls.',
    deliverables: 'Monthly management accounts, budget variance reports, cash flow forecasts, audit and tax packs.',
    kpis: [
      { name: 'Operating Margin', target: '15', unit: '%' },
      { name: 'Budget Variance', target: '5', unit: '%' },
      { name: 'Days Sales Outstanding', target: '45', unit: 'Days' },
    ],
    roles: [
      { title: 'Chief Financial Officer', responsibilities: 'Lead finance strategy, controls, and regulatory compliance.', reportsTo: 'CEO / Board of Directors' },
      { title: 'Finance Director', responsibilities: 'Run finance operations, close cadence, and management reporting.', reportsTo: 'CFO' },
    ],
    budget: '3850000',
    budgetLines: [
      { category: 'Personnel', amount: '3312500', percentage: '86.0%' },
      { category: 'Software & Technology', amount: '285000', percentage: '7.4%' },
      { category: 'Professional Services', amount: '120000', percentage: '3.1%' },
    ],
    workflows: ['Monthly Financial Close', 'Accounts Payable Processing', 'Accounts Receivable Management', 'Budget Planning & Monitoring'],
    operationalRoutines: cadence(
      ['Cash position review', 'Invoice validation'],
      ['Treasury update', 'AP/AR reconciliation review'],
      ['Month-end close', 'Budget variance analysis', 'Finance dashboard publication'],
    ),
    dataPack: [
      { order: 1, system: 'ERP / general ledger' },
      { order: 2, system: 'Budget model and forecast workbook' },
      { order: 3, system: 'Cash flow dashboard' },
      { order: 4, system: 'Audit and tax filing calendar' },
    ],
    activities: [
      { component: 'Financial Planning & Analysis', owner: 'Finance Director', summary: 'Planning, forecasting, and board-quality reporting.', sections: ['Annual budget cycle', 'Forecast refresh', 'Variance commentary'] },
      { component: 'Accounting Operations', owner: 'Financial Controller', summary: 'Ledger integrity and close discipline.', sections: ['Journal management', 'Reconciliations', 'Close controls'] },
    ],
    communicationLines: [
      { channel: 'CFO -> CEO/Board', purpose: 'Financial reporting, budget approvals, and strategic briefings.' },
      { channel: 'Accounting Manager -> AP/AR/Payroll', purpose: 'Transaction deadlines, reconciliation approvals, and control checks.' },
    ],
  },
  hr: {
    id: 'hr',
    name: 'Human Resources',
    description: 'Talent, Payroll & Culture',
    icon: 'Users',
    color: '#4682B4',
    mandate: 'Attract, develop, and retain exceptional talent while fostering engagement, equity, and continuous growth.',
    coreResponsibilities: 'Recruitment, onboarding, performance management, compensation and benefits, employee relations, L&D, HR compliance.',
    deliverables: 'Recruitment pipelines, onboarding programs, review cycles, workforce reports, policy updates.',
    kpis: [
      { name: 'Employee Turnover Rate', target: '10', unit: '%' },
      { name: 'Time to Fill Positions', target: '35', unit: 'Days' },
      { name: 'Employee Engagement Score', target: '85', unit: '%' },
    ],
    roles: [
      { title: 'Chief Human Resources Officer', responsibilities: 'Lead workforce strategy, culture, and organizational development.', reportsTo: 'CEO / Board of Directors' },
      { title: 'HR Director', responsibilities: 'Run HR operations, policy implementation, and people initiatives.', reportsTo: 'CHRO' },
    ],
    budget: '3250000',
    budgetLines: [
      { category: 'Personnel', amount: '2725000', percentage: '83.9%' },
      { category: 'HR Technology & Software', amount: '285000', percentage: '8.8%' },
      { category: 'Training & Development', amount: '125000', percentage: '3.8%' },
    ],
    workflows: ['Employee Onboarding', 'Recruitment & Hiring', 'Performance Review Cycle', 'Offboarding Process'],
    operationalRoutines: cadence(
      ['Candidate pipeline updates', 'Employee relations triage'],
      ['Hiring manager sync', 'Training calendar review'],
      ['Engagement reporting', 'Benefits reconciliation', 'Policy review'],
    ),
    dataPack: [
      { order: 1, system: 'ATS / recruiting tracker' },
      { order: 2, system: 'HRIS and employee master data' },
      { order: 3, system: 'Performance review tracker' },
      { order: 4, system: 'Policy library and compliance register' },
    ],
    activities: [
      { component: 'Talent Acquisition', owner: 'Talent Acquisition Manager', summary: 'Structured recruiting and hiring handoff.', sections: ['Job requisitions', 'Sourcing', 'Interview process'] },
      { component: 'People Operations', owner: 'HR Director', summary: 'Manage employee lifecycle and policy compliance.', sections: ['Onboarding', 'Employee relations', 'Offboarding'] },
    ],
    communicationLines: [
      { channel: 'CHRO -> CEO', purpose: 'Workforce strategy, culture health, and executive hiring updates.' },
      { channel: 'HRIS Analyst -> Finance/Payroll', purpose: 'Headcount, payroll input, and employee data synchronization.' },
    ],
  },
  ops: {
    id: 'ops',
    name: 'Operations',
    description: 'Processes & Supply Chain',
    icon: 'Settings',
    color: '#2E7D32',
    mandate: 'Design, optimize, and oversee operational processes that enable reliable and efficient delivery.',
    coreResponsibilities: 'Process design, supply chain, vendor management, quality assurance, facilities, continuity, and safety.',
    deliverables: 'Procurement cycles, vendor scorecards, quality reviews, process improvement plans, operational dashboards.',
    kpis: [
      { name: 'Operational Efficiency Rate', target: '92', unit: '%' },
      { name: 'On-Time Delivery Rate', target: '98', unit: '%' },
      { name: 'Vendor On-Time Delivery', target: '95', unit: '%' },
    ],
    roles: [
      { title: 'Chief Operating Officer', responsibilities: 'Lead cross-functional execution, process quality, and operational risk.', reportsTo: 'CEO / Board of Directors' },
      { title: 'Operations Director', responsibilities: 'Direct daily operations and maintain operating rhythm.', reportsTo: 'COO' },
    ],
    budget: '3400000',
    budgetLines: [
      { category: 'Personnel', amount: '2450000', percentage: '72.1%' },
      { category: 'Procurement & Supply Chain', amount: '480000', percentage: '14.1%' },
      { category: 'Facilities & Maintenance', amount: '180000', percentage: '5.3%' },
    ],
    workflows: ['Procurement Cycle', 'Supply Chain Management', 'Quality Assurance Process', 'Incident & Risk Management'],
    operationalRoutines: cadence(
      ['Operations stand-up', 'Delivery and exception tracking'],
      ['Vendor performance review', 'Project status review'],
      ['Operational dashboard publication', 'Continuity readiness review', 'Facilities and safety review'],
    ),
    dataPack: [
      { order: 1, system: 'Procurement tracker / ERP' },
      { order: 2, system: 'Vendor scorecard register' },
      { order: 3, system: 'Inventory and logistics tracker' },
      { order: 4, system: 'Risk and continuity register' },
    ],
    activities: [
      { component: 'Supply Chain Management', owner: 'Supply Chain Manager', summary: 'Planning, sourcing, receipt, stock, and replenishment.', sections: ['Demand planning', 'Supplier orders', 'Goods receipt'] },
      { component: 'Process Improvement', owner: 'Process Improvement Analyst', summary: 'Drive process mapping and operational improvement.', sections: ['Baseline measurement', 'Gap analysis', 'Pilot testing'] },
    ],
    communicationLines: [
      { channel: 'COO -> CEO', purpose: 'Operational review, KPI dashboard, and execution updates.' },
      { channel: 'Supply Chain Manager -> Finance', purpose: 'Spend analysis, PO approvals, and payment coordination.' },
    ],
  },
  mkt: {
    id: 'mkt',
    name: 'Marketing',
    description: 'Brand & Content Calendar',
    icon: 'Megaphone',
    color: '#C2185B',
    mandate: 'Build brand awareness, generate qualified leads, and nurture customer relationships through compelling content and campaigns.',
    coreResponsibilities: 'Brand strategy, digital marketing, content creation, lead generation, social media, market research, campaign reporting.',
    deliverables: 'Campaign calendars, content assets, lead generation programs, attribution reports, brand materials.',
    kpis: [
      { name: 'Marketing Qualified Leads', target: '250', unit: 'Per Month' },
      { name: 'Lead-to-Opportunity Conversion Rate', target: '30', unit: '%' },
      { name: 'Cost per Lead', target: '25', unit: 'USD' },
    ],
    roles: [
      { title: 'Chief Marketing Officer', responsibilities: 'Lead brand, demand generation, and market positioning.', reportsTo: 'CEO / Board of Directors' },
      { title: 'Marketing Director', responsibilities: 'Run marketing execution, budget, and channel coordination.', reportsTo: 'CMO' },
    ],
    budget: '3000000',
    budgetLines: [
      { category: 'Personnel', amount: '2100000', percentage: '70.0%' },
      { category: 'Digital Media & Campaigns', amount: '420000', percentage: '14.0%' },
      { category: 'Content & Creative Production', amount: '225000', percentage: '7.5%' },
    ],
    workflows: ['Quarterly Campaign Planning', 'Editorial Calendar Management', 'Lead Handoff to Sales', 'Campaign Performance Review'],
    operationalRoutines: cadence(
      ['Campaign monitoring', 'Publishing cadence'],
      ['Pipeline review with Sales', 'Content sprint review'],
      ['Attribution and ROI reporting', 'Brand performance dashboard', 'Market insights review'],
    ),
    dataPack: [
      { order: 1, system: 'CRM and marketing automation platform' },
      { order: 2, system: 'Editorial calendar' },
      { order: 3, system: 'Campaign performance dashboard' },
      { order: 4, system: 'Brand asset library' },
    ],
    activities: [
      { component: 'Brand & Creative', owner: 'Brand Manager', summary: 'Maintain brand standards and creative asset delivery.', sections: ['Brand governance', 'Creative review', 'Asset distribution'] },
      { component: 'Demand Generation', owner: 'Digital Marketing Manager', summary: 'Run paid, email, and inbound programs that create qualified demand.', sections: ['Campaign targeting', 'Lead acquisition', 'Optimization'] },
    ],
    communicationLines: [
      { channel: 'CMO -> CEO', purpose: 'Marketing performance, campaign approvals, and brand strategy updates.' },
      { channel: 'CMO -> CRO', purpose: 'Lead quality review and campaign alignment.' },
    ],
  },
  sls: {
    id: 'sls',
    name: 'Sales & CRM',
    description: 'Leads & Deal Pipelines',
    icon: 'TrendingUp',
    color: '#EF4444',
    mandate: 'Convert demand into revenue through disciplined pipeline management, strong relationships, and accurate forecasting.',
    coreResponsibilities: 'Lead qualification, deal progression, account management, forecasting, CRM hygiene, renewal and expansion management.',
    deliverables: 'Qualified pipeline, forecast packs, account plans, CRM quality reports, renewal trackers.',
    kpis: [
      { name: 'Pipeline Coverage', target: '3', unit: 'x' },
      { name: 'Win Rate', target: '28', unit: '%' },
      { name: 'Forecast Accuracy', target: '90', unit: '%' },
    ],
    roles: [
      { title: 'Chief Revenue Officer', responsibilities: 'Own revenue strategy, forecasting, and growth execution.', reportsTo: 'CEO / Board of Directors' },
      { title: 'Sales Director', responsibilities: 'Manage sales operations, team performance, and pipeline quality.', reportsTo: 'CRO' },
    ],
    budget: '6000000',
    budgetLines: [
      { category: 'Personnel', amount: '4200000', percentage: '70.0%' },
      { category: 'Sales Incentives & Commissions', amount: '900000', percentage: '15.0%' },
      { category: 'CRM & Sales Tooling', amount: '420000', percentage: '7.0%' },
    ],
    workflows: ['Lead Qualification and Handoff', 'Pipeline Review and Forecasting', 'Opportunity Management', 'Customer QBR and Renewal Planning'],
    operationalRoutines: cadence(
      ['CRM updates', 'Deal progression tracking'],
      ['Pipeline review', 'Forecast call', 'Coaching review'],
      ['Quota attainment review', 'Customer health review', 'CRM hygiene audit'],
    ),
    dataPack: [
      { order: 1, system: 'CRM platform' },
      { order: 2, system: 'Pipeline and forecast model' },
      { order: 3, system: 'Proposal and pricing library' },
      { order: 4, system: 'Revenue operations dashboard' },
    ],
    activities: [
      { component: 'Pipeline Management', owner: 'Sales Director', summary: 'Run stage discipline, forecast quality, and quota execution.', sections: ['Stage management', 'Forecasting cadence', 'Deal inspection'] },
      { component: 'Revenue Operations', owner: 'CRM Administrator', summary: 'Maintain CRM process integrity and reporting reliability.', sections: ['CRM data quality', 'Automation', 'Reporting'] },
    ],
    communicationLines: [
      { channel: 'CRO -> CEO', purpose: 'Revenue forecast, board pack preparation, and partnership updates.' },
      { channel: 'CRM Admin -> Sales Team', purpose: 'CRM training, data quality reporting, and process updates.' },
    ],
  },
  leg: {
    id: 'leg',
    name: 'Legal',
    description: 'Contracts & Compliance',
    icon: 'Shield',
    color: '#455A64',
    mandate: 'Protect the company through contract governance, regulatory compliance, and practical legal risk management.',
    coreResponsibilities: 'Contract review, regulatory tracking, legal advisory, compliance governance, board support, policy development, privacy and risk management.',
    deliverables: 'Approved contracts, compliance calendar, policy library, legal risk register, board resolutions.',
    kpis: [
      { name: 'Contract Turnaround Time', target: '5', unit: 'Business Days' },
      { name: 'Compliance Deadline Completion', target: '100', unit: '%' },
      { name: 'Outstanding Legal Risk Actions', target: '0', unit: 'Critical Items' },
    ],
    roles: [
      { title: 'General Counsel', responsibilities: 'Lead legal strategy, enterprise risk posture, and governance advisory.', reportsTo: 'CEO / Board of Directors' },
      { title: 'Deputy General Counsel', responsibilities: 'Manage legal operations, contract review capacity, and escalations.', reportsTo: 'General Counsel' },
    ],
    budget: '3000000',
    budgetLines: [
      { category: 'Personnel', amount: '2100000', percentage: '70.0%' },
      { category: 'External Counsel & Advisory', amount: '510000', percentage: '17.0%' },
      { category: 'Compliance Tooling', amount: '180000', percentage: '6.0%' },
    ],
    workflows: ['Contract Intake and Review', 'Compliance Calendar Management', 'Board & Governance Support', 'Policy Development'],
    operationalRoutines: cadence(
      ['Contract triage', 'Urgent legal advisory'],
      ['Compliance schedule review', 'Sales and procurement support'],
      ['Board pack legal review', 'Policy and training review', 'Matter tracking review'],
    ),
    dataPack: [
      { order: 1, system: 'Contract repository' },
      { order: 2, system: 'Compliance calendar' },
      { order: 3, system: 'Policy library' },
      { order: 4, system: 'Legal matter tracker' },
    ],
    activities: [
      { component: 'Contract Governance', owner: 'Commercial Contracts Lawyer', summary: 'Control contract intake, negotiation, execution, and renewal.', sections: ['Intake', 'Review', 'Negotiation'] },
      { component: 'Compliance Management', owner: 'Compliance Manager', summary: 'Maintain legal obligations and policy adherence.', sections: ['Obligation tracking', 'Policy updates', 'Audit support'] },
    ],
    communicationLines: [
      { channel: 'General Counsel -> CEO/Board', purpose: 'Legal risk briefings, resolutions, and governance updates.' },
      { channel: 'Employment Lawyer -> HR', purpose: 'Employment law advice, disciplinary support, and policy review.' },
    ],
  },
  it: {
    id: 'it',
    name: 'IT & Systems',
    description: 'Assets & Technical Debt',
    icon: 'Cpu',
    color: '#512DA8',
    mandate: 'Provide secure, reliable, and scalable technology infrastructure that enables productivity and minimizes technical risk.',
    coreResponsibilities: 'Infrastructure, cybersecurity, software development, IT support, backup and recovery, cloud architecture, enterprise applications.',
    deliverables: 'ITSM workflows, CMDB and asset registers, release pipelines, uptime dashboards, security controls and runbooks.',
    kpis: [
      { name: 'System Uptime / Availability', target: '99.9', unit: '%' },
      { name: 'Mean Time to Resolve', target: '4', unit: 'Hours' },
      { name: 'Change Success Rate', target: '98', unit: '%' },
    ],
    roles: [
      { title: 'Chief Technology Officer / CIO', responsibilities: 'Own technology strategy, cybersecurity posture, and transformation roadmap.', reportsTo: 'CEO / Board of Directors' },
      { title: 'IT Director', responsibilities: 'Run IT operations, service reliability, and vendor execution.', reportsTo: 'CTO / CIO' },
    ],
    budget: '7000000',
    budgetLines: [
      { category: 'Personnel', amount: '3850000', percentage: '55.0%' },
      { category: 'Cloud Infrastructure & Hosting', amount: '980000', percentage: '14.0%' },
      { category: 'Software Licenses & SaaS', amount: '840000', percentage: '12.0%' },
    ],
    workflows: ['IT Helpdesk & Support', 'Software Development Lifecycle', 'Cybersecurity Incident Response', 'Change Management Process'],
    operationalRoutines: cadence(
      ['Helpdesk queue triage', 'Monitoring and alert response'],
      ['Change schedule review', 'Backlog grooming', 'Security scan review'],
      ['ITSM metrics dashboard', 'Technical debt review', 'Architecture review'],
    ),
    dataPack: [
      { order: 1, system: 'ITSM platform / Service desk' },
      { order: 2, system: 'CMDB and asset register' },
      { order: 3, system: 'Git repository and CI/CD pipeline' },
      { order: 4, system: 'Security incident log / SIEM' },
    ],
    activities: [
      { component: 'Infrastructure & Operations', owner: 'IT Director', summary: 'Maintain availability, access, and operational resilience.', sections: ['Cloud and network operations', 'Monitoring', 'Backup and DR'] },
      { component: 'IT Service Management', owner: 'IT Manager', summary: 'Provide support, change control, and asset governance.', sections: ['Service desk', 'Incident management', 'Change management'] },
    ],
    communicationLines: [
      { channel: 'CTO/CIO -> CEO', purpose: 'Technology strategy, incident escalation, and transformation updates.' },
      { channel: 'IT Manager -> All Departments', purpose: 'Helpdesk support, maintenance notices, and change communications.' },
    ],
  },
  stg: {
    id: 'stg',
    name: 'Strategy & OKRs',
    description: 'Roadmaps & Goal Tracking',
    icon: 'Target',
    color: '#0EA5A4',
    mandate: 'Drive organizational alignment, long-term positioning, and measurable goal achievement through strategy and OKR governance.',
    coreResponsibilities: 'Strategic planning, OKR governance, performance tracking, competitive intelligence, business case development, executive support.',
    deliverables: 'Strategic plan, OKR cycles, QBR packs, executive dashboards, initiative portfolio reviews.',
    kpis: [
      { name: 'OKR Achievement Rate', target: '70', unit: '%' },
      { name: 'Strategic Initiative On-Time Delivery', target: '85', unit: '%' },
      { name: 'Department OKR Participation Rate', target: '100', unit: '%' },
    ],
    roles: [
      { title: 'Chief Strategy Officer', responsibilities: 'Lead strategy, portfolio governance, and executive decision support.', reportsTo: 'CEO / Board of Directors' },
      { title: 'OKR Program Manager', responsibilities: 'Run the OKR framework, alignment reviews, and scoring cycles.', reportsTo: 'Head of Strategy' },
    ],
    budget: '2500000',
    budgetLines: [
      { category: 'Personnel', amount: '1750000', percentage: '70.0%' },
      { category: 'Strategy & BI Tools', amount: '280000', percentage: '11.2%' },
      { category: 'External Research & Advisory', amount: '210000', percentage: '8.4%' },
    ],
    workflows: ['Annual Strategic Planning', 'OKR Quarterly Cycle', 'Quarterly Business Review', 'Portfolio & Program Management'],
    operationalRoutines: cadence(
      ['Executive dashboard refresh', 'Strategic issue triage'],
      ['OKR progress update chase', 'Portfolio status review'],
      ['Strategy execution check-in', 'Department KPI packs', 'Resource capacity review'],
    ),
    dataPack: [
      { order: 1, system: 'Strategic plan template' },
      { order: 2, system: 'OKR platform and scorecards' },
      { order: 3, system: 'Executive dashboard / BI platform' },
      { order: 4, system: 'Portfolio dashboard and project charters' },
    ],
    activities: [
      { component: 'Strategic Planning', owner: 'Head of Strategy', summary: 'Facilitate annual planning, prioritization, and board strategy preparation.', sections: ['Environmental analysis', 'Strategy retreat', 'Plan publication'] },
      { component: 'OKR Framework & Governance', owner: 'OKR Program Manager', summary: 'Run quarterly goal cycles and alignment across departments.', sections: ['Drafting', 'Alignment review', 'Scoring and retrospective'] },
    ],
    communicationLines: [
      { channel: 'CSO -> CEO', purpose: 'Strategy execution status, decision support, and board preparation.' },
      { channel: 'OKR Program Manager -> Department Heads', purpose: 'Goal-setting guidance, stale OKR chase, and score review.' },
    ],
  },
  adm: {
    id: 'adm',
    name: 'Administration',
    description: 'Records & Procurement',
    icon: 'Clipboard',
    color: '#0F766E',
    mandate: 'Provide seamless administrative, procurement, and records management support that removes operational friction.',
    coreResponsibilities: 'Executive support, records management, procurement, travel and expense management, meeting coordination, visitor and fleet administration.',
    deliverables: 'Board and executive support workflows, records classification controls, travel coordination, procurement support, expense routing.',
    kpis: [
      { name: 'Administrative Request Turnaround', target: '24', unit: 'Hours' },
      { name: 'Records Retrieval Accuracy', target: '99', unit: '%' },
      { name: 'Procurement Cost Savings', target: '8', unit: '%' },
    ],
    roles: [
      { title: 'Chief Administrative Officer', responsibilities: 'Own administrative services, support operations, and internal coordination.', reportsTo: 'CEO / Board of Directors' },
      { title: 'Administration Manager', responsibilities: 'Manage office operations, procurement support, and records control.', reportsTo: 'CAO' },
    ],
    budget: '2000000',
    budgetLines: [
      { category: 'Personnel', amount: '1250000', percentage: '62.5%' },
      { category: 'Travel & Accommodation', amount: '280000', percentage: '14.0%' },
      { category: 'Fleet Management & Fuel', amount: '150000', percentage: '7.5%' },
    ],
    workflows: ['Administrative Request Handling', 'Records Management & Archival', 'Office Procurement Process', 'Travel & Accommodation Booking'],
    operationalRoutines: cadence(
      ['Document filing', 'Executive calendar updates', 'Urgent purchase and travel requests'],
      ['PO queue review', 'Board action log chase'],
      ['Retention review', 'Office supplies stock count', 'Travel spend report to Finance'],
    ),
    dataPack: [
      { order: 1, system: 'Executive calendar and correspondence templates' },
      { order: 2, system: 'Records classification framework' },
      { order: 3, system: 'Retention schedule and disposal log' },
      { order: 4, system: 'Purchase order system and supplier list' },
    ],
    activities: [
      { component: 'Executive & Board Support', owner: 'Executive Assistant', summary: 'Coordinate executive time, board packs, and stakeholder follow-through.', sections: ['Calendar management', 'Board meeting support', 'Correspondence'] },
      { component: 'Records Management', owner: 'Records Manager', summary: 'Maintain classification, retention, archive, and disposal controls.', sections: ['Classification', 'Retention schedule', 'Disposal controls'] },
    ],
    communicationLines: [
      { channel: 'Administration Manager -> Admin Team', purpose: 'Daily operational coordination, procurement queue review, and office support allocation.' },
      { channel: 'Records Manager -> Legal', purpose: 'Retention schedule alignment, legal holds, and records audit support.' },
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
