import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post()
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(dto);
  }

  @UseGuards(AuthGuard)
  @Post('operator-reply')
  async sendOperatorReply(@Body() body: { conversationId: string; message: string }) {
    return this.chatService.sendOperatorReply(body.conversationId, body.message);
  }

  @UseGuards(AuthGuard)
  @Post('simulate-incoming')
  async simulateIncoming(
    @Body() body: {
      businessId: string;
      channel: string;
      message: string;
      leadName?: string;
      leadPhone?: string;
      leadEmail?: string;
    }
  ) {
    return this.chatService.simulateIncomingMessage(body);
  }
}
