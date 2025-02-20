import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import { diskStorage } from 'multer';
import { ImportsService } from './imports.service';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

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
    const result = await this.importsService.importClientsFromCsv(tempFilePath);
    return {
      message: result.message,
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
    const result = await this.importsService.importLabelsFromCsv(tempFilePath);
    return {
      message: result.message,
      filename: file.originalname,
    };
  }

  @Post('upload/client-balance')
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
  async uploadClientBalanceCsv(@UploadedFile() file: Express.Multer.File) {
    const tempFilePath = path.resolve(file.path);
    const result =
      await this.importsService.importClientBalanceFromCsv(tempFilePath);
    return {
      message: result.message,
      filename: file.originalname,
    };
  }

  @Post('reverse/client-balance')
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
  async reverseClientBalanceCsv(@UploadedFile() file: Express.Multer.File) {
    const tempFilePath = path.resolve(file.path);
    const result =
      await this.importsService.revertClientBalanceFromCsv(tempFilePath);
    return {
      message: result.message,
      filename: file.originalname,
    };
  }
}
