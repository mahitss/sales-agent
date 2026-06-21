import { Controller, Get, Param, Res, Req } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('email-tracking')
export class EmailTrackingController {
  constructor(private prisma: PrismaService) {}

  @Get('open/:activityId')
  async trackOpen(
    @Param('activityId') activityId: string,
    @Req() req: any,
    @Res() res: any,
  ) {
    try {
      const ipAddress =
        req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
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
            ipAddress: Array.isArray(ipAddress)
              ? ipAddress[0]
              : String(ipAddress),
            userAgent,
          },
        });
      }
    } catch (err) {
      // Fail silently to prevent recipient's client from blocking image load
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
}
