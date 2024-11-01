import { Controller, Get, HttpCode } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Get()
  @Public()
  @HttpCode(418)
  getHello(): string {
    return 'I am a teapot ☕️';
  }
}
