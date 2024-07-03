// dmb/dmb-auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as tough from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DmbAuthService {
  private readonly logger = new Logger(DmbAuthService.name);
  private cookieJar = new tough.CookieJar();
  private xsrfToken: string;

  constructor(private configService: ConfigService) {}

  async login(user: string, pass: string): Promise<void> {
    try {
      const client = wrapper(axios.create({ jar: this.cookieJar }));

      const loginUrl =
        'https://dmb.kontornewmedia.com/api/v4/public/users/auth';
      const xsrfUrl = 'https://dmb.kontornewmedia.com/v5/dmbauth';

      // Login request
      this.logger.log('Sending login request...');
      await client.post(
        loginUrl,
        {
          payload: {
            user,
            pass,
          },
        },
        {
          withCredentials: true,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          },
        },
      );

      // Get XSRF token
      this.logger.log('Fetching XSRF token...');
      await client.get(xsrfUrl, {
        withCredentials: true,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
      });

      // Extract XSRF token from cookies
      const cookies = this.cookieJar.getCookiesSync(xsrfUrl);
      this.xsrfToken = cookies.find(
        (cookie) => cookie.key === 'XSRF-TOKEN',
      )?.value;

      if (!this.xsrfToken) {
        this.logger.error('XSRF token not found');
        throw new Error('XSRF token not found');
      }

      this.logger.log('Login successful, XSRF token:', this.xsrfToken);
    } catch (error) {
      this.logger.error('Error during login:', error.message);
      throw error;
    }
  }

  async ensureAuthenticated(): Promise<void> {
    if (!this.getXsrfToken() || !this.getDmbSid()) {
      const user = this.configService.get<string>('DMB_USER');
      const pass = this.configService.get<string>('DMB_PASS');

      if (!user || !pass) {
        this.logger.error(
          'DMB_USER or DMB_PASS not defined in environment variables',
        );
        throw new Error(
          'DMB_USER or DMB_PASS not defined in environment variables',
        );
      }

      this.logger.log('Ensuring authentication...');
      await this.login(user, pass);
    }
  }

  getCookieJar() {
    return this.cookieJar;
  }

  getXsrfToken(): string {
    const cookies = this.cookieJar.getCookiesSync(
      'https://dmb.kontornewmedia.com',
    );
    const xsrfCookie = cookies.find((cookie) => cookie.key === 'XSRF-TOKEN');
    return xsrfCookie ? xsrfCookie.value : null;
  }

  getDmbSid(): string {
    const cookies = this.cookieJar.getCookiesSync(
      'https://dmb.kontornewmedia.com',
    );
    const dmbSidCookie = cookies.find((cookie) => cookie.key === 'DMBSID');
    return dmbSidCookie ? dmbSidCookie.value : null;
  }
}
