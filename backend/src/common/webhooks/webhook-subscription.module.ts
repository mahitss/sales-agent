import { Module, Global } from '@nestjs/common';
import { WebhookSubscriptionService } from './webhook-subscription.service';
import { WebhookSubscriptionController } from './webhook-subscription.controller';

@Global()
@Module({
  providers: [WebhookSubscriptionService],
  controllers: [WebhookSubscriptionController],
  exports: [WebhookSubscriptionService],
})
export class WebhookSubscriptionModule {}
