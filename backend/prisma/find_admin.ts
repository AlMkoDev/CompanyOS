import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allUsers = await prisma.user.findMany({
    include: {
      company: true
    }
  });

  console.log(`Found ${allUsers.length} total users in DB`);
  
  allUsers.forEach(u => {
    console.log(`- ${u.first_name} ${u.last_name} (${u.email}) | Company: ${u.company?.name} (${u.company_id})`);
  });

  const admins = await prisma.user.findMany({
    where: {
      OR: [
        { first_name: { contains: 'System', mode: 'insensitive' } },
        { last_name: { contains: 'Admin', mode: 'insensitive' } },
        { email: { contains: 'admin', mode: 'insensitive' } }
      ]
    },
    include: {
      company: true
    }
  });

  console.log(`\nFound ${admins.length} users matching 'Admin' or 'System'`);
  admins.forEach(a => {
    console.log(`- MATCH: ${a.first_name} ${a.last_name} (${a.email}) | Company: ${a.company?.name} (${a.company_id})`);
  });
}

main().catch(e => console.error(e)).finally(async () => await prisma.$disconnect());
