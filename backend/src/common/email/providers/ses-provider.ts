import { SmtpProvider } from './smtp-provider';

export class SesProvider extends SmtpProvider {
  constructor(config: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  }) {
    super({
      host: config.host,
      port: config.port,
      user: config.user,
      pass: config.pass,
      from: config.from,
      providerName: 'SES',
    });
  }
}
