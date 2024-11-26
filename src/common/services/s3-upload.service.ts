// src/common/services/s3-upload.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class S3UploadService {
  private readonly logger = new Logger(S3UploadService.name);

  constructor(
    private readonly s3: S3Client,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Uploads a file to S3 and optionally saves its details in the database.
   * @param bucket - S3 bucket name
   * @param key - S3 object key for the file
   * @param filePath - Local path of the file to be uploaded
   * @param saveToDB - Whether to save the file's metadata to the database
   */
  async uploadFile(
    bucket: string,
    key: string,
    filePath: string,
    saveToDB = true,
  ): Promise<void> {
    try {
      const fileStream = fs.createReadStream(filePath);
      await this.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: fileStream,
        }),
      );
      this.logger.log(`File uploaded to S3: ${bucket}/${key}`);

      if (saveToDB) {
        const fileName = path.basename(filePath);
        const type = path.extname(filePath).substring(1); // Get file extension without the dot
        const folder = path.dirname(key); // Get folder structure from key if available

        await this.saveFileRecord(bucket, key, fileName, type, folder);
      }
    } catch (error) {
      this.logger.error(
        `Failed to upload file to S3: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Saves the file's metadata to the database.
   * @param bucket - S3 bucket name
   * @param key - S3 object key for the file
   * @param fileName - Original name of the file
   * @param type - File extension (e.g., 'csv')
   * @param folder - Optional folder path within the S3 bucket
   */
  private async saveFileRecord(
    bucket: string,
    key: string,
    fileName: string,
    type: string,
    folder?: string,
  ): Promise<void> {
    await this.prisma.s3File.create({
      data: { bucket, key, fileName, type, folder },
    });
    this.logger.log(`File record saved in the database: ${bucket}/${key}`);
  }
}
