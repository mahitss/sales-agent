import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('email-reminder')
export class EmailReminderWorker extends WorkerHost {
  private readonly logger = new Logger(EmailReminderWorker.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { activityId } = job.data;
    const startTime = Date.now();

    this.logger.log(
      `Running follow-up reminder check for activity: ${activityId}`,
    );

    try {
      const activity = await this.prisma.emailActivity.findUnique({
        where: { id: activityId },
        include: { lead: true },
      });

      if (!activity) {
        this.logger.warn(
          `Email Activity ${activityId} not found. Skipping reminder.`,
        );
        return { status: 'SKIPPED' };
      }

      // If a reply has already been received, skip creating a reminder
      if (activity.repliedAt) {
        this.logger.log(
          `Reply already received for thread: ${activity.threadId}. Skipping follow-up reminder.`,
        );
        return { status: 'SKIPPED' };
      }

      const leadName = activity.lead?.name || 'Customer';
      const leadId = activity.leadId || '';

      // Log follow-up alert activity log
      await this.prisma.activityLog.create({
        data: {
          action: 'EMAIL_REMINDER',
          description: `Follow-up Alert: Lead "${leadName}" (${activity.toAddress}) has not replied to email: "${activity.subject}"`,
          metadata: {
            activityId,
            leadId,
            toAddress: activity.toAddress,
            subject: activity.subject,
          },
        },
      });

      this.logger.log(
        `Follow-up alert registered for lead ${leadName} on email activity ${activityId}`,
      );

      await this.logJob(
        job.id || 'remind',
        'email-reminder',
        'check-reminder',
        'COMPLETED',
        job.data,
        Date.now() - startTime,
        activity.businessId,
      );
      return { status: 'REMINDER_CREATED' };
    } catch (err: any) {
      this.logger.error(
        `Email Reminder Worker failed: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  private async logJob(
    jobId: string,
    queueName: string,
    jobName: string,
    status: 'COMPLETED' | 'FAILED',
    data: any,
    duration: number,
    businessId?: string | null,
    error?: string,
  ) {
    await this.prisma.jobLog
      .create({
        data: {
          queueName,
          jobId,
          jobName,
          status,
          data: data || {},
          duration,
          businessId,
          error,
        },
      })
      .catch(() => {});
  }
}
