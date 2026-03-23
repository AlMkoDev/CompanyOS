import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('Verifying Department Data...');
  
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@verdant.com' }
  });

  if (!adminUser) {
    console.error('Admin user not found!');
    return;
  }

  const companyId = adminUser.company_id;
  console.log('Company ID:', companyId);

  const depts = await prisma.department.findMany({
    where: { company_id: companyId }
  });

  console.log('Total Departments for this company:', depts.length);

  const finance = depts.find(d => d.template_key === 'fin');

  if (!finance) {
    console.error('Finance department not found for this company!');
    return;
  }

  console.log('--- Finance Department ---');
  console.log('ID:', finance.id);
  console.log('Template Key:', finance.template_key);
  console.log('Mandate:', JSON.stringify(finance.mandate, null, 2));
  console.log('Routines:', JSON.stringify(finance.operational_routines, null, 2));
  console.log('Roles Count:', (finance.roles as any[] | null)?.length || 0);
  console.log('Activities Count:', (finance.activities as any[] | null)?.length || 0);
  console.log('Communication Lines:', (finance.communication_lines as any[] | null)?.length || 0);
  console.log('Data Packs:', (finance.data_pack as any[] | null)?.length || 0);
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
