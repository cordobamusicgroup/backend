import { DmbAuthService } from '../dmb-auth.service';
import { Logger } from '@nestjs/common';
import { navigateToPage } from './navigate.util';

const logger = new Logger('NavigateToAlbum');

export async function navigateToAlbum(
  authService: DmbAuthService,
  albumId: string,
): Promise<void> {
  const url = `https://dmb.kontornewmedia.com/page/album/${albumId}`;

  const page = await navigateToPage(authService, url, []);

  if (!page) {
    logger.error('Failed to navigate to the album page.');
    return;
  }

  try {
    logger.verbose('Successfully navigated to the album page.');
    // Aquí puedes agregar más lógica si necesitas interactuar con la página del álbum.
  } catch (error) {
    logger.error('Error navigating to album page:', error.message);
  } finally {
    await page.browser().close();
  }
}
