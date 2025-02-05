import { BadRequestException, Injectable } from '@nestjs/common';
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

  // Método actualizado para revertir una transacción optimizando la actualización de transacciones posteriores
  async reverseTransaction(transactionId: number): Promise<any> {
    // Recupera la transacción a revertir
    const transactionToReverse = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!transactionToReverse) {
      throw new BadRequestException('Transaction not found'); // Considera lanzar una excepción HTTP
    }
    const balanceId = transactionToReverse.balanceId;

    // Obtén la transacción inmediatamente anterior a la transacción a revertir
    const previousTransaction = await this.prisma.transaction.findFirst({
      where: {
        balanceId,
        createdAt: { lt: transactionToReverse.createdAt },
      },
      orderBy: { createdAt: 'desc' },
    });
    let baseBalance = previousTransaction
      ? new Prisma.Decimal(previousTransaction.balanceAmount)
      : new Prisma.Decimal(0);

    // Busca solo las transacciones posteriores a la transacción a revertir, en orden ascendente
    const subsequentTransactions = await this.prisma.transaction.findMany({
      where: {
        balanceId,
        createdAt: { gt: transactionToReverse.createdAt },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Elimina la transacción a revertir primero
    await this.prisma.transaction.delete({
      where: { id: transactionId },
    });

    // Actualiza únicamente las transacciones posteriores recalculando el balance
    for (const t of subsequentTransactions) {
      baseBalance = baseBalance.plus(new Prisma.Decimal(t.amount));
      await this.prisma.transaction.update({
        where: { id: t.id },
        data: { balanceAmount: baseBalance },
      });
    }

    // Actualiza el saldo principal con el balance final
    await this.prisma.balance.update({
      where: { id: balanceId },
      data: { amount: baseBalance },
    });

    return {
      message:
        'Transaction reversed and subsequent balances updated successfully',
    };
  }
}
