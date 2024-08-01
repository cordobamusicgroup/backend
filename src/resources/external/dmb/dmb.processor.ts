import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { DmbService } from './dmb.service';

@Processor('dmb')
export class DmbProcessor {
  constructor(private readonly dmbService: DmbService) {}

  @Process('scrape-album')
  async handleScrapeAlbum(
    job: Job<{ ean: string; removeAttachments: boolean }>,
  ) {
    const { ean, removeAttachments } = job.data;
    await this.dmbService.scrapeAlbum(ean, removeAttachments);
  }

  @Process('import-blv-cover')
  async handleImportBlvCover(job: Job<{ ean: string }>) {
    const { ean } = job.data;
    await this.dmbService.importBlvCover(ean);
  }
}
