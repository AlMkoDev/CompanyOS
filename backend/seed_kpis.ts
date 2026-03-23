import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding KPI Library v1.0...');

  const admin = await prisma.user.findUnique({
    where: { email: 'admin@verdant.com' }
  });

  if (!admin) {
    console.error('Admin user not found!');
    process.exit(1);
  }

  const companyId = admin.company_id;
  
  // Find Departments
  const financeDept = await prisma.department.findFirst({ where: { company_id: companyId, template_key: 'fin' } });
  const opsDept = await prisma.department.findFirst({ where: { company_id: companyId, template_key: 'ops' } });

  if (!financeDept || !opsDept) {
    console.error('Core departments for KPIs not found!');
    process.exit(1);
  }

  const kpis = [
    // Finance KPIs
    {
      company_id: companyId,
      department_id: financeDept.id,
      name: 'Month-End Close Cycle Time',
      description: 'Days required to finalize and lock the financial period.',
      formula: 'Date of period lock - Last day of period',
      data_source: 'ERP System Logs',
      owner_role: 'Financial Controller',
      frequency: 'monthly',
      unit: 'days',
      target: 5.00,
      current_value: 8.50,
      status: 'at-risk'
    },
    {
      company_id: companyId,
      department_id: financeDept.id,
      name: 'Accounts Payable Accuracy',
      description: 'Percentage of invoices processed without error.',
      formula: '(Total Invoices - Error Invoices) / Total Invoices',
      data_source: 'AP Aging Report',
      owner_role: 'AP Manager',
      frequency: 'monthly',
      unit: 'percentage',
      target: 99.00,
      current_value: 94.50,
      status: 'off-track'
    },
    // Operations KPIs
    {
      company_id: companyId,
      department_id: opsDept.id,
      name: 'Procurement Cycle Time',
      description: 'Average time from PR to PO issuance.',
      formula: 'Average(PO Issuance Date - PR Approval Date)',
      data_source: 'Procurement System',
      owner_role: 'Procurement Manager',
      frequency: 'weekly',
      unit: 'days',
      target: 3.00,
      current_value: 5.20,
      status: 'at-risk'
    },
    {
      company_id: companyId,
      department_id: opsDept.id,
      name: 'Inventory Turnover Ratio',
      description: 'How many times company has sold and replaced its inventory during a specific period.',
      formula: 'Cost of Goods Sold / Average Inventory',
      data_source: 'Warehouse Management System',
      owner_role: 'Inventory Coordinator',
      frequency: 'monthly',
      unit: 'ratio',
      target: 12.00,
      current_value: 11.80,
      status: 'on-track'
    }
  ];

  for (const kpi of kpis) {
    await prisma.kPI.create({ data: kpi });
  }

  console.log(`Successfully seeded ${kpis.length} KPIs into Library v1.0`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
