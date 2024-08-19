import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
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

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateClientDto: UpdateClientDto,
  ): Promise<ClientDto> {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<{ message: string }> {
    await this.clientsService.delete(id);
    return { message: `Client with ID ${id} deleted successfully` };
  }
}
