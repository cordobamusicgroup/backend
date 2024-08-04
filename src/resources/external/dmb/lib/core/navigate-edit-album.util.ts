import { DmbAuthService } from '../../dmb-auth.service';
import { Logger } from '@nestjs/common';
import { navigateToPage } from './navigate.util';
import {
  removePrimaryAttachment,
  removeSubCoverAttachments,
} from '../utils/removeCovers';
import { saveAlbum } from '../utils/saveAlbum';
import { setEditMode } from '../utils/setEditMode';
import { uploadImageToDmb } from '../utils/uploadImageToDmb';

const logger = new Logger('NavigateAndEditAlbum');

export async function navigateAndEditAlbum(
  authService: DmbAuthService,
  albumId: string,
  removeAttachments: boolean = false,
  coverFilePath?: string,
): Promise<void> {
  const url = `https://dmb.kontornewmedia.com/page/album/${albumId}`;
  const iframeSelector = 'iframe';

  const page = await navigateToPage(authService, url, [
    { selector: iframeSelector, timeout: 5000 },
  ]);

  if (!page) {
    logger.error('Failed to navigate to the album page.');
    return;
  }

  try {
    logger.verbose('Successfully navigated to the album page.');

    // Esperar a que el iframe se cargue completamente
    const iframeElement = await page.$(iframeSelector);
    if (!iframeElement) {
      logger.error('Iframe not found.');
      return;
    }

    const iframe = await iframeElement.contentFrame();
    if (!iframe) {
      logger.error('Failed to get iframe content.');
      return;
    }

    await setEditMode(iframe);

    // Si removeAttachments es true, eliminar todos los adjuntos
    if (removeAttachments) {
      await removePrimaryAttachment(iframe);
      await removeSubCoverAttachments(iframe);
    }

    await saveAlbum(page, iframe);

    if (coverFilePath) {
      await uploadImageToDmb(page, iframe, coverFilePath);
    }
  } catch (error) {
    logger.error('Error interacting with album page:', error.message);
  } finally {
    await page.browser().close();
    logger.verbose('Browser closed.');
  }
}
