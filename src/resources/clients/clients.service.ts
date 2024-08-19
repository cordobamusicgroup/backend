import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { plainToInstance } from 'class-transformer';
import { ClientDto } from './dto/client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new client.
   * @param userObject - The data for creating a client.
   * @returns A promise that resolves to the created client.
   */
  async create(userObject: CreateClientDto) {
    const { address, ...clientData } = userObject;
    return this.prisma.client.create({
      data: {
        ...clientData,
        address: {
          create: address,
        },
      },
    });
  }

  /**
   * Updates an existing client.
   * @param id - The ID of the client to update.
   * @param userObject - The data for updating the client.
   * @returns A promise that resolves to the updated client.
   * @throws NotFoundException if the client with the specified ID is not found.
   */
  async update(id: number, userObject: UpdateClientDto) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    const { address, ...clientData } = userObject;

    if (address) {
      if (client.addressId) {
        await this.prisma.address.update({
          where: { id: client.addressId },
          data: address,
        });
      } else {
        await this.prisma.address.create({
          data: {
            ...address,
            client: { connect: { id: client.id } },
          },
        });
      }
    }

    return this.prisma.client.update({
      where: { id },
      data: clientData,
    });
  }

  /**
   * Deletes a client.
   * @param id - The ID of the client to delete.
   * @returns A promise that resolves when the client is deleted.
   * @throws NotFoundException if the client with the specified ID is not found.
   */
  async delete(id: number) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return this.prisma.client.delete({
      where: { id },
    });
  }

  async getClients() {
    const clients = await this.prisma.client.findMany({
      include: {
        address: true,
      },
    });
    return plainToInstance(ClientDto, clients, {
      excludeExtraneousValues: true,
    });
  }

  async getClientById(id: number) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        address: true,
      },
    });
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
    return plainToInstance(ClientDto, client, {
      excludeExtraneousValues: true,
    });
  }
}
