import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, forwardRef, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { LeadService } from '../../lead/lead.service';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('report-generation')
export class ReportGenerationWorker extends WorkerHost {
  private readonly logger = new Logger(ReportGenerationWorker.name);

  constructor(
    @Inject(forwardRef(() => LeadService))
    private leadService: LeadService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const startTime = Date.now();
    const { businessId, format } = job.data;
    this.logger.log(
      `Processing report generation job ${job.id} for business ${businessId} in format ${format}`,
    );

    try {
      let outputSize = 0;

      if (format === 'csv') {
        const csv = await this.leadService.exportLeadsToCsv(businessId);
        outputSize = Buffer.byteLength(csv);
      } else if (format === 'excel') {
        const buffer = await this.leadService.exportLeadsToExcel(businessId);
        outputSize = buffer.length;
      } else {
        const json = await this.leadService.exportLeadsToJson(businessId);
        outputSize = Buffer.byteLength(JSON.stringify(json));
      }

      const duration = Date.now() - startTime;
      await this.prisma.jobLog
        .create({
          data: {
            queueName: 'report-generation',
            jobId: job.id || 'unknown',
            jobName: job.name,
            status: 'COMPLETED',
            data: { ...job.data, outputSize },
            duration,
            businessId,
          },
        })
        .catch(() => {});

      return { success: true, size: outputSize };
    } catch (err: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Report generation job ${job.id} failed: ${err.message}`,
        err.stack,
      );

      await this.prisma.jobLog
        .create({
          data: {
            queueName: 'report-generation',
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

      throw err;
    }
  }
}
