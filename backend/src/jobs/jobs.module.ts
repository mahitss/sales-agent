import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AIResearchWorker } from './workers/ai-research.worker';
import { LeadEnrichmentWorker } from './workers/lead-enrichment.worker';
import { EmailSendingWorker } from './workers/email-sending.worker';
import { ReportGenerationWorker } from './workers/report-generation.worker';
import { WorkflowAutomationWorker } from './workers/workflow-automation.worker';
import { AccountIntelligenceWorker } from './workers/account-intelligence.worker';
import { WorkflowExecutionWorker } from './workers/workflow-execution.worker';
import { EmailSyncWorker } from './workers/email-sync.worker';
import { EmailSequenceWorker } from './workers/email-sequence.worker';
import { EmailReminderWorker } from './workers/email-reminder.worker';
import { BusinessModule } from '../business/business.module';
import { LeadModule } from '../lead/lead.module';
import { EmailModule } from '../common/email/email.module';
import { AccountResearchModule } from '../account-research/account-research.module';
import { AIModule } from '../common/ai/ai.module';


@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: parseInt(configService.get<string>('REDIS_PORT') || '6379'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'ai-research' },
      { name: 'lead-enrichment' },
      { name: 'email-sending' },
      { name: 'report-generation' },
      { name: 'workflow-automation' },
      { name: 'account-intelligence' },
      { name: 'workflow-execution' },
      { name: 'email-sync' },
      { name: 'email-sequence' },
      { name: 'email-reminder' },
    ),
    PrismaModule,
    forwardRef(() => EmailModule),
    forwardRef(() => BusinessModule),
    forwardRef(() => LeadModule),
    forwardRef(() => AccountResearchModule),
    AIModule,
  ],

  controllers: [JobsController],
  providers: [
    JobsService,
    AIResearchWorker,
    LeadEnrichmentWorker,
    EmailSendingWorker,
    ReportGenerationWorker,
    WorkflowAutomationWorker,
    AccountIntelligenceWorker,
    WorkflowExecutionWorker,
    EmailSyncWorker,
    EmailSequenceWorker,
    EmailReminderWorker,
  ],
  exports: [JobsService, BullModule],
})
export class JobsModule {}
