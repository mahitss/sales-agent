import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private prisma: PrismaService,
    private jobsService: JobsService,
  ) {}

  async createWorkflow(
    businessId: string,
    name: string,
    trigger: string,
    nodes: any[],
    edges: any[],
  ) {
    return this.prisma.workflow.create({
      data: {
        businessId,
        name,
        trigger,
        nodes: nodes || [],
        edges: edges || [],
      },
    });
  }

  async updateWorkflow(
    id: string,
    businessId: string,
    name: string,
    trigger: string,
    nodes: any[],
    edges: any[],
    isEnabled?: boolean,
  ) {
    const existing = await this.prisma.workflow.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Workflow not found');
    }

    if (existing.businessId !== businessId) {
      throw new ForbiddenException('Tenancy isolation mismatch');
    }

    return this.prisma.workflow.update({
      where: { id },
      data: {
        name,
        trigger,
        nodes: (nodes !== undefined ? nodes : existing.nodes) as any,
        edges: (edges !== undefined ? edges : existing.edges) as any,
        isEnabled: isEnabled !== undefined ? isEnabled : existing.isEnabled,
      },
    });
  }

  async listWorkflows(businessId: string) {
    return this.prisma.workflow.findMany({
      where: { businessId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getWorkflow(id: string, businessId: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    if (workflow.businessId !== businessId) {
      throw new ForbiddenException('Tenancy isolation mismatch');
    }

    return workflow;
  }

  async listExecutions(workflowId: string, businessId: string) {
    // Enforce tenancy by validating workflow ownership first
    await this.getWorkflow(workflowId, businessId);

    return this.prisma.workflowExecution.findMany({
      where: { workflowId },
      include: {
        logs: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getExecutionDetails(executionId: string, businessId: string) {
    const execution = await this.prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: { 
        workflow: true,
        logs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!execution) {
      throw new NotFoundException('Workflow execution not found');
    }

    if (execution.workflow.businessId !== businessId) {
      throw new ForbiddenException('Tenancy isolation mismatch');
    }

    return execution;
  }

  async getWorkflowMetrics(businessId: string) {
    const workflows = await this.prisma.workflow.findMany({
      where: { businessId },
      select: { id: true },
    });

    const workflowIds = workflows.map((w) => w.id);

    if (workflowIds.length === 0) {
      return {
        totalExecutions: 0,
        completedExecutions: 0,
        failedExecutions: 0,
        failureRate: 0,
        averageStepDurationMs: 0,
      };
    }

    const totalExecutions = await this.prisma.workflowExecution.count({
      where: { workflowId: { in: workflowIds } },
    });

    const completedExecutions = await this.prisma.workflowExecution.count({
      where: { workflowId: { in: workflowIds }, status: 'COMPLETED' },
    });

    const failedExecutions = await this.prisma.workflowExecution.count({
      where: { workflowId: { in: workflowIds }, status: 'FAILED' },
    });

    const stepLogsGroup = await this.prisma.workflowStepLog.aggregate({
      where: {
        execution: {
          workflowId: { in: workflowIds },
        },
      },
      _avg: {
        duration: true,
      },
    });

    const failureRate = totalExecutions > 0 ? parseFloat(((failedExecutions / totalExecutions) * 100).toFixed(1)) : 0;
    const averageStepDurationMs = Math.round(stepLogsGroup._avg.duration || 0);

    return {
      totalExecutions,
      completedExecutions,
      failedExecutions,
      failureRate,
      averageStepDurationMs,
    };
  }

  /**
   * Dispatch trigger event: scans and enqueues matching active workflows.
   */
  async trigger(triggerType: string, businessId: string, payload: any) {
    this.logger.log(`Received trigger event: ${triggerType} for business ${businessId}`);
    
    try {
      const activeWorkflows = await this.prisma.workflow.findMany({
        where: {
          businessId,
          trigger: triggerType,
          isEnabled: true,
        },
      });

      this.logger.log(`Found ${activeWorkflows.length} active workflows matching trigger ${triggerType}`);

      for (const workflow of activeWorkflows) {
        const execution = await this.prisma.workflowExecution.create({
          data: {
            workflowId: workflow.id,
            status: 'PENDING',
            triggerPayload: payload || {},
          },
        });

        await this.jobsService.addWorkflowExecutionJob(execution.id, workflow.id, businessId);
      }
    } catch (err: any) {
      this.logger.error(`Failed to dispatch trigger ${triggerType}: ${err.message}`, err.stack);
    }
  }
}
