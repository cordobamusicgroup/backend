import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { countries } from './countries-seed';

const prisma = new PrismaClient();

/**
 * WARNING: This seed script should only be run ONCE in production.
 * Run this script using the command: pnpm db:seed-prod
 *
 * NOTE: Running this script multiple times may result in duplicate data or an inconsistent state.
 * or inconsistent database state. Make sure this script
 * only run once after the initial deployment.
 */

async function main() {
  for (const country of countries) {
    await prisma.country.create({
      data: {
        name: country.name,
        shortCode: country.shortCode,
        code: country.code,
        continent: country.continent,
      },
    });
  }

  /**
   * WARNING: You must change the admin user details via API.
   * You should not use the default details because they corrupt security.
   */

  const password = 'adminpassword-123';
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      username: 'admin',
      email: 'changeme@gmail.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
