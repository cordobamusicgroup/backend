import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import { Logger } from '@nestjs/common';

const logger = new Logger('UploadImageToDmb');

export async function uploadImageToDmb(
  page: puppeteer.Page, // Cambiamos a page en lugar de iframe
  iframe: puppeteer.Frame,
  filePath: string,
): Promise<void> {
  try {
    // Selector para el input de subida de archivo
    const fileInputSelector =
      'input.upload.dmb-input-file--hidden.dmb-input-text';
    const uploadButtonSelector =
      'div.dmb-module-cover__add-cover > div.dmb-module-cover__select-cover > button';
    const coverSelector =
      '#AttachmentList > div.dmb-module-cover__item.js-dmb-attachment-list__item > a.vc-link.dmb-module-cover__link'; // Selector para la imagen de portada

    // Esperar a que el input de subida de archivo sea visible
    await iframe.waitForSelector(fileInputSelector, { visible: true });
    const fileInput = await iframe.$(fileInputSelector);

    if (fileInput) {
      // Subir el archivo
      await fileInput.uploadFile(filePath);
      logger.verbose('File uploaded to the input');

      // Esperar a que el botón de subir sea visible
      await iframe.waitForSelector(uploadButtonSelector, { visible: true });
      const uploadButton = await iframe.$(uploadButtonSelector);

      if (uploadButton) {
        // Configurar el monitoreo de la solicitud y el clic en el botón
        await Promise.all([
          page.waitForResponse(
            (response) =>
              response.url().includes('cover-upload') &&
              response.status() === 200,
          ),
          uploadButton.click(),
        ]);

        // Esperar hasta que no haya más solicitudes de red en vuelo
        await page.waitForNetworkIdle({ idleTime: 2000 });

        // Esperar a que la nueva imagen de portada aparezca en el DOM
        await iframe.waitForSelector(coverSelector, { visible: true });
        logger.verbose(
          'Upload process completed and cover uploaded successfully',
        );
      } else {
        logger.warn('Upload button not found');
      }
    } else {
      logger.warn('File input not found');
    }
  } catch (error) {
    logger.error('Error uploading image:', error.message);
  } finally {
    // Eliminar el archivo descargado para no dejar residuos
    fs.unlink(filePath, (err) => {
      if (err) {
        logger.error('Error deleting uploaded image:', err.message);
      } else {
        logger.verbose('Uploaded image deleted');
      }
    });
  }
}
