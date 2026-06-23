import { EmailProvider, SendEmailOptions, SendEmailResult } from './email-provider.interface';
import * as nodemailer from 'nodemailer';

export class SmtpProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;
  private defaultFrom: string;
  private providerName: string;

  constructor(config: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    providerName?: string;
  }) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
    this.defaultFrom = config.from || 'no-reply@beacon-sales.com';
    this.providerName = config.providerName || 'SMTP';
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const from = options.from || this.defaultFrom;
      const info = await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      return {
        messageId: info.messageId || `smtp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        provider: this.providerName,
        status: 'DELIVERED',
      };
    } catch (err: any) {
      return {
        messageId: '',
        provider: this.providerName,
        status: 'FAILED',
        error: err.message,
      };
    }
  }
}
