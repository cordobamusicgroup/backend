import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from 'src/resources/prisma/prisma.service';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name); // Logger de NestJS

  constructor(private readonly prisma: PrismaService) {}

  async seedCountries() {
    const countriesData = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '..', '..', 'seed', 'countries.json'),
        'utf-8',
      ),
    );

    for (const country of countriesData) {
      const existingCountry = await this.prisma.country.findUnique({
        where: { shortCode: country.alpha2 },
      });

      if (!existingCountry) {
        await this.prisma.country.create({
          data: {
            name: country.name,
            shortCode: country.alpha2,
            code: country.alpha3,
          },
        });
        this.logger.debug(`Country ${country.name} inserted.`);
      } else {
        this.logger.debug(`Country ${country.name} already exists.`);
      }
    }
  }

  async runSeed() {
    try {
      // Check if the seed has already been initialized
      let status = await this.prisma.initializationStatus.findFirst();

      // Si no existe un registro, crearlo
      if (!status) {
        status = await this.prisma.initializationStatus.create({
          data: {
            initialized: false,
            adminInit: false,
          },
        });
        this.logger.debug('Initialization status created.');
      }

      // Si ya se ejecutó el seed, finalizar
      if (status.initialized) {
        this.logger.debug('The seed has already been executed.');
        return;
      }

      // Seed countries
      await this.seedCountries();

      // Si no se ha inicializado el admin user, crearlo
      if (!status.adminInit) {
        const password = 'adminpassword-123';
        const hashedPassword = await bcrypt.hash(password, 10);

        await this.prisma.user.create({
          data: {
            username: 'admin',
            email: 'changeme@gmail.com',
            password: hashedPassword,
            role: 'ADMIN',
          },
        });
        this.logger.debug('Admin user created successfully.');

        // Actualizar el campo adminInit a true
        await this.prisma.initializationStatus.update({
          where: { id: status.id },
          data: { adminInit: true },
        });
        this.logger.debug('AdminInit status updated to true.');
      } else {
        this.logger.debug('Admin user has already been initialized.');
      }

      // Actualizar el estado general de la inicialización
      await this.prisma.initializationStatus.update({
        where: { id: status.id },
        data: { initialized: true },
      });

      this.logger.debug('Initialization status updated successfully.');
    } catch (error) {
      this.logger.error('Error during seed execution:', error);
    }
  }
}
