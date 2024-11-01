// src/providers/s3.module.ts
import { Module, Global } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';

export const S3_PROVIDER = 'S3_CLIENT';

@Global() // Hacer que este módulo sea global
@Module({
  providers: [
    {
      provide: S3_PROVIDER,
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
  exports: [S3_PROVIDER], // Exporta el cliente para su uso en otros módulos
})
export class S3Module {}
