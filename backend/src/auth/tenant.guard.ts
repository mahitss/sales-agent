import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('User session not found');
    }

    const params = request.params;
    const body = request.body;
    const query = request.query;

    let targetBusinessId = params.businessId || body.businessId || query.businessId;

    // Resource-level resolution for lead, conversation, appointment, feedback
    if (!targetBusinessId && (params.id || params.feedbackId)) {
      const path = request.path;
      const resourceId = params.id || params.feedbackId;

      if (path.includes('/leads') && !path.includes('/feedback')) {
        const lead = await this.prisma.lead.findUnique({
          where: { id: resourceId },
          select: { businessId: true },
        });
        if (lead) targetBusinessId = lead.businessId;
      } else if (path.includes('/conversations')) {
        const conv = await this.prisma.conversation.findUnique({
          where: { id: resourceId },
          select: { businessId: true },
        });
        if (conv) targetBusinessId = conv.businessId;
      } else if (path.includes('/appointments')) {
        const appt = await this.prisma.appointment.findUnique({
          where: { id: resourceId },
          select: { businessId: true },
        });
        if (appt) targetBusinessId = appt.businessId;
      } else if (path.includes('/feedback')) {
        const fback = await this.prisma.feedback.findUnique({
          where: { id: resourceId },
          select: { businessId: true },
        });
        if (fback) targetBusinessId = fback.businessId;
      } else if (path.includes('/account-research')) {
        const research = await this.prisma.accountResearch.findUnique({
          where: { id: resourceId },
          select: { businessId: true },
        });
        if (research) targetBusinessId = research.businessId;
      }
    }

    if (!targetBusinessId) {
      return true; // No business ID constraints found on this endpoint
    }

    // Check visitor role
    if (user.role === 'VISITOR') {
      if (user.businessId !== targetBusinessId) {
        throw new ForbiddenException('Access denied: Visitor token tenant mismatch');
      }
      return true;
    }

    // Resolve user's actual database businessId
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { businessId: true, role: true },
    });

    if (!dbUser) {
      throw new ForbiddenException('User record not found');
    }

    if (dbUser.businessId !== targetBusinessId) {
      throw new ForbiddenException('Access denied: Tenancy isolation mismatch');
    }

    return true;
  }
}
