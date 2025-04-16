import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { Currency, Prisma, TransactionType } from 'generated/client';
import { UsersAdminService } from 'src/resources/users/admin/users-admin.service';
import { ModifyBalanceDto } from './dto/modify-balance.dto';

@Injectable()
export class BalancesAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersAdminService,
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

  // Función auxiliar para recalcular la cadena de transacciones en un balance
  private async recalcBalance(
    prisma: any,
    balanceId: number,
  ): Promise<Prisma.Decimal> {
    const allTransactions = await prisma.transaction.findMany({
      where: { balanceId },
      orderBy: { createdAt: 'asc' },
    });
    let cumulative = new Prisma.Decimal(0);
    for (const tx of allTransactions) {
      if (!tx.reversed) {
        cumulative = cumulative.plus(new Prisma.Decimal(tx.amount));
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { balanceAmount: cumulative },
        });
      } else {
        // Opcional: podemos dejar el balanceAmount de transacciones revertidas inalterado
      }
    }
    return cumulative;
  }

  async reverseTransaction(transactionId: number): Promise<any> {
    return this.prisma.$transaction(async (prisma) => {
      // 1️⃣ Buscar la transacción a revertir
      const transactionToReverse = await prisma.transaction.findUnique({
        where: { id: transactionId },
      });
      if (!transactionToReverse) {
        throw new BadRequestException('Transaction not found');
      }
      const { balanceId } = transactionToReverse;

      // 2️⃣ Marcar la transacción como revertida
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { reversed: true },
      });

      // 3️⃣ Recalcular el balance acumulado para todas las transacciones del balance
      const newBalance = await this.recalcBalance(prisma, balanceId);

      // 4️⃣ Actualizar el balance final
      await prisma.balance.update({
        where: { id: balanceId },
        data: { amount: newBalance },
      });

      return {
        message: 'Transaction reversed and balances updated successfully',
      };
    });
  }

  async restoreTransaction(transactionId: number): Promise<any> {
    return this.prisma.$transaction(async (prisma) => {
      // 1️⃣ Buscar la transacción a restaurar
      const transactionToRestore = await prisma.transaction.findUnique({
        where: { id: transactionId },
      });
      if (!transactionToRestore) {
        throw new BadRequestException('Transaction not found');
      }
      if (!transactionToRestore.reversed) {
        throw new BadRequestException('Transaction is not reversed');
      }
      const { balanceId } = transactionToRestore;

      // 2️⃣ Restaurar la transacción
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { reversed: false },
      });

      // 3️⃣ Recalcular el balance acumulado para todas las transacciones del balance
      const newBalance = await this.recalcBalance(prisma, balanceId);

      // 4️⃣ Actualizar el balance final
      await prisma.balance.update({
        where: { id: balanceId },
        data: { amount: newBalance },
      });

      return {
        message: 'Transaction restored and balances updated successfully',
      };
    });
  }
}
