import { DmbAuthService } from '../../dmb-auth.service';
import { navigateToPage } from '../core/navigate.util';
import { Logger } from '@nestjs/common';

const logger = new Logger('ExtractProductIdUtil');

export async function extractProductId(
  authService: DmbAuthService,
  ean: string,
): Promise<string | null> {
  const url = `https://dmb.kontornewmedia.com/page/albums?ean_upc=${ean}`;
  const iframeSelector = '.dmb-actions-toolbar .vc-link[href*="page/album/"]';

  const page = await navigateToPage(authService, url, [
    { selector: iframeSelector, timeout: 5000 },
  ]);

  if (!page) {
    logger.error('Failed to navigate to the page.');
    return null;
  }

  try {
    const iframeElement = await page.$('iframe');
    if (iframeElement) {
      const iframe = await iframeElement.contentFrame();
      if (iframe) {
        await iframe.waitForSelector(iframeSelector);
        const element = await iframe.$(iframeSelector);
        if (element) {
          const href = await iframe.evaluate(
            (el) => el.getAttribute('href'),
            element,
          );
          const idMatch = href && href.match(/album\/(\d+)/);
          if (idMatch) {
            return idMatch[1];
          }
        }
      }
    }
  } catch (error) {
    logger.error('Error extracting product ID:', error.message);
  } finally {
    await page.browser().close();
  }

  return null;
}
