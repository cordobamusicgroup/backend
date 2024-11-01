// src/imports/imports.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ImportsService {
  constructor(@InjectQueue('client-import') private clientImportQueue: Queue) {}

  async importClientsFromCsv(filePath: string) {
    await this.clientImportQueue.add('client-import-job', { filePath });
  }
}
