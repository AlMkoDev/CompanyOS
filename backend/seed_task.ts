import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@verdant.com' }
  });

  if (!adminUser) {
    console.error('Admin user not found!');
    process.exit(1);
  }

  const dept = await prisma.department.findFirst({
    where: { company_id: adminUser.company_id }
  });

  if (!dept) {
     console.error('No departments found!');
     process.exit(1);
  }

  console.log('Found Department:', dept.name);

  const task = await prisma.task.create({
    data: {
      title: 'Q3 Strategy Presentation',
      description: 'Prepare slides for the board meeting.',
      priority: 'high',
      status: 'open',
      company_id: adminUser.company_id,
      department_id: dept.id,
      creator_id: adminUser.id
    }
  });

  console.log('Created Task:', task.title, 'Status:', task.status);

  const updatedTask = await prisma.task.update({
    where: { id: task.id },
    data: { status: 'in-progress' }
  });

  console.log('Updated Task Status to:', updatedTask.status);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
