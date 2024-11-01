import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea un nuevo usuario en la base de datos.
   * @param username - El nombre de usuario
   * @param email - El correo electrónico
   * @param password - La contraseña sin hash
   * @returns El usuario creado
   * @throws ConflictException si el username o email ya están en uso
   * @throws InternalServerErrorException si ocurre algún otro error
   */
  async createUser(username: string, email: string, password: string) {
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
      if (error.code === 'P2002') {
        // Prisma error code for unique constraint violation
        throw new ConflictException('El username o email ya están en uso.');
      }
      throw new InternalServerErrorException('Error al crear el usuario.');
    }
  }

  /**
   * Busca un usuario por su nombre de usuario.
   * @param username - El nombre de usuario
   * @returns El usuario encontrado o lanza una excepción si no existe
   * @throws NotFoundException si el usuario no es encontrado
   */
  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    if (!user) {
      throw new NotFoundException(
        `No se encontró un usuario con el username: ${username}`,
      );
    }
    return user;
  }

  /**
   * Busca un usuario por su correo electrónico.
   * @param email - El correo electrónico del usuario
   * @returns El usuario encontrado o lanza una excepción si no existe
   * @throws NotFoundException si el usuario no es encontrado
   */
  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new NotFoundException(
        `No se encontró un usuario con el email: ${email}`,
      );
    }
    return user;
  }

  /**
   * Obtiene todos los usuarios con sus relaciones de cliente.
   * @returns Lista de usuarios transformada en DTOs
   * @throws InternalServerErrorException si ocurre algún error durante la consulta
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
      throw new InternalServerErrorException(
        'Error al obtener la lista de usuarios.',
      );
    }
  }
}
