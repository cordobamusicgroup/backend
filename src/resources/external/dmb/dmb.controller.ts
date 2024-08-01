import { Controller, Post, Body, Logger, Delete } from '@nestjs/common';
import { DmbService } from './dmb.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('dmb')
export class DmbController {
  private readonly logger = new Logger(DmbController.name);

  constructor(private readonly dmbService: DmbService) {}

  @Public()
  @Post('albums')
  async getAlbums(
    @Body('eans') eans: string[],
    @Body('removeAttachments') removeAttachments: boolean,
  ) {
    this.logger.verbose(`Received request to scrape albums for EANs ${eans}`);
    await this.dmbService.scrapeAlbums(eans, removeAttachments);
    return { message: 'Albums are being processed' };
  }

  @Public()
  @Post('import-blv-covers')
  async importBlvCovers(@Body('eans') eans: string[]): Promise<void> {
    this.logger.verbose(`Received request to import covers for EANs ${eans}`);
    await this.dmbService.importBlvCovers(eans);
  }

  @Public()
  @Delete('clear-queue')
  async clearQueue(): Promise<void> {
    this.logger.verbose(`Received request to clear the queue`);
    await this.dmbService.clearQueue();
  }
}
