import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Reseeding Admin and Company...');

  const companyId = '00000000-0000-0000-0000-000000000001'; // Default test company ID
  const email = 'admin@verdant.com';
  const password = 'Password123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  // 1. Create Company
  const company = await prisma.company.upsert({
    where: { id: companyId },
    update: {},
    create: {
      id: companyId,
      name: 'Verdant Fields AgriTech Ltd.',
      industry: 'Agriculture',
      description: 'A leading agritech company specializing in sustainable farming solutions.',
    },
  });

  // 2. Create Admin User
  const user = await prisma.user.upsert({
    where: { email },
    update: { password_hash: hashedPassword },
    create: {
      email,
      password_hash: hashedPassword,
      first_name: 'System',
      last_name: 'Admin',
      company_id: company.id,
      status: 'active',
    },
  });

  // 3. Create Setup Progress
  await prisma.companySetup.upsert({
      where: { company_id: company.id },
      update: { current_step: 4, is_complete: false },
      create: {
          company_id: company.id,
          current_step: 4,
          is_complete: false
      }
  });

  console.log(`Successfully created company: ${company.name}`);
  console.log(`Successfully created admin user: ${user.email}`);
  console.log('Pre-condition for seed_departments.ts met.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
