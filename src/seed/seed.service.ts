import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

/**
 * Service responsible for seeding the database with initial data.
 * This includes countries and an admin user for application initialization.
 */
@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Seeds the database with country data from a JSON file.
   * Checks for existing countries to avoid duplicates.
   *
   * @returns {Promise<void>}
   */
  async seedCountries(): Promise<void> {
    this.logger.log('Starting country seeding process...');

    try {
      const countriesFilePath = path.join(
        __dirname,
        '..',
        'seed',
        'countries.json',
      );
      this.logger.debug(`Reading countries from file: ${countriesFilePath}`);

      const countriesData = JSON.parse(
        fs.readFileSync(countriesFilePath, 'utf-8'),
      );

      this.logger.log(
        `Processing ${countriesData.length} countries from data file`,
      );
      let insertedCount = 0;
      let existingCount = 0;

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
          insertedCount++;
          this.logger.verbose(
            `Country inserted: ${country.name} (${country.alpha2})`,
          );
        } else {
          existingCount++;
          this.logger.verbose(
            `Country already exists: ${country.name} (${country.alpha2})`,
          );
        }
      }

      this.logger.log(
        `Country seeding completed: ${insertedCount} inserted, ${existingCount} already existed`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to seed countries: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Main seed execution function that initializes the database with required data.
   * Creates an admin user and seeds countries if they don't already exist.
   * Tracks initialization status to prevent duplicate seeding.
   *
   * @returns {Promise<void>}
   */
  async runSeed(): Promise<void> {
    this.logger.log('Starting database seed process...');

    try {
      const databaseUrl = this.configService.get<string>('APP_DATABASE_URL');
      if (!databaseUrl) {
        this.logger.error(
          'Database initialization failed: Database URL is not properly configured',
        );
        return;
      }

      // Check if the seed has already been initialized
      this.logger.debug('Checking initialization status');
      let status = await this.prisma.initializationStatus.findFirst();

      // Create initialization status if it doesn't exist
      if (!status) {
        this.logger.debug(
          'No initialization status found, creating new record',
        );
        status = await this.prisma.initializationStatus.create({
          data: {
            initialized: false,
            adminInit: false,
          },
        });
        this.logger.log('Initialization status record created');
      }

      // If seed has already been executed, exit
      if (status.initialized) {
        this.logger.log(
          'Seed process has already been completed. Skipping initialization.',
        );
        return;
      }

      // Seed countries
      this.logger.log('Proceeding with country data seeding');
      await this.seedCountries();

      // Create admin user if not already initialized
      if (!status.adminInit) {
        this.logger.log('Creating admin user account');
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
        this.logger.log('Admin user created successfully');

        // Update adminInit status
        await this.prisma.initializationStatus.update({
          where: { id: status.id },
          data: { adminInit: true },
        });
        this.logger.debug('AdminInit status updated to true');
      } else {
        this.logger.log('Admin user already initialized, skipping creation');
      }

      // Update general initialization status
      await this.prisma.initializationStatus.update({
        where: { id: status.id },
        data: { initialized: true },
      });

      this.logger.log('Database seed process completed successfully');
    } catch (error) {
      this.logger.error(`Seed process failed: ${error.message}`, error.stack);
      throw error; // Re-throw to allow handling at higher level if needed
    }
  }
}
