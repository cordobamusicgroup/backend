import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Crear algunos países
  const argentina = await prisma.country.create({
    data: {
      name: 'Argentina',
      code: 'ARG',
      continent: 'AMERICA',
    },
  });

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

  // Crear algunos usuarios
  await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'ADMIN',
      clientId: client1.id,
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
