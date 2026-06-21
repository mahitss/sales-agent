import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailIntegrationService } from '../../common/email/email-integration.service';
import { JobsService } from '../jobs.service';

@Processor('email-sequence')
export class EmailSequenceWorker extends WorkerHost {
  private readonly logger = new Logger(EmailSequenceWorker.name);

  constructor(
    private prisma: PrismaService,
    private emailIntegrationService: EmailIntegrationService,
    @Inject(forwardRef(() => JobsService))
    private jobsService: JobsService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { enrollmentId, businessId } = job.data;
    const startTime = Date.now();

    this.logger.log(`Running sequence execution step for enrollment: ${enrollmentId}`);

    try {
      // 1. Fetch enrollment context
      const enrollment = await this.prisma.emailSequenceEnrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          sequence: true,
          lead: true
        }
      });

      if (!enrollment || enrollment.status !== 'ACTIVE') {
        this.logger.warn(`Enrollment ${enrollmentId} not found or inactive. Skipping step.`);
        return { status: 'SKIPPED' };
      }

      if (!enrollment.sequence.isEnabled) {
        this.logger.warn(`Sequence ${enrollment.sequence.name} is disabled. Skipping step.`);
        return { status: 'SKIPPED' };
      }

      const steps = (enrollment.sequence.steps as any[]) || [];
      const currentStepIdx = enrollment.currentStep;

      // Check if sequence is fully completed
      if (currentStepIdx >= steps.length) {
        await this.prisma.emailSequenceEnrollment.update({
          where: { id: enrollmentId },
          data: { status: 'COMPLETED' }
        });
        return { status: 'COMPLETED' };
      }

      // 2. Fetch current step payload
      const step = steps[currentStepIdx];
      const templateId = step.templateId;

      const template = await this.prisma.emailTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        throw new Error(`Email Template ID ${templateId} not found for sequence step`);
      }

      // 3. Find connected account to send from
      const account = await this.prisma.emailAccount.findFirst({
        where: { businessId }
      });

      if (!account) {
        throw new Error(`No connected email accounts connected in business ${businessId} to send outreach from`);
      }

      // 4. Format template with Lead tokens replacement
      const lead = enrollment.lead;
      const subject = this.replacePlaceholders(template.subject, lead);
      const htmlBody = this.replacePlaceholders(template.body, lead);

      // 5. Dispatch email sending through OAuth account
      this.logger.log(`Sending sequence email to lead: ${lead.email} via account: ${account.email}`);
      const messageId = await this.emailIntegrationService.sendEmail(
        account.id,
        lead.email || '',
        subject,
        htmlBody
      );

      // 6. Schedule next step check if available
      const nextStepIdx = currentStepIdx + 1;
      if (nextStepIdx < steps.length) {
        const nextStep = steps[nextStepIdx];
        
        // Fast sandbox testing mode if name contains "Test" or "Demo"
        const isFastTest = enrollment.sequence.name.toLowerCase().includes('test') || 
                           enrollment.sequence.name.toLowerCase().includes('demo');
        
        const delayDays = nextStep.delayDays || 1;
        const delayMs = isFastTest ? delayDays * 10000 : delayDays * 24 * 3600 * 1000; // 10 seconds per day in test mode

        await this.prisma.emailSequenceEnrollment.update({
          where: { id: enrollmentId },
          data: {
            currentStep: nextStepIdx,
            nextRunAt: new Date(Date.now() + delayMs)
          }
        });

        // Enqueue next run
        await this.jobsService.addEmailSequenceExecutionJob(enrollmentId, businessId, delayMs);
        this.logger.log(`Scheduled next step index ${nextStepIdx} to execute in ${delayMs}ms`);
      } else {
        // Mark enrollment fully complete
        await this.prisma.emailSequenceEnrollment.update({
          where: { id: enrollmentId },
          data: { status: 'COMPLETED' }
        });
        this.logger.log(`Sequence completed for enrollment: ${enrollmentId}`);
      }

      // Log success job
      await this.logJob(job.id || 'seq', 'email-sequence', 'execute-step', 'COMPLETED', job.data, Date.now() - startTime, businessId);
      return { status: 'SUCCESS', messageId };

    } catch (err: any) {
      this.logger.error(`Email Sequence Step execution failed: ${err.message}`, err.stack);
      await this.logJob(job.id || 'seq-err', 'email-sequence', 'execute-step', 'FAILED', job.data, Date.now() - startTime, businessId, err.message);
      throw err;
    }
  }

  private replacePlaceholders(text: string, lead: any): string {
    if (!text || !lead) return text;
    return text
      .replace(/\{\{\s*lead\.name\s*\}\}/gi, lead.name || 'Customer')
      .replace(/\{\{\s*lead\.email\s*\}\}/gi, lead.email || '')
      .replace(/\{\{\s*lead\.phone\s*\}\}/gi, lead.phone || '')
      .replace(/\{\{\s*lead\.budget\s*\}\}/gi, lead.budget || '')
      .replace(/\{\{\s*lead\.status\s*\}\}/gi, lead.status || '');
  }

  private async logJob(
    jobId: string, 
    queueName: string, 
    jobName: string, 
    status: 'COMPLETED' | 'FAILED', 
    data: any, 
    duration: number, 
    businessId: string, 
    error?: string
  ) {
    await this.prisma.jobLog.create({
      data: {
        queueName,
        jobId,
        jobName,
        status,
        data: data || {},
        duration,
        businessId,
        error
      }
    }).catch(() => {});
  }
}
