import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createObjectCsvStringifier } from 'csv-writer';

export type AuditSeverity = 'INFO' | 'WARN' | 'CRITICAL';

export interface AuditLogDto {
  userId?: string | null;
  businessId?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  description: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  severity?: AuditSeverity;
  metadata?: Record<string, any>;
}

export interface AuditFilterDto {
  userId?: string;
  action?: string;
  entity?: string;
  severity?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// Helper to extract audit context from a NestJS request object
export function extractAuditContext(req: any): Partial<AuditLogDto> {
  return {
    userId: req?.user?.id || req?.user?.userId || null,
    businessId: req?.user?.businessId || null,
    ipAddress:
      req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      req?.ip ||
      null,
    userAgent: req?.headers?.['user-agent'] || null,
  };
}

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Write a typed audit entry. Never throws — failures are swallowed to avoid
   * blocking the main request path.
   */
  async log(dto: AuditLogDto): Promise<void> {
    try {
      await this.prisma.activityLog.create({
        data: {
          userId: dto.userId || null,
          businessId: dto.businessId || null,
          action: dto.action,
          entity: dto.entity || null,
          entityId: dto.entityId || null,
          description: dto.description,
          ipAddress: dto.ipAddress || null,
          userAgent: dto.userAgent || null,
          severity: dto.severity || 'INFO',
          metadata: dto.metadata || {},
        },
      });

      this.logger.log(
        `[Audit] ${dto.severity || 'INFO'} | ${dto.action} | ${dto.entity || '-'}:${dto.entityId || '-'} | User:${dto.userId || 'SYSTEM'} | ${dto.description}`,
      );
    } catch (err: any) {
      this.logger.error(
        `[Audit] Failed to write log: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Paginated, filterable audit log query for a business tenant.
   */
  async getLogsWithFilters(businessId: string, filters: AuditFilterDto) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 200);
    const skip = (page - 1) * limit;

    const where: any = { businessId };

    if (filters.userId) where.userId = filters.userId;
    if (filters.action)
      where.action = { contains: filters.action, mode: 'insensitive' };
    if (filters.entity) where.entity = filters.entity;
    if (filters.severity) where.severity = filters.severity;

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

    if (filters.search) {
      where.OR = [
        { description: { contains: filters.search, mode: 'insensitive' } },
        { action: { contains: filters.search, mode: 'insensitive' } },
        { entity: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [total, logs] = await Promise.all([
      this.prisma.activityLog.count({ where }),
      this.prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Summary statistics for the audit dashboard widgets.
   */
  async getAuditStats(businessId: string) {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      total,
      last24h,
      criticalCount,
      warnCount,
      actionBreakdown,
      topActors,
    ] = await Promise.all([
      this.prisma.activityLog.count({ where: { businessId } }),
      this.prisma.activityLog.count({
        where: { businessId, createdAt: { gte: since24h } },
      }),
      this.prisma.activityLog.count({
        where: { businessId, severity: 'CRITICAL' },
      }),
      this.prisma.activityLog.count({
        where: { businessId, severity: 'WARN' },
      }),
      this.prisma.activityLog.groupBy({
        by: ['action'],
        where: { businessId, createdAt: { gte: since7d } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 8,
      }),
      this.prisma.activityLog.groupBy({
        by: ['userId'],
        where: {
          businessId,
          userId: { not: null },
          createdAt: { gte: since7d },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    // Resolve top actor names
    const actorIds = topActors.map((a) => a.userId).filter(Boolean) as string[];
    const actors = await this.prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, name: true, email: true },
    });
    const actorMap = Object.fromEntries(actors.map((u) => [u.id, u]));

    return {
      total,
      last24h,
      criticalCount,
      warnCount,
      actionBreakdown: actionBreakdown.map((a) => ({
        action: a.action,
        count: a._count.id,
      })),
      topActors: topActors.map((a) => ({
        userId: a.userId,
        name: actorMap[a.userId!]?.name || 'Unknown',
        email: actorMap[a.userId!]?.email || '',
        count: a._count.id,
      })),
    };
  }

  /**
   * Export filtered audit logs to CSV for compliance downloads.
   */
  async exportToCsv(
    businessId: string,
    filters: AuditFilterDto,
  ): Promise<string> {
    const { data } = await this.getLogsWithFilters(businessId, {
      ...filters,
      limit: 5000,
      page: 1,
    });

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'createdAt', title: 'Timestamp' },
        { id: 'severity', title: 'Severity' },
        { id: 'action', title: 'Action' },
        { id: 'entity', title: 'Entity Type' },
        { id: 'entityId', title: 'Entity ID' },
        { id: 'description', title: 'Description' },
        { id: 'userName', title: 'User Name' },
        { id: 'userEmail', title: 'User Email' },
        { id: 'userRole', title: 'User Role' },
        { id: 'ipAddress', title: 'IP Address' },
        { id: 'userAgent', title: 'User Agent' },
      ],
    });

    const records = data.map((log: any) => ({
      createdAt: new Date(log.createdAt).toISOString(),
      severity: log.severity,
      action: log.action,
      entity: log.entity || '',
      entityId: log.entityId || '',
      description: log.description,
      userName: log.user?.name || 'System',
      userEmail: log.user?.email || '',
      userRole: log.user?.role || '',
      ipAddress: log.ipAddress || '',
      userAgent: log.userAgent || '',
    }));

    return (
      csvStringifier.getHeaderString() +
      csvStringifier.stringifyRecords(records)
    );
  }

  /**
   * Get distinct users who have activity in this business (for filter dropdown).
   */
  async getAuditActors(businessId: string) {
    const rows = await this.prisma.activityLog.findMany({
      where: { businessId, userId: { not: null } },
      select: { userId: true },
      distinct: ['userId'],
    });

    const ids = rows.map((r) => r.userId).filter(Boolean) as string[];
    return this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, email: true, role: true },
    });
  }
}
