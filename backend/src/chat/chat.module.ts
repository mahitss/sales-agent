import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChannelController } from './channel.controller';
import { LeadModule } from '../lead/lead.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [LeadModule, JobsModule],
  providers: [ChatService],
  controllers: [ChatController, ChannelController],
})
export class ChatModule {}
