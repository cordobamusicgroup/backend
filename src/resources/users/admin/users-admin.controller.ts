import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersAdminService } from './users-admin.service';

import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/generated/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Controller('users/admin')
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard)
export class UsersAdminController {
  constructor(private readonly usersService: UsersAdminService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.registerUser(createUserDto);
  }

  @Get()
  async getUsers() {
    return this.usersService.getAllUsers();
  }

  @Get(':id')
  async getUserById(@Param('id') id: number) {
    return this.usersService.findById(Number(id));
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(Number(id), updateUserDto);
  }

  @Delete()
  async deleteMultipleUsers(@Body() body: { ids: number[] }) {
    return this.usersService.deleteMultipleUsers(body.ids);
  }

  @Patch('view-as-client')
  async changeClientId(@Request() req, @Body() body: { clientId: number }) {
    const user = req.user;
    return this.usersService.changeClientId(
      user.username,
      Number(body.clientId),
    );
  }

  @Post('resend-account-info')
  async resendAccountInfo(@Body() body: { email: string }) {
    return this.usersService.resendAccountInfoEmail(body.email);
  }
}
