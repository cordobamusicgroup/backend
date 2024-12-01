import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { UserDto } from './dto/user.dto';
import {
  UserNotFoundException,
  UserAlreadyExistsException,
  EmailAlreadyExistsException,
} from 'src/common/exceptions/CustomHttpException';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new user in the database.
   * @param username - The username
   * @param email - The email
   * @param password - The unhashed password
   * @returns The created user
   * @throws UserAlreadyExistsException if the username is already in use
   * @throws EmailAlreadyExistsException if the email is already in use
   * @throws InternalServerErrorException if any other error occurs
   */
  async createUser(username: string, email: string, password: string) {
    const existingUserByUsername = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existingUserByUsername) {
      throw new UserAlreadyExistsException();
    }

    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUserByEmail) {
      throw new EmailAlreadyExistsException();
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      return await this.prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error creating user.');
    }
  }

  /**
   * Finds a user by their username.
   * @param username - The username
   * @returns The found user or throws an exception if not found
   * @throws UserNotFoundException if the user is not found
   */
  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    if (!user) {
      throw new UserNotFoundException();
    }
    return user;
  }

  /**
   * Finds a user by their email.
   * @param email - The user's email
   * @returns The found user or throws an exception if not found
   * @throws UserNotFoundException if the user is not found
   */
  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new UserNotFoundException();
    }
    return user;
  }

  /**
   * Gets all users with their client relations.
   * @returns List of users transformed into DTOs
   * @throws InternalServerErrorException if any error occurs during the query
   */
  async getAllUsers() {
    try {
      const users = await this.prisma.user.findMany({
        include: {
          client: true,
        },
      });
      return plainToInstance(UserDto, users, { excludeExtraneousValues: true });
    } catch (error) {
      throw new InternalServerErrorException('Error fetching user list.');
    }
  }
}
