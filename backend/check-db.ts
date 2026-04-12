import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Departments ---');
  const departments = await prisma.department.findMany();
  console.log(JSON.stringify(departments, null, 2));

  console.log('\n--- Setup ---');
  const setup = await prisma.companySetup.findMany();
  console.log(JSON.stringify(setup, null, 2));

  console.log('\n--- Companies ---');
  const companies = await prisma.company.findMany({
    include: {
      setup: true,
    }
  });
  console.log(JSON.stringify(companies, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
