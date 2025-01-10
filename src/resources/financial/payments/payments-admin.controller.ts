import {
  Controller,
  Patch,
  Param,
  UseGuards,
  Get,
  Body,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { PaymentsAdminService } from './payments-admin.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { JwtPayloadInterceptor } from 'src/common/interceptors/jwt-payload.interceptor';

@Controller('admin')
@UseGuards(JwtAuthGuard)
@UseInterceptors(JwtPayloadInterceptor)
export class PaymentsAdminController {
  constructor(private readonly paymentsAdminService: PaymentsAdminService) {}

  @Patch('approve/:clientId')
  async approvePaymentInformation(
    @Request() req,
    @Param('clientId') clientId: number,
  ) {
    return this.paymentsAdminService.approvePaymentInformation(
      req.jwtPayload,
      Number(clientId),
    );
  }

  @Patch('reject/:clientId')
  async rejectPaymentInformation(
    @Request() req,
    @Param('clientId') clientId: number,
    @Body('reason') reason: string,
  ) {
    return this.paymentsAdminService.rejectPaymentInformation(
      req.jwtPayload,
      clientId,
      reason,
    );
  }

  @Get('pending')
  async listPendingPaymentRequests() {
    return this.paymentsAdminService.listPendingPaymentRequests();
  }

  @Get('details/:clientId')
  async getPaymentRequestDetails(@Param('clientId') clientId: number) {
    return this.paymentsAdminService.getPaymentRequestDetails(clientId);
  }

  @Get('history/:clientId')
  async getClientPaymentInformationHistory(
    @Param('clientId') clientId: number,
  ) {
    return this.paymentsAdminService.getClientPaymentInformationHistory(
      clientId,
    );
  }
}
