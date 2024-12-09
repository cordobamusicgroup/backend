import { Injectable, Logger } from '@nestjs/common';
// Remove NotFoundException from imports
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { AuthLoginDto } from './dto/auth-login.dto';
import { CurrentUserResponseDto } from './dto/current-user-data.dto';
import { Request } from 'express';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import {
  InvalidCredentialsException,
  InvalidOrExpiredTokenException,
  RecordNotFoundException,
  UnauthorizedException,
} from 'src/common/exceptions/CustomHttpException';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  /**
   * Validates a user's credentials.
   * @param login - The username of the user.
   * @param password - The password of the user.
   * @returns A Promise that resolves to the User object if the credentials are valid, or null otherwise.
   * @throws UnauthorizedException if the credentials are invalid.
   */
  async validateUser(login: string, password: string): Promise<User | null> {
    try {
      const user = login.includes('@')
        ? await this.usersService.findByEmail(login)
        : await this.usersService.findByUsername(login);

      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new InvalidCredentialsException();
      }

      return user;
    } catch (error) {
      if (error instanceof InvalidCredentialsException) {
        throw error;
      }

      throw new InvalidCredentialsException();
    }
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
      throw new RecordNotFoundException('User');
    }

    let clientData = { id: null, clientName: 'Unknown' };
    if (userData.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: userData.clientId },
      });
      if (client) {
        clientData = { id: client.id, clientName: client.clientName };
      }
    }

    return {
      id: userData.id,
      fullName: userData.fullName,
      username: userData.username,
      email: userData.email,
      role: userData.role,
      clientId: clientData.id,
      clientName: clientData.clientName,
    };
  }

  async forgotPassword(email: string): Promise<void> {
    // Log the request regardless of the result
    this.logger.log(`Password reset request received for ${email}`);
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // If the user exists, delete any previous password reset tokens
      await this.prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
        },
      });

      // Generate a new token and hash it
      const token = randomBytes(16).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const hashedToken = await bcrypt.hash(token, salt);

      // Set token expiration to 24 hours
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Save the new token in the database
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: hashedToken,
          expiresAt: expiresAt,
        },
      });

      this.emailService.sendPasswordResetEmail(user.username, email, token);

      this.logger.log(`Password reset email sent to ${email}`);
    } else {
      this.logger.warn(
        `Password reset attempt failed for ${email}: user not found.`,
      );
    }
    return;
  }

  /**
   * Resets the user's password using the provided reset token.
   * @param resetPasswordDto - The DTO containing the reset token and new password.
   * @throws UnauthorizedException if the token is invalid or expired.
   * @throws NotFoundException if the token is not found.
   * @throws BadRequestException if the token has already been used.
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = resetPasswordDto;

    // Find the reset token in the database
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        expiresAt: {
          gte: new Date(), // Ensure the token has not expired
        },
      },
    });

    if (!resetToken) {
      this.logger.warn('Invalid or expired password reset token.');
      throw new InvalidOrExpiredTokenException();
    }

    // Verify if the token matches the stored hash
    const isTokenValid = await bcrypt.compare(token, resetToken.token);
    if (!isTokenValid) {
      this.logger.warn('Invalid password reset token attempt.');
      throw new UnauthorizedException();
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Delete the reset token after it has been used
    await this.prisma.passwordResetToken.delete({
      where: { userId: resetToken.userId },
    });

    this.logger.log(
      `Password successfully reset for user ID: ${resetToken.userId}`,
    );
    return;
  }
}
