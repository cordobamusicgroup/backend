import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { BalancesService } from './balances.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Currency } from '@prisma/client';
import { JwtPayloadDto } from 'src/resources/auth/dto/jwt-payload.dto';

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
  async getBalanceTransactions(
    @Query('currency') currency: string,
    @Request() req,
  ) {
    const user: JwtPayloadDto = req.user;
    return this.balancesService.getBalanceTransactions(
      user,
      currency as Currency,
    );
  }
}
