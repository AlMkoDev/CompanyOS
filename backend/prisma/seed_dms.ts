import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error('No company found. Run core seeds first.');
    return;
  }

  const user = await prisma.user.findFirst({
    where: { company_id: company.id }
  });

  if (!user) {
    console.error('No user found.');
    return;
  }

  console.log('Seeding DMS for company:', company.name);

  // 1. Retention Policies
  const standardPolicy = await prisma.retentionPolicy.create({
    data: {
      company_id: company.id,
      name: 'Standard Operational (7 Years)',
      duration_years: 7,
      category: 'legal',
      trigger_event: 'creation'
    }
  });

  const legalPolicy = await prisma.retentionPolicy.create({
    data: {
      company_id: company.id,
      name: 'Permanent Corporate (Infinity)',
      duration_years: 100,
      category: 'legal',
      trigger_event: 'creation'
    }
  });

  // 2. Folders
  const financeFolder = await prisma.folder.create({
    data: {
      company_id: company.id,
      name: 'Financial Records',
      security_level: 'confidential'
    }
  });

  const legalFolder = await prisma.folder.create({
    data: {
      company_id: company.id,
      name: 'Legal Archives',
      security_level: 'secret'
    }
  });

  const taxSubfolder = await prisma.folder.create({
    data: {
      company_id: company.id,
      name: 'Tax Filings 2024',
      parent_id: financeFolder.id,
      security_level: 'confidential'
    }
  });

  // 3. Documents
  const doc1 = await prisma.document.create({
    data: {
      company_id: company.id,
      folder_id: taxSubfolder.id,
      retention_id: standardPolicy.id,
      name: 'VAT_Return_Q1_2024.pdf',
      file_url: 'https://placeholder.com/vat.pdf',
      file_type: 'application/pdf',
      size_bytes: 1250000,
      status: 'published',
      classification: 'confidential'
    }
  });

  await prisma.documentVersion.create({
    data: {
      doc_id: doc1.id,
      version_no: 1,
      file_url: 'https://placeholder.com/vat_v1.pdf',
      created_by: user.id
    }
  });

  const doc2 = await prisma.document.create({
    data: {
      company_id: company.id,
      folder_id: legalFolder.id,
      retention_id: legalPolicy.id,
      name: 'Master_Service_Agreement_v0.9.docx',
      file_url: 'https://placeholder.com/msa.docx',
      file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size_bytes: 450000,
      status: 'draft',
      classification: 'secret'
    }
  });

  await prisma.documentVersion.create({
    data: {
      doc_id: doc2.id,
      version_no: 1,
      file_url: 'https://placeholder.com/msa_v1.docx',
      created_by: user.id
    }
  });

  // 4. Legal Hold
  await prisma.legalHold.create({
    data: {
      doc_id: doc2.id,
      reason: 'Active mediation with Global Tech Solutions',
      placed_by: user.id,
      active: true
    }
  });

  console.log('DMS Seeding Complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
