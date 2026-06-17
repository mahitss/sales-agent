import { Injectable, OnModuleInit, Logger, Inject, forwardRef } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { BusinessService } from '../../business/business.service';
import * as crypto from 'crypto';

@Injectable()
export class QueueService implements OnModuleInit {
  private readonly logger = new Logger(QueueService.name);
  private memoryQueue: Map<string, any[]> = new Map();

  constructor(
    private redisService: RedisService,
    private emailService: EmailService,
    @Inject(forwardRef(() => BusinessService))
    private businessService: BusinessService,
  ) {}

  async addJob(queueName: string, data: any) {
    const job = { id: crypto.randomUUID(), data, createdAt: Date.now(), attempts: 0 };
    const client = (this.redisService as any).client;

    if (client) {
      try {
        await client.rpush(`queue:${queueName}`, JSON.stringify(job));
        this.logger.log(`Job added to Redis queue "${queueName}": ${job.id}`);
        return;
      } catch (err: any) {
        this.logger.error(`Failed to add job to Redis queue: ${err.message}. Falling back to memory.`);
      }
    }

    // Memory fallback
    if (!this.memoryQueue.has(queueName)) {
      this.memoryQueue.set(queueName, []);
    }
    this.memoryQueue.get(queueName)!.push(job);
    this.logger.log(`Job added to memory queue "${queueName}": ${job.id}`);
  }

  onModuleInit() {
    // Start background polling loops for scraper and email queues
    this.startWorker('scraper', async (data) => {
      this.logger.log(`Processing scraper job for business ${data.businessId} with URL ${data.url}`);
      await this.businessService.scrapeWebsite(data.businessId, data.url);
    });

    this.startWorker('emails', async (data) => {
      this.logger.log(`Processing email invite job for ${data.email}`);
      await this.emailService.sendInviteEmail(data.email, data.name, data.businessName, data.inviteUrl);
    });
  }

  private startWorker(queueName: string, processor: (data: any) => Promise<void>) {
    const poll = async () => {
      const client = (this.redisService as any).client;
      let job: any = null;

      if (client) {
        try {
          const rawJob = await client.lpop(`queue:${queueName}`);
          if (rawJob) {
            job = JSON.parse(rawJob);
          }
        } catch (err: any) {
          this.logger.error(`Failed to pop job from Redis queue "${queueName}": ${err.message}`);
        }
      } else {
        const mem = this.memoryQueue.get(queueName);
        if (mem && mem.length > 0) {
          job = mem.shift();
        }
      }

      if (job) {
        try {
          await processor(job.data);
          this.logger.log(`Job completed successfully: ${job.id}`);
        } catch (err: any) {
          this.logger.error(`Job failed: ${job.id}. Error: ${err.message}`);
          const attempts = job.attempts || 0;
          if (attempts < 3) {
            job.attempts = attempts + 1;
            const delay = Math.pow(2, attempts) * 1000;
            this.logger.log(`Retrying job ${job.id} in ${delay}ms (attempt ${job.attempts})`);
            setTimeout(() => this.addJob(queueName, job.data), delay);
          }
        }
      }

      // Poll again after short delay
      setTimeout(poll, job ? 100 : 1000);
    };

    poll();
  }
}
