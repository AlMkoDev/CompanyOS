import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const COMPANY_ID = '00000000-0000-0000-0000-000000000000';
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  console.log('Final Seeder Run: CompanyOS Upgrade');

  // 1. System Company
  await prisma.company.upsert({
    where: { id: COMPANY_ID },
    update: { name: 'Verdant Fields Agritech Ltd' },
    create: {
      id: COMPANY_ID,
      name: 'Verdant Fields Agritech Ltd',
      industry: 'Agriculture',
      brand_colors: { primary: '#2E7D32', secondary: '#FBC02D' }
    }
  });

  // 2. System User (Creator for tasks)
  await prisma.user.upsert({
    where: { email: 'admin@verdantfields.com' },
    update: {},
    create: {
      id: SYSTEM_USER_ID,
      email: 'admin@verdantfields.com',
      password_hash: '$2b$10$EpjXWz.G5s0M7R.F.B.B.e.e.e.e.e.e.e.e.e.e.e.e.e.e.e.e.', // Placeholder
      first_name: 'System',
      last_name: 'Administrator',
      company_id: COMPANY_ID,
      status: 'active'
    }
  });

  // 3. Departments (9 Pillars)
  const deptSpecs = [
    { name: 'Finance', color: '#B8860B', icon: 'Wallet' },
    { name: 'HR', color: '#4682B4', icon: 'Users' },
    { name: 'Operations', color: '#2E7D32', icon: 'Settings' },
    { name: 'Marketing', color: '#C2185B', icon: 'Megaphone' },
    { name: 'Sales', color: '#1976D2', icon: 'TrendingUp' },
    { name: 'Legal', color: '#455A64', icon: 'Shield' },
    { name: 'IT', color: '#512DA8', icon: 'Cpu' },
    { name: 'Strategy', color: '#E64A19', icon: 'Target' },
    { name: 'Administration', color: '#689F38', icon: 'Folder' }
  ];

  const depts: Record<string, string> = {};

  for (const spec of deptSpecs) {
    const template_key = spec.name.toLowerCase().replace(/ /g, '_');
    const dept = await prisma.department.upsert({
      where: { companyId_templateKey: { company_id: COMPANY_ID, template_key } },
      update: { name: spec.name, color: spec.color, icon: spec.icon },
      create: {
        company_id: COMPANY_ID,
        name: spec.name,
        template_key,
        color: spec.color,
        icon: spec.icon,
        status: 'active'
      }
    });
    depts[spec.name] = dept.id;
  }

  // 4. Native Modules (27)
  const moduleList = [
    { code: 'VF-FIN-001', name: 'Core Accounting (GL)', dept: 'Finance', priority: 'P0' },
    { code: 'VF-FIN-002', name: 'Accounts Payable', dept: 'Finance', priority: 'P0' },
    { code: 'VF-FIN-003', name: 'Accounts Receivable', dept: 'Finance', priority: 'P0' },
    { code: 'VF-FIN-004', name: 'Cash & Treasury', dept: 'Finance', priority: 'P0' },
    { code: 'VF-FIN-005', name: 'Payroll', dept: 'Finance', priority: 'P0' },
    { code: 'VF-HR-001', name: 'HRIS Core', dept: 'HR', priority: 'P0' },
    { code: 'VF-HR-002', name: 'ATS Lite', dept: 'HR', priority: 'P1' },
    { code: 'VF-HR-003', name: 'Onboarding & Offboarding', dept: 'HR', priority: 'P0' },
    { code: 'VF-HR-004', name: 'Performance Review', dept: 'HR', priority: 'P1' },
    { code: 'VF-HR-005', name: 'LMS Lite', dept: 'HR', priority: 'P2' },
    { code: 'VF-HR-006', name: 'ER & Engagement', dept: 'HR', priority: 'P2' },
    { code: 'VF-OPS-001', name: 'Projects & Delivery', dept: 'Operations', priority: 'P1' },
    { code: 'VF-OPS-002', name: 'QA & NCR', dept: 'Operations', priority: 'P1' },
    { code: 'VF-OPS-003', name: 'Supply Chain & Inventory', dept: 'Operations', priority: 'P1' },
    { code: 'VF-OPS-004', name: 'Facilities & HSE', dept: 'Operations', priority: 'P2' },
    { code: 'VF-OPS-005', name: 'Process Improvement', dept: 'Operations', priority: 'P2' },
    { code: 'VF-MKT-001', name: 'Content & Campaign', dept: 'Marketing', priority: 'P2' },
    { code: 'VF-MKT-002', name: 'Digital Asset Manager', dept: 'Marketing', priority: 'P2' },
    { code: 'VF-MKT-003', name: 'Marketing Analytics', dept: 'Marketing', priority: 'P2' },
    { code: 'VF-SAL-001', name: 'CRM Core', dept: 'Sales', priority: 'P0' },
    { code: 'VF-SAL-003', name: 'Account Mgmt & Renewals', dept: 'Sales', priority: 'P1' },
    { code: 'VF-LEG-001', name: 'CLM Lite', dept: 'Legal', priority: 'P1' },
    { code: 'VF-LEG-002', name: 'Regulatory & Compliance', dept: 'Legal', priority: 'P1' },
    { code: 'VF-LEG-003', name: 'Data Privacy', dept: 'Legal', priority: 'P1' },
    { code: 'VF-IT-001', name: 'ITSM Lite', dept: 'IT', priority: 'P1' },
    { code: 'VF-IT-002', name: 'Cybersecurity Monitoring', dept: 'IT', priority: 'P1' },
    { code: 'VF-STR-001', name: 'OKR Platform', dept: 'Strategy', priority: 'P1' },
    { code: 'VF-STR-002', name: 'BI Dashboard', dept: 'Strategy', priority: 'P1' },
  ];

  for (const m of moduleList) {
    await prisma.nativeModule.upsert({
      where: { company_id_module_code: { company_id: COMPANY_ID, module_code: m.code } },
      update: { name: m.name, status: 'planned' },
      create: {
        company_id: COMPANY_ID,
        module_code: m.code,
        name: m.name,
        department_id: depts[m.dept],
        priority: m.priority,
        status: 'planned',
        phase: 1
      }
    });
  }

  // 5. Platform Tasks (P-01 to P-16)
  const platformTasks = [
    { code: 'P-01', title: 'Build multi-tenant architecture', cat: 'Core Infrastructure' },
    { code: 'P-02', title: 'Implement JWT + MFA', cat: 'Authentication' },
    { code: 'P-03', title: 'Implement RBAC', cat: 'Authorisation' },
    { code: 'P-04', title: 'Configure AES-256 encryption at rest', cat: 'Encryption' },
    { code: 'P-05', title: 'Enforce TLS 1.3', cat: 'Encryption in Transit' },
    { code: 'P-06', title: 'Implement global audit logging', cat: 'Audit Logging' },
    { code: 'P-07', title: 'Set up automated backups', cat: 'Data Backup' },
    { code: 'P-08', title: 'Kenya DPA compliance features', cat: 'Data Protection' },
    { code: 'P-09', title: 'Set up MinIO storage', cat: 'File Storage' },
    { code: 'P-10', title: 'Configure SMTP notifications', cat: 'Notifications' },
    { code: 'P-11', title: 'Configure SMS (Africa\'s Talking)', cat: 'Notifications' },
    { code: 'P-12', title: 'Set up GitHub Actions CI/CD', cat: 'CI/CD' },
    { code: 'P-13', title: 'Set up Prometheus/Grafana', cat: 'Monitoring' },
    { code: 'P-14', title: 'Set up Loki/Grafana', cat: 'Log Aggregation' },
    { code: 'P-15', title: 'Enforce unit test coverage gate', cat: 'Quality Gate' },
    { code: 'P-16', title: 'Set up Redis caching', cat: 'Cache' },
  ];

  for (const pt of platformTasks) {
    await prisma.platformTask.upsert({
      where: { company_id_task_code: { company_id: COMPANY_ID, task_code: pt.code } },
      update: { title: pt.title },
      create: {
        company_id: COMPANY_ID,
        task_code: pt.code,
        title: pt.title,
        category: pt.cat,
        priority: 'CRITICAL',
        status: 'pending'
      }
    });
  }

  // 6. Roadmap Tasks (R1-01 to R1-11)
  const roadmapTasks = [
    { code: 'R1-01', title: 'Platform Foundation', phase: 1, sprint: '1' },
    { code: 'R1-02', title: 'Infra Automation', phase: 1, sprint: '2' },
    { code: 'R1-03', title: 'Finance Core', phase: 1, sprint: '3' },
    { code: 'R1-04', title: 'AP Automation', phase: 1, sprint: '4' },
    { code: 'R1-05', title: 'AR Automation', phase: 1, sprint: '4' },
    { code: 'R1-06', title: 'Cash Forecasting', phase: 1, sprint: '5' },
    { code: 'R1-07', title: 'Statutory Payroll', phase: 1, sprint: '5' },
    { code: 'R1-08', title: 'HRIS Launch', phase: 1, sprint: '6' },
    { code: 'R1-09', title: 'CRM Launch', phase: 1, sprint: '6' },
    { code: 'R1-10', title: 'DMS Launch', phase: 1, sprint: '6' },
    { code: 'R1-11', title: 'Phase 1 UAT', phase: 1, sprint: '6' }
  ];

  for (const r of roadmapTasks) {
    await prisma.roadmapTask.upsert({
      where: { company_id_story_id: { company_id: COMPANY_ID, story_id: r.code } },
      update: { title: r.title },
      create: {
        company_id: COMPANY_ID,
        phase: r.phase,
        sprint: r.sprint,
        story_id: r.code,
        title: r.title,
        module: 'System',
        points: 8,
        status: 'todo'
      }
    });
  }

  // 7. Core Departmental Tasks (Finance & HR)
  const deptTasks = [
    { code: 'F-K01', title: 'Configure Operating Margin tracking', cat: 'KPI Configuration', dept: 'Finance' },
    { code: 'F-W01', title: 'Close sub-ledgers', cat: 'Operational Workflow', dept: 'Finance' },
    { code: 'H-W01', title: 'Create headcount requisitions', cat: 'Operational Workflow', dept: 'HR' },
    { code: 'H-G01', title: 'Write Onboarding SOP', cat: 'Gap Closure', dept: 'HR' }
  ];

  for (const dt of deptTasks) {
    await prisma.task.upsert({
      where: { company_id_task_code: { company_id: COMPANY_ID, task_code: dt.code } },
      update: { title: dt.title },
      create: {
        company_id: COMPANY_ID,
        task_code: dt.code,
        task_category: dt.cat,
        title: dt.title,
        priority: 'HIGH',
        status: 'todo',
        department_id: depts[dt.dept],
        creator_id: SYSTEM_USER_ID
      }
    });
  }

  console.log('Seed tasklist upgrade finished.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
