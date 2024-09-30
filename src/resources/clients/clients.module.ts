import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { ClientsController } from './clients.controller';
import { TranslationHelper } from 'src/common/helper/translation.helper';

@Module({
  imports: [PrismaModule],
  providers: [ClientsService, PrismaService, TranslationHelper],
  controllers: [ClientsController],
})
export class ClientsModule {}
