import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@verdant.com' }
  });

  if (!adminUser) {
    console.log('Admin user not found. Trying to find any company setup...');
    const result = await prisma.companySetup.updateMany({
      data: { is_complete: true, current_step: 5 }
    });
    console.log(`Updated ${result.count} company setups to complete.`);
    return;
  }

  // Update this specific company's setup to complete
  await prisma.companySetup.update({
    where: { company_id: adminUser.company_id },
    data: { is_complete: true, current_step: 5 }
  });

  console.log('Successfully completed the setup configuration for the current company.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
