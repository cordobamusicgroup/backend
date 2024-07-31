import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DmbAuthService } from './dmb-auth.service';
import { extractProductId } from './utils/extract-id.util';
import { AlbumDTO } from './interfaces/album.dto';
import { navigateToAlbum } from './utils/navigateToAlbum';

@Injectable()
export class DmbService {
  constructor(private readonly dmbAuthService: DmbAuthService) {}

  async scrapeAlbum(ean: string): Promise<AlbumDTO> {
    try {
      const productId = await extractProductId(this.dmbAuthService, ean);

      if (!productId) {
        throw new NotFoundException('Product ID not found');
      }

      await navigateToAlbum(this.dmbAuthService, productId);

      return { productId };
    } catch (error) {
      throw new HttpException(
        'Error during scraping',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
