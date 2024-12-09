import { Module } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { ImportsController } from './imports.controller';
import { RedisService } from 'src/common/services/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { BullModule } from '@nestjs/bullmq';
import { ClientImportProcessor } from './utils/processors/clients-imports.processor';
import { LabelImportProcessor } from './utils/processors/labels-imports.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: 'client-import',
      },
      { name: 'label-import' },
    ),
  ],
  controllers: [ImportsController],
  providers: [
    ImportsService,
    ClientImportProcessor,
    LabelImportProcessor,
    RedisService,
    PrismaService,
  ],
})
export class ImportsModule {}
