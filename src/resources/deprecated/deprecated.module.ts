import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { DeprecatedService } from './deprecated.service';
import { DeprecatedController } from './deprecated.controller';

@Module({
  controllers: [DeprecatedController],
  providers: [DeprecatedService, PrismaService],
})
export class DeprecatedModule {}
