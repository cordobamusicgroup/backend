import { Module } from '@nestjs/common';
import { DmbAuthService } from './dmb-auth.service';
import { DmbController } from './dmb.controller';
import { DmbService } from './dmb.service';
import { BullModule } from '@nestjs/bull';
import { DmbProcessor } from './dmb.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'dmb',
    }),
  ],
  controllers: [DmbController],
  providers: [DmbAuthService, DmbService, DmbProcessor],
})
export class DmbModule {}
