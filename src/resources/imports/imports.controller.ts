// src/imports/imports.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as path from 'path';
import { diskStorage } from 'multer';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('imports')
export class ImportsController {
  constructor(
    @InjectQueue('client-import') private clientImportQueue: Queue,
    @InjectQueue('label-import') private labelImportQueue: Queue,
  ) {}

  @Post('upload/client')
  @Roles('ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './temp',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}-${file.originalname}`);
        },
      }),
    }),
  )
  async uploadClientCsv(@UploadedFile() file: Express.Multer.File) {
    const tempFilePath = path.resolve(file.path);

    await this.clientImportQueue.add('client-import-queue', {
      filePath: tempFilePath,
    });

    return {
      message: 'CSV file uploaded and queued for processing.',
      filename: file.originalname,
    };
  }

  @Post('upload/label')
  @Roles('ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './temp',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}-${file.originalname}`);
        },
      }),
    }),
  )
  async uploadLabelCsv(@UploadedFile() file: Express.Multer.File) {
    const tempFilePath = path.resolve(file.path);

    await this.labelImportQueue.add('labelImportQueue', {
      filePath: tempFilePath,
    });

    return {
      message: 'CSV file uploaded and queued for processing.',
      filename: file.originalname,
    };
  }
}
