import { Controller, Get, Logger, Query } from '@nestjs/common';
import { DmbService } from './dmb.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('dmb')
export class DmbController {
  private readonly logger = new Logger(DmbController.name);

  constructor(private readonly dmbService: DmbService) {}

  @Public()
  @Get('album')
  async getAlbum(
    @Query('ean') ean: string,
    @Query('removeAttachments') removeAttachments: string,
  ) {
    const shouldRemoveAttachments = removeAttachments === 'true';
    const albumInfo = await this.dmbService.scrapeAlbum(
      ean,
      shouldRemoveAttachments,
    );
    return albumInfo;
  }

  @Public()
  @Get('import-blv-cover')
  async importBlvCover(@Query('ean') ean: string): Promise<void> {
    this.logger.verbose(`Received request to import cover for EAN ${ean}`);
    await this.dmbService.importBlvCover(ean);
  }
}
