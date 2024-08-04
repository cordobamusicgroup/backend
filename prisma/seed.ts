import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function seedCountries() {
  const countriesData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'seed/countries.json'), 'utf-8'),
  );

  for (const country of countriesData) {
    const existingCountry = await prisma.country.findUnique({
      where: { shortCode: country.alpha2 },
    });

    if (!existingCountry) {
      await prisma.country.create({
        data: {
          name: country.name,
          shortCode: country.alpha2,
          code: country.alpha3,
        },
      });
      console.log(`País ${country.name} insertado.`);
    } else {
      console.log(`El país ${country.name} ya existe en la base de datos.`);
    }
  }
}

async function main() {
  try {
    // Verificar si ya está inicializado
    const status = await prisma.initializationStatus.findFirst();
    if (status?.initialized) {
      console.log('La semilla ya ha sido ejecutada previamente.');
      return;
    }

    // Insertar países
    await seedCountries();

    // Insertar usuario admin si no existe
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (!existingAdmin) {
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
      console.log('Usuario admin insertado correctamente.');
    } else {
      console.log('El usuario admin ya existe en la base de datos.');
    }

    // Actualizar el estado de inicialización
    await prisma.initializationStatus.create({
      data: { initialized: true },
    });

    console.log('Estado de inicialización actualizado correctamente.');
  } catch (error) {
    console.error('Error al ejecutar la semilla:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Error en la función main:', error);
  process.exit(1);
});
