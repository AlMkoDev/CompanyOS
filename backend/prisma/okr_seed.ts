import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst({
    where: { name: 'Verdant Fields' }
  });

  if (!company) {
    console.log('Verdant Fields company not found. Please run seed_verdant first.');
    return;
  }

  const engineering = await prisma.department.findFirst({
    where: { company_id: company.id, name: 'Engineering' }
  });

  const ceo = await prisma.employee.findFirst({
    where: { company_id: company.id, position: { title: 'CEO' } }
  });

  const cto = await prisma.employee.findFirst({
    where: { company_id: company.id, position: { title: 'CTO' } }
  });

  // 1. Create Cycle
  const cycle = await prisma.oKRCycle.create({
    data: {
      company_id: company.id,
      name: 'Q3 2024 Strategic Alignment',
      start_date: new Date('2024-07-01'),
      end_date: new Date('2024-09-30'),
      status: 'active'
    }
  });

  // 2. Company Level Objective
  const coObjective = await prisma.objective.create({
    data: {
      cycle_id: cycle.id,
      owner_id: ceo?.id,
      title: 'Drive Sustainable Agricultural Growth in East Africa',
      description: 'Expand our tech-enabled farming footprint by 25% while maintaining net-zero operations.',
      progress: 45
    }
  });

  // 3. Department Level (Cascaded)
  const deptObjective = await prisma.objective.create({
    data: {
      cycle_id: cycle.id,
      parent_id: coObjective.id,
      department_id: engineering?.id,
      owner_id: cto?.id,
      title: 'Roll Out Next-Gen Fertigation AI Module',
      description: 'Deploy the automated nutrient delivery system to 50 pilot farms.',
      progress: 60
    }
  });

  // 4. Key Results for Engineering Objective
  const kr1 = await prisma.keyResult.create({
    data: {
      objective_id: deptObjective.id,
      title: 'Deploy to 50 pilot farms',
      unit: 'farms',
      initial_value: 0,
      target_value: 50,
      current_value: 30,
      status: 'on-track'
    }
  });

  const kr2 = await prisma.keyResult.create({
    data: {
      objective_id: deptObjective.id,
      title: 'Achieve 99.9% uptime for Fertigation Cloud',
      unit: 'percentage',
      initial_value: 95,
      target_value: 99.9,
      current_value: 98.5,
      status: 'behind'
    }
  });

  // 5. Check-ins
  await prisma.checkIn.createMany({
    data: [
      {
        kr_id: kr1.id,
        value: 30,
        confidence: 9,
        comment: 'Expansion into Rift Valley farms completed ahead of schedule.'
      },
      {
        kr_id: kr2.id,
        value: 98.5,
        confidence: 6,
        comment: 'Encountered some latency issues in rural connectivity nodes.'
      }
    ]
  });

  console.log('OKR data seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
