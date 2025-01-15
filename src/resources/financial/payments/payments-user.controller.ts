import {
  Controller,
  Get,
  UseGuards,
  UseInterceptors,
  Request,
  Patch,
  Body,
} from '@nestjs/common';
import { PaymentsUserService } from './payments-user.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { JwtPayloadInterceptor } from 'src/common/interceptors/jwt-payload.interceptor';

@Controller()
@UseGuards(JwtAuthGuard)
@UseInterceptors(JwtPayloadInterceptor)
export class PaymentsUserController {
  constructor(private readonly paymentsUserService: PaymentsUserService) {}

  @Get('withdrawal-authorized')
  async getClientPaymentStatus(@Request() req) {
    return this.paymentsUserService.getClientPaymentStatus(req.jwtPayload);
  }

  @Patch('update-payment-information')
  async updatePaymentInformation(
    @Request() req,
    @Body() paymentData: Record<string, any>,
  ) {
    return this.paymentsUserService.requestUpdatePaymentInfo(
      req.jwtPayload,
      paymentData,
    );
  }

  @Get('payment-information-history')
  async getPaymentInformationHistory(@Request() req) {
    return this.paymentsUserService.getPaymentInformationHistory(
      req.jwtPayload,
    );
  }
}
