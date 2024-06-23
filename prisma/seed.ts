import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { countries } from './countries-seed';

const prisma = new PrismaClient();

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

  const argentina = await prisma.country.findUnique({
    where: { code: 'ARG' },
  });

  if (argentina) {
    const address1 = await prisma.address.create({
      data: {
        street: 'Sargento Cabral 241',
        city: 'Cruz del Eje',
        state: 'Cordoba',
        zip: '5280',
        countryId: argentina.id,
      },
    });

    const client1 = await prisma.client.create({
      data: {
        name: 'Santiago Joaquin Diaz',
        type: 'INDIVIDUAL',
        addressId: address1.id,
        vatId: '123456789',
        taxId: '987654321',
      },
    });

    const label = await prisma.label.create({
      data: {
        client: { connect: { id: 1 } },
        name: 'Legion Records',
      },
    });

    const password = 'admin';
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'ADMIN',
        clientId: client1.id,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
