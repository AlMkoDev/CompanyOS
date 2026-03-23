import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('Verifying Database Relations for Operational Gaps...');

  const company = await prisma.company.findFirst({
    where: { name: { contains: 'Verdant Fields' } },
    include: {
      gap_statuses: true,
      departments: {
        include: {
          gap_statuses: true
        }
      }
    }
  });

  if (!company) {
    console.error('Company not found!');
    return;
  }

  console.log(`Company: ${company.name}`);
  console.log(`Global Gaps found: ${company.gap_statuses.length}`);
  
  company.gap_statuses.forEach(gap => {
    console.log(` - [${gap.priority.toUpperCase()}] ${gap.item_name} (${gap.status})`);
  });

  console.log('\nDepartment-specific Gaps:');
  company.departments.forEach(dept => {
      if (dept.gap_statuses.length > 0) {
          console.log(`\n--- ${dept.name} ---`);
          dept.gap_statuses.forEach(gap => {
              console.log(` - [${gap.priority.toUpperCase()}] ${gap.item_name}`);
          });
      }
  });

  console.log('\nRelational Verification Complete.');
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
