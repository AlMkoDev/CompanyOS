import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      company: true
    }
  });

  console.log('--- USERS ---');
  users.forEach(u => {
    console.log(`Email: ${u.email}`);
    console.log(`Name: ${u.first_name} ${u.last_name}`);
    console.log(`Company: ${u.company?.name} (${u.company_id})`);
    console.log('-----------------');
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
