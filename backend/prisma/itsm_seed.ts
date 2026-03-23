import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const companyId = "00000000-0000-0000-0000-000000000000";
  const employees = [
    "e5724606-c6ac-4de0-9f96-48e9187f8ab0", // Dwight
    "49874dfe-4655-41b7-8d0d-5eb5c9693e36", // Sarah
    "1805c64c-f3e1-4684-9ee8-b14d12eaeceb"  // Michael
  ];

  console.log('Seeding ITSM data...');

  // 1. Assets
  const assets = await Promise.all([
    prisma.iTAsset.upsert({
      where: { asset_tag: 'ASSET-001' },
      update: {},
      create: {
        company_id: companyId,
        asset_tag: 'ASSET-001',
        name: 'MacBook Pro 16"',
        type: 'laptop',
        status: 'active',
        model: 'Apple M3 Max',
        serial_no: 'SN-VJF-9102',
        assigned_to_id: employees[0],
        specs: { ram: '64GB', storage: '1TB SSD' }
      }
    }),
    prisma.iTAsset.upsert({
      where: { asset_tag: 'SRV-082' },
      update: {},
      create: {
        company_id: companyId,
        asset_tag: 'SRV-082',
        name: 'Main Application Cluster',
        type: 'server',
        status: 'active',
        model: 'Dell PowerEdge R750',
        serial_no: 'SN-PX-0001',
        specs: { cpu: '32 Core', ram: '256GB' }
      }
    })
  ]);

  // 2. Tickets
  const slaDeadline = new Date();
  slaDeadline.setHours(slaDeadline.getHours() + 4);

  await prisma.iTTicket.createMany({
    data: [
      {
        company_id: companyId,
        raised_by_id: employees[1],
        subject: 'VPN Connection Dropping',
        description: 'VPN connection drops every 20 minutes specifically when using the fiber line.',
        priority: 'P2',
        status: 'open',
        category: 'Network',
        sla_deadline: slaDeadline,
        asset_id: assets[0].id
      },
      {
        company_id: companyId,
        raised_by_id: employees[2],
        subject: 'Request for Adobe Acrobat Pro License',
        description: 'Need license for PDF editing and signing for the finance department.',
        priority: 'P3',
        status: 'pending',
        category: 'Software',
        sla_deadline: new Date(Date.now() + 86400000)
      },
      {
        company_id: companyId,
        raised_by_id: employees[0],
        subject: 'CRITICAL: Database Latency Spike',
        description: 'Production DB is showing 2.5s latency on simple queries. Impacting user experience.',
        priority: 'P1',
        status: 'in_progress',
        category: 'Infrastructure',
        sla_deadline: new Date(Date.now() + 7200000)
      }
    ]
  });

  // 3. Knowledge Base
  await prisma.knowledgeArticle.create({
    data: {
      company_id: companyId,
      author_id: employees[2],
      title: 'Global VPN Troubleshooting Guide',
      category: 'Troubleshooting',
      tags: ['network', 'remote', 'vpn'],
      content: '## Common VPN Issues\n\n1. Check your internet connection.\n2. Ensure you are using the correct credentials.\n3. If using Fiber, check if MTU settings are correct (1400 suggested).\n\n### Error 800\nThis usually means the server is down or unreachable.'
    }
  });

  console.log('ITSM Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
