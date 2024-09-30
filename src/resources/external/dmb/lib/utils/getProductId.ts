import { DmbAuthService } from '../../dmb-auth.service';
import { navigateToPage } from '../core/navigate.util';
import { Logger, HttpException, HttpStatus } from '@nestjs/common';

const logger = new Logger('ExtractProductIdUtil');

export async function extractProductId(
  authService: DmbAuthService,
  ean: string,
): Promise<string | null> {
  const url = `https://dmb.kontornewmedia.com/page/albums?ean_upc=${ean}`;
  const iframeSelector = '.dmb-actions-toolbar .vc-link[href*="page/album/"]';
  const warningSelector =
    '.dmb-message.dmb-message--warning .dmb-message__text';

  logger.log(`[DMB - Kontor] Starting extraction for EAN: ${ean}`);
  logger.log(`[DMB - Kontor] Navigating to URL: ${url}`);

  const page = await navigateToPage(authService, url, [
    { selector: iframeSelector, timeout: 5000 },
  ]);

  if (!page) {
    logger.error(
      `[DMB - Kontor] Failed to navigate to the page for EAN: ${ean}`,
    );
    throw new HttpException(
      `[DMB - Kontor] Failed to navigate to the page.`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  try {
    logger.log(
      `[DMB - Kontor] Page loaded successfully, checking for warnings...`,
    );

    // Check if the warning message appears on the page
    const warningElement = await page.$(warningSelector);
    if (warningElement) {
      const warningText = await page.evaluate(
        (el) => el.textContent,
        warningElement,
      );

      if (warningText?.includes(ean)) {
        logger.warn(`[DMB - Kontor] EAN not found: ${ean}`);
        throw new HttpException(
          `[DMB - Kontor] EAN ${ean} not found in the search results.`,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    logger.log(`[DMB - Kontor] No warnings found, searching for iframe...`);

    const iframeElement = await page.$('iframe');
    if (iframeElement) {
      logger.log(`[DMB - Kontor] Iframe found, accessing content...`);

      const iframe = await iframeElement.contentFrame();
      if (iframe) {
        logger.log(
          `[DMB - Kontor] Iframe content accessed, waiting for selector: ${iframeSelector}`,
        );

        await iframe.waitForSelector(iframeSelector, { timeout: 5000 });
        const element = await iframe.$(iframeSelector);

        if (element) {
          logger.log(
            `[DMB - Kontor] Selector found, extracting href attribute...`,
          );
          const href = await iframe.evaluate(
            (el) => el.getAttribute('href'),
            element,
          );

          const idMatch = href && href.match(/album\/(\d+)/);
          if (idMatch) {
            const productId = idMatch[1];
            logger.log(
              `[DMB - Kontor] Product ID extracted successfully: ${productId}`,
            );
            return productId;
          } else {
            logger.warn(
              `[DMB - Kontor] No matching product ID found in href: ${href}`,
            );
            throw new HttpException(
              `[DMB - Kontor] Product ID not found in href.`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
        } else {
          logger.warn(`[DMB - Kontor] Selector not found: ${iframeSelector}`);
          throw new HttpException(
            `[DMB - Kontor] Product ID selector not found.`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      } else {
        logger.error(`[DMB - Kontor] Failed to access iframe content.`);
        throw new HttpException(
          `[DMB - Kontor] Failed to access iframe content.`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } else {
      logger.warn(`[DMB - Kontor] Iframe not found on the page.`);
      throw new HttpException(
        `[DMB - Kontor] Iframe not found on the page.`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  } catch (error) {
    logger.error(
      `[DMB - Kontor] Error extracting product ID for EAN: ${ean}: ${error.message}`,
    );
    if (error instanceof HttpException) {
      throw error; // Rethrow known exceptions (404 or internal server error)
    }
    throw new HttpException(
      `[DMB - Kontor] Unknown error extracting product ID.`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  } finally {
    logger.log(`[DMB - Kontor] Closing the browser session.`);
    await page.browser().close();
  }
}
