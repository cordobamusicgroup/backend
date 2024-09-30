import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { BalancesService } from './balances.service';
import { BalanceDto } from './dto/balance.dto';
import { ModifyBalanceDto } from './dto/modify-balance.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('financial')
@UseGuards(RolesGuard)
export class FinancialController {
  constructor(private readonly balancesService: BalancesService) {}

  @Patch('balances/modify')
  @Roles(Role.ADMIN)
  async modifyBalance(
    @Body() modifyBalanceDto: ModifyBalanceDto,
  ): Promise<BalanceDto> {
    const { clientId, currency, amount, description, operationType } =
      modifyBalanceDto;
    return this.balancesService.modifyBalance(
      clientId,
      currency,
      amount,
      description,
      operationType,
    );
  }
}
