import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientExtendedDto } from './dto/client-extended.dto';
import { ContractDto } from './dto/contract/contract.dto';
import { AddressDto } from './dto/address/address.dto';
import { BalanceDto } from '../financial/balances/dto/balance.dto';
import { DmbDto } from './dto/dmb/dmb.dto';
import { ClientStatus, Currency, TransactionType } from 'generated/client';
import { convertToDto } from 'src/common/utils/convert-dto.util';
import { getCountryName } from 'src/common/utils/get-countryname.util';
import {
  ConflictRecordsException,
  UserNotFoundException,
} from 'src/common/exceptions/CustomHttpException';
import {
  PrismaClientKnownRequestError,
  Decimal,
} from 'generated/client/runtime/library';
import { ClientValidationSchema } from './validation/client-validation.schema';
import { validateWithZod } from 'src/common/utils/zod-validate.util';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Main method to create a client.
   * This method creates a new client along with its address, contract, DMB, and balance information.
   *
   * @param userObject - The DTO containing client creation data
   * @returns The created client as a ClientDto
   */
  async create(userObject: CreateClientDto): Promise<ClientExtendedDto> {
    validateWithZod(ClientValidationSchema, userObject);
    await this.validateClientData(userObject);
    const generalContact = await this.getAndValidateGeneralContact(
      userObject.generalContactId,
    );
    const data = this.buildClientData(userObject, generalContact, 'create');
    const client = await this.prisma.client.create({
      data,
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
    validateWithZod(ClientValidationSchema, updateClientDto);
    const generalContact = await this.getAndValidateGeneralContact(
      updateClientDto.generalContactId,
    );
    const data = this.buildClientData(
      updateClientDto,
      generalContact,
      'update',
    );
    const updatedClient = await this.prisma.client.update({
      where: { id },
      data,
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
   * Blocks a client and retains their funds
   */
  async blockClient(clientId: number): Promise<any> {
    return this.prisma.$transaction(async (prisma) => {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { balances: true },
      });
      if (!client) throw new NotFoundException('Client not found');
      if (client.status === 'BLOCKED')
        throw new BadRequestException('Client is already blocked');

      const moved: Record<string, number> = {};
      for (const balance of client.balances) {
        if (balance.amount.gt(0)) {
          const currency = balance.currency;
          const amountNum = balance.amount.toNumber();
          moved[currency] = (moved[currency] || 0) + amountNum;
          await prisma.transaction.create({
            data: {
              type: TransactionType.OTHER,
              description: 'Client blocked: funds retained',
              amount: balance.amount.negated(),
              balanceAmount: 0,
              balanceId: balance.id,
            },
          });
          await prisma.balance.update({
            where: { id: balance.id },
            data: {
              amountRetain: { increment: balance.amount },
              amount: 0,
            },
          });
          this.logger.log(
            `Blocked client ${clientId}: moved ${amountNum} ${currency} to retained funds.`,
          );
        }
      }
      await prisma.client.update({
        where: { id: clientId },
        data: { status: 'BLOCKED' },
      });
      this.logger.log(`Client ${clientId} blocked successfully.`);
      const movedMsg = Object.entries(moved)
        .map(([cur, amt]) => `${amt} ${cur}`)
        .join(' and ');
      return {
        success: true,
        action: 'blocked',
        moved,
        message: `Client blocked, ${movedMsg ? movedMsg + ' moved to retained funds.' : 'no funds moved.'}`,
      };
    });
  }

  /**
   * Unblocks a client and releases their funds
   */
  async unblockClient(clientId: number): Promise<any> {
    return this.prisma.$transaction(async (prisma) => {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { balances: true },
      });
      if (!client) throw new NotFoundException('Client not found');
      if (client.status !== 'BLOCKED')
        throw new BadRequestException('Client is not blocked');

      const moved: Record<string, number> = {};
      for (const balance of client.balances) {
        if (balance.amountRetain.gt(0)) {
          const currency = balance.currency;
          const amountNum = balance.amountRetain.toNumber();
          moved[currency] = (moved[currency] || 0) + amountNum;
          const newAmount = balance.amount.plus(balance.amountRetain);
          await prisma.transaction.create({
            data: {
              type: TransactionType.OTHER,
              description: 'Client unblocked: funds released',
              amount: balance.amountRetain,
              balanceAmount: newAmount,
              balanceId: balance.id,
            },
          });
          await prisma.balance.update({
            where: { id: balance.id },
            data: {
              amount: { increment: balance.amountRetain },
              amountRetain: 0,
            },
          });
          this.logger.log(
            `Unblocked client ${clientId}: released ${amountNum} ${currency} from retained funds.`,
          );
        }
      }
      await prisma.client.update({
        where: { id: clientId },
        data: { status: 'ACTIVE' },
      });
      this.logger.log(`Client ${clientId} unblocked successfully.`);
      const movedMsg = Object.entries(moved)
        .map(([cur, amt]) => `${amt} ${cur}`)
        .join(' and ');
      return {
        success: true,
        action: 'unblocked',
        moved,
        message: `Client unblocked, ${movedMsg ? movedMsg + ' released from retained funds.' : 'no funds released.'}`,
      };
    });
  }

  // Modify the terminateClient method to ensure consistency by requiring the client to be unblocked before termination
  async terminateClient(clientId: number, confirm: boolean): Promise<any> {
    if (!confirm) {
      throw new BadRequestException('Termination must be confirmed.');
    }
    return this.prisma.$transaction(async (prisma) => {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { balances: true },
      });
      if (!client) throw new NotFoundException('Client not found');
      if (client.status === ClientStatus.TERMINATED) {
        throw new BadRequestException('Client is already terminated');
      }

      // Ensure the client is not blocked before termination
      if (client.status === ClientStatus.BLOCKED) {
        throw new BadRequestException(
          'Client is blocked. Please unblock the client before termination to ensure consistency.',
        );
      }

      let moved: Record<string, number> = {};
      for (const balance of client.balances) {
        const total = balance.amount.plus(balance.amountRetain);
        if (total.gt(0)) {
          const currency = balance.currency;
          const amountNum = total.toNumber();
          moved[currency] = (moved[currency] || 0) + amountNum;
          // Move to amountTerminated
          await prisma.balance.update({
            where: { id: balance.id },
            data: {
              amountTerminated: { increment: total },
              amount: 0,
              amountRetain: 0,
            },
          });
          // Create termination transaction
          await prisma.transaction.create({
            data: {
              type: TransactionType.OTHER,
              description: 'Account Terminated',
              amount: total.negated(),
              balanceAmount: 0,
              balanceId: balance.id,
            },
          });
        }
      }

      await prisma.client.update({
        where: { id: clientId },
        data: { status: ClientStatus.TERMINATED },
      });
      const movedMsg = Object.entries(moved)
        .map(([cur, amt]) => `${amt} ${cur}`)
        .join(' and ');
      return {
        success: true,
        action: 'terminated',
        moved,
        message: `Client terminated, ${movedMsg ? movedMsg + ' moved to terminated funds.' : 'no funds moved.'}`,
      };
    });
  }

  async undoTerminateClient(clientId: number): Promise<any> {
    return this.prisma.$transaction(async (prisma) => {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { balances: true },
      });
      if (!client) throw new NotFoundException('Client not found');
      if (client.status !== ClientStatus.TERMINATED) {
        throw new BadRequestException('Client is not terminated');
      }
      let restored: Record<string, number> = {};
      for (const balance of client.balances) {
        if (balance.amountTerminated.gt(0)) {
          const currency = balance.currency;
          const amountNum = balance.amountTerminated.toNumber();
          restored[currency] = (restored[currency] || 0) + amountNum;
          // Restore funds
          await prisma.balance.update({
            where: { id: balance.id },
            data: {
              amount: { increment: balance.amountTerminated },
              amountTerminated: 0,
            },
          });
          // Delete the termination transaction (Account Terminated)
          await prisma.transaction.deleteMany({
            where: {
              balanceId: balance.id,
              description: 'Account Terminated',
            },
          });
        }
      }
      await prisma.client.update({
        where: { id: clientId },
        data: { status: ClientStatus.ACTIVE },
      });
      const movedMsg = Object.entries(restored)
        .map(([cur, amt]) => `${amt} ${cur}`)
        .join(' and ');
      return {
        success: true,
        action: 'undo-terminated',
        restored,
        message: `Termination undone, ${movedMsg ? movedMsg + ' funds restored.' : 'no funds restored.'}`,
      };
    });
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
    // Defensive: If any related entity is missing, avoid errors
    const addressDto = client.address
      ? await convertToDto(client.address, AddressDto)
      : null;
    const contractDto = client.contract
      ? await convertToDto(client.contract, ContractDto)
      : null;
    const dmbDto = client.dmb ? await convertToDto(client.dmb, DmbDto) : null;

    // Defensive: balances may be undefined or empty
    const balanceDtos = Array.isArray(client.balances)
      ? await Promise.all(
          client.balances.map((balance) =>
            convertToDto(
              {
                ...balance,
                amount: balance.amount?.toNumber?.() ?? 0,
                amountRetain: balance.amountRetain?.toNumber?.() ?? 0,
              },
              BalanceDto,
            ),
          ),
        )
      : [];

    if (addressDto && addressDto.countryId) {
      addressDto.countryName = await getCountryName(
        this.prisma,
        addressDto.countryId,
      );
    }

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

  // --- Helpers ---

  private async getAndValidateGeneralContact(generalContactId?: number) {
    if (!generalContactId) return null;
    const generalContact = await this.prisma.user.findUnique({
      where: { id: generalContactId },
    });
    if (!generalContact) throw new UserNotFoundException();
    return generalContact;
  }

  private buildClientData(
    dto: any,
    generalContact: any,
    mode: 'create' | 'update',
  ) {
    const { address, contract, dmb, generalContactId, ...clientData } = dto;
    const data: any = {
      ...clientData,
      generalContact: generalContact
        ? { connect: { id: generalContact.id } }
        : undefined,
    };
    if (address) {
      data.address =
        mode === 'create' ? { create: address } : { update: { ...address } };
    }
    if (contract) {
      // Calcular el valor de signed automáticamente
      const status = contract.status;
      const signed = status === 'DRAFT' ? false : true;
      const contractData = { ...contract, signed };
      data.contract =
        mode === 'create'
          ? { create: contractData }
          : { update: { ...contractData } };
    }
    if (dmb) {
      data.dmb = mode === 'create' ? { create: dmb } : { update: { ...dmb } };
    }
    if (mode === 'create') {
      data.balances = {
        createMany: {
          data: [
            { amount: new Decimal(0), currency: Currency.EUR },
            { amount: new Decimal(0), currency: Currency.USD },
          ],
        },
      };
    }
    return data;
  }
}
