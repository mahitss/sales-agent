import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from '../../common/email/email.service';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('email-sending')
export class EmailSendingWorker extends WorkerHost {
  private readonly logger = new Logger(EmailSendingWorker.name);

  constructor(
    private emailService: EmailService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const startTime = Date.now();
    const { email, name, businessName, inviteUrl, businessId } = job.data;
    this.logger.log(
      `Processing email sending job ${job.id} for recipient: ${email}`,
    );

    try {
      const result = await this.emailService.sendInviteEmail(
        email,
        name,
        businessName,
        inviteUrl,
      );

      const duration = Date.now() - startTime;
      await this.prisma.jobLog
        .create({
          data: {
            queueName: 'email-sending',
            jobId: job.id || 'unknown',
            jobName: job.name,
            status: 'COMPLETED',
            data: job.data,
            duration,
            businessId,
          },
        })
        .catch(() => {});

      return result;
    } catch (err: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Email sending job ${job.id} to ${email} failed: ${err.message}`,
        err.stack,
      );

      await this.prisma.jobLog
        .create({
          data: {
            queueName: 'email-sending',
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
