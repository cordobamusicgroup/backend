import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientStatus } from 'generated/client';

@Injectable()
export class DeprecatedService {
  constructor(private readonly prisma: PrismaService) {}

  async migrateBlockedClients() {
    // 1. Set clientStatus = BLOCKED where isBlocked = true
    const updateBlocked = await this.prisma.client.updateMany({
      where: { isBlocked: true },
      data: { clientStatus: ClientStatus.BLOCKED },
    });
    // 2. Set isBlocked = null for all clients
    const updateAll = await this.prisma.client.updateMany({
      data: { isBlocked: null },
    });
    return {
      blockedUpdated: updateBlocked.count,
      isBlockedNullified: updateAll.count,
      message: 'Migración completada',
    };
  }
}
