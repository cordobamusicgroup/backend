// Controlador para exponer endpoints de migración y mantenimiento de datos obsoletos.
// El endpoint 'migrate-blocked-clients' migra clientes bloqueados y limpia el campo isBlocked.
// Solo accesible por usuarios con rol ADMIN.

import { Controller, Post } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'generated/client';
import { DeprecatedService } from './deprecated.service';

@Controller('deprecated')
export class DeprecatedController {
  constructor(private readonly deprecatedService: DeprecatedService) {}

  /**
   * Endpoint para migrar clientes bloqueados:
   * - Cambia clientStatus a BLOCKED donde isBlocked es true
   * - Limpia el campo isBlocked (lo pone en null) para todos los clientes
   * Solo accesible por usuarios con rol ADMIN.
   * @returns Un resumen de la migración realizada
   */
  @Post('migrate-blocked-clients')
  @Roles(Role.ADMIN)
  async migrateBlockedClients() {
    return this.deprecatedService.migrateBlockedClients();
  }
}
