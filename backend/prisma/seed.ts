import { PrismaClient } from '@prisma/client';
import { seedSupplyChain } from './supply_chain_seed';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding defaults...');

  // 1. Define Base Roles (Roles are company-specific in the schema, but we define templates here)
  // Note: Since roles in our schema have a company_id, the actual seeding will happen 
  // during company registration. However, we can define the template objects here or 
  // seed a "System" company (uuid: 00000000-0000-0000-0000-000000000000) for templates.
  
  const systemCompanyId = '00000000-0000-0000-0000-000000000000';

  // Create System Company for Templates
  await prisma.company.upsert({
    where: { id: systemCompanyId },
    update: {},
    create: {
      id: systemCompanyId,
      name: 'System Templates',
    },
  });

  const roles = [
    { name: 'Super Admin', level: 1, description: 'Full system access', is_system: true },
    { name: 'Dept Admin', level: 2, description: 'Full access to a department', is_system: true },
    { name: 'Manager', level: 3, description: 'Project and team management', is_system: true },
    { name: 'Contributor', level: 4, description: 'Task execution and collaboration', is_system: true },
    { name: 'Viewer', level: 5, description: 'Read-only access', is_system: true },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: systemCompanyId }, // This is just a placeholder logic for templates
      update: {},
      create: {
        ...role,
        company_id: systemCompanyId,
      },
    });
  }

  // 2. Define Base Permissions
  const resources = ['tasks', 'documents', 'users', 'departments', 'rbac', 'analytics', 'audit'];
  const actions = ['create', 'read', 'update', 'delete', 'manage'];

  for (const resource of resources) {
    for (const action of actions) {
      await prisma.permission.create({
        data: {
          company_id: systemCompanyId,
          action,
          resource,
          effect: 'allow',
        },
      });
    }
  }

  // 3. Define Department Templates
  const deptTemplates = [
    {
      name: 'Finance',
      icon: 'Wallet',
      color: '#B8860B', // Gold
      mandate: {
        mission: 'Ensure financial health and transparency.',
        objectives: ['Maximize cash flow', 'Maintain 100% compliance', 'Optimize budget utilization'],
        scope: 'Treasury, Accounting, Budgeting, Financial Reporting',
      },
      kpis: [
        { name: 'Revenue', unit: 'ZAR', target: 1000000, frequency: 'monthly' },
        { name: 'Operating Margin', unit: '%', target: 25, frequency: 'monthly' },
      ],
    },
    {
      name: 'Human Resources',
      icon: 'Users',
      color: '#4682B4', // SteelBlue
      mandate: {
        mission: 'Attract, develop, and retain top talent.',
        objectives: ['Reduce turnover rate', 'Improve employee engagement', 'Streamline recruitment'],
        scope: 'Recruitment, Training, Payroll, Employee Relations',
      },
      kpis: [
        { name: 'Retention Rate', unit: '%', target: 90, frequency: 'quarterly' },
        { name: 'Time to Hire', unit: 'days', target: 30, frequency: 'monthly' },
      ],
    },
    // Add others (Operations, Marketing, Sales, Legal, IT, Strategy, Admin)
  ];

  // 4. Define Supply Chain Default Approval Policies (§2.1.2 matrix equivalent)
  const defaultPolicies = [
    { product_category: 'IT Equipment', auto_approve_limit: 500, l1_threshold: 5000, l2_threshold: 50000 },
    { product_category: 'Office Supplies', auto_approve_limit: 200, l1_threshold: 1000, l2_threshold: 5000 },
    { product_category: 'Raw Materials', auto_approve_limit: 1000, l1_threshold: 10000, l2_threshold: 100000 },
    { product_category: 'Services', auto_approve_limit: 0, l1_threshold: 2000, l2_threshold: 20000 },
  ];

  for (const policy of defaultPolicies) {
    await prisma.approvalPolicy.upsert({
      where: { company_id_product_category: { company_id: systemCompanyId, product_category: policy.product_category } },
      update: {},
      create: {
        company_id: systemCompanyId,
        ...policy,
      },
    });
  }

  console.log('Seeding complete.');

  // Run Supply Chain seeding
  await seedSupplyChain();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
