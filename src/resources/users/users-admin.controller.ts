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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('users/admin')
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard)
export class UsersAdminController {
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

  @Patch('view-as-client')
  async changeClientId(@Request() req, @Body() body: { clientId: number }) {
    const user = req.user;
    return this.usersService.changeClientId(
      user.username,
      Number(body.clientId),
    );
  }
}
