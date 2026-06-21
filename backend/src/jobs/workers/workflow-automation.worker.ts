import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, forwardRef, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { GoogleSheetsService } from '../../lead/google-sheets.service';
import { WebhookSubscriptionService } from '../../common/webhooks/webhook-subscription.service';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('workflow-automation')
export class WorkflowAutomationWorker extends WorkerHost {
  private readonly logger = new Logger(WorkflowAutomationWorker.name);

  constructor(
    @Inject(forwardRef(() => GoogleSheetsService))
    private googleSheetsService: GoogleSheetsService,
    private webhookSubscriptionService: WebhookSubscriptionService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const startTime = Date.now();
    const { businessId, leadId, triggerEvent } = job.data;
    this.logger.log(
      `Processing Workflow Automation job ${job.id} for lead ${leadId} (trigger: ${triggerEvent})`,
    );

    try {
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        throw new Error(
          `Lead ${leadId} not found, aborting workflow automation.`,
        );
      }

      // Fetch active rules for the business
      const rules = await this.prisma.workflowRule.findMany({
        where: {
          businessId,
          isEnabled: true,
          trigger: triggerEvent,
        },
      });

      const actionsRun: string[] = [];

      for (const rule of rules) {
        this.logger.log(
          `Executing rule action: ${rule.action} for lead ${leadId}`,
        );
        actionsRun.push(rule.action);

        if (rule.action === 'SHEET_SYNC') {
          await this.googleSheetsService.syncLead(leadId);
        } else if (rule.action === 'EMAIL_OUTREACH') {
          // Create a scheduled outreach sequence in DB
          await this.prisma.outreachSequence.create({
            data: {
              leadId,
              template: 'AUTO_FOLLOW_UP',
              subject: 'Checking in - Sales Intelligence',
              body: `Hello ${lead.name || 'there'},\n\nThanks for reaching out! We received your inquiry and wanted to follow up. How can we help?`,
              status: 'SENT', // Mark as sent for mock sequence completion
              scheduledFor: new Date(),
            },
          });
        } else if (rule.action === 'WEBHOOK') {
          await this.webhookSubscriptionService.publish(
            businessId,
            'lead.qualified',
            {
              leadId,
              name: lead.name,
              email: lead.email,
              status: lead.status,
              sentiment: lead.sentiment,
            },
          );
        }
      }

      const duration = Date.now() - startTime;
      await this.prisma.jobLog
        .create({
          data: {
            queueName: 'workflow-automation',
            jobId: job.id || 'unknown',
            jobName: job.name,
            status: 'COMPLETED',
            data: { ...job.data, actionsRun },
            duration,
            businessId,
          },
        })
        .catch(() => {});

      return { success: true, actionsRun };
    } catch (err: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Workflow Automation job ${job.id} failed: ${err.message}`,
        err.stack,
      );

      await this.prisma.jobLog
        .create({
          data: {
            queueName: 'workflow-automation',
            jobId: job.id || 'unknown',
            jobName: job.name,
            status: 'FAILED',
            data: job.data,
            error: `${err.message}\n${err.stack || ''}`,
            duration,
            businessId,
          },
        })
        .catch(() => {});

      throw err;
    }
  }
}
