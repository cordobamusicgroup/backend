import * as puppeteer from 'puppeteer';
import { DmbAuthService } from '../../dmb-auth.service';
import { Logger, HttpException, HttpStatus } from '@nestjs/common';
import { waitForSelectorSafe } from './waitForSelectorSafe'; // Importamos la función personalizada

const logger = new Logger('NavigateUtil');

export async function navigateToPage(
  authService: DmbAuthService,
  url: string,
  iframeSelectors: { selector: string; timeout?: number }[] = [],
): Promise<puppeteer.Page> {
  let browser: puppeteer.Browser;

  try {
    logger.log('[DMB - Kontor] Starting navigation to page...');
    await authService.ensureAuthenticated();

    logger.log('[DMB - Kontor] Launching Puppeteer browser...');
    browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set authentication cookies
    const xsrfToken = authService.getXsrfToken();
    const dmbSid = authService.getDmbSid();

    await page.setCookie(
      {
        name: 'XSRF-TOKEN',
        value: xsrfToken,
        domain: 'dmb.kontornewmedia.com',
        path: '/',
        httpOnly: true,
        secure: true,
      },
      {
        name: 'DMBSID',
        value: dmbSid,
        domain: 'dmb.kontornewmedia.com',
        path: '/',
        httpOnly: true,
        secure: true,
      },
    );

    // Set the user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    );

    // Navigate to the URL
    logger.log(`[DMB - Kontor] Navigating to URL: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for essential selectors using `waitForSelectorSafe`
    const essentialSelectors = ['dmb-root', 'iframe'];
    for (const selector of essentialSelectors) {
      await waitForSelectorSafe(page, selector, 5000); // Delega la excepción a waitForSelectorSafe
    }

    // Handle iframe and check selectors within it
    const iframeElement = await page.$('iframe');
    if (!iframeElement) {
      throw new HttpException(
        `[DMB - Kontor] Iframe element not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const iframe = await iframeElement.contentFrame();
    if (!iframe) {
      throw new HttpException(
        `[DMB - Kontor] Unable to access iframe content.`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Check selectors inside the iframe
    for (const { selector, timeout } of iframeSelectors) {
      await waitForSelectorSafe(iframe, selector, timeout || 5000); // Delega la excepción a waitForSelectorSafe
    }

    return page;
  } finally {
    if (browser) {
      await browser.close(); // Ensure browser is closed in case of an error
    }
  }
}
