import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from 'src/resources/prisma/prisma.service';
@Module({
  imports: [PrismaModule],
  providers: [PrismaService],
  controllers: [],
})
export class LabelsModule {}
