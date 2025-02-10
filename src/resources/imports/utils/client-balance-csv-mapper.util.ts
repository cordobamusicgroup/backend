import Decimal from 'decimal.js';

function validateDecimal(value: string | number, fieldName: string): Decimal {
  if (value === undefined || value === null || value === '') {
    return new Decimal(0);
  }
  let numericValue: number;
  if (typeof value === 'string') {
    numericValue = parseFloat(value);
  } else if (typeof value === 'number') {
    numericValue = value;
  } else {
    throw new Error(`Invalid value for ${fieldName}: "${value}"`);
  }
  if (isNaN(numericValue)) {
    throw new Error(`Invalid value for ${fieldName}: "${value}"`);
  }
  return new Decimal(numericValue).toDP(10);
}

export function mapClientBalanceCsvToTransaction(row: any) {
  const rawBalance = row['Balance'];
  const balance = validateDecimal(rawBalance, 'Balance');
  const isDisabled = row['Disabled'] === 'Disabled';
  return {
    wp_id: parseInt(row['ID']),
    transactionData: {
      amount: balance,
      description: 'Transfer from Previous Platform',
      currency: 'USD',
    },
    isDisabled,
  };
}
