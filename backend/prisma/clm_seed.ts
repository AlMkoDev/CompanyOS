import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst({
    where: { name: 'Verdant Fields' }
  });

  if (!company) {
    console.log('Verdant Fields company not found. Please run main seed first.');
    return;
  }

  console.log('Seeding CLM Templates for Verdant Fields...');

  const templates = [
    {
      company_id: company.id,
      title: 'Mutual Non-Disclosure Agreement',
      category: 'NDA',
      content: 'This Mutual Non-Disclosure Agreement is entered into between Verdant Fields and {{client_name}} on {{effective_date}}. Both parties agree to protect confidential information...',
      variables: {
        client_name: 'string',
        effective_date: 'date',
        jurisdiction: 'string'
      },
      isActive: true,
    },
    {
      company_id: company.id,
      title: 'Master Service Agreement',
      category: 'Service Agreement',
      content: 'This Master Service Agreement ("MSA") governs the provision of services by Verdant Fields to {{client_name}}. Total value: {{contract_value}}. Scope: {{service_scope}}.',
      variables: {
        client_name: 'string',
        contract_value: 'number',
        service_scope: 'text',
        start_date: 'date',
        end_date: 'date'
      },
      isActive: true,
    },
    {
      company_id: company.id,
      title: 'Standard Employment Contract',
      category: 'Employment',
      content: 'Employment Agreement between Verdant Fields and {{employee_name}}. Position: {{position_title}}. Salary: {{annual_salary}}. Start Date: {{start_date}}.',
      variables: {
        employee_name: 'string',
        position_title: 'string',
        annual_salary: 'number',
        start_date: 'date'
      },
      isActive: true,
    }
  ];

  for (const template of templates) {
    await prisma.contractTemplate.create({
      data: template
    });
  }

  console.log('Successfully seeded 3 Contract Templates.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
