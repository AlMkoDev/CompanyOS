import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userCounts = await prisma.user.groupBy({
    by: ['company_id'],
    _count: true
  });
  console.log('--- User counts by Company ID ---');
  userCounts.forEach(c => console.log(`${c.company_id}: ${c._count} users`));

  const projectCounts = await prisma.project.groupBy({
    by: ['company_id'],
    _count: true
  });
  console.log('\n--- Project counts by Company ID ---');
  projectCounts.forEach(c => console.log(`${c.company_id}: ${c._count} projects`));

  const systemAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { first_name: { contains: 'System', mode: 'insensitive' } },
        { last_name: { contains: 'Admin', mode: 'insensitive' } }
      ]
    }
  });
  
  if (systemAdmin) {
    console.log(`\nSystem Admin found: ${systemAdmin.first_name} ${systemAdmin.last_name} (${systemAdmin.email})`);
    console.log(`Company ID: ${systemAdmin.company_id}`);
  } else {
    console.log('\nSystem Admin NOT found in DB search.');
  }
}

main().catch(e => console.error(e)).finally(async () => await prisma.$disconnect());
