import { EmailProvider, SendEmailOptions, SendEmailResult } from './email-provider.interface';
import axios from 'axios';

export class SendGridProvider implements EmailProvider {
  private apiKey: string;
  private defaultFrom: string;

  constructor(config: { apiKey: string; from: string }) {
    this.apiKey = config.apiKey;
    this.defaultFrom = config.from || 'no-reply@beacon-sales.com';
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const from = options.from || this.defaultFrom;
      const res = await axios.post(
        'https://api.sendgrid.com/v3/mail/send',
        {
          personalizations: [
            {
              to: [{ email: options.to }],
            },
          ],
          from: { email: from },
          subject: options.subject,
          content: [
            {
              type: 'text/html',
              value: options.html,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // SendGrid returns 202 Accepted on success without JSON body
      const messageId =
        res.headers['x-message-id'] || `sendgrid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      return {
        messageId,
        provider: 'SENDGRID',
        status: 'DELIVERED',
      };
    } catch (err: any) {
      const errMsg = err.response?.data?.errors?.[0]?.message || err.message;
      return {
        messageId: '',
        provider: 'SENDGRID',
        status: 'FAILED',
        error: errMsg,
      };
    }
  }
}
