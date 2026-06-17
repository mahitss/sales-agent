import { Controller, Get, Param, UseGuards, Put, Body, Query, Res } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('conversations')
export class ConversationController {
  constructor(private conversationService: ConversationService) {}

  @UseGuards(AuthGuard)
  @Get('business/:businessId')
  async getByBusiness(
    @Param('businessId') businessId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.conversationService.getByBusiness(businessId, limitNum, cursor);
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

  @UseGuards(AuthGuard)
  @Get('business/:businessId/export')
  async exportConversationsCsv(@Param('businessId') businessId: string, @Res() res: any) {
    const csv = await this.conversationService.exportConversationsToCsv(businessId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=conversations-${businessId}.csv`);
    return res.status(200).send(csv);
  }

  @UseGuards(AuthGuard)
  @Get('business/:businessId/export/json')
  async exportConversationsJson(@Param('businessId') businessId: string, @Res() res: any) {
    const json = await this.conversationService.exportConversationsToJson(businessId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=conversations-${businessId}.json`);
    return res.status(200).send(json);
  }
}
