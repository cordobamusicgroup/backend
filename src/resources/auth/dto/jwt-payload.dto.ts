import { Role } from '@prisma/client';

export class JwtPayloadDto {
  /**
   * The subject of the token (user ID)
   */
  sub: number;

  /**
   * The username of the authenticated user
   */
  username: string;

  /**
   * The role of the authenticated user
   */
  role: Role;

  /**
   * The client ID the user belongs to (if any)
   */
  clientId?: number;

  /**
   * The client name
   */
  clientName?: string;

  /**
   * Issued At timestamp (automatically added by JWT)
   */
  iat?: number;

  /**
   * Expiration timestamp (automatically added by JWT)
   */
  exp?: number;

  /**
   * JWT ID - unique identifier for the token
   */
  jti?: string;
}
