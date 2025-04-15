import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { BalancesService } from './balances-user.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Currency } from 'src/generated/client';
import { JwtPayloadDto } from 'src/resources/auth/dto/jwt-payload.dto';
import { BalanceTransactionDto } from './dto/balance-transaction.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/generated/client';
import { GetCurrentUserJwt } from 'src/common/decorators/get-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class BalancesUserController {
  constructor(private readonly balancesService: BalancesService) {}

  @Get()
  async getUserBalances(@Request() req) {
    const user: JwtPayloadDto = req.user;
    return this.balancesService.getUserBalances(user);
  }

  @Get('transactions')
  @Roles(Role.ADMIN)
  async getBalanceTransactions(
    @Query('currency') currency: string,
    @GetCurrentUserJwt() user,
  ): Promise<BalanceTransactionDto[]> {
    return this.balancesService.getBalanceTransactions(
      user,
      currency as Currency,
    );
  }
}
