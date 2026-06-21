import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { WebhookSignatureGuard } from '../common/guards/webhook.guard';
import { ChatService } from './chat.service';

@Controller('channels')
export class ChannelController {
  constructor(private chatService: ChatService) {}

  @UseGuards(WebhookSignatureGuard)
  @Post('webhook')
  async handleIncomingWebhook(
    @Body()
    body: {
      businessId: string;
      channel: string;
      message: string;
      leadName?: string;
      leadPhone?: string;
      leadEmail?: string;
    },
  ) {
    return this.chatService.simulateIncomingMessage(body);
  }
}
