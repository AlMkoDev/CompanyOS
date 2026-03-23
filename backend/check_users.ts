import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.user.findMany({ select: { email: true, status: true, company: { select: { name: true } } } })
  .then(users => { console.log(JSON.stringify(users, null, 2)); p.$disconnect(); });
