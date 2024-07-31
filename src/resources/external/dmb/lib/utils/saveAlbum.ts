import { Frame, Page } from 'puppeteer';
import { Logger } from '@nestjs/common';

const logger = new Logger('SaveAlbum');

export async function saveAlbum(page: Page, iframe: Frame): Promise<void> {
  try {
    const saveButtonSelector = '.dmb-actions-toolbar__action--save a.vc-link';

    // Hacer clic en el botón de guardar
    await iframe.waitForSelector(saveButtonSelector, {
      visible: true,
      timeout: 10000,
    });
    const saveButton = await iframe.$(saveButtonSelector);

    if (saveButton) {
      logger.verbose('Save button clicked.');
      await Promise.all([
        page.waitForNetworkIdle({ idleTime: 5000 }),
        saveButton.click(),
      ]);

      logger.verbose('Page reloaded after saving.');
    } else {
      logger.warn('Save button not found.');
    }
  } catch (error) {
    logger.error('Error interacting with save button:', error.message);
    throw error;
  }
}
