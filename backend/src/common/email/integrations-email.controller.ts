import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { EmailIntegrationService } from './email-integration.service';
import { AuthGuard } from '../../auth/auth.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('integrations/email')
@UseGuards(AuthGuard, TenantGuard)
export class IntegrationsEmailController {
  constructor(
    private emailIntegrationService: EmailIntegrationService,
    private prisma: PrismaService,
  ) {}

  @Get('connect')
  async getConnectUrl(
    @Query('provider') provider: 'GMAIL' | 'OUTLOOK',
    @Query('redirectUri') redirectUri: string,
    @Req() req: any,
  ) {
    const businessId = req.user.businessId;
    const url = this.emailIntegrationService.getConnectUrl(
      provider,
      redirectUri,
      businessId,
    );
    return { url };
  }

  @Post('callback')
  async handleCallback(
    @Body()
    body: { provider: 'GMAIL' | 'OUTLOOK'; code: string; redirectUri: string },
    @Req() req: any,
  ) {
    const businessId = req.user.businessId;
    const account = await this.emailIntegrationService.handleCallback(
      body.provider,
      body.code,
      body.redirectUri,
      businessId,
    );
    return { success: true, email: account.email };
  }

  @Get('accounts')
  async listAccounts(@Req() req: any) {
    const businessId = req.user.businessId;
    return this.prisma.emailAccount.findMany({
      where: { businessId },
      select: {
        id: true,
        provider: true,
        email: true,
        syncState: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('activities/:leadId')
  async getLeadActivities(@Param('leadId') leadId: string, @Req() req: any) {
    const businessId = req.user.businessId;
    return this.prisma.emailActivity.findMany({
      where: { leadId, businessId },
      include: {
        opens: {
          orderBy: { openedAt: 'desc' },
        },
      },
      orderBy: { sentAt: 'desc' },
    });
  }

  @Delete('accounts/:id')
  async disconnectAccount(@Param('id') id: string, @Req() req: any) {
    const businessId = req.user.businessId;

    // Tenancy isolation lookup check
    const account = await this.prisma.emailAccount.findFirst({
      where: { id, businessId },
    });

    if (!account) {
      return {
        success: false,
        message: 'Email account not found or access denied',
      };
    }

    await this.prisma.emailAccount.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Email account disconnected successfully',
    };
  }

  @Post('send')
  async sendEmail(
    @Body()
    body: {
      accountId: string;
      to: string;
      subject: string;
      body: string;
      leadId?: string;
    },
    @Req() req: any,
  ) {
    const businessId = req.user.businessId;

    // Validate account ownership
    const account = await this.prisma.emailAccount.findFirst({
      where: { id: body.accountId, businessId },
    });

    if (!account) {
      return {
        success: false,
        message: 'Email account not found or access denied',
      };
    }

    // Send the email via the integration service
    const messageId = await this.emailIntegrationService.sendEmail(
      body.accountId,
      body.to,
      body.subject,
      body.body,
    );

    // Record the email activity
    await this.prisma.emailActivity.create({
      data: {
        businessId,
        emailAccountId: body.accountId,
        leadId: body.leadId || null,
        messageId,
        threadId: messageId,
        subject: body.subject,
        body: body.body,
        fromAddress: account.email,
        toAddress: body.to,
        direction: 'SENT',
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    return { success: true, messageId };
  }
}
