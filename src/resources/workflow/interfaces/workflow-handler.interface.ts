import { WorkflowEntry } from '@prisma/client';
import { JwtPayloadDto } from 'src/resources/auth/dto/jwt-payload.dto';

export interface WorkflowHandler {
  formKey: string;
  handleApproval?(
    jwt: JwtPayloadDto,
    entry: WorkflowEntry,
    data?: Record<string, any>,
  ): Promise<any>;
  handleRejection?(
    jwt: JwtPayloadDto,
    entry: WorkflowEntry,
    data?: Record<string, any>,
  ): Promise<any>;
}
