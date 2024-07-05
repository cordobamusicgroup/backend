// src/freeagent/freeagent.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FreeAgentService {
  private readonly apiUrl = 'https://api.freeagent.com/v2';
  private readonly logger = new Logger(FreeAgentService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async getStoredTokens() {
    return await this.prisma.freeAgentToken.findFirst({
      orderBy: { createdAt: 'desc' },
    });
  }

  async setTokens(accessToken: string, refreshToken: string) {
    await this.prisma.freeAgentToken.create({
      data: {
        accessToken,
        refreshToken,
      },
    });
    this.logger.log('Tokens updated in database');
  }

  async refreshAccessToken() {
    const tokens = await this.getStoredTokens();
    if (!tokens) {
      throw new Error('No tokens found in the database');
    }

    const clientId = this.configService.get<string>('FREEAGENT_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'FREEAGENT_CLIENT_SECRET',
    );
    const tokenEndpoint = 'https://api.freeagent.com/v2/token_endpoint';

    try {
      const response = await axios.post(tokenEndpoint, null, {
        params: {
          grant_type: 'refresh_token',
          refresh_token: tokens.refreshToken,
        },
        auth: {
          username: clientId,
          password: clientSecret,
        },
      });

      const { access_token, refresh_token } = response.data;
      await this.setTokens(access_token, refresh_token);
      this.logger.log(`Token response: ${JSON.stringify(response.data)}`);
    } catch (error) {
      this.logger.error(`Error refreshing access token: ${error.message}`);
      throw error;
    }
  }

  async ensureAccessTokenValid() {
    const tokens = await this.getStoredTokens();
    if (!tokens) {
      throw new Error('No tokens found in the database');
    }
    // Refresh the token if it's expired or close to expiring
    const tokenExpirationTime = 15 * 60 * 1000; // 15 minutes
    const now = new Date().getTime();
    const tokenAge = now - new Date(tokens.createdAt).getTime();
    if (tokenAge > tokenExpirationTime - 60 * 1000) {
      await this.refreshAccessToken();
    } else return this.logger.log('Access token is valid');
  }

  async getInvoices() {
    await this.ensureAccessTokenValid();
    const tokens = await this.getStoredTokens();

    const response = await axios.get(`${this.apiUrl}/invoices`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });
    return response.data;
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron() {
    this.logger.log('Checking if token refresh is needed');
    await this.ensureAccessTokenValid();
  }
}
