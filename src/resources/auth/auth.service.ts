import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { AuthLoginDto } from './dto/auth-login.dto';
import { CurrentUserResponseDto } from './dto/current-user-data.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByUsername(username);
    const isPasswordMatch =
      user && (await bcrypt.compare(password, user.password));
    if (!isPasswordMatch) {
      throw new UnauthorizedException(
        'Failed to log in. Please check your username and password.',
      );
    }
    return user;
  }

  async login(authLoginDto: AuthLoginDto) {
    const { username, password } = authLoginDto;
    const user = await this.validateUser(username, password);
    const payload: JwtPayloadDto = {
      username: user.username,
      sub: user.id,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async getCurrentUserData(
    user: JwtPayloadDto,
  ): Promise<CurrentUserResponseDto> {
    const userData = await this.usersService.findByUsername(user.username);
    if (!userData) {
      throw new NotFoundException('User not found');
    }
    return {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      role: userData.role,
    };
  }
}
