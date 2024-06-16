import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    async createUser(username: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
        data: {
            username,
            password: hashedPassword
        }
    })    
    }
    async findByUsername(username: string) {
        return this.prisma.user.findUnique({
            where: { username}
        })
    }
}
