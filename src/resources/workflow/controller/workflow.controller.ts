import { Controller, Get, Post, Param, Body, Req, Query } from '@nestjs/common';
import { WorkflowService } from '../services/workflow.service';
import { WorkflowStatus } from '../enums/workflow-status.enum';

@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  /**
   * Retrieves workflow entries with an optional status filter.
   * @param status - Optional status to filter workflow entries by.
   * @returns A list of workflow entries.
   */
  @Get('entries')
  async getEntries(@Query('status') status?: WorkflowStatus): Promise<any> {
    return this.workflowService.listEntries(status);
  }

  /**
   * Retrieves workflow entries by status.
   * @param status - The status to filter workflow entries by.
   * @returns A list of workflow entries with the specified status.
   */
  @Get('entries/status')
  async getEntriesByStatus(
    @Query('status') status: WorkflowStatus,
  ): Promise<any> {
    return this.workflowService.listEntriesByStatus(status);
  }

  /**
   * Retrieves the details of a specific workflow entry by ID.
   * @param entryId - The ID of the workflow entry to retrieve.
   * @returns The details of the specified workflow entry.
   */
  @Get('entry/:entryId')
  async getEntryById(@Param('entryId') entryId: number): Promise<any> {
    return this.workflowService.getEntryById(entryId);
  }

  /**
   * Approves a workflow entry.
   * @param request - The HTTP request object.
   * @param entryId - The ID of the workflow entry to approve.
   * @param data - Optional data for the approval.
   * @returns The result of the approval process.
   */
  @Post('approve/:entryId')
  async approveEntry(
    @Req() request: any,
    @Param('entryId') entryId: number,
    @Body('data') data?: Record<string, any>,
  ): Promise<any> {
    return this.workflowService.approveWorkflowEntry(
      request.jwt,
      Number(entryId),
      data,
    );
  }

  /**
   * Rejects a workflow entry.
   * @param request - The HTTP request object.
   * @param entryId - The ID of the workflow entry to reject.
   * @param data - Optional data for the rejection.
   * @returns The result of the rejection process.
   */
  @Post('reject/:entryId')
  async rejectEntry(
    @Req() request: any,
    @Param('entryId') entryId: number,
    @Body('data') data?: Record<string, any>,
  ): Promise<any> {
    return this.workflowService.rejectWorkflowEntry(
      request.jwt,
      Number(entryId),
      data,
    );
  }
}
