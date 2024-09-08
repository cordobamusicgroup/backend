import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { AuthLoginDto } from './dto/auth-login.dto';
import { CurrentUserResponseDto } from './dto/current-user-data.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() authLoginDto: AuthLoginDto,
    @Res() res: Response,
    @Req() req,
  ) {
    const { access_token } = await this.authService.login(authLoginDto, req);

    return res.send({ access_token });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async me(@Request() req): Promise<CurrentUserResponseDto> {
    return this.authService.getCurrentUserData(req.user);
  }
}
