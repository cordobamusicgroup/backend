import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { BalanceDto } from './dto/balance.dto';
import { Currency, TransactionType } from '@prisma/client'; // Suponiendo que el enum viene del modelo Prisma

@Injectable()
export class BalancesService {
  constructor(private readonly prisma: PrismaService) {}

  async modifyBalance(
    clientId: number,
    currency: Currency,
    amount: number,
    description: string,
    operationType: 'CREDIT' | 'DEBIT',
  ): Promise<BalanceDto> {
    const balance = await this.prisma.balance.findFirst({
      where: {
        clientId,
        currency,
      },
    });

    if (!balance) {
      throw new NotFoundException(
        `Balance for client ID ${clientId} and currency ${currency} not found`,
      );
    }

    // Calculating new balance amount based on operation type
    let newBalanceAmount = balance.amount;
    if (operationType === 'CREDIT') {
      newBalanceAmount += amount;
    } else if (operationType === 'DEBIT') {
      newBalanceAmount -= amount;
    } else {
      throw new BadRequestException(
        'Invalid operation type. Must be CREDIT or DEBIT.',
      );
    }

    // Create transaction
    await this.prisma.transaction.create({
      data: {
        type: TransactionType.OTHER, // Since it's a manual transaction
        description,
        amount,
        balanceAmount: newBalanceAmount,
        balanceId: balance.id,
      },
    });

    // Update balance with the new amount
    await this.prisma.balance.update({
      where: { id: balance.id },
      data: { amount: newBalanceAmount },
    });

    return this.getBalanceWithTransactions(balance.id);
  }

  private async getBalanceWithTransactions(
    balanceId: number,
  ): Promise<BalanceDto> {
    const balance = await this.prisma.balance.findUnique({
      where: { id: balanceId },
      include: { transactions: true },
    });

    if (!balance) {
      throw new NotFoundException(`Balance with ID ${balanceId} not found`);
    }

    return balance;
  }
}
