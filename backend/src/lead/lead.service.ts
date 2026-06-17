import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';

@Injectable()
export class LeadService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async create(dto: CreateLeadDto) {
    const lead = await this.prisma.lead.create({
      data: {
        businessId: dto.businessId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        budget: dto.budget,
        source: dto.source || 'WIDGET',
        status: dto.status || 'COLD',
      },
    });

    await this.redisService.del(`business:${dto.businessId}:lead-stats`).catch(() => {});
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto) {
    const existing = await this.prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Lead not found');
    }
    const updated = await this.prisma.lead.update({
      where: { id },
      data: dto,
    });

    await this.redisService.del(`business:${existing.businessId}:lead-stats`).catch(() => {});
    return updated;
  }

  async getById(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: { conversations: true, appointments: true },
    });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    return lead;
  }

  async getByBusiness(businessId: string, limit: number = 20, cursor?: string) {
    const take = limit;
    const skip = cursor ? 1 : 0;
    const cursorObj = cursor ? { id: cursor } : undefined;

    const leads = await this.prisma.lead.findMany({
      where: { businessId },
      take,
      skip,
      cursor: cursorObj,
      orderBy: { id: 'desc' },
    });

    const nextCursor = leads.length === take ? leads[leads.length - 1].id : null;
    return {
      data: leads,
      nextCursor,
    };
  }

  async getStats(businessId: string) {
    const cacheKey = `business:${businessId}:lead-stats`;
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      // Ignore cache errors
    }

    const totalLeads = await this.prisma.lead.count({ where: { businessId } });
    const hotLeads = await this.prisma.lead.count({ where: { businessId, status: 'HOT' } });
    const warmLeads = await this.prisma.lead.count({ where: { businessId, status: 'WARM' } });
    const coldLeads = await this.prisma.lead.count({ where: { businessId, status: 'COLD' } });
    const appointments = await this.prisma.appointment.count({ where: { businessId } });

    const qualifiedLeads = hotLeads + warmLeads;
    const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;

    const stats = {
      totalLeads,
      qualifiedLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      appointments,
      conversionRate,
    };

    try {
      await this.redisService.set(cacheKey, JSON.stringify(stats), 300); // 5 min TTL
    } catch (err) {
      // Ignore cache errors
    }

    return stats;
  }

  async exportLeadsToCsv(businessId: string): Promise<string> {
    const leads = await this.prisma.lead.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['ID', 'Name', 'Email', 'Phone', 'Budget', 'Source', 'Status', 'Sentiment', 'Engagement Score', 'Created At'];
    const rows = leads.map((l) => [
      l.id,
      l.name || 'Anonymous Visitor',
      l.email || '',
      l.phone || '',
      l.budget || '',
      l.source,
      l.status,
      l.sentiment || 'Neutral',
      l.engagementScore !== null && l.engagementScore !== undefined ? String(l.engagementScore) : '—',
      l.createdAt.toISOString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  async exportLeadsToJson(businessId: string): Promise<any[]> {
    return this.prisma.lead.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
