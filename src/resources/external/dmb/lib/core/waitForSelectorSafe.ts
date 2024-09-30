import * as puppeteer from 'puppeteer';
import {
  Logger,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';

const logger = new Logger('WebScraper');

/**
 * Espera a que un selector esté presente en la página dentro de un tiempo límite.
 * Si no lo encuentra, lanza una excepción HTTP con un mensaje de error personalizado y lo registra en el logger.
 */
export async function waitForSelectorSafe(
  pageOrFrame: puppeteer.Page | puppeteer.Frame,
  selector: string,
  timeout: number = 5000,
): Promise<puppeteer.ElementHandle | null> {
  try {
    return await pageOrFrame.waitForSelector(selector, { timeout });
  } catch (error) {
    if (error instanceof puppeteer.TimeoutError) {
      // Registrar en el logger y lanzar una excepción Http
      const errorMessage = `Selector ${selector} not found after ${timeout}ms (timeout).`;
      logger.error(errorMessage);
      throw new NotFoundException(`[WebScraper] ${errorMessage}`);
    }

    // Para otros errores, los registramos y lanzamos la excepción Http
    const generalErrorMessage = `Error while waiting for selector ${selector}: ${error.message}`;
    logger.error(`[PuppeteerUtil] ${generalErrorMessage}`);
    throw new HttpException(
      `[PuppeteerUtil] ${generalErrorMessage}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
