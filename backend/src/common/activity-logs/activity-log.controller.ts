import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ActivityLogService, AuditFilterDto } from './activity-log.service';
import { AuthGuard } from '../../auth/auth.guard';
import type { Response } from 'express';

@Controller('business')
export class ActivityLogController {
  constructor(private activityLogService: ActivityLogService) {}

  /**
   * GET /business/:businessId/audit-logs
   * Paginated, filterable audit log query.
   * Query params: userId, action, entity, severity, search, dateFrom, dateTo, page, limit
   */
  @UseGuards(AuthGuard)
  @Get(':businessId/audit-logs')
  async getAuditLogs(
    @Param('businessId') businessId: string,
    @Query() query: any,
    @Req() req: any,
  ) {
    this.enforceAccess(req, businessId);

    const filters: AuditFilterDto = {
      userId: query.userId,
      action: query.action,
      entity: query.entity,
      severity: query.severity,
      search: query.search,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 50,
    };

    return this.activityLogService.getLogsWithFilters(businessId, filters);
  }

  /**
   * GET /business/:businessId/audit-logs/stats
   * Summary statistics for dashboard widgets.
   */
  @UseGuards(AuthGuard)
  @Get(':businessId/audit-logs/stats')
  async getAuditStats(
    @Param('businessId') businessId: string,
    @Req() req: any,
  ) {
    this.enforceAccess(req, businessId);
    return this.activityLogService.getAuditStats(businessId);
  }

  /**
   * GET /business/:businessId/audit-logs/actors
   * List of distinct users who appear in this business's audit log.
   */
  @UseGuards(AuthGuard)
  @Get(':businessId/audit-logs/actors')
  async getAuditActors(
    @Param('businessId') businessId: string,
    @Req() req: any,
  ) {
    this.enforceAccess(req, businessId);
    return this.activityLogService.getAuditActors(businessId);
  }

  /**
   * GET /business/:businessId/audit-logs/export
   * Download filtered audit logs as a CSV file.
   */
  @UseGuards(AuthGuard)
  @Get(':businessId/audit-logs/export')
  @HttpCode(HttpStatus.OK)
  async exportAuditLogs(
    @Param('businessId') businessId: string,
    @Query() query: any,
    @Req() req: any,
    @Res() res: Response,
  ) {
    this.enforceAccess(req, businessId);

    const filters: AuditFilterDto = {
      userId: query.userId,
      action: query.action,
      entity: query.entity,
      severity: query.severity,
      search: query.search,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    };

    const csv = await this.activityLogService.exportToCsv(businessId, filters);
    const filename = `beacon-audit-log-${new Date().toISOString().split('T')[0]}.csv`;

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    res.send(csv);
  }

  /**
   * Legacy: keep old /activities endpoint for backwards compat.
   */
  @UseGuards(AuthGuard)
  @Get(':businessId/activities')
  async getActivitiesLegacy(
    @Param('businessId') businessId: string,
    @Req() req: any,
  ) {
    this.enforceAccess(req, businessId);
    const result = await this.activityLogService.getLogsWithFilters(
      businessId,
      { limit: 100, page: 1 },
    );
    return result.data;
  }

  private enforceAccess(req: any, businessId: string) {
    if (req.user.role !== 'ADMIN' && req.user.businessId !== businessId) {
      throw new ForbiddenException(
        'Access denied to other business audit logs',
      );
    }
  }
}
