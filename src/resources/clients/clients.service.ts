import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientDto } from './dto/client.dto';
import { plainToInstance } from 'class-transformer';
import { AddressDto } from './address/dto/address.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  // Main methods
  async create(userObject: CreateClientDto): Promise<ClientDto> {
    const { address, ...clientData } = userObject;
    const client = await this.prisma.client.create({
      data: {
        ...clientData,
        address: {
          create: address,
        },
      },
      include: { address: true },
    });

    return this.convertToClientDto(client);
  }

  async update(id: number, userObject: UpdateClientDto): Promise<ClientDto> {
    const client = await this.findClientById(id);

    const { address, ...clientData } = userObject;

    if (address) {
      await this.updateOrCreateAddress(client.addressId, address, client.id);
    }

    const updatedClient = await this.prisma.client.update({
      where: { id },
      data: clientData,
      include: { address: true },
    });

    return this.convertToClientDto(updatedClient);
  }

  async delete(id: number): Promise<void> {
    await this.findClientById(id);
    await this.prisma.client.delete({
      where: { id },
    });
  }

  async getClients(): Promise<ClientDto[]> {
    const clients = await this.prisma.client.findMany({
      include: { address: true },
    });

    return Promise.all(
      clients.map((client) => this.convertToClientDto(client)),
    );
  }

  async getClientById(id: number): Promise<ClientDto> {
    const client = await this.findClientById(id);

    return this.convertToClientDto(client);
  }

  // *** Helper methods ***

  private async findClientById(id: number) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { address: true },
    });
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
    return client;
  }

  private async updateOrCreateAddress(
    addressId: number | null,
    address: any,
    clientId: number,
  ) {
    if (addressId) {
      await this.prisma.address.update({
        where: { id: addressId },
        data: address,
      });
    } else {
      await this.prisma.address.create({
        data: {
          ...address,
          client: { connect: { id: clientId } },
        },
      });
    }
  }

  private async getCountryName(countryId: number): Promise<string> {
    const country = await this.prisma.country.findUnique({
      where: { id: countryId },
    });
    return country ? country.name : 'Unknown';
  }

  private async convertToClientDto(client: any): Promise<ClientDto> {
    const addressDto = plainToInstance(AddressDto, client.address, {
      excludeExtraneousValues: true,
    });

    addressDto.countryName = await this.getCountryName(addressDto.countryId);

    return plainToInstance(
      ClientDto,
      {
        ...client,
        address: addressDto,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }
}
