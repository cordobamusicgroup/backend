import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { ClientsController } from './clients.controller';

@Module({
  imports: [PrismaModule],
  providers: [ClientsService, PrismaService],
  controllers: [ClientsController],
})
export class ClientsModule {}
