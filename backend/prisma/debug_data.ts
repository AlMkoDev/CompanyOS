import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      company: true
    }
  });

  console.log('--- ALL USERS ---');
  for (const u of users) {
    console.log(`ID: ${u.id}`);
    console.log(`Email: ${u.email}`);
    console.log(`Name: ${u.first_name} ${u.last_name}`);
    console.log(`Company: ${u.company?.name} (${u.company_id})`);
    console.log('-----------------');
  }

  const projects = await prisma.project.findMany({
    include: {
      company: true
    }
  });

  console.log('--- ALL PROJECTS ---');
  for (const p of projects) {
    console.log(`Name: ${p.name}`);
    console.log(`Company: ${p.company?.name} (${p.company_id})`);
    console.log('-----------------');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
