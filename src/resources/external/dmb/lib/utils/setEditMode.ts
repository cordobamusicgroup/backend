import { Frame } from 'puppeteer';
import { Logger } from '@nestjs/common';

const logger = new Logger('SetEditMode');

export async function setEditMode(
  iframe: Frame,
  timeout: number = 1500,
): Promise<void> {
  const editButtonSelector = '.dmb-actions-toolbar__action--edit .vc-link';
  try {
    // Intentar encontrar el botón de editar dentro del tiempo especificado
    await iframe.waitForSelector(editButtonSelector, {
      visible: true,
      timeout,
    });
    const editButton = await iframe.$(editButtonSelector);
    if (editButton) {
      await editButton.click();
      logger.verbose('Edit mode activated');
      await iframe.waitForNavigation({ waitUntil: 'networkidle2' });
      logger.verbose('Page reloaded after set edit mode.');
    } else {
      logger.warn('Edit button not found.');
    }
  } catch (error) {
    if (error.name === 'TimeoutError') {
      logger.warn(
        `Edit button not found within ${timeout}ms. Continuing without setting edit mode.`,
      );
    } else {
      logger.error('Error interacting with edit button:', error.message);
      throw error;
    }
  }
}
