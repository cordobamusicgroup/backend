import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(username: string, email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });
  }
  async findByUsername(username: string) {
    return await this.prisma.user.findUnique({
      where: { username },
    });
  }
  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      include: {
        client: true,
      },
    });
    return plainToInstance(UserDto, users, { excludeExtraneousValues: true });
  }
}
