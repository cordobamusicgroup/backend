import { Decimal } from '@prisma/client/runtime/library';

export function mapClientBalanceCsvToTransaction(row: any) {
  // Validate and trim the CSV balance value
  const rawBalance = row['Balance'];
  const balanceStr = rawBalance ? rawBalance.toString().trim() : '';
  if (!balanceStr || isNaN(Number(balanceStr))) {
    throw new Error(`Invalid balance value: ${rawBalance}`);
  }
  return {
    wp_id: parseInt(row['ID']),
    transactionData: {
      amount: new Decimal(balanceStr),
      description: 'Transfer from Previous Platform',
      currency: 'USD',
    },
  };
}
