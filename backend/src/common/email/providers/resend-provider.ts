import { EmailProvider, SendEmailOptions, SendEmailResult } from './email-provider.interface';
import { Logger } from '@nestjs/common';
import axios from 'axios';

export class ResendProvider implements EmailProvider {
  private readonly logger = new Logger(ResendProvider.name);
  private apiKey: string;
  private defaultFrom: string;

  constructor(config: { apiKey: string; from: string }) {
    this.apiKey = config.apiKey;
    this.defaultFrom = config.from || 'onboarding@resend.dev';
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const payload = {
      from: options.from || this.defaultFrom,
      to: [options.to],
      subject: options.subject,
      html: options.html,
    };

    this.logger.log(`Resend Request Payload: ${JSON.stringify(payload, null, 2)}`);

    try {
      const res = await axios.post(
        'https://api.resend.com/emails',
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`Resend Response Payload: ${JSON.stringify(res.data, null, 2)}`);

      return {
        messageId: res.data.id || `resend-${Date.now()}`,
        provider: 'RESEND',
        status: 'DELIVERED',
      };
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.response?.data || err.message;
      const statusCode = err.response?.status;

      this.logger.error(`Resend Error Response (Status ${statusCode}): ${JSON.stringify(err.response?.data || err.message, null, 2)}`);

      // Fallback logic: If we get a 403 Forbidden due to unverified domain and we did not use onboarding@resend.dev yet, retry with onboarding@resend.dev
      if (statusCode === 403 && payload.from !== 'onboarding@resend.dev') {
        this.logger.warn(`Custom domain unverified (403). Retrying send using fallback 'onboarding@resend.dev'...`);
        const fallbackPayload = {
          ...payload,
          from: 'onboarding@resend.dev',
        };
        this.logger.log(`Resend Fallback Request Payload: ${JSON.stringify(fallbackPayload, null, 2)}`);

        try {
          const res = await axios.post(
            'https://api.resend.com/emails',
            fallbackPayload,
            {
              headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
              },
            },
          );

          this.logger.log(`Resend Fallback Response Payload: ${JSON.stringify(res.data, null, 2)}`);

          return {
            messageId: res.data.id || `resend-${Date.now()}`,
            provider: 'RESEND',
            status: 'DELIVERED',
          };
        } catch (fallbackErr: any) {
          const fallbackErrMsg = fallbackErr.response?.data?.message || fallbackErr.response?.data || fallbackErr.message;
          this.logger.error(`Resend Fallback Error (Status ${fallbackErr.response?.status}): ${JSON.stringify(fallbackErr.response?.data || fallbackErr.message, null, 2)}`);
          return {
            messageId: '',
            provider: 'RESEND',
            status: 'FAILED',
            error: fallbackErrMsg,
          };
        }
      }

      return {
        messageId: '',
        provider: 'RESEND',
        status: 'FAILED',
        error: errMsg,
      };
    }
  }
}

