import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChannelController } from './channel.controller';

@Module({
  providers: [ChatService],
  controllers: [ChatController, ChannelController],
})
export class ChatModule {}
