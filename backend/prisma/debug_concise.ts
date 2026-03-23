import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, first_name: true, last_name: true, company_id: true }
  });
  console.log('--- USERS ---');
  users.forEach(u => console.log(`${u.first_name} ${u.last_name} (${u.email}) -> CompanyID: ${u.company_id}`));

  const companies = await prisma.company.findMany({
    select: { id: true, name: true }
  });
  console.log('\n--- COMPANIES ---');
  companies.forEach(c => console.log(`${c.name} -> ID: ${c.id}`));

  const projects = await prisma.project.findMany({
    select: { name: true, company_id: true }
  });
  console.log('\n--- PROJECTS ---');
  projects.forEach(p => console.log(`${p.name} -> CompanyID: ${p.company_id}`));
}

main().catch(e => console.error(e)).finally(async () => await prisma.$disconnect());
