import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard to handle local authentication strategy.
 *
 * This guard uses the 'local' strategy defined in Passport to authenticate users.
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
