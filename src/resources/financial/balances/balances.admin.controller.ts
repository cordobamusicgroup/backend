import {
  Body,
  Controller,
  Get,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/generated/client';
import { ModifyBalanceDto } from './dto/modify-balance.dto';
import { BalancesAdminService } from './balances-admin.service';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class BalancesAdminController {
  constructor(private readonly balancesService: BalancesAdminService) {}

  @Patch('modify')
  async modifyBalance(
    @Body() modifyBalanceDto: ModifyBalanceDto,
  ): Promise<any> {
    return this.balancesService.modifyBalance(modifyBalanceDto);
  }

  @Get('total-balances')
  async getTotalBalances() {
    return this.balancesService.getTotalBalances();
  }

  @Delete('reverse-transaction')
  async reverseTransaction(
    @Body('transactionId') transactionId: number,
  ): Promise<any> {
    return this.balancesService.reverseTransaction(transactionId);
  }

  // Nuevo endpoint para restaurar una transacción
  @Patch('restore-transaction')
  async restoreTransaction(
    @Body('transactionId') transactionId: number,
  ): Promise<any> {
    return this.balancesService.restoreTransaction(transactionId);
  }
}
