import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class WebhookSubscriptionService {
  private readonly logger = new Logger(WebhookSubscriptionService.name);

  constructor(private prisma: PrismaService) {}

  async createSubscription(businessId: string, url: string, events: string[]) {
    // Generate a unique secret for signing webhook payloads
    const secret = 'whsec_' + crypto.randomBytes(16).toString('hex');
    
    return this.prisma.webhookSubscription.create({
      data: {
        businessId,
        url,
        events,
        secret,
        isActive: true,
      },
    });
  }

  async listSubscriptions(businessId: string) {
    return this.prisma.webhookSubscription.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteSubscription(businessId: string, id: string) {
    const sub = await this.prisma.webhookSubscription.findFirst({
      where: { id, businessId },
    });

    if (!sub) {
      throw new NotFoundException('Webhook subscription not found');
    }

    await this.prisma.webhookSubscription.delete({
      where: { id },
    });

    return { success: true, message: 'Webhook subscription deleted successfully' };
  }

  /**
   * Publish an event to all active subscribers of a business.
   * Runs asynchronously in the background.
   */
  async publish(businessId: string, event: string, data: any) {
    try {
      const subscriptions = await this.prisma.webhookSubscription.findMany({
        where: {
          businessId,
          isActive: true,
          events: {
            has: event,
          },
        },
      });

      if (subscriptions.length === 0) return;

      const payload = {
        event,
        timestamp: new Date().toISOString(),
        data,
      };
      const stringifiedPayload = JSON.stringify(payload);

      // Dispatch webhooks in the background
      for (const sub of subscriptions) {
        const hmac = crypto.createHmac('sha256', sub.secret);
        const signature = hmac.update(stringifiedPayload).digest('hex');

        axios.post(sub.url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-signature': signature,
            'user-agent': 'Beacon-Webhook-Dispatcher/1.0',
          },
          timeout: 5000,
        }).then(() => {
          this.logger.log(`Webhook dispatched successfully to ${sub.url} for event ${event}`);
        }).catch((err) => {
          this.logger.warn(`Failed to dispatch webhook to ${sub.url}: ${err.message}`);
        });
      }
    } catch (err: any) {
      this.logger.error(`Webhook publishing error: ${err.message}`);
    }
  }
}
