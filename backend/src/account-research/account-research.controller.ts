import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import { AccountResearchService } from './account-research.service';
import { AuthGuard } from '../auth/auth.guard';
import { TenantGuard } from '../auth/tenant.guard';
import * as express from 'express';

@Controller('account-research')
@UseGuards(AuthGuard, TenantGuard)
export class AccountResearchController {
  constructor(private accountResearchService: AccountResearchService) {}

  @Post('domain')
  async createResearch(@Body() body: { domain: string }, @Req() req: any) {
    const businessId = req.user.businessId;
    return this.accountResearchService.createResearch(businessId, body.domain);
  }

  @Get('history')
  async getHistory(@Req() req: any) {
    const businessId = req.user.businessId;
    return this.accountResearchService.getHistory(businessId);
  }

  @Get(':id')
  async getDetails(@Param('id') id: string, @Req() req: any) {
    const businessId = req.user.businessId;
    return this.accountResearchService.getDetails(id, businessId);
  }

  @Get(':id/pdf')
  async downloadPdf(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: express.Response,
  ) {
    const businessId = req.user.businessId;
    const pdfBuffer = await this.accountResearchService.generatePdf(
      id,
      businessId,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=briefing-${id}.pdf`,
    );
    return res.status(200).send(pdfBuffer);
  }
}
