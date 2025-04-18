import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Put,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientExtendedDto } from './dto/client-extended.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from 'generated/client';

@Controller('clients')
@UseGuards(RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  /**
   * Endpoint to create a new client.
   * Only accessible by ADMIN role.
   *
   * @param createClientDto - DTO containing the client data to be created
   * @returns The created client as ClientDto
   */
  @Post()
  @Roles(Role.ADMIN)
  async create(
    @Body() createClientDto: CreateClientDto,
  ): Promise<ClientExtendedDto> {
    return this.clientsService.create(createClientDto);
  }

  /**
   * Endpoint to retrieve all clients.
   * Only accessible by ADMIN role.
   *
   * @returns An array of ClientDto objects representing all clients
   */
  @Get()
  @Roles(Role.ADMIN)
  async findAll(): Promise<ClientExtendedDto[]> {
    return this.clientsService.getClients();
  }

  /**
   * Endpoint to retrieve a single client by its ID.
   * Only accessible by ADMIN role.
   *
   * @param id - The ID of the client to retrieve
   * @returns The requested client as ClientDto
   */
  @Get(':id')
  @Roles(Role.ADMIN)
  async findOne(@Param('id') id: number): Promise<ClientExtendedDto> {
    return this.clientsService.getClientById(Number(id));
  }

  /**
   * Endpoint to update an existing client by its ID.
   * Only accessible by ADMIN role.
   *
   * @param id - The ID of the client to be updated
   * @param updateClientDto - DTO containing the fields to update
   * @returns The updated client as ClientDto
   */
  @Put(':id')
  @Roles(Role.ADMIN)
  async updateClient(
    @Param('id') id: number,
    @Body() updateClientDto: UpdateClientDto,
  ): Promise<ClientExtendedDto> {
    return this.clientsService.updateClient(Number(id), updateClientDto);
  }

  /**
   * Endpoint to delete multiple clients by their IDs.
   * Only accessible by ADMIN role.
   *
   * @param deleteClientDto - Object containing an array of IDs to delete
   * @returns A success message
   */
  @Delete()
  @Roles(Role.ADMIN)
  async deleteMultiple(
    @Body() deleteClientDto: { ids: number[] },
  ): Promise<{ message: string }> {
    await this.clientsService.deleteMultiple(deleteClientDto.ids);
    return {
      message: `Clients with IDs ${deleteClientDto.ids.join(', ')} deleted successfully`,
    };
  }
}
