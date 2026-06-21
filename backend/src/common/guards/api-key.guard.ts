import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = request.headers['x-api-key'] as string;

    if (!key) {
      throw new UnauthorizedException(
        'Developer API key is missing. Pass it in the x-api-key header.',
      );
    }

    const hashedKey = crypto.createHash('sha256').update(key).digest('hex');
    const keyRecord = await this.prisma.apiKey.findUnique({
      where: { hashedKey },
      include: { business: true },
    });

    if (!keyRecord) {
      throw new UnauthorizedException('Invalid Developer API key.');
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Developer API key has expired.');
    }

    // Map request user details so existing guards/controllers still function correctly
    request['user'] = {
      sub: `apikey-${keyRecord.id}`,
      role: keyRecord.role,
      businessId: keyRecord.businessId,
      isApiKey: true,
    };

    // Update lastUsedAt asynchronously
    this.prisma.apiKey
      .update({
        where: { id: keyRecord.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});

    return true;
  }
}
