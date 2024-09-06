import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { ClientDto } from './dto/client.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from '@prisma/client';

@Controller('clients')
@UseGuards(RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() createClientDto: CreateClientDto): Promise<ClientDto> {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  async findAll(): Promise<ClientDto[]> {
    return this.clientsService.getClients();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<ClientDto> {
    return this.clientsService.getClientById(id);
  }

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
