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
  
  // Find the duplicate departments (those without template_key)
  const duplicateHR = await prisma.department.findFirst({
    where: {
      company_id: companyId,
      name: 'Human Resources',
      template_key: null
    }
  });

  const duplicateOps = await prisma.department.findFirst({
    where: {
      company_id: companyId,
      name: 'Operations',
      template_key: null
    }
  });

  // Find the proper seeded departments
  const properHR = await prisma.department.findFirst({
    where: {
      company_id: companyId,
      template_key: 'hr'
    }
  });

  const properOps = await prisma.department.findFirst({
    where: {
      company_id: companyId,
      template_key: 'ops'
    }
  });

  console.log('Duplicate HR ID:', duplicateHR?.id);
  console.log('Proper HR ID:', properHR?.id);
  console.log('Duplicate Ops ID:', duplicateOps?.id);
  console.log('Proper Ops ID:', properOps?.id);

  // Transfer all positions from duplicate to proper departments
  if (duplicateHR && properHR) {
    const hrPositions = await prisma.position.findMany({
      where: { department_id: duplicateHR.id }
    });
    
    console.log(`\nTransferring ${hrPositions.length} positions from duplicate HR to proper HR...`);
    
    for (const position of hrPositions) {
      await prisma.position.update({
        where: { id: position.id },
        data: { department_id: properHR.id }
      });
      console.log(`  - Transferred position: ${position.title}`);
    }
  }

  if (duplicateOps && properOps) {
    const opsPositions = await prisma.position.findMany({
      where: { department_id: duplicateOps.id }
    });
    
    console.log(`\nTransferring ${opsPositions.length} positions from duplicate Ops to proper Ops...`);
    
    for (const position of opsPositions) {
      await prisma.position.update({
        where: { id: position.id },
        data: { department_id: properOps.id }
      });
      console.log(`  - Transferred position: ${position.title}`);
    }
  }

  // Now delete the duplicates
  if (duplicateHR) {
    await prisma.department.delete({ where: { id: duplicateHR.id } });
    console.log('\n✓ Deleted duplicate Human Resources department');
  }

  if (duplicateOps) {
    await prisma.department.delete({ where: { id: duplicateOps.id } });
    console.log('✓ Deleted duplicate Operations department');
  }

  // Verify final count
  const finalCount = await prisma.department.count({
    where: { company_id: companyId, status: 'active' }
  });

  console.log(`\n✓ Cleanup complete! Active departments: ${finalCount}`);
  
  // List all departments
  const allDepts = await prisma.department.findMany({
    where: { company_id: companyId, status: 'active' },
    orderBy: { name: 'asc' }
  });
  
  console.log('\nFinal department list:');
  allDepts.forEach(dept => {
    console.log(`  - ${dept.name} (template_key: ${dept.template_key})`);
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
