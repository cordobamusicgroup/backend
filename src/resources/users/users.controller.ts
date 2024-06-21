import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { Public } from '../../common/decorators/public.decorator';

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

  @Public()
  @Get('all')
  async getUsers() {
    return this.usersService.getAllUsers();
  }
}
