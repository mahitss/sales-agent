import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, forwardRef, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BusinessService } from '../../business/business.service';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('ai-research')
export class AIResearchWorker extends WorkerHost {
  private readonly logger = new Logger(AIResearchWorker.name);

  constructor(
    @Inject(forwardRef(() => BusinessService))
    private businessService: BusinessService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const startTime = Date.now();
    const { businessId, url } = job.data;
    this.logger.log(
      `Processing scraping job ${job.id} for business ${businessId} with URL ${url}`,
    );

    try {
      const result = await this.businessService.scrapeWebsite(businessId, url);

      const duration = Date.now() - startTime;
      await this.prisma.jobLog
        .create({
          data: {
            queueName: 'ai-research',
            jobId: job.id || 'unknown',
            jobName: job.name,
            status: 'COMPLETED',
            data: job.data,
            duration,
            businessId,
          },
        })
        .catch(() => {});

      return result;
    } catch (err: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Scraping job ${job.id} failed: ${err.message}`,
        err.stack,
      );

      await this.prisma.jobLog
        .create({
          data: {
            queueName: 'ai-research',
            jobId: job.id || 'unknown',
            jobName: job.name,
            status: 'FAILED',
            data: job.data,
            error: `${err.message}\n${err.stack || ''}`,
            duration,
            businessId,
          },
        })
        .catch(() => {});

      throw err; // Throwing error triggers BullMQ retry logic
    }
  }
}
