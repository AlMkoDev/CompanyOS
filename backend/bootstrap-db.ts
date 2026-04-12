import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany({
    include: { setup: true }
  });

  for (const company of companies) {
    if (!company.setup) {
      console.log(`Bootstrapping setup for company: ${company.name} (${company.id})`);
      await prisma.companySetup.upsert({
        where: { company_id: company.id },
        update: {},
        create: { company_id: company.id },
      });
    }

    const adminDept = await prisma.department.findFirst({
      where: { company_id: company.id, template_key: 'adm' }
    });

    if (!adminDept) {
      console.log(`Creating Admin department for company: ${company.name}`);
      await prisma.department.create({
        data: {
          company_id: company.id,
          name: 'Administration',
          template_key: 'adm',
          status: 'active'
        }
      });
    }
  }

  console.log('Bootstrap complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
