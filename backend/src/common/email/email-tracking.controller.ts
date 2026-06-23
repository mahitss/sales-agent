import { Controller, Get, Post, Param, Query, Body, Res, Req, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Response, Request } from 'express';

@Controller('email-tracking')
export class EmailTrackingController {
  private readonly logger = new Logger(EmailTrackingController.name);

  constructor(private prisma: PrismaService) {}

  @Get('open/:activityId')
  async trackOpen(
    @Param('activityId') activityId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const ipAddress = Array.isArray(rawIp) ? rawIp[0] : String(rawIp);
      const userAgent = req.headers['user-agent'] || '';

      const activity = await this.prisma.emailActivity.findUnique({
        where: { id: activityId },
      });

      if (activity) {
        // Increment open counter
        await this.prisma.emailActivity.update({
          where: { id: activityId },
          data: { opensCount: { increment: 1 } },
        });

        // Save detailed open device log
        await this.prisma.emailOpenTracking.create({
          data: {
            emailActivityId: activityId,
            ipAddress,
            userAgent,
          },
        });

        // Save generic tracking event
        await this.prisma.emailTrackingEvent.create({
          data: {
            emailActivityId: activityId,
            eventType: 'OPENED',
            ipAddress,
            userAgent,
          },
        });

        this.logger.log(`Tracked email open event for activity: ${activityId}`);
      }
    } catch (err: any) {
      this.logger.error(`Silent fail in open tracking for activity ${activityId}: ${err.message}`);
    }

    // Transparent 1x1 GIF representation
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64',
    );

    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    });
    res.end(pixel);
  }

  @Get('click/:activityId')
  async trackClick(
    @Param('activityId') activityId: string,
    @Query('url') targetUrl: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const ipAddress = Array.isArray(rawIp) ? rawIp[0] : String(rawIp);
    const userAgent = req.headers['user-agent'] || '';
    const redirectUrl = targetUrl || '/';

    try {
      const activity = await this.prisma.emailActivity.findUnique({
        where: { id: activityId },
      });

      if (activity) {
        // Create click log
        await this.prisma.emailClickTracking.create({
          data: {
            emailActivityId: activityId,
            url: redirectUrl,
            ipAddress,
            userAgent,
          },
        });

        // Create tracking event
        await this.prisma.emailTrackingEvent.create({
          data: {
            emailActivityId: activityId,
            eventType: 'CLICKED',
            ipAddress,
            userAgent,
            metadata: { clickedUrl: redirectUrl },
          },
        });

        this.logger.log(`Tracked email click link redirect: ${redirectUrl} for activity: ${activityId}`);
      }
    } catch (err: any) {
      this.logger.error(`Failed to log click event for activity ${activityId}: ${err.message}`);
    }

    // Always redirect the user, even if logging fails
    return res.redirect(redirectUrl);
  }

  @Post('webhook/:provider')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() body: any,
  ) {
    this.logger.log(`Received email webhook callback for provider: ${provider}`);

    try {
      if (provider.toLowerCase() === 'sendgrid') {
        const events = Array.isArray(body) ? body : [body];
        for (const event of events) {
          const sgMsgId = event.sg_message_id?.split('.')?.[0]; // Strip sg parts
          if (sgMsgId) {
            // Find activity by messageId startsWith
            const activity = await this.prisma.emailActivity.findFirst({
              where: { messageId: { startsWith: sgMsgId } },
            });

            if (activity) {
              await this.processEventUpdate(activity.id, event.event, event);
            }
          }
        }
      } else if (provider.toLowerCase() === 'resend') {
        const resendMsgId = body.data?.email_id || body.data?.id;
        const resendType = body.type; // e.g. email.delivered, email.bounced
        
        if (resendMsgId) {
          const activity = await this.prisma.emailActivity.findUnique({
            where: { messageId: resendMsgId },
          });

          if (activity) {
            let mappedEvent = 'delivered';
            if (resendType?.includes('bounced')) mappedEvent = 'bounce';
            if (resendType?.includes('clicked')) mappedEvent = 'click';
            if (resendType?.includes('opened')) mappedEvent = 'open';
            if (resendType?.includes('complained')) mappedEvent = 'spam';

            await this.processEventUpdate(activity.id, mappedEvent, body);
          }
        }
      } else {
        // Fallback manual webhook payload parsing
        const { messageId, eventType, details } = body;
        if (messageId && eventType) {
          const activity = await this.prisma.emailActivity.findUnique({
            where: { messageId },
          });
          if (activity) {
            await this.processEventUpdate(activity.id, eventType, details || {});
          }
        }
      }
    } catch (err: any) {
      this.logger.error(`Error processing email webhook for ${provider}: ${err.message}`, err.stack);
    }

    return { received: true };
  }

  private async processEventUpdate(activityId: string, event: string, metadata: any) {
    const ev = event?.toLowerCase();
    let status = 'SENT';
    let dbEventType = 'DELIVERED';

    if (ev.includes('bounce') || ev.includes('dropped') || ev.includes('blocked')) {
      status = 'FAILED';
      dbEventType = 'BOUNCED';
    } else if (ev.includes('fail') || ev.includes('error')) {
      status = 'FAILED';
      dbEventType = 'FAILED';
    } else if (ev.includes('deliver')) {
      status = 'SENT';
      dbEventType = 'DELIVERED';
    } else if (ev.includes('open')) {
      dbEventType = 'OPENED';
    } else if (ev.includes('click')) {
      dbEventType = 'CLICKED';
    } else {
      dbEventType = event.toUpperCase();
    }

    // 1. Update activity status if it changes state
    if (status !== 'SENT' || dbEventType === 'DELIVERED') {
      await this.prisma.emailActivity.update({
        where: { id: activityId },
        data: { status },
      });
    }

    // 2. Insert event log
    await this.prisma.emailTrackingEvent.create({
      data: {
        emailActivityId: activityId,
        eventType: dbEventType,
        metadata: metadata || {},
      },
    });

    this.logger.log(`Logged tracking webhook event ${dbEventType} for activity ${activityId}`);
  }
}
