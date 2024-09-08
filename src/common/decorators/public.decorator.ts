import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/**
 * Decorator that marks a route or handler as public.
 * Public routes do not require authentication or authorization.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
