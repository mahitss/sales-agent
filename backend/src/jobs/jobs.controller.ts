import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  Query,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { JobsService } from './jobs.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('jobs')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class JobsController {
  private readonly logger = new Logger(JobsController.name);

  constructor(
    private jobsService: JobsService,
    private prisma: PrismaService,
  ) {}

  /**
   * Fetch job counts for all 5 queues
   */
  @Get('metrics')
  async getQueueMetrics(@Req() req) {
    const businessId = req.user.businessId;
    const queues = this.jobsService.getQueues();
    const metrics: Record<string, any> = {};

    for (const [name, queue] of Object.entries(queues)) {
      const counts = await queue.getJobCounts(
        'waiting',
        'active',
        'completed',
        'failed',
        'delayed',
      );

      // Filter database logs specific to this business to count successful/failed runs
      const dbSuccessCount = await this.prisma.jobLog.count({
        where: { queueName: name, status: 'COMPLETED', businessId },
      });
      const dbFailedCount = await this.prisma.jobLog.count({
        where: { queueName: name, status: 'FAILED', businessId },
      });

      metrics[name] = {
        active: counts.active,
        waiting: counts.waiting,
        completed: counts.completed,
        failed: counts.failed,
        delayed: counts.delayed,
        totalRunsSuccess: dbSuccessCount,
        totalRunsFailed: dbFailedCount,
      };
    }

    return { success: true, metrics };
  }

  /**
   * Get failure logs from the database
   */
  @Get('failures')
  async getFailureLogs(
    @Req() req,
    @Query('queueName') queueName?: string,
    @Query('limit') limit = '20',
  ) {
    const businessId = req.user.businessId;
    const parsedLimit = parseInt(limit, 10) || 20;

    const failures = await this.prisma.jobLog.findMany({
      where: {
        status: 'FAILED',
        businessId,
        ...(queueName ? { queueName } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: parsedLimit,
    });

    return { success: true, failures };
  }

  /**
   * Retry a specific failed job in a queue
   */
  @Post('retry/:queueName/:jobId')
  async retryJob(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
    @Req() req,
  ) {
    const businessId = req.user.businessId;
    const queues = this.jobsService.getQueues();
    const queue = queues[queueName];

    if (!queue) {
      throw new NotFoundException(`Queue "${queueName}" not found`);
    }

    // Verify job belongs to this tenant in the DB logs first
    const jobLog = await this.prisma.jobLog.findFirst({
      where: { queueName, jobId, businessId },
    });

    if (!jobLog) {
      throw new NotFoundException(`Job log not found or access denied`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`Job "${jobId}" not found in Redis store`);
    }

    this.logger.log(`Admin retrying job ${jobId} in queue ${queueName}`);
    await job.retry();

    return { success: true, message: `Job ${jobId} promoted for retry.` };
  }

  /**
   * Retry all failed jobs in a queue
   */
  @Post('retry-all/:queueName')
  async retryAllFailed(@Param('queueName') queueName: string, @Req() req) {
    const businessId = req.user.businessId;
    const queues = this.jobsService.getQueues();
    const queue = queues[queueName];

    if (!queue) {
      throw new NotFoundException(`Queue "${queueName}" not found`);
    }

    // Retrieve all failed jobs from Redis
    const failedJobs = await queue.getFailed();
    let retriedCount = 0;

    for (const job of failedJobs) {
      // Cross-reference with DB logs to ensure tenancy match
      const log = await this.prisma.jobLog.findFirst({
        where: { queueName, jobId: job.id, businessId },
      });

      if (log) {
        await job.retry().catch(() => {});
        retriedCount++;
      }
    }

    return {
      success: true,
      message: `Retried ${retriedCount} failed jobs in queue "${queueName}".`,
    };
  }
}
