import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { Role, User } from '@prisma/client';
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
  ClientBlockedException,
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
   * @param login - The username or email of the user.
   * @param password - The password of the user.
   * @returns A Promise that resolves to the User object if the credentials are valid.
   * @throws InvalidCredentialsException if credentials are invalid.
   * @throws ClientBlockedException if the client is blocked and user is not admin.
   */
  async validateUser(login: string, password: string): Promise<User> {
    try {
      // Determine whether the login is an email or username
      const isEmail = login.includes('@');

      let user;
      if (isEmail) {
        // Email login - case insensitive
        user = await this.prisma.user.findFirst({
          where: {
            email: {
              equals: login,
              mode: 'insensitive',
            },
          },
          include: { client: true },
        });
      } else {
        // Username login - case sensitive
        user = await this.prisma.user.findUnique({
          where: { username: login },
          include: { client: true },
        });
      }

      // Validate user exists and password is correct
      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new InvalidCredentialsException();
      }

      // Check if the user has any admin role
      const isAdminRole =
        user.role === Role.ADMIN || user.role.includes('ADMIN_');

      // Check client blocked status (skip for admin users)
      if (!isAdminRole && user.client?.isBlocked) {
        throw new ClientBlockedException();
      }

      return user;
    } catch (error) {
      // Re-throw specific exceptions, wrap others in InvalidCredentialsException
      if (
        error instanceof InvalidCredentialsException ||
        error instanceof ClientBlockedException
      ) {
        throw error;
      }

      // Log unexpected errors before wrapping
      this.logger.error(
        `Unexpected error during user validation: ${error.message}`,
      );
      throw new InvalidCredentialsException();
    }
  }

  /**
   * Logs in a user and returns an access token.
   * @param authLoginDto - The DTO containing the login credentials.
   * @param req - The Express Request object.
   * @returns An object containing the access token.
   */
  async login(authLoginDto: AuthLoginDto, req: Request) {
    try {
      const { username, password } = authLoginDto;
      const user = await this.validateUser(username, password);

      // Create JWT payload and sign token
      const payload: JwtPayloadDto = {
        username: user.username,
        sub: user.id,
        role: user.role,
      };
      const accessToken = this.jwtService.sign(payload);

      // Get client information for logging
      const ipAddress = this.getClientIp(req);
      const userAgent = req.headers['user-agent'] || 'Unknown';

      // Log successful login with emoji
      this.logger.log(
        `🔓 User ${user.username} (ID: ${user.id}) logged in successfully from IP ${ipAddress} using ${userAgent}.`,
      );

      return { access_token: accessToken };
    } catch (error) {
      // Get client information for failed login logging
      const ipAddress = this.getClientIp(req);
      const userAgent = req.headers['user-agent'] || 'Unknown';

      // Log failed login attempt
      this.logger.warn(
        `❌ Failed login attempt for "${authLoginDto.username}" from IP ${ipAddress} using ${userAgent}. Reason: ${error.message}`,
      );

      throw error;
    }
  }

  /**
   * Gets the real client IP address using NestJS/Express methods
   * @param req - The Express Request object
   * @returns The client IP address
   */
  private getClientIp(req: Request): string {
    // NestJS/Express automatically handles common proxy headers like x-forwarded-for
    // and sets req.ip to the client's IP address, making this much simpler

    // Get IP from Cloudflare headers if available (highest priority)
    const cfIP = req.headers['cf-connecting-ip'];
    if (cfIP) {
      const ip = Array.isArray(cfIP) ? cfIP[0] : cfIP;
      this.logger.debug(`Using IP from Cloudflare: ${ip}`);
      return ip;
    }

    // For other proxies, NestJS/Express already handles this with req.ip
    // which typically reads X-Forwarded-For and other common headers
    const ip = req.ip || 'unknown';

    // Log the source of the IP for debugging
    if (req.ip !== req.socket.remoteAddress) {
      this.logger.debug(`Using IP from proxy headers: ${ip}`);
    } else {
      this.logger.debug(`Using direct connection IP: ${ip}`);
    }

    return ip;
  }

  /**
   * Retrieves the current user's data.
   * @param user - The JWT payload containing the user's information.
   * @returns A Promise that resolves to the CurrentUserResponseDto object.
   * @throws RecordNotFoundException if the user is not found.
   */
  async getCurrentUserData(
    user: JwtPayloadDto,
  ): Promise<CurrentUserResponseDto> {
    // Find the user by username
    const userData = await this.usersService.findByUsername(user.username);
    if (!userData) {
      throw new RecordNotFoundException('User');
    }

    this.logger.log(
      `👤 Retrieved user data for ${userData.username} (ID: ${userData.id})`,
    );

    // Get client data if the user belongs to a client
    let clientData = { id: null, clientName: 'Unknown' };
    if (userData.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: userData.clientId },
      });
      if (client) {
        clientData = { id: client.id, clientName: client.clientName };
        this.logger.log(
          `🏢 User belongs to client: ${client.clientName} (ID: ${client.id})`,
        );
      }
    }

    // Return formatted user response
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

  /**
   * Initiates the password reset process for a user with the given email
   * @param email - The email address of the user
   */
  async forgotPassword(email: string): Promise<void> {
    // Log the request but don't expose if the user exists
    this.logger.log(`🔑 Password reset request received for email: ${email}`);

    // Find user by case-insensitive email search
    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
    });

    if (user) {
      // Clean up any existing reset tokens
      await this.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // Generate secure token
      const token = randomBytes(16).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const hashedToken = await bcrypt.hash(token, salt);

      // Set expiration time (24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Store token in database
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: hashedToken,
          expiresAt: expiresAt,
        },
      });

      // Send the reset email
      this.emailService.sendPasswordResetEmail(
        user.username,
        user.email,
        token,
      );

      this.logger.log(`📧 Password reset email sent to ${email}`);
    } else {
      // Don't expose that the user doesn't exist in response
      this.logger.warn(
        `❓ Password reset attempted for non-existent email: ${email}`,
      );
    }
  }

  /**
   * Resets the user's password using the provided reset token.
   * @param resetPasswordDto - The DTO containing the reset token and new password.
   * @throws InvalidOrExpiredTokenException if the token is invalid or expired.
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = resetPasswordDto;
    this.logger.log(`🔄 Processing password reset request with token`);

    // Find all unexpired tokens with user information
    const allValidTokens = await this.prisma.passwordResetToken.findMany({
      where: {
        expiresAt: {
          gte: new Date(), // Ensure token has not expired
        },
      },
      include: { user: true },
    });

    if (allValidTokens.length === 0) {
      // Pasa el contexto como segundo parámetro en warn, error, etc.
      this.logger.warn(
        '❌ No valid password reset tokens found in the database',
      );
      throw new InvalidOrExpiredTokenException();
    }

    // Find the matching token by comparing with each stored hash
    let matchedToken = null;
    let userData = null;

    for (const resetToken of allValidTokens) {
      const isMatch = await bcrypt.compare(token, resetToken.token);
      if (isMatch) {
        matchedToken = resetToken;
        userData = resetToken.user;
        break;
      }
    }

    if (!matchedToken || !userData) {
      this.logger.warn('❌ No matching password reset token found');
      throw new InvalidOrExpiredTokenException();
    }

    // Token is valid, update the user's password
    this.logger.log(
      `✅ Valid reset token found for user: ${userData.username} (${userData.email})`,
    );

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await this.prisma.user.update({
      where: { id: userData.id },
      data: { password: hashedPassword },
    });

    // Delete the used token
    await this.prisma.passwordResetToken.delete({
      where: { id: matchedToken.id },
    });

    this.logger.log(
      `🎉 Password successfully reset for user: ${userData.username} (${userData.email})`,
    );
  }
}
