import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkflowEntry } from '@prisma/client';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { WorkflowHandler } from '../interfaces/workflow-handler.interface';
import { JwtPayloadDto } from 'src/resources/auth/dto/jwt-payload.dto';
import { WorkflowKeys } from '../enums/workflow-keys.enum';
import { WorkflowStatus } from '../enums/workflow-status.enum';

@Injectable()
export class UpdatePaymentInformationHandler implements WorkflowHandler {
  formKey = 'UpdatePaymentInformation';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Handles the approval of a workflow entry.
   * @param jwt - JWT payload containing user information.
   * @param entry - The workflow entry to approve.
   * @param data - Optional data for the approval.
   * @returns The result of the approval process.
   */
  async handleApproval(
    jwt: JwtPayloadDto,
    entry: WorkflowEntry,
    data?: Record<string, any>,
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { username: jwt.username },
    });
    const workflowEntry = await this.prisma.workflowEntry.findFirst({
      where: {
        id: entry.id,
        formKey: WorkflowKeys.UPDATE_PAYMENT_INFO.FORM_KEY,
        stepKey: WorkflowKeys.UPDATE_PAYMENT_INFO.STEPS.REVIEW_INFO_ADMIN,
        stepStatus: WorkflowStatus.PENDING,
      },
    });

    if (!workflowEntry) {
      throw new NotFoundException(
        `Pending payment information request not found`,
      );
    }

    const newClientPaymentInfo =
      await this.prisma.clientPaymentInformation.upsert({
        where: { clientId: workflowEntry.clientId },
        update: { data: entry.entryData },
        create: {
          paymentMethod: (entry.entryData as any).paymentMethod,
          data: entry.entryData,
          client: { connect: { id: workflowEntry.clientId } },
        },
      });

    await this.prisma.client.update({
      where: { id: workflowEntry.clientId },
      data: {
        isPaymentDataInValidation: false,
      },
    });

    await this.prisma.workflowEntry.update({
      where: { id: workflowEntry.id },
      data: {
        stepStatus: WorkflowStatus.APPROVED,
        stepKey:
          WorkflowKeys.UPDATE_PAYMENT_INFO.STEPS.UPDATE_PAYMENT_INFO_APPROVED,
        statusForm: WorkflowStatus.COMPLETED,
      },
    });

    // todo: Add email notification logic here

    await this.prisma.log.create({
      data: {
        userId: user.id,
        object: 'Update Payment Information',
        objectId: workflowEntry.clientId,
        message: `${user.fullName} approved payment info${data?.note ? `, note: ${data.note}` : ''}`,
      },
    });

    return { message: 'Approved and updated', data, newClientPaymentInfo };
  }

  /**
   * Handles the rejection of a workflow entry.
   * @param jwt - JWT payload containing user information.
   * @param entry - The workflow entry to reject.
   * @param data - Optional data for the rejection.
   * @returns The result of the rejection process.
   */
  async handleRejection(
    jwt: JwtPayloadDto,
    entry: WorkflowEntry,
    data?: Record<string, any>,
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { username: jwt.username },
    });
    const workflowEntry = await this.prisma.workflowEntry.findFirst({
      where: {
        id: entry.id,
        formKey: WorkflowKeys.UPDATE_PAYMENT_INFO.FORM_KEY,
        stepKey: WorkflowKeys.UPDATE_PAYMENT_INFO.STEPS.REVIEW_INFO_ADMIN,
        stepStatus: WorkflowStatus.PENDING,
      },
    });

    if (!workflowEntry) {
      throw new NotFoundException(
        `Pending payment information request not found`,
      );
    }

    await this.prisma.workflowEntry.update({
      where: { id: workflowEntry.id },
      data: {
        stepStatus: WorkflowStatus.REJECTED,
        stepKey:
          WorkflowKeys.UPDATE_PAYMENT_INFO.STEPS.UPDATE_PAYMENT_INFO_REJECTED,
        statusForm: WorkflowStatus.REJECTED,
      },
    });

    // todo: Add email notification logic here

    await this.prisma.log.create({
      data: {
        userId: user.id,
        object: 'Update Payment Information',
        objectId: workflowEntry.clientId,
        message: `${user.fullName} rejected payment info${data?.note ? `, note: ${data.note}` : ''}`,
      },
    });

    return { message: 'Rejected', data };
  }
}
