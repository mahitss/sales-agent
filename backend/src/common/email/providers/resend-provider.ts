import { EmailProvider, SendEmailOptions, SendEmailResult } from './email-provider.interface';
import axios from 'axios';

export class ResendProvider implements EmailProvider {
  private apiKey: string;
  private defaultFrom: string;

  constructor(config: { apiKey: string; from: string }) {
    this.apiKey = config.apiKey;
    this.defaultFrom = config.from || 'onboarding@resend.dev';
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const from = options.from || this.defaultFrom;
      const res = await axios.post(
        'https://api.resend.com/emails',
        {
          from,
          to: [options.to],
          subject: options.subject,
          html: options.html,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        messageId: res.data.id || `resend-${Date.now()}`,
        provider: 'RESEND',
        status: 'DELIVERED',
      };
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message;
      return {
        messageId: '',
        provider: 'RESEND',
        status: 'FAILED',
        error: errMsg,
      };
    }
  }
}
