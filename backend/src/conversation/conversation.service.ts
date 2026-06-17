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

  async getByBusiness(businessId: string, limit: number = 20, cursor?: string) {
    const take = limit;
    const skip = cursor ? 1 : 0;
    const cursorObj = cursor ? { id: cursor } : undefined;

    const list = await this.prisma.conversation.findMany({
      where: { businessId },
      include: { lead: true },
      take,
      skip,
      cursor: cursorObj,
      orderBy: { id: 'desc' },
    });

    const nextCursor = list.length === take ? list[list.length - 1].id : null;
    return {
      data: list.map((item) => ({
        ...item,
        messages: JSON.parse(item.messages),
      })),
      nextCursor,
    };
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

  async exportConversationsToCsv(businessId: string): Promise<string> {
    const list = await this.prisma.conversation.findMany({
      where: { businessId },
      include: { lead: true },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['ID', 'Lead ID', 'Lead Name', 'Channel', 'Is Human Takeover', 'Created At', 'Messages'];
    const rows = list.map((c) => [
      c.id,
      c.leadId || '',
      c.lead?.name || 'Anonymous Visitor',
      c.channel,
      String(c.isHumanTakeover),
      c.createdAt.toISOString(),
      c.messages,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  async exportConversationsToJson(businessId: string): Promise<any[]> {
    const list = await this.prisma.conversation.findMany({
      where: { businessId },
      include: { lead: true },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((c) => ({
      id: c.id,
      leadId: c.leadId,
      leadName: c.lead?.name || 'Anonymous Visitor',
      channel: c.channel,
      isHumanTakeover: c.isHumanTakeover,
      createdAt: c.createdAt,
      messages: JSON.parse(c.messages),
    }));
  }
}
