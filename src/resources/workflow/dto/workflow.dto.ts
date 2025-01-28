import { WorkflowStatus } from '../enums/workflow-status.enum';

export class WorkflowEntryDto {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  formKey: string;
  stepKey: string;
  stepStatus: string;
  stepData?: Record<string, any>;
  entryData: Record<string, any>;
  statusForm: WorkflowStatus;
  clientId?: number;
}

export class WorkflowEntryDetailDto extends WorkflowEntryDto {
  client?: any; // Add appropriate type for client
}
