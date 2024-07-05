// src/freeagent/freeagent.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FreeAgentService } from './freeagent.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('freeagent')
export class FreeAgentController {
  constructor(private readonly freeAgentService: FreeAgentService) {}

  @Get('login')
  @Public()
  @UseGuards(AuthGuard('freeagent'))
  async login() {
    // El usuario será redirigido a FreeAgent para autorizar la aplicación
  }

  @Get('callback')
  @Public()
  @UseGuards(AuthGuard('freeagent'))
  async callback() {
    // Redirige a una página de éxito o dashboard después de la autenticación
    return { message: 'Success' };
  }
  @Get('invoices')
  @Public()
  async getInvoices() {
    const invoices = await this.freeAgentService.getInvoices();
    return invoices;
  }
}
