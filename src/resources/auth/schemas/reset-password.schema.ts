import { z } from 'zod';

export const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .refine((password) => /[A-Z]/.test(password), {
      message: 'Password must contain at least one uppercase letter',
    })
    .refine((password) => /[a-z]/.test(password), {
      message: 'Password must contain at least one lowercase letter',
    })
    .refine((password) => /\d/.test(password), {
      message: 'Password must contain at least one number',
    }),
});
