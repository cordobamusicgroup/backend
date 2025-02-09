import { Module } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { ImportsController } from './imports.controller';
import { RedisService } from 'src/common/services/redis.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    // ...existing modules, sin BullModule...
  ],
  controllers: [ImportsController],
  providers: [
    ImportsService,
    PrismaService,
    RedisService,
    // Se removieron ClientImportProcessor y LabelImportProcessor
  ],
})
export class ImportsModule {}
