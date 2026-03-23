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
  
  // Find duplicate departments (those without template_key)
  const duplicates = await prisma.department.findMany({
    where: {
      company_id: companyId,
      template_key: null
    }
  });

  console.log(`Found ${duplicates.length} duplicate departments to remove:`);
  duplicates.forEach(dept => {
    console.log(`- ${dept.name} (id: ${dept.id})`);
  });

  // Delete duplicates
  for (const dept of duplicates) {
    await prisma.department.delete({
      where: { id: dept.id }
    });
    console.log(`✓ Deleted duplicate: ${dept.name}`);
  }

  // Verify final count
  const finalCount = await prisma.department.count({
    where: { company_id: companyId, status: 'active' }
  });

  console.log(`\n✓ Cleanup complete! Active departments: ${finalCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
