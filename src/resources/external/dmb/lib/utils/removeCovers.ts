import * as puppeteer from 'puppeteer';
import { Logger } from '@nestjs/common';

const logger = new Logger('AttachmentRemoval');

export async function removePrimaryAttachment(iframe: puppeteer.Frame) {
  try {
    // Selector para el botón de eliminar del attachment principal
    const primaryRemoveButtonSelector =
      '.vc-link.dmb-module-cover__icon-remove';

    // Esperar a que el botón de eliminar sea visible
    await iframe.waitForSelector(primaryRemoveButtonSelector, {
      visible: true,
      timeout: 3000, // Timeout de 10 segundos
    });

    const primaryRemoveButton = await iframe.$(primaryRemoveButtonSelector);
    if (!primaryRemoveButton) {
      logger.warn('No primary attachment found.');
      return;
    }

    await primaryRemoveButton.click();
    logger.verbose('Primary attachment removed.');
    // Esperar un momento para que el botón desaparezca y el DOM se actualice
    await new Promise((resolve) => setTimeout(resolve, 10000));
  } catch (error) {
    logger.error('Error removing primary attachment:', error.message);
  }
}

export async function removeSubCoverAttachments(iframe: puppeteer.Frame) {
  try {
    const subCoverContainerSelector = '#SubCoverList';
    const subCoverItemSelector =
      '.dmb-module-cover__item.js-dmb-attachment-list__item';
    const subCoverRemoveButtonSelector = 'a:nth-child(4).vc-link';

    // Esperar a que el contenedor de subcovers sea visible
    await iframe.waitForSelector(subCoverContainerSelector, {
      visible: true,
      timeout: 3000, // Timeout de 10 segundos
    });

    // Continuar eliminando subcovers mientras existan
    while (true) {
      const subCoverElements = await iframe.$$(subCoverItemSelector);

      if (subCoverElements.length === 0) {
        logger.verbose('No more subcover attachments found.');
        break;
      }

      for (const [index, element] of subCoverElements.entries()) {
        const removeButton = await element.$(subCoverRemoveButtonSelector);
        if (removeButton) {
          await removeButton.click();
          logger.verbose(`Subcover attachment ${index + 1} removed.`);
          // Esperar un momento para asegurar la eliminación
          await new Promise((resolve) => setTimeout(resolve, 10000));
        } else {
          logger.warn(
            `Remove button for subcover attachment ${index + 1} not found.`,
          );
        }
      }
    }
  } catch (error) {
    logger.error('Error removing subcover attachments:', error.message);
  }
}
