import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT') || 587;
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.logger.log(`SMTP Email Transporter initialized using host: ${smtpHost}`);
    } else {
      this.logger.warn('SMTP configuration is missing. Falling back to log-only console email delivery.');
    }
  }

  async sendVerificationEmail(to: string, token: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
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

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.configService.get<string>('SMTP_FROM') || 'no-reply@beacon-sales.com',
          to,
          subject,
          html,
        });
        this.logger.log(`Verification email sent successfully to ${to}`);
        return;
      } catch (err: any) {
        this.logger.error(`Failed to send verification email to ${to}: ${err.message}`);
      }
    }

    this.logger.log(`[CONSOLE EMAIL Verification] To: ${to} | URL: ${verifyUrl}`);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
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

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.configService.get<string>('SMTP_FROM') || 'no-reply@beacon-sales.com',
          to,
          subject,
          html,
        });
        this.logger.log(`Password reset email sent successfully to ${to}`);
        return;
      } catch (err: any) {
        this.logger.error(`Failed to send password reset email to ${to}: ${err.message}`);
      }
    }

    this.logger.log(`[CONSOLE EMAIL Reset] To: ${to} | URL: ${resetUrl}`);
  }

  async sendInviteEmail(to: string, name: string, businessName: string, inviteUrl: string) {
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

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.configService.get<string>('SMTP_FROM') || 'no-reply@beacon-sales.com',
          to,
          subject,
          html,
        });
        this.logger.log(`Invite email sent successfully to ${to}`);
        return;
      } catch (err: any) {
        this.logger.error(`Failed to send invite email to ${to}: ${err.message}`);
      }
    }

    this.logger.log(`[CONSOLE EMAIL Invite] To: ${to} | URL: ${inviteUrl}`);
  }

  async sendCustomEmail(to: string, subject: string, html: string) {
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.configService.get<string>('SMTP_FROM') || 'no-reply@beacon-sales.com',
          to,
          subject,
          html,
        });
        this.logger.log(`Custom email sent successfully to ${to}`);
        return;
      } catch (err: any) {
        this.logger.error(`Failed to send custom email to ${to}: ${err.message}`);
        throw err;
      }
    }
    this.logger.log(`[CONSOLE EMAIL Custom] To: ${to} | Subject: ${subject} | Content: ${html}`);
  }
}
