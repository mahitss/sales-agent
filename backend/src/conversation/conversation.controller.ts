import { Controller, Get, Param, UseGuards, Put, Body } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('conversations')
export class ConversationController {
  constructor(private conversationService: ConversationService) {}

  @UseGuards(AuthGuard)
  @Get('business/:businessId')
  async getByBusiness(@Param('businessId') businessId: string) {
    return this.conversationService.getByBusiness(businessId);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.conversationService.getById(id);
  }

  @UseGuards(AuthGuard)
  @Put(':id/takeover')
  async toggleTakeover(
    @Param('id') id: string,
    @Body('isHumanTakeover') isHumanTakeover: boolean
  ) {
    return this.conversationService.toggleTakeover(id, isHumanTakeover);
  }
}
