import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { JwtPayloadDto } from 'src/resources/auth/dto/jwt-payload.dto';
import { UsersService } from 'src/resources/users/users.service';
import { MailerService } from '@nestjs-modules/mailer';
import { WorkflowStatus } from 'src/resources/workflow/enums/workflow-status.enum';
import { WorkflowKeys } from 'src/resources/workflow/enums/workflow-keys.enum';
import { updatePaymentInfoSchema } from './validation-schemas';
import { ZodError } from 'zod';

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

  async requestUpdatePaymentInfo(user: JwtPayloadDto, paymentData: any) {
    const userData = await this.usersService.findByUsername(user.username);
    const clientId = userData.clientId;

    const existingRequest = await this.prisma.workflowEntry.findFirst({
      where: {
        clientId: clientId,
        formKey: WorkflowKeys.UPDATE_PAYMENT_INFO.FORM_KEY,
        stepStatus: WorkflowStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException(
        'There is already a pending payment information request for this client.',
      );
    }

    // Validate payment data
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

    // Reorder properties to ensure 'method' appears first
    const { method, ...rest } = paymentData;
    const paymentDataObject = { method, ...rest };

    await this.prisma.workflowEntry.create({
      data: {
        formKey: WorkflowKeys.UPDATE_PAYMENT_INFO.FORM_KEY,
        stepKey: WorkflowKeys.UPDATE_PAYMENT_INFO.STEPS.REVIEW_INFO_ADMIN,
        stepStatus: WorkflowStatus.PENDING,
        entryData: JSON.parse(JSON.stringify(paymentDataObject)),
        statusForm: WorkflowStatus.PENDING,
        clientId: clientId,
      },
    });

    // TODO: Add email notification logic here

    await this.prisma.log.create({
      data: {
        userId: userData.id,
        object: WorkflowKeys.UPDATE_PAYMENT_INFO.FORM_KEY,
        message: 'Payment information update request submitted successfully',
      },
    });

    return {
      message: 'Payment information update request submitted successfully',
    };
  }
}
