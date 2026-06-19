import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { AuthGuard } from '../../auth/auth.guard';

@Controller('business')
export class ActivityLogController {
  constructor(private activityLogService: ActivityLogService) {}

  @UseGuards(AuthGuard)
  @Get(':businessId/activities')
  async getLogsForBusiness(@Param('businessId') businessId: string) {
    return this.activityLogService.getLogsForBusiness(businessId);
  }
}
