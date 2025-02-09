import { Decimal } from '@prisma/client/runtime/library';

export function mapClientBalanceCsvToTransaction(row: any) {
  return {
    wp_id: parseInt(row['ID']),
    transactionData: {
      amount: new Decimal(row['Balance']),
      description: 'Transfer from Previous Platform',
      currency: 'USD',
    },
  };
}
