export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  metadata?: Record<string, any>;
}

export interface SendEmailResult {
  messageId: string;
  provider: string;
  status: 'DELIVERED' | 'FAILED';
  error?: string;
}

export interface EmailProvider {
  send(options: SendEmailOptions): Promise<SendEmailResult>;
}
