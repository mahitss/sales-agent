import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailIntegrationService } from '../../common/email/email-integration.service';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('email-sync')
export class EmailSyncWorker extends WorkerHost {
  private readonly logger = new Logger(EmailSyncWorker.name);

  constructor(
    private emailIntegrationService: EmailIntegrationService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { accountId, businessId, sentActivityId } = job.data;
    const startTime = Date.now();

    try {
      if (job.name === 'sync-inbox') {
        this.logger.log(
          `Running inbox sync job ${job.id} for account ${accountId}`,
        );
        const result = await this.emailIntegrationService.syncInbox(accountId);

        await this.logJob(
          job.id || 'sync',
          'email-sync',
          'sync-inbox',
          'COMPLETED',
          job.data,
          Date.now() - startTime,
          businessId,
        );
        return result;
      } else if (job.name === 'simulated-reply') {
        this.logger.log(
          `Running simulated reply job ${job.id} on activity ${sentActivityId}`,
        );
        await this.emailIntegrationService.handleSimulatedReply(
          accountId,
          sentActivityId,
          businessId,
        );

        await this.logJob(
          job.id || 'reply',
          'email-sync',
          'simulated-reply',
          'COMPLETED',
          job.data,
          Date.now() - startTime,
          businessId,
        );
        return { success: true };
      }
    } catch (err: any) {
      this.logger.error(
        `Email Sync Worker Job ${job.id} failed: ${err.message}`,
        err.stack,
      );
      await this.logJob(
        job.id || 'error',
        'email-sync',
        job.name,
        'FAILED',
        job.data,
        Date.now() - startTime,
        businessId,
        err.message,
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
    businessId: string,
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
