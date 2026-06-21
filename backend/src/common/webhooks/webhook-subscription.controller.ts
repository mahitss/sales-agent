import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { WebhookSubscriptionService } from './webhook-subscription.service';
import { AuthGuard } from '../../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('business/webhooks')
export class WebhookSubscriptionController {
  constructor(private webhookService: WebhookSubscriptionService) {}

  @Post()
  async create(@Req() req, @Body() body: { url: string; events: string[] }) {
    if (!req.user.businessId) {
      throw new BadRequestException(
        'User is not associated with a business workspace',
      );
    }
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only workspace administrators can subscribe to outbound webhooks',
      );
    }
    if (!body.url || !body.events || !Array.isArray(body.events)) {
      throw new BadRequestException(
        'Webhook URL and array of events are required',
      );
    }
    return this.webhookService.createSubscription(
      req.user.businessId,
      body.url,
      body.events,
    );
  }

  @Get()
  async list(@Req() req) {
    if (!req.user.businessId) {
      throw new BadRequestException(
        'User is not associated with a business workspace',
      );
    }
    return this.webhookService.listSubscriptions(req.user.businessId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req) {
    if (!req.user.businessId) {
      throw new BadRequestException(
        'User is not associated with a business workspace',
      );
    }
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only workspace administrators can delete webhook subscriptions',
      );
    }
    return this.webhookService.deleteSubscription(req.user.businessId, id);
  }
}
