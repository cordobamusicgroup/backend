// src/freeagent/freeagent.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { FreeAgentController } from './freeagent.controller';
import { FreeAgentService } from './freeagent.service';
import { FreeAgentStrategy } from './freeagent.strategy';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'freeagent' }),
    ConfigModule,
    PrismaModule,
  ],
  providers: [FreeAgentService, FreeAgentStrategy],
  controllers: [FreeAgentController],
})
export class FreeAgentModule {}
