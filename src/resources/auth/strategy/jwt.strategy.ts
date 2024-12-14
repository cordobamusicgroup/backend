import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayloadDto } from '../dto/jwt-payload.dto';

/**
 * JwtStrategy class that extends PassportStrategy.
 * This strategy is used for authenticating requests using JSON Web Tokens (JWT).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * Constructor for JwtStrategy class.
   * @param configService - The ConfigService instance.
   */
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('APP_JWT_SECRET'),
    });
  }

  /**
   * Method to validate the JWT payload.
   * @param payload - The JWT payload.
   * @returns An object containing the validated payload data.
   */
  async validate(payload: JwtPayloadDto) {
    return { id: payload.sub, username: payload.username, role: payload.role };
  }
}
