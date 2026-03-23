import "dotenv/config";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const companyId = '11111111-1111-1111-1111-111111111111'; // Verdant Fields standard ID

  console.log('Seeding Sample Projects...');

  // Create company if it doesn't exist
  await prisma.company.upsert({
    where: { id: companyId },
    update: {},
    create: {
      id: companyId,
      name: 'Verdant Fields',
      description: 'Agricultural technology company',
      industry: 'Agriculture',
    },
  });
  console.log('Company ensured!');

  const projects = [
    {
      id: 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa',
      name: 'Digital Transformation',
      description: 'Enterprise-wide digital shift including ERP upgrade and cloud migration.',
      start_date: new Date('2026-01-01'),
      end_date: new Date('2026-12-31'),
      status: 'ACTIVE',
      rag_status: 'GREEN',
      budget_allocated: 1500000,
    },
    {
      id: 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb',
      name: 'Precision Farming Pilot',
      description: 'IoT sensor network deployment for real-time crop health monitoring.',
      start_date: new Date('2026-03-01'),
      end_date: new Date('2026-08-30'),
      status: 'ACTIVE',
      rag_status: 'AMBER',
      budget_allocated: 450000,
    },
    {
      id: 'cccccccc-3333-3333-3333-cccccccccccc',
      name: 'Supply Chain Optimization',
      description: 'Streamlining logistics and warehouse management workflows.',
      start_date: new Date('2026-02-15'),
      end_date: new Date('2026-11-15'),
      status: 'PLANNED',
      rag_status: 'GREEN',
      budget_allocated: 850000,
    }
  ];

  for (const p of projects) {
    await prisma.project.upsert({
      where: { id: p.id },
      update: {},
      // @ts-ignore - Type compatibility issue with Prisma enums
      create: {
        ...p,
        company_id: companyId,
      },
    });

    // Create a budget record for each
    await prisma.projectBudget.upsert({
      where: { id: `d${p.id.substring(1)}` },
      update: {},
      // @ts-ignore - Type compatibility
      create: {
        id: `d${p.id.substring(1)}`,
        project_id: p.id,
        total_allocated: p.budget_allocated || 0,
        actual_spent: (p.budget_allocated || 0) * 0.45,
        variance: (p.budget_allocated || 0) * 0.55,
        variance_pct: 55,
      }
    });

    // Create sample tasks for Kanban
    const taskStatuses: ('TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE')[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
    for (let i = 1; i <= 5; i++) {
        await prisma.projectTask.create({
            // @ts-ignore - Type compatibility
            data: {
                project_id: p.id,
                title: `${p.name} Task ${i}`,
                description: `Description for ${p.name} Task ${i}`,
                status: taskStatuses[Math.floor(Math.random() * taskStatuses.length)],
                priority: 'MEDIUM',
                due_date: new Date(Date.now() + i * 86400000 * 7),
            }
        });
    }
  }

  console.log('Sample projects seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
