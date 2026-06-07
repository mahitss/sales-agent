import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConversationService {
  constructor(private prisma: PrismaService) {}

  async getById(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: { lead: true },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return {
      ...conversation,
      messages: JSON.parse(conversation.messages),
    };
  }

  async getByBusiness(businessId: string) {
    const list = await this.prisma.conversation.findMany({
      where: { businessId },
      include: { lead: true },
      orderBy: { updatedAt: 'desc' },
    });
    return list.map((item) => ({
      ...item,
      messages: JSON.parse(item.messages),
    }));
  }

  async findOrCreate(leadId: string, businessId: string) {
    let conversation = await this.prisma.conversation.findFirst({
      where: { leadId, businessId },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          leadId,
          businessId,
          messages: '[]',
        },
      });
    }

    return {
      ...conversation,
      messages: JSON.parse(conversation.messages),
    };
  }

  async updateMessages(id: string, messages: any[]) {
    const conversation = await this.prisma.conversation.update({
      where: { id },
      data: {
        messages: JSON.stringify(messages),
      },
    });
    return {
      ...conversation,
      messages: JSON.parse(conversation.messages),
    };
  }

  async toggleTakeover(id: string, isHumanTakeover: boolean) {
    const conversation = await this.prisma.conversation.update({
      where: { id },
      data: { isHumanTakeover },
    });
    return {
      ...conversation,
      messages: JSON.parse(conversation.messages),
    };
  }
}
