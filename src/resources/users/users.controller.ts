import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.registerUser(createUserDto);
  }

  @Get('all')
  async getUsers() {
    return this.usersService.getAllUsers();
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete()
  async deleteMultipleUsers(@Body() body: { ids: number[] }) {
    return this.usersService.deleteMultipleUsers(body.ids);
  }

  @Get('all-dto')
  async getUsersWithDto() {
    return this.usersService.getAllUsersWithDto();
  }
}
