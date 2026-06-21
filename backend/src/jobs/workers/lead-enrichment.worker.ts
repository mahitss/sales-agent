import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, forwardRef, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { LeadIntelligenceService } from '../../lead/lead-intelligence.service';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('lead-enrichment')
export class LeadEnrichmentWorker extends WorkerHost {
  private readonly logger = new Logger(LeadEnrichmentWorker.name);

  constructor(
    @Inject(forwardRef(() => LeadIntelligenceService))
    private leadIntelligenceService: LeadIntelligenceService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const startTime = Date.now();
    const { leadId, businessId } = job.data;
    this.logger.log(`Processing Lead Enrichment job ${job.id} for lead ${leadId}`);

    try {
      const result = await this.leadIntelligenceService.processLeadAnalysis(leadId);
      
      const duration = Date.now() - startTime;
      await this.prisma.jobLog.create({
        data: {
          queueName: 'lead-enrichment',
          jobId: job.id || 'unknown',
          jobName: job.name,
          status: 'COMPLETED',
          data: job.data,
          duration,
          businessId,
        },
      }).catch(() => {});

      return result;
    } catch (err: any) {
      const duration = Date.now() - startTime;
      this.logger.error(`Lead Enrichment job ${job.id} failed: ${err.message}`, err.stack);

      await this.prisma.jobLog.create({
        data: {
          queueName: 'lead-enrichment',
          jobId: job.id || 'unknown',
          jobName: job.name,
          status: 'FAILED',
          data: job.data,
          error: `${err.message}\n${err.stack || ''}`,
          duration,
          businessId,
        },
      }).catch(() => {});

      throw err;
    }
  }
}
