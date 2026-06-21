import { Module, forwardRef } from '@nestjs/common';
import { LeadService } from './lead.service';
import { LeadController } from './lead.controller';
import { LeadIntelligenceService } from './lead-intelligence.service';
import { LeadScoringService } from './lead-scoring.service';
import { GoogleSheetsService } from './google-sheets.service';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { CRMController } from './crm.controller';
import { AICostModule } from '../common/ai-cost/ai-cost.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { ActivityLogModule } from '../common/activity-logs/activity-log.module';

@Module({
  imports: [AICostModule, forwardRef(() => WorkflowModule), ActivityLogModule],
  providers: [
    LeadService,
    LeadIntelligenceService,
    LeadScoringService,
    GoogleSheetsService,
    FeedbackService,
  ],
  controllers: [LeadController, FeedbackController, CRMController],
  exports: [
    LeadService,
    LeadIntelligenceService,
    LeadScoringService,
    GoogleSheetsService,
    FeedbackService,
  ],
})
export class LeadModule {}
