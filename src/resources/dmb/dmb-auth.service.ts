// dmb/dmb-auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as tough from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import { ConfigService } from '@nestjs/config';

const logger = new Logger('DmbAuthService');

@Injectable()
export class DmbAuthService {
  private cookieJar = new tough.CookieJar();
  private xsrfToken: string;

  constructor(private configService: ConfigService) {}

  async login(user: string, pass: string): Promise<void> {
    const client = wrapper(axios.create({ jar: this.cookieJar }));

    const loginUrl = 'https://dmb.kontornewmedia.com/api/v4/public/users/auth';
    const xsrfUrl = 'https://dmb.kontornewmedia.com/v5/dmbauth';

    // Login request
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
      throw new Error('XSRF token not found');
    }

    console.log('Login successful, XSRF token:', this.xsrfToken);
  }

  async ensureAuthenticated(): Promise<void> {
    if (!this.getXsrfToken() || !this.getDmbSid()) {
      const user = this.configService.get<string>('DMB_USER');
      const pass = this.configService.get<string>('DMB_PASS');

      if (!user || !pass) {
        logger.error(
          'DMB_USER or DMB_PASS not defined in environment variables',
        );
      }

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