import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { JwtPayloadDto } from 'src/resources/auth/dto/jwt-payload.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class PaymentsUserController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('authorized')
  async getClientPaymentStatus(@Request() req) {
    const user: JwtPayloadDto = req.user;
    return this.paymentsService.getClientPaymentStatus(user);
  }
}
