import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const companyId = '11111111-1111-1111-1111-111111111111';
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // 1. Create Company
  const company = await prisma.company.upsert({
    where: { id: companyId },
    update: {},
    create: {
      id: companyId,
      name: 'Verdant Fields',
      industry: 'Agriculture & Technology',
      tagline: 'Cultivating the future with precision metrics.',
    },
  });

  // 1.1 Create Company Setup (Bypass Wizard)
  await prisma.companySetup.upsert({
    where: { company_id: companyId },
    update: {},
    create: {
      company_id: companyId,
      current_step: 4,
      is_complete: true,
      completed_steps: [1, 2, 3, 4],
    }
  });

  // 2. Create Departments
  const hrDept = await prisma.department.upsert({
    where: { id: '22222222-2222-2222-2222-222222222222' },
    update: {},
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      company_id: companyId,
      name: 'Human Resources',
      color: '#4682B4',
    },
  });

  const opsDept = await prisma.department.upsert({
    where: { id: '33333333-3333-3333-3333-333333333333' },
    update: {},
    create: {
      id: '33333333-3333-3333-3333-333333333333',
      company_id: companyId,
      name: 'Operations',
      color: '#2E8B57',
    },
  });

  // 3. Create Roles/Positions
  const mgrPosition = await prisma.position.upsert({
    where: { id: '44444444-4444-4444-4444-444444444444' },
    update: {},
    create: {
      id: '44444444-4444-4444-4444-444444444444',
      company_id: companyId,
      department_id: opsDept.id,
      title: 'Operations Manager',
      level: 3,
      headcount: 2,
    },
  });

  const devPosition = await prisma.position.upsert({
    where: { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' },
    update: {},
    create: {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      company_id: companyId,
      department_id: opsDept.id,
      title: 'Senior Full Stack Developer',
      level: 4,
      headcount: 5,
    },
  });

  // 4. Create Users & Employees
  const mgrUser = await prisma.user.upsert({
    where: { email: 'manager@verdant.com' },
    update: {},
    create: {
      email: 'manager@verdant.com',
      password_hash: hashedPassword,
      first_name: 'Sarah',
      last_name: 'Connor',
      company_id: companyId,
    },
  });

  const manager = await prisma.employee.upsert({
    where: { emp_no: 'VF-001' },
    update: {},
    create: {
      emp_no: 'VF-001',
      first_name: 'Sarah',
      last_name: 'Connor',
      email: mgrUser.email,
      hire_date: new Date('2023-01-15'),
      company_id: companyId,
      department_id: opsDept.id,
      position_id: mgrPosition.id,
    },
  });

  const empUser1 = await prisma.user.upsert({
    where: { email: 'michael.s@verdant.com' },
    update: {},
    create: {
      email: 'michael.s@verdant.com',
      password_hash: hashedPassword,
      first_name: 'Michael',
      last_name: 'Scott',
      company_id: companyId,
    },
  });

  const emp1 = await prisma.employee.upsert({
    where: { emp_no: 'VF-002' },
    update: {},
    create: {
      emp_no: 'VF-002',
      first_name: 'Michael',
      last_name: 'Scott',
      email: empUser1.email,
      hire_date: new Date('2023-06-01'),
      company_id: companyId,
      department_id: opsDept.id,
      position_id: devPosition.id,
      manager_id: manager.id,
    },
  });

  const empUser2 = await prisma.user.upsert({
    where: { email: 'dwight.s@verdant.com' },
    update: {},
    create: {
      email: 'dwight.s@verdant.com',
      password_hash: hashedPassword,
      first_name: 'Dwight',
      last_name: 'Schrute',
      company_id: companyId,
    },
  });

  const emp2 = await prisma.employee.upsert({
    where: { emp_no: 'VF-003' },
    update: {},
    create: {
      emp_no: 'VF-003',
      first_name: 'Dwight',
      last_name: 'Schrute',
      email: empUser2.email,
      hire_date: new Date('2023-08-15'),
      company_id: companyId,
      department_id: opsDept.id,
      position_id: devPosition.id,
      manager_id: manager.id,
    },
  });

  // 5. Create Projects
  const digitalTransformation = await prisma.project.upsert({
    where: { id: '55555555-5555-5555-5555-555555555555' },
    update: {},
    create: {
      id: '55555555-5555-5555-5555-555555555555',
      name: 'Digital Transformation',
      description: 'Enterprise-wide digital shift including ERP upgrade and cloud migration.',
      start_date: new Date('2026-01-01'),
      end_date: new Date('2026-12-31'),
      status: 'ACTIVE',
      rag_status: 'GREEN',
      budget_allocated: 1500000,
      company_id: companyId,
    },
  });

  await prisma.project.upsert({
    where: { id: '66666666-6666-6666-6666-666666666666' },
    update: {},
    create: {
      id: '66666666-6666-6666-6666-666666666666',
      name: 'Precision Farming Pilot',
      description: 'IoT sensor network deployment for real-time crop health monitoring.',
      start_date: new Date('2026-03-01'),
      end_date: new Date('2026-08-30'),
      status: 'ACTIVE',
      rag_status: 'AMBER',
      budget_allocated: 450000,
      company_id: companyId,
    },
  });

  // 6. Create Budgets
  await prisma.projectBudget.upsert({
    where: { id: '77777777-7777-7777-7777-777777777777' },
    update: {},
    create: {
      id: '77777777-7777-7777-7777-777777777777',
      project_id: digitalTransformation.id,
      total_allocated: 1500000,
      actual_spent: 675000,
      variance: 825000,
      variance_pct: 55,
    }
  });

  // 7. Create Sample Tasks
  const taskStatuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const;
  for (let i = 1; i <= 8; i++) {
    const taskId = `d1617a11-0000-0000-0000-00000000000${i}`;
    await prisma.projectTask.upsert({
      where: { id: taskId },
      update: {
        status: taskStatuses[Math.floor(Math.random() * taskStatuses.length)] as any,
      },
      create: {
        id: taskId,
        project_id: digitalTransformation.id,
        title: `Digital Transformation Task ${i}`,
        description: `Implement core module ${i} and verify integration.`,
        status: taskStatuses[Math.floor(Math.random() * taskStatuses.length)] as any,
        priority: i % 3 === 0 ? 'HIGH' : 'MEDIUM',
        due_date: new Date(Date.now() + i * 86400000 * 5),
      }
    });
  }

  console.log('Verdant Fields seeded with employees and projects!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
