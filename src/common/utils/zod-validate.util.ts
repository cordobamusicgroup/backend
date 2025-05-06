import { ZodSchema } from 'zod';
import { BadRequestException } from '@nestjs/common';

export function validateWithZod<T>(schema: ZodSchema<T>, dto: unknown) {
  const result = schema.safeParse(dto);
  if (!result.success) {
    const errors: string[] = result.error.issues.map((issue) => issue.message);
    throw new BadRequestException(errors);
  }
}
