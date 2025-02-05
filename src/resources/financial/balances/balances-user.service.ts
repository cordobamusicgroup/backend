import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { Currency } from '@prisma/client';
import { JwtPayloadDto } from 'src/resources/auth/dto/jwt-payload.dto';
import { UsersService } from 'src/resources/users/users.service';
import { BalanceTransactionDto } from './dto/balance-transaction.dto';
import { convertToDto } from 'src/common/utils/convert-dto.util';

@Injectable()
export class BalancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

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
  async getBalanceTransactions(
    user: JwtPayloadDto,
    currency: Currency,
  ): Promise<BalanceTransactionDto[]> {
    const userData = await this.usersService.findByUsername(user.username);
    const clientId = userData.clientId;

    let balance = await this.prisma.balance.findUnique({
      where: {
        currency_clientId: {
          currency,
          clientId,
        },
      },
      include: { transactions: { orderBy: { createdAt: 'desc' } } },
    });

    if (!balance) {
      balance = await this.prisma.balance.create({
        data: { clientId, currency, amount: 0 },
        include: { transactions: { orderBy: { createdAt: 'desc' } } },
      });
    }

    return await Promise.all(
      balance.transactions.map(
        async (transaction) =>
          await convertToDto(
            {
              ...transaction,
              amount: transaction.amount.toNumber(),
              balanceAmount: transaction.balanceAmount.toNumber(),
              currency,
            },
            BalanceTransactionDto,
          ),
      ),
    );
  }
}
