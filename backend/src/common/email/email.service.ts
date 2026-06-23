import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JobsService } from '../../jobs/jobs.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    @Inject(forwardRef(() => JobsService))
    private jobsService: JobsService,
  ) {}

  async sendVerificationEmail(to: string, token: string) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;
    const subject = 'Verify your Beacon AI Sales Agent account';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h1 style="color: #10B981;">Welcome to Beacon!</h1>
        <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
        <p style="margin: 20px 0;">
          <a href="${verifyUrl}" target="_blank" style="padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Verify Email Address</a>
        </p>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #4b5563;">${verifyUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">If you did not request this account creation, please ignore this message.</p>
      </div>
    `;

    // 1. Find user to link to businessId
    const user = await this.prisma.user.findUnique({ where: { email: to } });
    const businessId = user?.businessId || null;

    // 2. Create EmailActivity record
    const activity = await this.prisma.emailActivity.create({
      data: {
        businessId,
        leadId: null,
        messageId: `system-verification-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        threadId: `thread-verification-${Date.now()}`,
        subject,
        body: html,
        fromAddress: this.configService.get<string>('SMTP_FROM') || 'no-reply@beacon-sales.com',
        toAddress: to,
        direction: 'SENT',
        status: 'PENDING',
        sentAt: new Date(),
      },
    });

    // 3. Enqueue generic email sending job to BullMQ
    await this.jobsService.addGenericEmailJob({
      to,
      subject,
      html,
      from: activity.fromAddress,
      businessId: businessId || undefined,
      emailActivityId: activity.id,
      emailType: 'VERIFICATION',
    });

    this.logger.log(`Enqueued verification email to ${to} in BullMQ`);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const subject = 'Reset your Beacon AI Password';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h1 style="color: #EF4444;">Password Reset Request</h1>
        <p>We received a request to reset your password. You can complete the request by clicking the link below:</p>
        <p style="margin: 20px 0;">
          <a href="${resetUrl}" target="_blank" style="padding: 12px 24px; background-color: #EF4444; color: white; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Reset Password</a>
        </p>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #4b5563;">${resetUrl}</p>
        <p>This link will expire in 15 minutes.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `;

    // 1. Find user to link to businessId
    const user = await this.prisma.user.findUnique({ where: { email: to } });
    const businessId = user?.businessId || null;

    // 2. Create EmailActivity record
    const activity = await this.prisma.emailActivity.create({
      data: {
        businessId,
        leadId: null,
        messageId: `system-reset-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        threadId: `thread-reset-${Date.now()}`,
        subject,
        body: html,
        fromAddress: this.configService.get<string>('SMTP_FROM') || 'no-reply@beacon-sales.com',
        toAddress: to,
        direction: 'SENT',
        status: 'PENDING',
        sentAt: new Date(),
      },
    });

    // 3. Enqueue generic email sending job to BullMQ
    await this.jobsService.addGenericEmailJob({
      to,
      subject,
      html,
      from: activity.fromAddress,
      businessId: businessId || undefined,
      emailActivityId: activity.id,
      emailType: 'PASSWORD_RESET',
    });

    this.logger.log(`Enqueued password reset email to ${to} in BullMQ`);
  }

  async sendInviteEmail(
    to: string,
    name: string,
    businessName: string,
    inviteUrl: string,
    inviteBusinessId?: string,
  ) {
    const subject = `You are invited to join ${businessName} on Beacon AI`;
    const html = `
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

    // 1. Find business if inviteBusinessId not supplied
    let businessId = inviteBusinessId || null;
    if (!businessId) {
      const b = await this.prisma.business.findFirst({
        where: { companyName: businessName },
      });
      if (b) businessId = b.id;
    }

    // 2. Create EmailActivity record
    const activity = await this.prisma.emailActivity.create({
      data: {
        businessId,
        leadId: null,
        messageId: `system-invite-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        threadId: `thread-invite-${Date.now()}`,
        subject,
        body: html,
        fromAddress: this.configService.get<string>('SMTP_FROM') || 'no-reply@beacon-sales.com',
        toAddress: to,
        direction: 'SENT',
        status: 'PENDING',
        sentAt: new Date(),
      },
    });

    // 3. Enqueue generic email sending job to BullMQ
    await this.jobsService.addGenericEmailJob({
      to,
      subject,
      html,
      from: activity.fromAddress,
      businessId: businessId || undefined,
      emailActivityId: activity.id,
      emailType: 'INVITE',
    });

    this.logger.log(`Enqueued invite email to ${to} in BullMQ`);
  }

  async sendCustomEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: any[],
    customBusinessId?: string,
    leadId?: string,
  ) {
    // 1. Create EmailActivity record
    const activity = await this.prisma.emailActivity.create({
      data: {
        businessId: customBusinessId || null,
        leadId: leadId || null,
        messageId: `system-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        threadId: `thread-custom-${Date.now()}`,
        subject,
        body: html,
        fromAddress: this.configService.get<string>('SMTP_FROM') || 'no-reply@beacon-sales.com',
        toAddress: to,
        direction: 'SENT',
        status: 'PENDING',
        sentAt: new Date(),
      },
    });

    // 2. Enqueue generic email sending job to BullMQ
    await this.jobsService.addGenericEmailJob({
      to,
      subject,
      html,
      from: activity.fromAddress,
      businessId: customBusinessId || undefined,
      leadId: leadId || undefined,
      emailActivityId: activity.id,
      emailType: 'WELCOME',
      metadata: attachments ? { attachments } : undefined,
    });

    this.logger.log(`Enqueued custom email to ${to} in BullMQ`);
  }
}
