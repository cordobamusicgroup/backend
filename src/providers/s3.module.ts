// src/providers/s3.module.ts
import { Global, Module } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import env from 'src/config/env.config';

@Global() // Make S3Module globally available
@Module({
  providers: [
    {
      provide: S3Client,
      useFactory: () => {
        return new S3Client({
          region: env.AWS_S3_REGION,
          credentials: {
            accessKeyId: env.AWS_S3_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_S3_SECRET_ACCESS_KEY,
          },
        });
      },
    },
  ],
  exports: [S3Client],
})
export class S3Module {}
