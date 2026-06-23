import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailProviderFactory } from '../../common/email/providers/provider.factory';

@Processor('email-sending')
export class EmailSendingWorker extends WorkerHost {
  private readonly logger = new Logger(EmailSendingWorker.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  private rewriteUrls(html: string, activityId: string, backendUrl: string): string {
    if (!html || !activityId) return html;
    // Match href="http..." or href='http...'
    const hrefRegex = /href=(["'])(https?:\/\/[^\s"'<>]+)\1/gi;
    return html.replace(hrefRegex, (match, quote, url) => {
      // Avoid double rewriting
      if (url.includes('/email-tracking/')) {
        return match;
      }
      const trackingUrl = `${backendUrl}/api/v1/email-tracking/click/${activityId}?url=${encodeURIComponent(url)}`;
      return `href=${quote}${trackingUrl}${quote}`;
    });
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const startTime = Date.now();
    const rawBackendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    // Strip trailing slash to avoid double-slash in URL construction
    const backendUrl = rawBackendUrl.replace(/\/+$/, '');
    let to = '';
    let subject = '';
    let html = '';
    let from = '';
    let businessId: string | undefined;
    let leadId: string | undefined;
    let activityId = '';
    let emailType = 'SYSTEM';

    this.logger.log(`Worker Started: Processing job ${job.id} (name: ${job.name})`);

    // 1. Extract payload details based on job name
    if (job.name === 'send-invite-email') {
      const { email, name, businessName, inviteUrl, businessId: bId } = job.data;
      to = email;
      subject = `You are invited to join ${businessName} on Beacon AI`;
      businessId = bId;
      emailType = 'INVITE';
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h1 style="color: #3B82F6;">Team Invitation</h1>
          <p>Hello ${name},</p>
          <p>You have been invited to join the <strong>${businessName}</strong> sales workspace on Beacon AI.</p>
          <p>Please configure your account password and join the workspace by clicking the button below:</p>
          <p style="margin: 20px 0;">
            <a href="${inviteUrl}" target="_blank" style="padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Accept Workspace Invitation</a>
          </p>
          <p>Or copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; color: #4b5563;">${inviteUrl}</p>
          <p>Welcome aboard!</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">Beacon AI Sales Team Agent</p>
        </div>
      `;

      // Create an activity record if not exists for invite enqueued historically
      const activity = await this.prisma.emailActivity.create({
        data: {
          businessId,
          leadId: null,
          messageId: `system-invite-${job.id}-${Date.now()}`,
          threadId: `thread-invite-${job.id}`,
          subject,
          body: html,
          fromAddress: process.env.SMTP_FROM || 'no-reply@beacon-sales.com',
          toAddress: to,
          direction: 'SENT',
          status: 'PENDING',
          sentAt: new Date(),
        },
      });
      activityId = activity.id;
      from = activity.fromAddress;
    } else if (job.name === 'send-generic-email') {
      to = job.data.to;
      subject = job.data.subject;
      html = job.data.html;
      from = job.data.from || process.env.SMTP_FROM || 'no-reply@beacon-sales.com';
      businessId = job.data.businessId;
      leadId = job.data.leadId;
      activityId = job.data.emailActivityId;
      emailType = job.data.emailType || 'SYSTEM';
    } else {
      this.logger.error(`Unknown job name: ${job.name}`);
      return { status: 'FAILED', error: `Unknown job name: ${job.name}` };
    }

    try {
      // 2. Perform open tracking and click tracking modifications
      const trackedHtml = this.rewriteUrls(html, activityId, backendUrl);
      const trackingPixelUrl = `${backendUrl}/api/v1/email-tracking/open/${activityId}`;
      const trackingPixel = `<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:none;" />`;
      const finalHtml = `${trackedHtml}${trackingPixel}`;

      // 3. Resolve email provider dynamically via factory
      const activeProviderName = process.env.EMAIL_PROVIDER || 'SMTP';
      const provider = EmailProviderFactory.create(activeProviderName, process.env as Record<string, string>);

      this.logger.log(`Dispatching email via provider: ${activeProviderName} to ${to}`);

      // 4. Send the email
      const result = await provider.send({
        to,
        subject,
        html: finalHtml,
        from,
      });

      const duration = Date.now() - startTime;

      if (result.status === 'DELIVERED') {
        // 5. Update EmailActivity on success
        await this.prisma.emailActivity.update({
          where: { id: activityId },
          data: {
            status: 'SENT',
            messageId: result.messageId,
            body: finalHtml,
          },
        });

        // 6. Log tracking event
        await this.prisma.emailTrackingEvent.create({
          data: {
            emailActivityId: activityId,
            eventType: 'DELIVERED',
            metadata: { provider: result.provider, messageId: result.messageId },
          },
        });

        // 7. Log Job completion
        await this.prisma.jobLog.create({
          data: {
            queueName: 'email-sending',
            jobId: job.id || 'unknown',
            jobName: job.name,
            status: 'COMPLETED',
            data: { to, subject, emailType, businessId, leadId, activityId },
            duration,
            businessId,
          },
        });

        this.logger.log(`Worker Completed: Job ${job.id} successfully processed and email dispatched to ${to}`);
        return { status: 'DELIVERED', messageId: result.messageId };
      } else {
        throw new Error(result.error || 'Provider failed to deliver email.');
      }
    } catch (err: any) {
      const duration = Date.now() - startTime;
      this.logger.error(`Worker Failed: Job ${job.id} failed to send email to ${to}: ${err.message}`, err.stack);

      // Update activity to FAILED
      await this.prisma.emailActivity.update({
        where: { id: activityId },
        data: { status: 'FAILED' },
      }).catch(() => {});

      // Log failure tracking event
      await this.prisma.emailTrackingEvent.create({
        data: {
          emailActivityId: activityId,
          eventType: 'FAILED',
          metadata: { error: err.message },
        },
      }).catch(() => {});

      // Log Job failure
      await this.prisma.jobLog.create({
        data: {
          queueName: 'email-sending',
          jobId: job.id || 'unknown',
          jobName: job.name,
          status: 'FAILED',
          data: { to, subject, emailType, businessId, leadId, activityId },
          error: `${err.message}\n${err.stack || ''}`,
          duration,
          businessId,
        },
      }).catch(() => {});

      throw err; // Throw to trigger BullMQ retry/exponential backoff
    }
  }
}
