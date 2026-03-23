import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const depts = await prisma.department.findMany({
    where: { company_id: '11111111-1111-1111-1111-111111111111' }
  });

  console.log(`Found ${depts.length} departments for Verdant Fields:`);
  depts.forEach(d => {
    console.log(`- ${d.name} (ID: ${d.id}, Status: ${d.status})`);
  });
}

main().catch(e => console.error(e)).finally(async () => await prisma.$disconnect());
