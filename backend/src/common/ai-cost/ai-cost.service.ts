import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AICostService {
  private readonly logger = new Logger(AICostService.name);

  // Gemini 2.5 Flash pricing rates (USD per token)
  private readonly INPUT_TOKEN_RATE = 0.075 / 1_000_000;
  private readonly OUTPUT_TOKEN_RATE = 0.3 / 1_000_000;

  constructor(private prisma: PrismaService) {}

  /**
   * Log AI token consumption and cost.
   */
  async logUsage(
    businessId: string,
    model: string,
    promptTokens: number,
    completionTokens: number,
    action: string,
  ) {
    try {
      const calculatedCost =
        promptTokens * this.INPUT_TOKEN_RATE +
        completionTokens * this.OUTPUT_TOKEN_RATE;

      const log = await this.prisma.aICostLog.create({
        data: {
          businessId,
          model,
          promptTokens,
          completionTokens,
          cost: calculatedCost,
          action,
        },
      });

      this.logger.log(
        `[AI Cost Log] Action: ${action} | Model: ${model} | Cost: $${calculatedCost.toFixed(6)} | Business: ${businessId}`,
      );
      return log;
    } catch (err: any) {
      this.logger.error(
        `Failed to write AI cost log: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Aggregate AI cost stats for the dashboard.
   */
  async getCostStats(businessId: string) {
    const logs = await this.prisma.aICostLog.findMany({
      where: { businessId },
    });

    const totalQueries = logs.length;
    const totalCost = logs.reduce((acc, l) => acc + l.cost, 0);
    const totalPromptTokens = logs.reduce((acc, l) => acc + l.promptTokens, 0);
    const totalCompletionTokens = logs.reduce(
      (acc, l) => acc + l.completionTokens,
      0,
    );

    // Group costs by action
    const byAction: Record<string, { count: number; cost: number }> = {};
    for (const log of logs) {
      if (!byAction[log.action]) {
        byAction[log.action] = { count: 0, cost: 0 };
      }
      byAction[log.action].count++;
      byAction[log.action].cost += log.cost;
    }

    return {
      totalQueries,
      totalCost,
      totalPromptTokens,
      totalCompletionTokens,
      byAction,
    };
  }
}
