import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { Currency, Prisma, TransactionType } from '@prisma/client';
import { UsersService } from 'src/resources/users/users.service';
import { ModifyBalanceDto } from './dto/modify-balance.dto';

@Injectable()
export class BalancesAdminService {
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
    const { clientId, currency, amount, description, transactionType } =
      modifyBalanceDto;

    let balance = await this.prisma.balance.findFirst({
      where: { clientId, currency },
    });

    if (!balance) {
      balance = await this.prisma.balance.create({
        data: { clientId, currency, amount: 0 },
      });
    }

    const newBalanceAmount = balance.amount.plus(new Prisma.Decimal(amount));

    const transaction = await this.prisma.transaction.create({
      data: {
        type: transactionType ?? TransactionType.OTHER,
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
   * Sums the balances of all users and returns the total in USD and EUR.
   * @returns An object containing the total balances in USD and EUR.
   */
  async getTotalBalances(): Promise<{ usd: number; eur: number }> {
    const balances = await this.prisma.balance.groupBy({
      by: ['currency'],
      _sum: { amount: true },
      where: { currency: { in: [Currency.USD, Currency.EUR] } },
    });

    return balances.reduce(
      (acc, balance) => {
        if (balance.currency === Currency.USD) {
          acc.usd = balance._sum.amount.toNumber();
        } else if (balance.currency === Currency.EUR) {
          acc.eur = balance._sum.amount.toNumber();
        }
        return acc;
      },
      { usd: 0, eur: 0 },
    );
  }
}
