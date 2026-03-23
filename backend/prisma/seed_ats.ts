import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error('No company found to seed ATS data for.');
    return;
  }

  const companyId = company.id;
  const adminDept = await prisma.department.findFirst({
    where: { company_id: companyId, name: 'Administration' }
  });

  if (!adminDept) {
    console.error('Administration department not found.');
    return;
  }

  // Ensure a position exists
  let position = await prisma.position.findFirst({
    where: { company_id: companyId }
  });

  if (!position) {
    position = await prisma.position.create({
      data: {
        company_id: companyId,
        department_id: adminDept.id,
        title: 'Senior Accountant',
        level: 3,
        headcount: 2,
      }
    });
  }

  console.log('Seeding ATS data for company:', company.name);

  // 1. Job Requisitions
  const req1 = await prisma.jobRequisition.create({
    data: {
      company_id: companyId,
      department_id: adminDept.id,
      position_id: position.id,
      title: 'Senior Portfolio Manager',
      status: 'open',
      headcount: 1,
      description: 'We are looking for a Senior Portfolio Manager to lead our investment strategy.',
      requirements: '10+ years of experience in finance, CFA preferred.',
      target_hire_date: new Date('2024-05-01'),
    } as any // using any because some fields might be newly added to prisma client
  });

  const req2 = await prisma.jobRequisition.create({
    data: {
      company_id: companyId,
      department_id: adminDept.id,
      position_id: position.id,
      title: 'Operations Coordinator',
      status: 'open',
      headcount: 2,
      description: 'Support day-to-day operations in our main office.',
      requirements: '3+ years experience in office management.',
      target_hire_date: new Date('2024-06-01'),
    } as any
  });

  // 2. Candidates
  const candidate1 = await prisma.candidate.create({
    data: {
      name: 'Michael Scott',
      email: 'michael.scott@dundermifflin.com',
      phone: '+1-555-0101',
      source: 'LinkedIn',
      cv_url: 'https://storage.verdantfields.com/cvs/michael_scott_cv.pdf',
    }
  });

  const candidate2 = await prisma.candidate.create({
    data: {
      name: 'Dwight Schrute',
      email: 'dwight.schrute@beets.com',
      phone: '+1-555-0102',
      source: 'Referral',
      cv_url: 'https://storage.verdantfields.com/cvs/dwight_schrute_cv.pdf',
    }
  });

  const candidate3 = await prisma.candidate.create({
    data: {
      name: 'Pam Beesly',
      email: 'pam.beesly@art.com',
      phone: '+1-555-0103',
      source: 'Indeed',
      cv_url: 'https://storage.verdantfields.com/cvs/pam_beesly_cv.pdf',
    }
  });

  // 3. Applications
  const app1 = await prisma.application.create({
    data: {
      requisition_id: req1.id,
      candidate_id: candidate1.id,
      stage: 'interview1',
      notes: 'Strong presentation skills, but maybe too many jokes.',
      rating: 4,
    } as any
  });

  const app2 = await prisma.application.create({
    data: {
      requisition_id: req1.id,
      candidate_id: candidate2.id,
      stage: 'screened',
      notes: 'Very intense. Loves discipline. Might be overqualified for manager (thinks he is assistant Regional Manager).',
      rating: 3,
    } as any
  });

  const app3 = await prisma.application.create({
    data: {
      requisition_id: req2.id,
      candidate_id: candidate3.id,
      stage: 'hired',
      notes: 'Perfect fit for the role. Great interpersonal skills.',
      rating: 5,
    } as any
  });

  // 4. Interviews
  const interview1 = await prisma.interview.create({
    data: {
      application_id: app1.id,
      scheduled_at: new Date('2024-03-20T10:00:00Z'),
      type: 'technical',
      location: 'Zoom Meeting',
      duration: 60,
    } as any
  });

  // 5. Scorecards
  await prisma.scorecard.create({
    data: {
      interview_id: interview1.id,
      scores: {
        commercial_awareness: 3,
        technical_skills: 5,
        cultural_fit: 4,
        leadership: 4
      },
      recommendation: 'hire',
      submitted_by: (await prisma.user.findFirst({ where: { company_id: companyId } }))?.id || '',
    }
  });

  // 6. Offers
  await prisma.offer.create({
    data: {
      application_id: app3.id,
      salary: 45000,
      start_date: new Date('2024-04-01'),
      status: 'accepted',
      sent_at: new Date('2024-03-10'),
    }
  });

  console.log('ATS Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
