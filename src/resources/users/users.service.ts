import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { UserDto } from './dto/user.dto';
import {
  UserNotFoundException,
  UserAlreadyExistsException,
  EmailAlreadyExistsException,
} from 'src/common/exceptions/CustomHttpException';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
  ) {}

  /**
   * Creates a new user in the database.
   * @param createUserDto - The DTO containing the user data
   * @returns The created user
   * @throws UserAlreadyExistsException if the username is already in use
   * @throws EmailAlreadyExistsException if the email is already in use
   * @throws InternalServerErrorException if any other error occurs
   */
  async createUser(createUserDto: CreateUserDto) {
    const { username, email, fullName, role, clientId } = createUserDto;
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

    const password = this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      return await this.prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          fullName,
          role,
          clientId,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error creating user.');
    }
  }

  /**
   * Registers a new user with a randomly generated password and sends an email with the account information.
   * @param createUserDto - The DTO containing the user data
   * @returns The created user
   * @throws UserAlreadyExistsException if the username is already in use
   * @throws EmailAlreadyExistsException if the email is already in use
   * @throws InternalServerErrorException if any other error occurs
   */
  async registerUser(createUserDto: CreateUserDto) {
    const { username, email, fullName, role, clientId } = createUserDto;
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

    const password = this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const user = await this.prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          fullName,
          role,
          clientId,
        },
      });

      await this.sendAccountInfoEmail(email, username, password);

      return user;
    } catch (error) {
      throw new InternalServerErrorException('Error registering user.');
    }
  }

  private generateRandomPassword(): string {
    return Math.random().toString(36).slice(-8);
  }

  private async sendAccountInfoEmail(
    email: string,
    username: string,
    password: string,
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Your Account Information',
        template: './account-info', // The path to the HBS template
        context: {
          username,
          password,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Error sending account information email.',
      );
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

  /**
   * Updates a user by their ID.
   * @param id - The ID of the user to update
   * @param updateUserDto - The DTO containing the fields to update
   * @returns The updated user
   * @throws UserNotFoundException if the user is not found
   */
  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new UserNotFoundException();
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...updateUserDto,
          id: undefined, // Ensure 'id' is not included in the update data
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error updating user.');
    }
  }

  /**
   * Deletes multiple users by their IDs.
   * @param ids - The array of user IDs to delete
   * @throws UserNotFoundException if any user IDs are not found
   */
  async deleteMultipleUsers(ids: number[]) {
    const existingUsers = await this.prisma.user.findMany({
      where: { id: { in: ids } },
    });

    if (existingUsers.length !== ids.length) {
      const existingIds = existingUsers.map((user) => user.id);
      const missingIds = ids.filter((id) => !existingIds.includes(id));
      throw new BadRequestException(
        `Users with IDs ${missingIds.join(', ')} not found`,
      );
    }

    try {
      await this.prisma.user.deleteMany({
        where: { id: { in: ids } },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error deleting users.');
    }
  }

  /**
   * Gets all users transformed into DTOs.
   * @returns List of users transformed into DTOs
   * @throws InternalServerErrorException if any error occurs during the query
   */
  async getAllUsersWithDto() {
    try {
      const users = await this.prisma.user.findMany();
      return plainToInstance(UserDto, users, { excludeExtraneousValues: true });
    } catch (error) {
      throw new InternalServerErrorException('Error fetching user list.');
    }
  }
}
