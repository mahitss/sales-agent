import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChannelController } from './channel.controller';
import { LeadModule } from '../lead/lead.module';

@Module({
  imports: [LeadModule],
  providers: [ChatService],
  controllers: [ChatController, ChannelController],
})
export class ChatModule {}
