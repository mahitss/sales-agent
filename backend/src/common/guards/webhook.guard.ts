import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const signature =
      request.headers['x-hub-signature-256'] || request.headers['x-signature'];

    if (!signature) {
      throw new UnauthorizedException('Webhook signature is missing');
    }

    const secret = process.env.WEBHOOK_SECRET || 'super-secret-webhook-key';
    const bodyStr = JSON.stringify(request.body);

    // Support standard Hub Signatures format (e.g. sha256=...)
    const expectedSignature = signature.startsWith('sha256=')
      ? signature.substring(7)
      : signature;

    const hmac = crypto.createHmac('sha256', secret);
    const computedSignature = hmac.update(bodyStr).digest('hex');

    if (computedSignature !== expectedSignature) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return true;
  }
}
