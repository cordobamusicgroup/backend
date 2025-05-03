import { Controller, Post } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'generated/client';
import { DeprecatedService } from './deprecated.service';

@Controller('deprecated')
export class DeprecatedController {
  constructor(private readonly deprecatedService: DeprecatedService) {}

  @Post('migrate-blocked-clients')
  @Roles(Role.ADMIN)
  async migrateBlockedClients() {
    return this.deprecatedService.migrateBlockedClients();
  }
}
