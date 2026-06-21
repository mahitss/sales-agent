import { Controller, Post, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { TenantGuard } from '../auth/tenant.guard';

@Controller('leads')
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  @Post('business/:businessId/feedback')
  async submitFeedback(
    @Param('businessId') businessId: string,
    @Body() body: { name: string; email: string; category: string; content: string }
  ) {
    return this.feedbackService.submitFeedback(businessId, body);
  }

  @UseGuards(AuthGuard, RolesGuard, TenantGuard)
  @Roles('ADMIN')
  @Get('business/:businessId/feedback')
  async getFeedback(@Param('businessId') businessId: string) {
    return this.feedbackService.getFeedback(businessId);
  }

  @UseGuards(AuthGuard, RolesGuard, TenantGuard)
  @Roles('ADMIN')
  @Put('feedback/:feedbackId/status')
  async updateStatus(
    @Param('feedbackId') feedbackId: string,
    @Body('status') status: string
  ) {
    return this.feedbackService.updateStatus(feedbackId, status);
  }
}
