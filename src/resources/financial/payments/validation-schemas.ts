import { z } from 'zod';

export const paypalSchema = z.object({
  paypalEmail: z.string().email(),
});

// Actualización del esquema crypto para permitir solo USDT y la red TRC20.
// Se añade validación de walletAddress con regex: debe iniciar con "T" y tener 34 caracteres.
export const cryptoSchema = z.object({
  cryptoCurrency: z.literal('USDT'),
  cryptoNetwork: z.literal('TRC20'),
  walletAddress: z
    .string()
    .regex(
      /^T[0-9A-Za-z]{33}$/,
      'Please enter a valid USDT wallet address on the TRC20 network.',
    ),
});

export const bankTransferEURSchema = z
  .object({
    whereIsBankAccount: z.enum(['Inside Europe', 'Outside Europe']),
    iban: z.string().optional(),
    accountNumberForSwift: z.string().optional(),
    swiftBicCode: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.whereIsBankAccount === 'Inside Europe' && !data.iban) {
        return false;
      }
      if (
        data.whereIsBankAccount === 'Outside Europe' &&
        (!data.accountNumberForSwift || !data.swiftBicCode)
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Invalid bank transfer data for EUR',
      path: ['iban', 'accountNumberForSwift', 'swiftBicCode'],
    },
  );

export const bankTransferUSDSchema = z.object({
  bankAccountOwnerAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
  }),
  ach: z
    .object({
      achRoutingNumber: z.string(),
      accountNumber: z.string(),
      accountType: z.enum(['Checking', 'Savings']),
    })
    .optional(),
  wire: z
    .object({
      fedwireRoutingNumber: z.string(),
      accountNumber: z.string(),
      accountType: z.enum(['Checking', 'Savings']),
    })
    .optional(),
  swift: z
    .object({
      swiftBicCode: z.string(),
      ibanOrAccountNumber: z.string(),
    })
    .optional(),
});

export const bankTransferSchema = z.object({
  currency: z.enum(['EUR', 'USD']),
  eur: bankTransferEURSchema.optional(),
  usd: bankTransferUSDSchema.optional(),
});

export const updatePaymentInfoSchema = z
  .object({
    method: z.enum(['PAYPAL', 'CRYPTO', 'BANK_TRANSFER']),
    paypal: paypalSchema.optional(),
    crypto: cryptoSchema.optional(),
    bankTransfer: bankTransferSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.method === 'PAYPAL' && !data.paypal) {
        return false;
      }
      if (data.method === 'CRYPTO' && !data.crypto) {
        return false;
      }
      if (data.method === 'BANK_TRANSFER' && !data.bankTransfer) {
        return false;
      }
      return true;
    },
    {
      message: 'Invalid payment data',
      path: ['paypal', 'crypto', 'bankTransfer'],
    },
  );
