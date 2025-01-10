import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { PaymentMethod } from '@prisma/client';
import { StepFormKeys } from 'src/constants/step-form-keys';
import { JwtPayloadDto } from 'src/resources/auth/dto/jwt-payload.dto';

@Injectable()
export class PaymentsAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async approvePaymentInformation(jwt: JwtPayloadDto, clientId: number) {
    const user = await this.prisma.user.findUnique({
      where: { username: jwt.username },
    });
    const workflowEntry = await this.prisma.workflowEntry.findFirst({
      where: {
        clientId: clientId,
        formKey: StepFormKeys.UPDATE_PAYMENT_INFO.FORM_KEY,
        stepStatus: 'pending',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!workflowEntry) {
      throw new NotFoundException(
        `Pending payment information request for client ID ${clientId} not found`,
      );
    }

    const paymentData = workflowEntry.entryData as {
      paymentMethod: PaymentMethod;
    };

    const clientPaymentInformation =
      await this.prisma.clientPaymentInformation.upsert({
        where: { clientId: clientId },
        update: { data: paymentData },
        create: {
          clientId: clientId,
          paymentMethod: paymentData.paymentMethod,
          data: paymentData,
        },
      });

    await this.prisma.client.update({
      where: { id: clientId },
      data: {
        isPaymentDataInValidation: false,
      },
    });

    await this.prisma.workflowEntry.update({
      where: { id: workflowEntry.id },
      data: {
        stepStatus: 'approved',
        stepKey:
          StepFormKeys.UPDATE_PAYMENT_INFO.STEPS.UPDATE_PAYMENT_INFO_APPROVED,
        statusForm: 'approved',
      },
    });

    // todo: Add email notification logic here

    await this.prisma.log.create({
      data: {
        userId: user.id, // Replace with actual admin user ID
        object: 'PaymentInformation',
        objectId: clientId,
        message: 'Payment information approved',
      },
    });

    return clientPaymentInformation;
  }

  async rejectPaymentInformation(
    jwt: JwtPayloadDto,
    clientId: number,
    reason: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { username: jwt.username },
    });
    const workflowEntry = await this.prisma.workflowEntry.findFirst({
      where: {
        clientId: clientId,
        formKey: StepFormKeys.UPDATE_PAYMENT_INFO.FORM_KEY,
        stepStatus: 'pending',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!workflowEntry) {
      throw new NotFoundException(
        `Pending payment information request for client ID ${clientId} not found`,
      );
    }

    await this.prisma.workflowEntry.update({
      where: { id: workflowEntry.id },
      data: {
        stepStatus: 'rejected',
        stepKey:
          StepFormKeys.UPDATE_PAYMENT_INFO.STEPS.UPDATE_PAYMENT_INFO_REJECTED,
        stepData: { reason },
        statusForm: 'rejected',
      },
    });

    // TODO: Add email notification logic here

    await this.prisma.log.create({
      data: {
        userId: user.id,
        object: 'PaymentInformation',
        objectId: clientId,
        message: `Payment information rejected. Reason: ${reason}`,
      },
    });

    return { message: 'Payment information request rejected' };
  }

  async listPendingPaymentRequests() {
    return this.prisma.client.findMany({
      where: { isPaymentDataInValidation: true },
      select: {
        id: true,
        clientName: true,
        paymentData: true,
      },
    });
  }

  async getPaymentRequestDetails(clientId: number) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        clientName: true,
        paymentData: true,
        isPaymentDataInValidation: true,
      },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    return client;
  }

  async getClientPaymentInformationHistory(clientId: number) {
    return this.prisma.workflowEntry.findMany({
      where: { clientId },
      select: {
        id: true,
        createdAt: true,
        stepData: true,
        statusForm: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
