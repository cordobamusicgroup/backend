import { Module } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { ImportsController } from './imports.controller';
import { ClientImportProcessor } from './processors/client-imports.processor';
import { RedisService } from 'src/common/services/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'client-import',
    }),
  ],
  controllers: [ImportsController],
  providers: [
    ImportsService,
    ClientImportProcessor,
    RedisService,
    PrismaService,
  ],
})
export class ImportsModule {}
