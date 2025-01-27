import {
  Controller,
  Get,
  UseGuards,
  UseInterceptors,
  Request,
  Patch,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { PaymentsUserService } from './payments-user.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { JwtPayloadInterceptor } from 'src/common/interceptors/jwt-payload.interceptor';
import { updatePaymentInfoSchema } from './validation-schemas';
import { ZodError } from 'zod';

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
  async updatePaymentInformation(@Request() req, @Body() paymentData: any) {
    try {
      updatePaymentInfoSchema.parse(paymentData);
    } catch (err) {
      if (err instanceof ZodError) {
        const formattedErrors = err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        throw new BadRequestException(formattedErrors);
      }
      throw new BadRequestException('Invalid data');
    }
    return this.paymentsUserService.requestUpdatePaymentInfo(
      req.jwt,
      paymentData,
    );
  }

  @Get('payment-information-history')
  async getPaymentInformationHistory(@Request() req) {
    return this.paymentsUserService.getPaymentInformationHistory(req.jwt);
  }
}
