import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'manager@verdant.com';
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      company: { include: { setup: true } },
      department_members: { include: { role: true } },
    },
  });

  if (!user) {
    console.log("User not found");
    return;
  }

  console.log("--- User Object from Login Query ---");
  console.log(JSON.stringify(user.company?.setup, null, 2));
}

main().catch(e => console.error(e)).finally(async () => await prisma.$disconnect());
