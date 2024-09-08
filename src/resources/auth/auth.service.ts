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

  /**
   * Validates a user's credentials.
   * @param username - The username of the user.
   * @param password - The password of the user.
   * @returns A Promise that resolves to the User object if the credentials are valid, or null otherwise.
   * @throws UnauthorizedException if the credentials are invalid.
   */
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

  /**
   * Logs in a user and returns an access token.
   * @param authLoginDto - The DTO containing the login credentials.
   * @param req - The Express Request object.
   * @returns An object containing the access token.
   * @throws Error if the login attempt fails.
   */
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

      // Log successful login
      this.logger.log(
        `User with ID ${user.id} logged in successfully from IP ${ipAddress} using ${userAgent}.`,
      );

      return { access_token: accessToken };
    } catch (error) {
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'] || 'Unknown';

      // Log failed login attempt
      this.logger.warn(
        `Failed login attempt for username ${authLoginDto.username} from IP ${ipAddress} using ${userAgent}. Reason: ${error.message}`,
      );

      throw error;
    }
  }

  /**
   * Retrieves the current user's data.
   * @param user - The JWT payload containing the user's information.
   * @returns A Promise that resolves to the CurrentUserResponseDto object.
   * @throws NotFoundException if the user is not found.
   */
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
