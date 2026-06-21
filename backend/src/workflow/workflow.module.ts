import { Module, forwardRef } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { JobsModule } from '../jobs/jobs.module';
import { ActivityLogModule } from '../common/activity-logs/activity-log.module';

@Module({
  imports: [forwardRef(() => JobsModule), ActivityLogModule],
  providers: [WorkflowService],
  controllers: [WorkflowController],
  exports: [WorkflowService],
})
export class WorkflowModule {}
