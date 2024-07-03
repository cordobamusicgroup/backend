import { Module } from '@nestjs/common';
import { DmbAuthService } from './dmb-auth.service';
import { DmbController } from './dmb.controller';
import { DmbService } from './dmb.service';

@Module({
  imports: [],
  controllers: [DmbController],
  providers: [DmbAuthService, DmbService],
})
export class DmbModule {}
