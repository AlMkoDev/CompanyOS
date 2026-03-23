import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminUser = await prisma.user.findUnique({
    where: { email: 'manager@verdant.com' }
  });

  if (!adminUser) {
    console.error('Admin user not found!');
    process.exit(1);
  }

  const companyId = adminUser.company_id;
  console.log(`Company ID: ${companyId}`);

  const allDepartments = await prisma.department.findMany({
    where: { company_id: companyId },
    orderBy: { name: 'asc' }
  });

  console.log(`\n=== ALL DEPARTMENTS (${allDepartments.length}) ===`);
  allDepartments.forEach(dept => {
    console.log(`- ${dept.name} (template_key: ${dept.template_key}, status: ${dept.status})`);
  });

  const activeDepartments = await prisma.department.findMany({
    where: { company_id: companyId, status: 'active' },
    orderBy: { name: 'asc' }
  });

  console.log(`\n=== ACTIVE DEPARTMENTS (${activeDepartments.length}) ===`);
  activeDepartments.forEach(dept => {
    console.log(`- ${dept.name} (template_key: ${dept.template_key})`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
