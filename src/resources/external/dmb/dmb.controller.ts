// dmb/dmb.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { DmbService } from './dmb.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('dmb')
export class DmbController {
  constructor(private readonly dmbService: DmbService) {}

  @Public()
  @Get('album')
  async getAlbum(@Query('ean') ean: string) {
    const albumInfo = await this.dmbService.scrapeAlbum(ean);
    return albumInfo;
  }
}
