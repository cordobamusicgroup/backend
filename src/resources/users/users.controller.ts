import {
  Body,
  Controller,
  Patch,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('edit-profile')
  async editProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const user = req.user;
    return this.usersService.updateUser(user.id, updateUserDto);
  }

  @Get('current')
  async getCurrentUser(@Request() req) {
    const user = req.user;
    return this.usersService.findByUsername(user.username);
  }
}
