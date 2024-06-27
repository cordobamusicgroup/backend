import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { Public } from '../../common/decorators/public.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(
    @Body() body: { username: string; email: string; password: string },
  ) {
    return this.usersService.createUser(
      body.username,
      body.email,
      body.password,
    );
  }

  @Get('all')
  async getUsers() {
    return this.usersService.getAllUsers();
  }
}
