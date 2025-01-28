import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientExtendedDto } from './dto/client-extended.dto';
import { ContractDto } from './dto/contract/contract.dto';
import { AddressDto } from './dto/address/address.dto';
import { BalanceDto } from '../financial/balances/dto/balance.dto';
import { DmbDto } from './dto/dmb/dmb.dto';
import { Currency } from '@prisma/client';
import { convertToDto } from 'src/common/utils/convert-dto.util';
import { getCountryName } from 'src/common/utils/get-countryname.util';
import { ConflictRecordsException } from 'src/common/exceptions/CustomHttpException';
import {
  PrismaClientKnownRequestError,
  Decimal,
} from '@prisma/client/runtime/library';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Main method to create a client.
   * This method creates a new client along with its address, contract, DMB, and balance information.
   *
   * @param userObject - The DTO containing client creation data
   * @returns The created client as a ClientDto
   */
  async create(userObject: CreateClientDto): Promise<ClientExtendedDto> {
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
              { amount: new Decimal(0), currency: Currency.EUR },
              { amount: new Decimal(0), currency: Currency.USD },
            ],
          },
        },
      },
      include: { address: true, contract: true, balances: true, dmb: true },
    });

    return this.convertToClientDto(client);
  }

  /**
   * Main method to update a client.
   * This method performs a partial update, meaning that only the provided fields in the UpdateClientDto
   * will be modified. If any nested objects such as address, contract, or dmb are provided,
   * they will also be updated, without deleting and recreating them.
   *
   * @param id - The ID of the client to be updated
   * @param updateClientDto - The DTO containing the fields to be updated
   * @returns The updated client as a ClientDto
   */
  async updateClient(
    id: number,
    updateClientDto: UpdateClientDto,
  ): Promise<ClientExtendedDto> {
    const { address, contract, dmb, ...clientData } = updateClientDto;

    const updatedClient = await this.prisma.client.update({
      where: { id },
      data: {
        ...clientData,
        address: {
          update: { ...address },
        },
        contract: {
          update: { ...contract },
        },
        dmb: {
          update: { ...dmb },
        },
      },
      include: { address: true, contract: true, balances: true, dmb: true },
    });

    return this.convertToClientDto(updatedClient);
  }

  /**
   * Method to delete multiple clients.
   *
   * @param ids - The array of client IDs to be deleted
   * @throws NotFoundException if any client IDs are not found
   * @throws ConflictException if there are existing relations that prevent deletion
   */
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

    try {
      await this.prisma.client.deleteMany({
        where: { id: { in: ids } },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictRecordsException();
      }
      throw error;
    }
  }

  /**
   * Method to retrieve all clients.
   *
   * @returns An array of ClientDto objects representing all clients
   */
  async getClients(): Promise<ClientExtendedDto[]> {
    const clients = await this.prisma.client.findMany({
      include: { address: true, contract: true, balances: true, dmb: true },
    });

    return Promise.all(
      clients.map((client) => this.convertToClientDto(client)),
    );
  }

  /**
   * Method to retrieve a client by ID.
   * Throws a NotFoundException if the client does not exist.
   *
   * @param id - The ID of the client to retrieve
   * @returns The client as a ClientDto
   */
  async getClientById(id: number): Promise<ClientExtendedDto> {
    const client = await this.findClientById(id);
    return this.convertToClientDto(client);
  }

  /**
   * Method to update a client's address.
   * If the address exists, it will be updated with the new data.
   *
   * @param addressId - The ID of the address to be updated
   * @param address - The new address data
   * @returns The updated address
   */
  private async updateAddress(addressId: number, address: any): Promise<any> {
    return this.prisma.address.update({
      where: { id: addressId },
      data: { ...address },
    });
  }

  /**
   * Method to update a client's contract.
   * If the contract exists, it will be updated with the new data.
   *
   * @param contractId - The ID of the contract to be updated
   * @param contract - The new contract data
   * @returns The updated contract
   */
  private async updateContract(
    contractId: number,
    contract: any,
  ): Promise<any> {
    return this.prisma.contract.update({
      where: { id: contractId },
      data: { ...contract },
    });
  }

  /**
   * Method to update a client's DMB (Digital Music Bundle) data.
   * If the DMB exists, it will be updated with the new data.
   *
   * @param dmbId - The ID of the DMB record to be updated
   * @param dmb - The new DMB data
   * @returns The updated DMB data
   */
  private async updateDmb(dmbId: number, dmb: any): Promise<any> {
    return this.prisma.clientDMB.update({
      where: { id: dmbId },
      data: { ...dmb },
    });
  }

  /**
   * Helper method to validate the client data before creating or updating a client.
   * Ensures that clientName is unique and VAT-related fields are correct.
   *
   * @param clientData - The client data to validate
   * @throws BadRequestException if validation fails
   */
  private async validateClientData(
    clientData: Partial<CreateClientDto>,
  ): Promise<void> {
    const existingClient = await this.prisma.client.findFirst({
      where: { clientName: clientData.clientName },
    });

    if (existingClient) {
      throw new BadRequestException('Client with this name already exists');
    }

    if (clientData.vatRegistered && !clientData.vatId) {
      throw new BadRequestException(
        'VAT ID is required for VAT-registered clients',
      );
    }
  }

  /**
   * Helper method to find a client by its ID.
   * Throws a NotFoundException if the client does not exist.
   *
   * @param id - The client ID to search for
   * @returns The found client
   * @throws NotFoundException if the client does not exist
   */
  private async findClientById(id: number) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { address: true, contract: true, balances: true, dmb: true },
    });
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
    return client;
  }

  /**
   * Helper method to convert a client entity to a ClientDto.
   * Also converts related entities like address, contract, and balances.
   *
   * @param client - The client entity
   * @returns The converted ClientDto
   */
  private async convertToClientDto(client: any): Promise<ClientExtendedDto> {
    const addressDto = await convertToDto(client.address, AddressDto);
    const contractDto = await convertToDto(client.contract, ContractDto);
    const dmbDto = await convertToDto(client.dmb, DmbDto);

    const balanceDtos = await Promise.all(
      client.balances.map((balance) =>
        convertToDto(
          {
            ...balance,
            amount: balance.amount.toNumber(),
            amountRetain: balance.amountRetain.toNumber(),
          },
          BalanceDto,
        ),
      ),
    );

    addressDto.countryName = await getCountryName(
      this.prisma,
      addressDto.countryId,
    );

    return convertToDto(
      {
        ...client,
        address: addressDto,
        dmb: dmbDto,
        contract: contractDto,
        balances: balanceDtos,
      },
      ClientExtendedDto,
    );
  }
}
