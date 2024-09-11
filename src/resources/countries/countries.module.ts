import { Module } from '@nestjs/common';
import { CountriesService } from './countries.service';
import { CountriesController } from './countries.controller';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { PrismaModule } from 'src/resources/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CountriesController],
  providers: [CountriesService, PrismaService],
})
export class CountriesModule {}
