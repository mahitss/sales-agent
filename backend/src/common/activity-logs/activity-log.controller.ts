import { Controller, Get, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { AuthGuard } from '../../auth/auth.guard';

@Controller('business')
export class ActivityLogController {
  constructor(private activityLogService: ActivityLogService) {}

  @UseGuards(AuthGuard)
  @Get(':businessId/activities')
  async getLogsForBusiness(@Param('businessId') businessId: string, @Req() req) {
    // Enforce tenant boundary checks
    if (req.user.role !== 'ADMIN' && req.user.businessId !== businessId) {
      throw new ForbiddenException('Access denied to other business activities');
    }
    return this.activityLogService.getLogsForBusiness(businessId);
  }
}
