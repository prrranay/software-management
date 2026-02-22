import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const plainPassword = process.env.SEED_ADMIN_PASS ?? 'SecurePass123!';

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  await prisma.user.create({
    data: {
      name: 'Admin',
      email,
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`Admin user created: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
