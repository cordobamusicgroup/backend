import {
  Controller,
  Get,
  UseGuards,
  Request,
  Patch,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { PaymentsUserService } from './payments-user.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { updatePaymentInfoSchema } from './validation-schemas';
import { ZodError } from 'zod';
import { GetCurrentUserJwt } from 'src/common/decorators/get-user.decorator';
import { JwtPayloadDto } from 'src/resources/auth/dto/jwt-payload.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class PaymentsUserController {
  constructor(private readonly paymentsUserService: PaymentsUserService) {}

  @Get('withdrawal-authorized')
  async getClientPaymentStatus(@GetCurrentUserJwt() user: JwtPayloadDto) {
    return this.paymentsUserService.getClientPaymentStatus(user);
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
}
