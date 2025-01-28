import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
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
}
