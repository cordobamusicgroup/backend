import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { ClientDto } from './dto/client.dto';
import { plainToInstance } from 'class-transformer';
import { I18nService } from 'nestjs-i18n';
import { ContractDto } from './dto/contract/contract.dto';
import { AddressDto } from './dto/address/address.dto';
import { Currency } from '@prisma/client';
import { BalanceDto } from '../financial/dto/balance.dto';
import { DmbDto } from './dto/dmb/dmb.dto';
import { TranslationHelper } from 'src/common/helper/translation.helper';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly translationHelper: TranslationHelper,
  ) {}

  // Main methods
  async create(userObject: CreateClientDto): Promise<ClientDto> {
    await this.validateClientData(userObject);
    const { address, contract, dmb, ...clientData } = userObject;
    const client = await this.prisma.client.create({
      data: {
        ...clientData,
        address: {
          create: address,
        },
        contract: {
          create: contract,
        },
        dmb: {
          create: dmb,
        },
        balances: {
          createMany: {
            data: [
              { amount: 0, currency: Currency.EUR },
              { amount: 0, currency: Currency.USD },
            ],
          },
        },
      },
      include: { address: true, contract: true, balances: true, dmb: true },
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
      include: { address: true, contract: true, balances: true, dmb: true },
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
  private async validateClientData(userObject: CreateClientDto): Promise<void> {
    const existingClient = await this.prisma.client.findFirst({
      where: { clientName: userObject.clientName },
    });

    if (existingClient) {
      throw new BadRequestException(
        this.translationHelper.translateError('clients.CLIENT_EXISTS', {
          clientName: userObject.clientName,
        }),
      );
    }

    if (userObject.vatRegistered && !userObject.vatId) {
      throw new BadRequestException(
        this.translationHelper.translateError('clients.CLIENT_VATIDMISSING'),
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

  private async convertToDto<T, K>(entity: T, dto: new () => K): Promise<K> {
    return plainToInstance(dto, entity, {
      excludeExtraneousValues: true,
      exposeUnsetFields: false,
    });
  }

  private async convertToClientDto(client: any): Promise<ClientDto> {
    const addressDto = await this.convertToDto(client.address, AddressDto);
    const contractDto = await this.convertToDto(client.contract, ContractDto);
    const dmbDto = await this.convertToDto(client.dmb, DmbDto);
    const balanceDtos = await Promise.all(
      client.balances.map((balance) => this.convertToDto(balance, BalanceDto)),
    );

    addressDto.countryName = await this.getCountryName(addressDto.countryId);

    const clientDto = await this.convertToDto(
      {
        ...client,
        address: addressDto,
        dmb: dmbDto,
        contract: contractDto,
        balances: balanceDtos,
      },
      ClientDto,
    );

    return clientDto;
  }
}
