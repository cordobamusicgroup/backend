// src/providers/multer-s3.module.ts
import { Module, Global } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import * as multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { S3Module } from './s3.module';

@Global() // Makes the module globally available
@Module({
  imports: [
    S3Module, // Ensures S3Client is available
    MulterModule.registerAsync({
      imports: [S3Module],
      useFactory: async (s3Client: S3Client) => ({
        storage: multerS3({
          s3: s3Client,
          bucket: process.env.S3_BUCKET_NAME,
          key: (req, file, cb) => {
            const filename = `${Date.now()}-${file.originalname}`;
            console.log('Uploading file with filename:', filename); // Verification log
            cb(null, filename);
          },
        }),
      }),
      inject: [S3Client], // Injects S3Client directly
    }),
  ],
  exports: [MulterModule],
})
export class MulterS3Module {}
