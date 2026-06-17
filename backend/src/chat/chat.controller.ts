import { Controller, Post, Body, UseGuards, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';
import { AuthGuard } from '../auth/auth.guard';
import * as express from 'express';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @UseGuards(AuthGuard)
  @Post()
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(dto);
  }

  @UseGuards(AuthGuard)
  @Post('stream')
  async streamMessage(@Body() dto: SendMessageDto, @Res() res: express.Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    await this.chatService.streamMessage(dto, res);
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
