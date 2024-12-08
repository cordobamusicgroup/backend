import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { JwtPayloadDto } from 'src/resources/auth/dto/jwt-payload.dto';
import { UsersService } from 'src/resources/users/users.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async getClientPaymentStatus(user: JwtPayloadDto) {
    const userData = await this.usersService.findByUsername(user.username);
    const clientId = userData.clientId;

    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: {
        isBlocked: true,
        isPaymentInProgress: true,
        isPaymentDataInValidation: true,
      },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    return client;
  }
}
