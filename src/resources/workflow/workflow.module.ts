import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowController } from './controller/workflow.controller';
import { UpdatePaymentInformationHandler } from './handlers/update-payment-info.handler';
import { WorkflowHandler } from './interfaces/workflow-handler.interface';
import { WorkflowService } from './services/workflow.service';
import { WorkflowEntryDto, WorkflowEntryDetailDto } from './dto/workflow.dto';

@Module({
  controllers: [WorkflowController],
  providers: [
    WorkflowService,
    PrismaService,
    UpdatePaymentInformationHandler,
    {
      provide: 'WORKFLOW_HANDLERS',
      useFactory: (...handlers: WorkflowHandler[]) => handlers,
      inject: [UpdatePaymentInformationHandler], // Add other handlers here
    },
    WorkflowEntryDto,
    WorkflowEntryDetailDto,
  ],
})
export class WorkflowModule {}
