import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst();
  if (!company) {
    console.log('No company found. Please seed company first.');
    return;
  }

  const hrDept = await prisma.department.findFirst({ where: { name: 'Human Resources' } });
  const opsDept = await prisma.department.findFirst({ where: { name: 'Operations' } });

  const manager = await prisma.employee.findFirst({ where: { position: { title: { contains: 'Manager' } } } });
  const employee1 = await prisma.employee.findFirst({ where: { manager_id: manager?.id, NOT: { id: manager?.id } } });
  const employee2 = await prisma.employee.findFirst({ where: { manager_id: manager?.id, NOT: { id: employee1?.id } } });

  if (!manager || !employee1) {
    console.log('Not enough employees to seed performance data.');
    return;
  }

  // 1. Create a Review Cycle
  const cycle = await prisma.reviewCycle.create({
    data: {
      company_id: company.id,
      name: 'Annual Performance Review 2026',
      period: 'FY2026 Q1',
      start_date: new Date('2026-01-01'),
      end_date: new Date('2026-03-31'),
      status: 'manager_review'
    }
  });

  // 2. Create Reviews
  const review1 = await prisma.review.create({
    data: {
      cycle_id: cycle.id,
      company_id: company.id,
      employee_id: employee1.id,
      manager_id: manager.id,
      status: 'manager_review_done',
      self_assessment: {
        highlights: 'Successfully delivered the new ATS module ahead of schedule.',
        challenges: 'Managing cross-departmental dependencies for data syncing.',
        goals_met: true
      },
      manager_assessment: {
        strengths: 'Exceptional technical execution and documentation quality.',
        areas_for_improvement: 'Could take a more active role in mentoring junior developers.',
        overall_comment: 'Michael has had a stellar quarter.'
      },
      final_rating: '4 - Exceeds Expectations'
    }
  });

  if (employee2) {
    await prisma.review.create({
      data: {
        cycle_id: cycle.id,
        company_id: company.id,
        employee_id: employee2.id,
        manager_id: manager.id,
        status: 'self_assessment_done',
        self_assessment: {
          highlights: 'Optimized the backend response times by 40%.',
          challenges: 'Learning new cloud infrastructure tools.',
          goals_met: true
        }
      }
    });
  }

  // 3. Create Peer Feedback
  if (employee2) {
    await prisma.feedbackRequest.create({
      data: {
        review_id: review1.id,
        provider_id: employee2.id,
        is_anonymous: true,
        submitted_at: new Date(),
        answers: {
          collaboration: 'Michael is always willing to help with complex bugs.',
          reliability: 'Very high throughput and reliable code output.',
          general: 'One of the strongest contributors on the team.'
        }
      }
    });
  }

  // 4. Create Goals
  await prisma.goal.createMany({
    data: [
      {
        employee_id: employee1.id,
        review_id: review1.id,
        title: 'Master Next.js 16 Server Components',
        description: 'Implement at least 3 high-complexity modules using server actions.',
        target: '100% completion in projects',
        status: 'in-progress',
        progress: 60
      },
      {
        employee_id: employee1.id,
        review_id: review1.id,
        title: 'Reduce API Latency',
        description: 'Optimize Postgres queries and implement Redis caching where appropriate.',
        target: '< 200ms average response time',
        status: 'completed',
        progress: 100
      }
    ]
  });

  console.log('Performance data seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
