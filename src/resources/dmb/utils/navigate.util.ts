// dmb/utils/navigate.util.ts
import * as puppeteer from 'puppeteer';
import { DmbAuthService } from '../dmb-auth.service';
import { Logger } from '@nestjs/common';

const logger = new Logger('NavigateUtil');

export async function navigateToPage(
  authService: DmbAuthService,
  url: string,
  iframeSelectors: { selector: string; timeout?: number }[] = [],
): Promise<puppeteer.Page> {
  try {
    logger.log('Ensuring authenticated session...');
    await authService.ensureAuthenticated();

    logger.log('Launching Puppeteer browser...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    logger.log('Setting cookies...');
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

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    );

    logger.log(`Navigating to URL: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Verificar y registrar cada etiqueta
    const selectors = [
      'dmb-root',
      'dmb-main',
      'dmb-combined-menu',
      'dmb-iframe',
      'iframe',
    ];

    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector);
        logger.log(`Selector ${selector} found.`);
      } catch (error) {
        logger.error(`Error: Selector ${selector} not found.`);
        await browser.close();
        throw error;
      }
    }

    // Obtener el iframe y verificar los selectores dentro del iframe
    const iframeElement = await page.$('iframe');
    if (iframeElement) {
      const iframe = await iframeElement.contentFrame();
      if (iframe) {
        try {
          await iframe.waitForSelector('html.dmb-smaller-size.iframe-enabled', {
            timeout: 5000,
          });
          logger.log(`Selector html.dmb-smaller-size.iframe-enabled found.`);

          for (const { selector, timeout } of iframeSelectors) {
            try {
              await iframe.waitForSelector(selector, {
                timeout: timeout || 5000,
              });
              logger.log(`Selector ${selector} found inside iframe.`);
            } catch (error) {
              logger.error(
                `Error: Selector ${selector} not found inside iframe.`,
              );
              await browser.close();
              throw error;
            }
          }
        } catch (error) {
          logger.error(
            `Error: Selector html.dmb-smaller-size.iframe-enabled not found.`,
          );
          await browser.close();
          throw error;
        }
      } else {
        logger.error(`Error: Could not get content frame.`);
        await browser.close();
        throw new Error('Could not get content frame.');
      }
    } else {
      logger.error(`Error: Selector iframe not found.`);
      await browser.close();
      throw new Error('Selector iframe not found.');
    }

    return page;
  } catch (error) {
    logger.error('Error in navigateToPage:', error.message);
    throw error;
  }
}
