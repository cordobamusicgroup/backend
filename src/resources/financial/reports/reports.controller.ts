// src/resources/financial/reports/reports.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  Body,
  BadRequestException,
  Inject,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Queue } from 'bull';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { S3_PROVIDER } from '../../../providers/s3.module';
import * as fs from 'fs';
import * as path from 'path';
import { diskStorage } from 'multer';
import { Distributor } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';

@Controller('reports')
export class ReportsController {
  constructor(
    @Inject(S3_PROVIDER) private readonly s3: S3Client,
    @InjectQueue('base-report') private baseReportQueue: Queue,
  ) {}

  // Endpoint específico para Kontor
  @Post('upload/kontor')
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
  async uploadKontorCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body('reportingMonth') reportingMonth: string,
  ) {
    // Validación de reportingMonth en el formato YYYYMM
    if (!reportingMonth || !/^(\d{4})(0[1-9]|1[0-2])$/.test(reportingMonth)) {
      throw new BadRequestException(
        'Invalid reportingMonth format. Expected format is YYYYMM.',
      );
    }

    // Llamamos a la función de procesamiento con el distribuidor definido como Kontor
    return this.uploadCsvToQueue(file, reportingMonth, Distributor.KONTOR);
  }

  // Endpoint específico para Believe
  @Post('upload/believe')
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
  async uploadBelieveCsv(@UploadedFile() file: Express.Multer.File) {
    // Llamamos a la función de procesamiento sin reportingMonth ya que está en el CSV
    return this.uploadCsvToQueue(file, null, Distributor.BELIEVE);
  }

  private async uploadCsvToQueue(
    file: Express.Multer.File,
    reportingMonth: string | null,
    distributor: Distributor,
  ) {
    const tempFilePath = path.resolve(file.path);
    const s3Key = `BaseReport_${distributor}_${reportingMonth || 'AUTO'}.csv`;

    try {
      const fileStream = fs.createReadStream(tempFilePath);
      await this.s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: s3Key,
          Body: fileStream,
        }),
      );

      // Añade el archivo a la cola con los datos necesarios para procesar
      await this.baseReportQueue.add('parse-csv', {
        filePath: tempFilePath,
        s3Key,
        reportingMonth,
        distributor,
      });

      return {
        message: 'CSV file uploaded and queued for processing.',
        distributor,
        reportingMonth,
        filename: s3Key,
      };
    } catch (error) {
      throw new Error(`Failed to upload CSV to S3: ${error.message}`);
    }
  }
}
