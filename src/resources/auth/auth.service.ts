import {
  Injectable,
  Logger,
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
import { Request } from 'express';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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

  async login(authLoginDto: AuthLoginDto, req: Request) {
    try {
      const { username, password } = authLoginDto;
      const user = await this.validateUser(username, password);
      const payload: JwtPayloadDto = {
        username: user.username,
        sub: user.id,
        role: user.role,
      };
      const accessToken = this.jwtService.sign(payload);

      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'] || 'Unknown';

      // Log de acceso exitoso
      this.logger.log(
        `User with ID ${user.id} logged in successfully from IP ${ipAddress} using ${userAgent}.`,
      );

      return { access_token: accessToken };
    } catch (error) {
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'] || 'Unknown';

      // Log de acceso fallido
      this.logger.warn(
        `Failed login attempt for username ${authLoginDto.username} from IP ${ipAddress} using ${userAgent}. Reason: ${error.message}`,
      );

      throw error;
    }
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
