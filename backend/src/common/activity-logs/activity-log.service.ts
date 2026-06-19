import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Log an action in the database.
   */
  async log(userId: string | null, action: string, description: string, req?: any, metadata: any = {}) {
    try {
      const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || null;
      
      const logEntry = await this.prisma.activityLog.create({
        data: {
          userId,
          action,
          description,
          ipAddress,
          metadata: metadata || {},
        },
      });

      this.logger.log(`[Activity Log] Action: ${action} | Description: ${description} | User: ${userId || 'SYSTEM'}`);
      return logEntry;
    } catch (err: any) {
      this.logger.error(`Failed to write activity log: ${err.message}`, err.stack);
    }
  }

  /**
   * Get audit logs for a business workspace.
   */
  async getLogsForBusiness(businessId: string) {
    return this.prisma.activityLog.findMany({
      where: {
        user: {
          businessId,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit for performance
    });
  }
}
