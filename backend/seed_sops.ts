import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial SOPs...');

  const admin = await prisma.user.findUnique({
    where: { email: 'admin@verdant.com' }
  });

  if (!admin) {
    console.error('Admin user not found!');
    process.exit(1);
  }

  const companyId = admin.company_id;
  const financeDept = await prisma.department.findFirst({
    where: { company_id: companyId, template_key: 'fin' }
  });

  if (!financeDept) {
    console.error('Finance department not found!');
    process.exit(1);
  }

  const monthEndSop = await prisma.sOP.create({
    data: {
      company_id: companyId,
      department_id: financeDept.id,
      title: 'Month-End Financial Close SOP',
      purpose: 'To ensure the accurate and timely closing of the financial records for each month, enabling reliable reporting and compliance.',
      scope: 'Global Finance Department, Accounting Team, and Departmental Budget Holders.',
      trigger: 'Execution of the last business day of the calendar month.',
      status: 'active',
      version: 1,
      raci: {
        responsible: ['Accounting Manager', 'Financial Controller'],
        accountable: ['Finance Director'],
        consulted: ['CFO', 'Department Heads'],
        informed: ['CEO', 'External Auditors']
      },
      procedure: [
        { step: 1, action: 'Close Accounts Payable sub-ledger', role: 'Accounting Manager', system: 'ERP (NetSuite/SAP)' },
        { step: 2, action: 'Review and post month-end accruals and prepayments', role: 'Financial Controller', system: 'ERP' },
        { step: 3, action: 'Complete bank reconciliations for all corporate accounts', role: 'Treasury Analyst', system: 'Banking Portal / ERP' },
        { step: 4, action: 'Run depreciation for fixed assets', role: 'Accounting Manager', system: 'Fixed Asset Register' },
        { step: 5, action: 'Perform intercompany eliminations and consolidations', role: 'Finance Director', system: 'Consolidation Tool' },
        { step: 6, action: 'Final Trial Balance review and sign-off', role: 'CFO', system: 'ERP' }
      ],
      approval_matrix: {
        thresholds: [
          { level: 'Finance Director', limit: 'All standard entries' },
          { level: 'CFO', limit: 'Adjustments > R100,000' }
        ]
      },
      output_standard: 'Signed Management Reporting Pack, fully reconciled Balance Sheet, and locked GL for the period.',
      systems_used: ['ERP (NetSuite)', 'Anaplan (Budgeting)', 'Banking Portal'],
      exceptions: [
        { condition: 'Unresolved discrepancy > R1,000', response: 'Escalate to Financial Controller immediately.' },
        { condition: 'System downtime > 4 hours', response: 'Activate BCP: Manual data entry into secure offline ledger.' }
      ],
      related_documents: {
        links: [
          { name: 'Corporate Financial Policy', url: '/documents/corp-fin-policy' },
          { name: 'ERP User Guide - Close Module', url: '/documents/erp-guide-close' }
        ]
      }
    }
  });

  console.log(`Successfully seeded SOP: ${monthEndSop.title}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
