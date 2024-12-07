import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { BalancesService } from '../../balances.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ModifyBalanceDto } from '../../dto/modify-balance.dto';

@Controller('admin')
@UseGuards(RolesGuard)
export class BalancesAdminController {
  constructor(private readonly balancesService: BalancesService) {}

  @Patch('modify')
  @Roles(Role.ADMIN)
  async modifyBalance(
    @Body() modifyBalanceDto: ModifyBalanceDto,
  ): Promise<any> {
    return this.balancesService.modifyBalance(modifyBalanceDto);
  }
}
