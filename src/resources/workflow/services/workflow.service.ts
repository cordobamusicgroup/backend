import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { WorkflowHandler } from '../interfaces/workflow-handler.interface';
import { PrismaService } from 'src/resources/prisma/prisma.service';
import { WorkflowEntry } from '@prisma/client';
import { JwtPayloadDto } from 'src/resources/auth/dto/jwt-payload.dto';
import { WorkflowStatus } from '../enums/workflow-status.enum';

@Injectable()
export class WorkflowService {
  private handlers: Record<string, WorkflowHandler>;

  constructor(
    @Inject('WORKFLOW_HANDLERS') handlers: WorkflowHandler[],
    private readonly prisma: PrismaService,
  ) {
    this.handlers = handlers.reduce((acc, handler) => {
      acc[handler.formKey] = handler;
      return acc;
    }, {});
  }

  /**
   * Approves a workflow entry.
   * @param jwt - JWT payload containing user information.
   * @param entryId - ID of the workflow entry to approve.
   * @param notes - Optional notes for the approval.
   * @returns The result of the approval process.
   */
  async approveWorkflowEntry(
    jwt: JwtPayloadDto,
    entryId: number,
    notes?: Record<string, any>,
  ): Promise<any> {
    const entry = await this.prisma.workflowEntry.findUnique({
      where: { id: entryId },
    });
    if (!entry) throw new NotFoundException('Workflow entry not found');
    const handler = this.handlers[entry.formKey];
    if (!handler)
      throw new BadRequestException(`No handler for formKey ${entry.formKey}`);
    return handler.handleApproval(jwt, entry, notes);
  }

  /**
   * Rejects a workflow entry.
   * @param jwt - JWT payload containing user information.
   * @param entryId - ID of the workflow entry to reject.
   * @param notes - Optional notes for the rejection.
   * @returns The result of the rejection process.
   */
  async rejectWorkflowEntry(
    jwt: JwtPayloadDto,
    entryId: number,
    notes?: Record<string, any>,
  ): Promise<any> {
    const entry = await this.prisma.workflowEntry.findUnique({
      where: { id: entryId },
    });
    if (!entry) throw new NotFoundException('Workflow entry not found');
    const handler = this.handlers[entry.formKey];
    if (!handler)
      throw new BadRequestException(`No handler for formKey ${entry.formKey}`);
    return handler.handleRejection(jwt, entry, notes);
  }

  /**
   * Lists all pending workflow entries.
   * @returns A list of pending workflow entries.
   */
  async listPendingEntries(): Promise<WorkflowEntry[]> {
    return this.prisma.workflowEntry.findMany({
      where: { statusForm: WorkflowStatus.PENDING },
    });
  }

  /**
   * Lists all workflow entries by status.
   * @param status - The status to filter workflow entries by.
   * @returns A list of workflow entries with the specified status.
   */
  async listEntriesByStatus(status: WorkflowStatus): Promise<WorkflowEntry[]> {
    return this.prisma.workflowEntry.findMany({
      where: { statusForm: status },
    });
  }

  /**
   * Lists all workflow entries with an optional status filter.
   * @param status - Optional status to filter workflow entries by.
   * @returns A list of workflow entries.
   */
  async listEntries(status?: WorkflowStatus): Promise<WorkflowEntry[]> {
    const where = status ? { statusForm: status } : {};
    return this.prisma.workflowEntry.findMany({ where });
  }

  /**
   * Retrieves the details of a specific workflow entry by ID.
   * @param entryId - The ID of the workflow entry to retrieve.
   * @returns The details of the specified workflow entry.
   */
  async getEntryById(entryId: number): Promise<WorkflowEntry> {
    const entry = await this.prisma.workflowEntry.findUnique({
      where: { id: entryId },
    });
    if (!entry) throw new NotFoundException('Workflow entry not found');
    return entry;
  }
}
