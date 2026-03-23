import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPersistence() {
  console.log('--- Checking Verdant Fields Persistence ---');

  const company = await prisma.company.findFirst({
    where: { name: 'Verdant Fields AgriTech' } // or whatever the exact name is, we can check by user instead
  });

  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@verdant.com' },
    include: { company: true }
  });

  if (!adminUser) {
    console.log('❌ Admin user admin@verdant.com not found.');
    return;
  }

  console.log(`✅ User found: ${adminUser.email}`);
  console.log(`✅ Company configured: ${adminUser.company.name}`);
  console.log(`   Tagline: ${adminUser.company.tagline || 'Not set'}`);
  console.log(`   Brand Colors JSON: ${adminUser.company.brand_colors ? JSON.stringify(adminUser.company.brand_colors) : 'Not set'}`);

  const departments = await prisma.department.findMany({
    where: { company_id: adminUser.company_id }
  });

  console.log(`\n--- Departments Enrolled: ${departments.length} ---`);
  departments.forEach(dept => {
    let mandateInfo = 'Not set';
    if (dept.mandate) {
       mandateInfo = JSON.stringify(dept.mandate).substring(0, 50);
    }
    console.log(`- ${dept.name} (Mandate: ${mandateInfo}...)`);
  });

  // Check roles linked to this company
  const roles = await prisma.role.findMany({
    where: { company_id: adminUser.company_id }
  });

  console.log(`\n--- Roles Defined: ${roles.length} ---`);
  roles.forEach(role => {
    console.log(`- ${role.name} `);
  });
}

checkPersistence()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
