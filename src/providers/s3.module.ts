// src/providers/s3.module.ts
import { Global, Module } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';

@Global() // Make S3Module globally available
@Module({
  providers: [
    {
      provide: S3Client,
      useFactory: () => {
        return new S3Client({
          region: process.env.S3_AWS_REGION,
          credentials: {
            accessKeyId: process.env.S3_AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_AWS_SECRET_ACCESS_KEY,
          },
        });
      },
    },
  ],
  exports: [S3Client],
})
export class S3Module {}
