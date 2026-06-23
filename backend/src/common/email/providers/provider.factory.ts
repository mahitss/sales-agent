import { EmailProvider } from './email-provider.interface';
import { SmtpProvider } from './smtp-provider';
import { ResendProvider } from './resend-provider';
import { SendGridProvider } from './sendgrid-provider';
import { SesProvider } from './ses-provider';

export class EmailProviderFactory {
  static create(providerType: string, env: Record<string, string>): EmailProvider {
    const from = env.SMTP_FROM || 'no-reply@beacon-sales.com';

    switch (providerType?.toUpperCase()) {
      case 'RESEND':
        return new ResendProvider({
          apiKey: env.RESEND_API_KEY || '',
          from,
        });
      case 'SENDGRID':
        return new SendGridProvider({
          apiKey: env.SENDGRID_API_KEY || '',
          from,
        });
      case 'SES':
        return new SesProvider({
          host: env.SES_SMTP_HOST || env.SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com',
          port: parseInt(env.SES_SMTP_PORT || env.SMTP_PORT || '587', 10),
          user: env.SES_SMTP_USER || env.SMTP_USER || '',
          pass: env.SES_SMTP_PASS || env.SMTP_PASS || '',
          from,
        });
      case 'GMAIL':
        return new SmtpProvider({
          host: 'smtp.gmail.com',
          port: 587,
          user: env.SMTP_USER || '',
          pass: env.SMTP_PASS || '',
          from,
          providerName: 'GMAIL',
        });
      case 'SMTP':
      default:
        return new SmtpProvider({
          host: env.SMTP_HOST || 'localhost',
          port: parseInt(env.SMTP_PORT || '587', 10),
          user: env.SMTP_USER || '',
          pass: env.SMTP_PASS || '',
          from,
          providerName: 'SMTP',
        });
    }
  }
}
