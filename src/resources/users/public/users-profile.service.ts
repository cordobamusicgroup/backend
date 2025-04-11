import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { UserNotFoundException } from 'src/common/exceptions/CustomHttpException';
import { UserDto } from '../dto/user.dto';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersProfileService {
  private readonly logger = new Logger(UsersProfileService.name);

  constructor(private readonly prisma: PrismaService) {}

  private convertToDto(user: any): UserDto {
    return plainToInstance(UserDto, user, { excludeExtraneousValues: true });
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
    return this.convertToDto(user);
  }

  /**
   * Updates a user's profile.
   * @param id - The ID of the user to update
   * @param updateUserDto - The DTO containing the fields to update
   * @returns The updated user
   */
  async updateUserProfile(id: number, updateUserDto: any) {
    try {
      if (updateUserDto.currentPassword) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
          this.logger.warn(`User with ID ${id} not found.`);
          throw new BadRequestException('User not found.');
        }

        const isPasswordValid = await bcrypt.compare(
          updateUserDto.currentPassword,
          user.password,
        ); // Compare encrypted password
        if (!isPasswordValid) {
          this.logger.warn(`Invalid current password for user ID ${id}.`);
          throw new BadRequestException('Invalid current password.');
        }
      }

      // Remove currentPassword from the updateUserDto before updating the database
      const { currentPassword, ...updateUserDtoWithoutPassword } =
        updateUserDto;

      // Create an object to only include allowed fields for update
      const allowedFields = ['email', 'fullName', 'password'];
      const updateData: any = {};

      for (const field of allowedFields) {
        if (updateUserDto[field]) {
          updateData[field] = updateUserDto[field];
        }
      }

      if (updateUserDto.newPassword) {
        const hashedPassword = await bcrypt.hash(updateUserDto.newPassword, 10);
        updateData.password = hashedPassword;
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });
      return this.convertToDto(updatedUser);
    } catch (error) {
      this.logger.error(
        `Error updating user profile for ID ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
