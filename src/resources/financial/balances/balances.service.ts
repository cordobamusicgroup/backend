import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { Currency, TransactionType } from '@prisma/client';
import { JwtPayloadDto } from 'src/resources/auth/dto/jwt-payload.dto';
import { UsersService } from 'src/resources/users/users.service';
import { ModifyBalanceDto } from './dto/modify-balance.dto';

@Injectable()
export class BalancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Modifies the balance for a given client and currency.
   * If the balance does not exist, it creates a new one.
   * @param modifyBalanceDto - Data transfer object containing modification details.
   * @returns The created transaction.
   */
  async modifyBalance(modifyBalanceDto: ModifyBalanceDto): Promise<any> {
    const { clientId, currency, amount, description } = modifyBalanceDto;

    let balance = await this.prisma.balance.findFirst({
      where: { clientId, currency },
    });

    if (!balance) {
      balance = await this.prisma.balance.create({
        data: { clientId, currency, amount: 0 },
      });
    }

    const newBalanceAmount = balance.amount + amount;

    const transaction = await this.prisma.transaction.create({
      data: {
        type: TransactionType.OTHER,
        description,
        amount,
        balanceAmount: newBalanceAmount,
        balanceId: balance.id,
      },
    });

    await this.prisma.balance.update({
      where: { id: balance.id },
      data: { amount: newBalanceAmount },
    });

    return transaction;
  }

  /**
   * Retrieves the balances for a given user.
   * @param user - JWT payload containing user information.
   * @returns An array of balances.
   */
  async getUserBalances(user: JwtPayloadDto) {
    const userData = await this.usersService.findByUsername(user.username);
    const clientId = userData.clientId;

    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: { balances: true },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    return client.balances.map((balance) => ({
      currency: balance.currency,
      total: balance.amount,
    }));
  }

  /**
   * Retrieves the transactions for a given user's balance and currency.
   * If the balance does not exist, it creates a new one.
   * @param user - JWT payload containing user information.
   * @param currency - The currency of the balance.
   * @returns An array of transactions.
   */
  async getBalanceTransactions(user: JwtPayloadDto, currency: Currency) {
    const userData = await this.usersService.findByUsername(user.username);
    const clientId = userData.clientId;

    let balance = await this.prisma.balance.findUnique({
      where: {
        currency_clientId: {
          currency,
          clientId,
        },
      },
      include: { transactions: true },
    });

    if (!balance) {
      balance = await this.prisma.balance.create({
        data: { clientId, currency, amount: 0 },
        include: { transactions: true },
      });
    }

    return balance.transactions;
  }
}
