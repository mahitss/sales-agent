import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Submit new feedback.
   */
  async submitFeedback(
    businessId: string,
    data: { name: string; email: string; category: string; content: string }
  ) {
    const feedback = await this.prisma.feedback.create({
      data: {
        businessId,
        name: data.name,
        email: data.email,
        category: data.category,
        content: data.content,
        status: 'NEW',
      },
    });

    this.logger.log(`New feedback registered for business ${businessId}: Category: ${data.category}`);
    return feedback;
  }

  /**
   * List feedback for business workspace.
   */
  async getFeedback(businessId: string) {
    return this.prisma.feedback.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update status of feedback.
   */
  async updateStatus(feedbackId: string, status: string) {
    return this.prisma.feedback.update({
      where: { id: feedbackId },
      data: { status },
    });
  }
}
