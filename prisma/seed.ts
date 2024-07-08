// Importar PrismaClient y dependencias necesarias
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { countries } from './countries-seed';

// Inicializar PrismaClient
const prisma = new PrismaClient();

// Función principal asincrónica
async function main() {
  try {
    // Verificar si ya está inicializado
    const status = await prisma.initializationStatus.findFirst();
    if (status?.initialized) {
      console.log('La semilla ya ha sido ejecutada previamente.');
      return;
    }

    // Insertar países si no existen
    for (const country of countries) {
      const existingCountry = await prisma.country.findUnique({
        where: {
          shortCode: country.alpha2,
          code: country.alpha3,
        },
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

    // Insertar usuario admin si no existe
    const existingAdmin = await prisma.user.findUnique({
      where: {
        username: 'admin',
      },
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
      data: {
        initialized: true,
      },
    });

    console.log('Estado de inicialización actualizado correctamente.');
  } catch (error) {
    console.error('Error al ejecutar la semilla:', error);
    process.exit(1); // Terminar con código de error
  } finally {
    await prisma.$disconnect(); // Desconectar Prisma al finalizar
  }
}

// Ejecutar la función principal
main().catch((error) => {
  console.error('Error en la función main:', error);
  process.exit(1); // Terminar con código de error si hay un problema
});
