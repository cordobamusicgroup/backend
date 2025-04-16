import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { JwtPayloadDto } from 'src/resources/auth/dto/jwt-payload.dto';
import { UsersAdminService } from 'src/resources/users/admin/users-admin.service';
import { MailerService } from '@nestjs-modules/mailer';
import { updatePaymentInfoSchema } from './validation-schemas';
import { ZodError } from 'zod';
import axios from 'axios';

import { PaymentMethod } from 'generated/client';

@Injectable()
export class PaymentsUserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersAdminService,
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

  //TODO: Implement logic again for payment info update
  async requestUpdatePaymentInfo(user: JwtPayloadDto, paymentData: any) {
    // const userData = await this.usersService.findByUsername(user.username);
    // const clientId = userData.clientId;

    // const existingRequest = await this.prisma.workflowEntry.findFirst({
    //   where: {
    //     clientId: clientId,
    //     formKey: WorkflowKeys.UPDATE_PAYMENT_INFORMATION.FORM_KEY,
    //     stepStatus: WorkflowStatus.PENDING,
    //   },
    // });

    // if (existingRequest) {
    //   throw new BadRequestException(
    //     'There is already a pending payment information request for this client.',
    //   );
    // }

    // Validar datos de pago con Zod
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

    // Reordenar propiedades para que 'method' sea el primer campo
    const { method, ...rest } = paymentData;
    const paymentDataObject = { method, ...rest };

    if (paymentDataObject.method === PaymentMethod.CRYPTO) {
      const { walletAddress } = paymentDataObject.crypto;
      // Call wallet validation via API and regex.
      const isValid = await this.validateTrc20Wallet(walletAddress);
      if (!isValid) {
        throw new BadRequestException('The provided wallet is not valid.');
      }
    }

    //   await this.prisma.workflowEntry.create({
    //     data: {
    //       formKey: WorkflowKeys.UPDATE_PAYMENT_INFORMATION.FORM_KEY,
    //       stepKey:
    //         WorkflowKeys.UPDATE_PAYMENT_INFORMATION.STEPS.REVIEW_INFO_ADMIN,
    //       stepStatus: WorkflowStatus.APPROVED,
    //       entryData: JSON.parse(JSON.stringify(paymentDataObject)),
    //       statusForm: WorkflowStatus.APPROVED,
    //       clientId: userData.clientId,
    //     },
    //   });

    //   await this.prisma.log.create({
    //     data: {
    //       userId: userData.id,
    //       object: WorkflowKeys.UPDATE_PAYMENT_INFORMATION.FORM_KEY,
    //       message: 'Crypto payment update request auto-approved',
    //     },
    //   });

    //   return {
    //     message: 'Crypto payment information auto-approved',
    //   };
    // }

    // // Para otros métodos de pago o si la wallet no es válida
    // await this.prisma.workflowEntry.create({
    //   data: {
    //     formKey: WorkflowKeys.UPDATE_PAYMENT_INFORMATION.FORM_KEY,
    //     stepKey:
    //       WorkflowKeys.UPDATE_PAYMENT_INFORMATION.STEPS.REVIEW_INFO_ADMIN,
    //     stepStatus: WorkflowStatus.PENDING,
    //     entryData: JSON.parse(JSON.stringify(paymentDataObject)),
    //     statusForm: WorkflowStatus.PENDING,
    //     clientId: clientId,
    //   },
    // });

    // await this.prisma.log.create({
    //   data: {
    //     userId: userData.id,
    //     object: WorkflowKeys.UPDATE_PAYMENT_INFORMATION.FORM_KEY,
    //     message: 'Payment information update request submitted successfully',
    //   },
    // });

    return {
      message: 'Payment information update request submitted successfully',
    };
  }

  /**
   * Valida una dirección TRC20 de USDT usando lógica similar a la validación en PHP.
   * @param address Dirección de wallet
   * @returns boolean - True si es válida, false en otro caso.
   */
  private async validateTrc20Wallet(address: string): Promise<boolean> {
    // Validate format: must start with "T" and be 34 characters long.
    const regex = /^T[0-9A-Za-z]{33}$/;
    if (!regex.test(address)) {
      return false;
    }
    try {
      const apiUrl = `https://apilist.tronscan.org/api/account?address=${address}`;
      const response = await axios.get(apiUrl);
      const data = response.data;
      if (!data || !data.address) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }
}
