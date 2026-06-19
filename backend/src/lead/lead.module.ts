import { Module } from '@nestjs/common';
import { LeadService } from './lead.service';
import { LeadController } from './lead.controller';
import { LeadIntelligenceService } from './lead-intelligence.service';
import { GoogleSheetsService } from './google-sheets.service';
import { LeadQueueService } from './lead-queue.service';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { CRMController } from './crm.controller';
import { AICostModule } from '../common/ai-cost/ai-cost.module';

@Module({
  imports: [AICostModule],
  providers: [LeadService, LeadIntelligenceService, GoogleSheetsService, LeadQueueService, FeedbackService],
  controllers: [LeadController, FeedbackController, CRMController],
  exports: [LeadService, LeadIntelligenceService, GoogleSheetsService, LeadQueueService, FeedbackService],
})
export class LeadModule {}
