import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Operational Gaps...');

  const admin = await prisma.user.findUnique({
    where: { email: 'admin@verdant.com' }
  });

  if (!admin) {
    console.error('Admin user not found!');
    process.exit(1);
  }

  const companyId = admin.company_id;
  const departments = await prisma.department.findMany({
    where: { company_id: companyId }
  });

  const getDeptId = (key: string) => departments.find(d => d.template_key === key)?.id;

  const gaps = [
    // FINANCE GAPS
    {
      deptKey: 'fin',
      gap_type: 'Process',
      item_name: 'Month-End Close SOP',
      description: 'No defined task list, timeline, or handoff sequence for the 5-day close. Dependent on individuals remembering steps.',
      priority: 'critical',
      status: 'identified'
    },
    {
      deptKey: 'fin',
      gap_type: 'Process',
      item_name: 'AP Invoice Processing SOP',
      description: 'Invoice matching done ad hoc. No 3-way match workflow. Payment run not on fixed schedule. Duplicate payment risk exists.',
      priority: 'critical',
      status: 'identified'
    },
    {
      deptKey: 'fin',
      gap_type: 'Process',
      item_name: 'AR Collections Cadence SOP',
      description: 'Collections follow-up not on defined schedule. Day 15/25/35/45 contact cadence not implemented.',
      priority: 'critical',
      status: 'identified'
    },
    {
      deptKey: 'fin',
      gap_type: 'Process',
      item_name: 'Payroll Cycle SOP',
      description: 'Payroll inputs collected informally. No formal cut-off date for changes. HRIS-to-payroll handoff not documented.',
      priority: 'critical',
      status: 'identified'
    },
    // HR GAPS
    {
      deptKey: 'hr',
      gap_type: 'Process',
      item_name: 'Recruitment Lifecycle SOP',
      description: 'Job requisition approvals informal. Interview structure varies by hiring manager. Offer letters produced inconsistently.',
      priority: 'critical',
      status: 'identified'
    },
    {
      deptKey: 'hr',
      gap_type: 'Process',
      item_name: 'Employee Onboarding SOP',
      description: 'No structured onboarding plan per role. New joiner experience depends entirely on the hiring manager.',
      priority: 'critical',
      status: 'identified'
    },
    // OPS GAPS
    {
      deptKey: 'ops',
      gap_type: 'Process',
      item_name: 'Procurement & Purchase Order SOP',
      description: 'No formal PO requirement below $10K. Authority thresholds not consistently applied.',
      priority: 'critical',
      status: 'identified'
    },
    // IT GAPS
    {
      deptKey: 'it',
      gap_type: 'Process',
      item_name: 'IT Onboarding Provisioning SOP',
      description: 'Access provisioning not triggered automatically from HRIS. Role-based access control templates not defined.',
      priority: 'critical',
      status: 'identified'
    },
    {
      deptKey: 'it',
      gap_type: 'Process',
      item_name: 'IT Offboarding SOP',
      description: 'System access revocation not on defined timeline. Risk of former employees retaining access.',
      priority: 'critical',
      status: 'identified'
    },
    {
      deptKey: 'it',
      gap_type: 'Process',
      item_name: 'IT Change Management SOP',
      description: 'Changes to production systems made without documented approval. Rollback plan not required.',
      priority: 'critical',
      status: 'identified'
    }
  ];

  for (const gap of gaps) {
    const deptId = getDeptId(gap.deptKey);
    if (!deptId) continue;

    await prisma.gapStatus.create({
      data: {
        company_id: companyId,
        department_id: deptId,
        gap_type: gap.gap_type,
        item_name: gap.item_name,
        description: gap.description,
        priority: gap.priority,
        status: gap.status,
        owner_id: gap.priority === 'critical' ? admin.id : null
      }
    });
  }

  console.log(`Seeded ${gaps.length} critical gaps into the tracking system.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
