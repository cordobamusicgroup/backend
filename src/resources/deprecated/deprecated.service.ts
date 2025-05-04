// Servicio que implementa la lógica de migración para clientes bloqueados.
// 1. Cambia clientStatus a BLOCKED donde isBlocked es true.
// 2. Limpia el campo isBlocked (lo pone en null) para todos los clientes.
// Devuelve un resumen de la migración realizada.

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientStatus } from 'generated/client';

@Injectable()
export class DeprecatedService {
  private readonly logger = new Logger(DeprecatedService.name);
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Migra los clientes bloqueados:
   * - Cambia clientStatus a BLOCKED donde isBlocked es true
   * - Limpia el campo isBlocked (lo pone en null) para todos los clientes
   * @returns Un objeto con el resumen de la migración
   */
  async migrateBlockedClients() {
    this.logger.log('Iniciando migración de clientes bloqueados...');
    // 1. Set clientStatus = BLOCKED where isBlocked = true
    const updateBlocked = await this.prisma.client.updateMany({
      where: { isBlocked: true },
      data: { clientStatus: ClientStatus.BLOCKED },
    });
    this.logger.log(`Clientes actualizados a BLOCKED: ${updateBlocked.count}`);
    // 2. Set isBlocked = null for all clients
    const updateAll = await this.prisma.client.updateMany({
      data: { isBlocked: null },
    });
    this.logger.log(
      `Clientes con isBlocked puesto en null: ${updateAll.count}`,
    );
    this.logger.log('Migración completada.');
    return {
      blockedUpdated: updateBlocked.count,
      isBlockedNullified: updateAll.count,
      message: 'Migración completada',
    };
  }
}
