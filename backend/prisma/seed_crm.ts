import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error('No company found to seed CRM data for.');
    return;
  }

  const companyId = company.id;

  console.log('Seeding CRM data for company:', company.name);

  // Accounts
  const account1 = await prisma.cRMAccount.create({
    data: {
      company_id: companyId,
      name: 'Acme Corp',
      industry: 'Manufacturing',
      website: 'https://acme.com',
      status: 'active',
      health_score: 85,
    },
  });

  const account2 = await prisma.cRMAccount.create({
    data: {
      company_id: companyId,
      name: 'Global Tech Solutions',
      industry: 'Technology',
      website: 'https://globaltech.io',
      status: 'active',
      health_score: 92,
    },
  });

  // Contacts
  const contact1 = await prisma.cRMContact.create({
    data: {
      company_id: companyId,
      account_id: account1.id,
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@acme.com',
      phone: '+1-555-0123',
      job_title: 'Purchasing Manager',
    },
  });

  const contact2 = await prisma.cRMContact.create({
    data: {
      company_id: companyId,
      account_id: account2.id,
      first_name: 'Sarah',
      last_name: 'Connor',
      email: 'sarah.connor@globaltech.io',
      phone: '+1-555-9876',
      job_title: 'CTO',
    },
  });

  // Deals
  await prisma.deal.createMany({
    data: [
      {
        company_id: companyId,
        account_id: account1.id,
        contact_id: contact1.id,
        title: 'Q1 Equipment Refresh',
        value: 150000,
        stage: 'proposal',
        probability: 60,
        close_date: new Date('2024-04-15'),
      },
      {
        company_id: companyId,
        account_id: account2.id,
        contact_id: contact2.id,
        title: 'Enterprise Software License',
        value: 500000,
        stage: 'negotiation',
        probability: 80,
        close_date: new Date('2024-05-20'),
      },
      {
        company_id: companyId,
        account_id: account1.id,
        contact_id: contact1.id,
        title: 'Maintenance Contract Renewal',
        value: 25000,
        stage: 'discovery',
        probability: 40,
        close_date: new Date('2024-06-10'),
      },
      {
        company_id: companyId,
        account_id: account2.id,
        contact_id: contact2.id,
        title: 'Cloud Migration Project',
        value: 1200000,
        stage: 'qualification',
        probability: 20,
        close_date: new Date('2024-09-30'),
      },
      {
        company_id: companyId,
        account_id: account1.id,
        contact_id: contact1.id,
        title: 'New Factory Setup - Phase 1',
        value: 2500000,
        stage: 'closed_won',
        probability: 100,
        close_date: new Date('2024-02-28'),
      },
    ],
  });

  console.log('CRM Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
