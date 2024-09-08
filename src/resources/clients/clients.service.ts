import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { ClientDto } from './dto/client.dto';
import { plainToInstance } from 'class-transformer';
import { AddressDto } from './address/dto/address.dto';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ContractDto } from './contract/dto/contract.dto';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  // Main methods
  async create(userObject: CreateClientDto): Promise<ClientDto> {
    await this.validateUniqueClientName(userObject.clientName);
    await this.validateVatIdExistOrNo(userObject);
    const { address, contract, ...clientData } = userObject;
    const client = await this.prisma.client.create({
      data: {
        ...clientData,
        address: {
          create: address,
        },
        contract: {
          create: contract,
        },
      },
      include: { address: true, contract: true },
    });

    return this.convertToClientDto(client);
  }

  async deleteMultiple(ids: number[]): Promise<void> {
    const existingClients = await this.prisma.client.findMany({
      where: { id: { in: ids } },
    });

    if (existingClients.length !== ids.length) {
      const existingIds = existingClients.map((client) => client.id);
      const missingIds = ids.filter((id) => !existingIds.includes(id));
      throw new NotFoundException(
        `Clients with IDs ${missingIds.join(', ')} not found`,
      );
    }
    await this.prisma.client.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async getClients(): Promise<ClientDto[]> {
    const clients = await this.prisma.client.findMany({
      include: { address: true, contract: true },
    });

    return Promise.all(
      clients.map((client) => this.convertToClientDto(client)),
    );
  }

  async getClientById(id: number): Promise<ClientDto> {
    const client = await this.findClientById(id);

    return this.convertToClientDto(client);
  }

  // *** Helper methods *** //

  private async validateUniqueClientName(clientName: string) {
    const existingClient = await this.prisma.client.findFirst({
      where: { clientName },
    });

    if (existingClient) {
      throw new BadRequestException(
        this.i18n.translate('clients.CLIENT_EXISTS', {
          args: { clientName },
          lang: I18nContext.current().lang,
        }),
      );
    }
  }

  private async validateVatIdExistOrNo(userObject: CreateClientDto) {
    if (userObject.vatRegistered && !userObject.vatId) {
      throw new BadRequestException(
        this.i18n.translate('clients.CLIENT_VATIDMISSING', {
          lang: I18nContext.current().lang,
        }),
      );
    }
  }

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
      exposeUnsetFields: false,
    });
    const contractDto = plainToInstance(ContractDto, client.contract, {
      excludeExtraneousValues: true,
      exposeUnsetFields: false,
    });

    addressDto.countryName = await this.getCountryName(addressDto.countryId);

    const clientDto = plainToInstance(
      ClientDto,
      {
        ...client,
        address: addressDto,
        contract: contractDto,
      },
      {
        excludeExtraneousValues: true,
        exposeUnsetFields: false,
      },
    );

    return clientDto;
  }
}
