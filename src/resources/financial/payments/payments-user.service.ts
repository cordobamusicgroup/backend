import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { JwtPayloadDto } from 'src/resources/auth/dto/jwt-payload.dto';
import { UsersService } from 'src/resources/users/users.service';
import { MailerService } from '@nestjs-modules/mailer';
import { StepFormKeys } from 'src/constants/step-form-keys';

@Injectable()
export class PaymentsUserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly mailerService: MailerService,
  ) {}

  async getClientPaymentStatus(user: JwtPayloadDto) {
    const userData = await this.usersService.findByUsername(user.username);
    const clientId = userData.clientId;

    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: {
        isBlocked: true,
        isPaymentInProgress: true,
        isPaymentDataInValidation: true,
      },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    return client;
  }

  async requestUpdatePaymentInfo(
    user: JwtPayloadDto,
    paymentData: Record<string, any>,
  ) {
    const userData = await this.usersService.findByUsername(user.username);
    const clientId = userData.clientId;

    const existingRequest = await this.prisma.workflowEntry.findFirst({
      where: {
        clientId: clientId,
        formKey: StepFormKeys.UPDATE_PAYMENT_INFO.FORM_KEY,
        stepStatus: 'pending',
      },
    });

    if (existingRequest) {
      throw new BadRequestException(
        'There is already a pending payment information request for this client.',
      );
    }

    const paymentDataObject = { ...paymentData };

    await this.prisma.workflowEntry.create({
      data: {
        formKey: StepFormKeys.UPDATE_PAYMENT_INFO.FORM_KEY,
        stepKey: StepFormKeys.UPDATE_PAYMENT_INFO.STEPS.REVIEW_INFO_ADMIN,
        stepStatus: 'pending',
        entryData: paymentDataObject,
        statusForm: 'pending',
        clientId: clientId,
      },
    });

    // TODO: Add email notification logic here

    await this.prisma.log.create({
      data: {
        userId: userData.id,
        object: StepFormKeys.UPDATE_PAYMENT_INFO.FORM_KEY,
        message: 'Payment information update request submitted successfully',
      },
    });

    return {
      message: 'Payment information update request submitted successfully',
    };
  }

  async getPaymentInformationHistory(user: JwtPayloadDto) {
    const userData = await this.usersService.findByUsername(user.username);
    const clientId = userData.clientId;

    return this.prisma.workflowEntry.findMany({
      where: { clientId },
      select: {
        id: true,
        createdAt: true,
        entryData: true,
        statusForm: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
