import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyService {
  constructor(private prisma: PrismaService) {}

  async createApiKey(businessId: string, name: string, role: string = 'EMPLOYEE', expiresDays?: number) {
    const rawKey = 'beacon_sk_' + crypto.randomBytes(24).toString('hex');
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');

    let expiresAt: Date | null = null;
    if (expiresDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresDays);
    }

    const keyRecord = await this.prisma.apiKey.create({
      data: {
        name,
        hashedKey,
        businessId,
        role,
        expiresAt,
      },
    });

    return {
      success: true,
      apiKey: {
        id: keyRecord.id,
        name: keyRecord.name,
        role: keyRecord.role,
        expiresAt: keyRecord.expiresAt,
        createdAt: keyRecord.createdAt,
      },
      rawKey, // Returned only once on generation
    };
  }

  async listApiKeys(businessId: string) {
    return this.prisma.apiKey.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        expiresAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeApiKey(businessId: string, id: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id, businessId },
    });

    if (!key) {
      throw new NotFoundException('API Key not found');
    }

    await this.prisma.apiKey.delete({
      where: { id },
    });

    return { success: true, message: 'API key revoked successfully' };
  }
}
