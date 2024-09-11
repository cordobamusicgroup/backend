import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Get()
  @Public()
  getHello(): string {
    return 'there is nothing to see here :)';
  }
}
