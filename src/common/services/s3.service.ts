// src/common/services/s3-upload.service.ts
import { Injectable, Logger } from '@nestjs/common';
import {
  PutObjectCommand,
  S3Client,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { S3File } from '@prisma/client';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);

  constructor(
    private readonly s3: S3Client,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Uploads a file to S3 and optionally saves its details in the database.
   * @param bucket - S3 bucket name
   * @param key - S3 object key for the file
   * @param filePath - Local path of the file to be uploaded
   */
  async uploadFile(
    bucket: string,
    key: string,
    filePath: string,
  ): Promise<S3File> {
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

      const fileName = path.basename(filePath);
      const type = path.extname(filePath).substring(1); // Get file extension without the dot
      const folder = path.dirname(key); // Get folder structure from key if available

      return await this.saveFileRecord(bucket, key, fileName, type, folder);
    } catch (error) {
      this.logger.error(
        `Failed to upload file to S3: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Retrieves a file from S3 by various optional fields and ID.
   * @param params - Object containing optional search fields
   * @returns - Object containing the download URL and ACL with expiration if applicable
   */
  async getFile(params: {
    id?: number;
    bucket?: string;
    key?: string;
    fileName?: string;
    type?: string;
    folder?: string;
  }): Promise<{ url: string; acl?: string; expiration?: number }> {
    const { id, bucket, key, fileName, type, folder } = params;

    if (!id && !bucket && !key && !fileName && !type && !folder) {
      throw new Error('At least one search parameter must be provided.');
    }

    const fileRecord = await this.prisma.s3File.findFirst({
      where: {
        id,
        bucket,
        key,
        fileName,
        type,
        folder,
      },
    });

    if (!fileRecord) {
      throw new Error('File not found.');
    }

    const getObjectParams = {
      Bucket: fileRecord.bucket,
      Key: fileRecord.key,
    };

    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });

    return {
      url,
      expiration: 3600,
    };
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
  ): Promise<S3File> {
    const s3File = await this.prisma.s3File.create({
      data: { bucket, key, fileName, type, folder },
    });
    this.logger.log(`File record saved in the database: ${bucket}/${key}`);
    return s3File;
  }
}
