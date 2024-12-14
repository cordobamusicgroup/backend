import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Queue } from 'bull';
import { DmbAuthService } from './dmb-auth.service';
import { AlbumDTO } from './interfaces/album.dto';
import { navigateAndEditAlbum } from './lib/core/navigate-edit-album.util';
import { extractProductId } from './lib/utils/getProductId';
import { downloadBlvCover } from './lib/external/downloadBlvCover';
import env from 'src/config/env.config';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class DmbService {
  constructor(
    private readonly dmbAuthService: DmbAuthService,
    @InjectQueue('dmb') private readonly dmbQueue: Queue,
  ) {}

  async login() {
    try {
      await this.dmbAuthService.login(env.APP_DMB_USER, env.APP_DMB_PASS);
      await extractProductId(this.dmbAuthService, '872076d6555065');
    } catch (error) {
      throw new HttpException(error, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async scrapeAlbum(
    ean: string,
    removeAttachments: boolean = false,
  ): Promise<AlbumDTO> {
    try {
      const productId = await extractProductId(this.dmbAuthService, ean);

      if (!productId) {
        throw new NotFoundException('Product ID not found');
      }

      // Navegar a la página del álbum usando el ID del producto y realizar acciones
      await navigateAndEditAlbum(
        this.dmbAuthService,
        productId,
        removeAttachments,
      );

      return { productId };
    } catch (error) {
      throw new HttpException(
        'Error during scraping',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async importBlvCover(ean: string): Promise<void> {
    try {
      const productId = await extractProductId(this.dmbAuthService, ean);

      if (!productId) {
        throw new NotFoundException('Product ID not found');
      }

      // Descargar la portada BLV
      const coverFilePath = await downloadBlvCover(ean);

      // Navegar y editar el álbum, removiendo los adjuntos existentes y subiendo la nueva portada
      await navigateAndEditAlbum(
        this.dmbAuthService,
        productId,
        true,
        coverFilePath,
      );
    } catch (error) {
      throw new HttpException(
        'Error during cover import',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async scrapeAlbums(
    eans: string[],
    removeAttachments: boolean,
  ): Promise<void> {
    for (const ean of eans) {
      await this.dmbQueue.add(
        'scrape-album',
        { ean, removeAttachments },
        { attempts: 10 },
      );
    }
  }

  async importBlvCovers(eans: string[]): Promise<void> {
    for (const ean of eans) {
      await this.dmbQueue.add('import-blv-cover', { ean }, { attempts: 10 });
    }
  }

  async clearQueue(): Promise<void> {
    await this.dmbQueue.empty();
  }
}
