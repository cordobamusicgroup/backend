import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { LabelsController } from './labels.controller';
import { LabelsService } from './labels.service';
@Module({
  imports: [PrismaModule],
  providers: [PrismaService, LabelsService],
  controllers: [LabelsController],
})
export class LabelsModule {}
