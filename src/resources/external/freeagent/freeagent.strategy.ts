// src/freeagent/freeagent.strategy.ts
import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import { FreeAgentService } from './freeagent.service';

@Injectable()
export class FreeAgentStrategy extends PassportStrategy(Strategy, 'freeagent') {
  private readonly logger = new Logger(FreeAgentStrategy.name);

  constructor(
    private configService: ConfigService,
    private freeAgentService: FreeAgentService,
  ) {
    super({
      authorizationURL: 'https://api.freeagent.com/v2/approve_app',
      tokenURL: 'https://api.freeagent.com/v2/token_endpoint',
      clientID: configService.get<string>('FREEAGENT_CLIENT_ID'),
      clientSecret: configService.get<string>('FREEAGENT_CLIENT_SECRET'),
      callbackURL: configService.get<string>('FREEAGENT_REDIRECT_URI'),
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    this.logger.log(`Access token: ${accessToken}`);
    this.logger.log(`Refresh token: ${refreshToken}`);
    await this.freeAgentService.setTokens(accessToken, refreshToken);
    return { accessToken, refreshToken, profile };
  }
}
