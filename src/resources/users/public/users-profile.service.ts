import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { UserNotFoundException } from 'src/common/exceptions/CustomHttpException';
import { UserDto } from '../dto/user.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UsersProfileService {
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
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });
      return this.convertToDto(updatedUser);
    } catch (error) {
      throw new Error('Error updating user profile.');
    }
  }
}
