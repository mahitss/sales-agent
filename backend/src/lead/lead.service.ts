import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';
import * as ExcelJS from 'exceljs';

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

    // Advanced Lead Intelligence stats
    const revenuePredictions = await this.prisma.revenuePrediction.findMany({
      where: {
        lead: {
          businessId,
        },
      },
    });
    const totalExpectedRevenue = revenuePredictions.reduce((acc, curr) => acc + curr.expectedValue, 0);
    const totalEstimatedValue = revenuePredictions.reduce((acc, curr) => acc + curr.estimatedValue, 0);

    const leadScores = await this.prisma.leadScore.findMany({
      where: {
        lead: {
          businessId,
        },
      },
    });
    const averageLeadScore = leadScores.length > 0
      ? Math.round(leadScores.reduce((acc, curr) => acc + curr.score, 0) / leadScores.length)
      : 0;

    const leadsWithAppointments = await this.prisma.lead.count({
      where: {
        businessId,
        appointments: {
          some: {},
        },
      },
    });
    const leadConversionRate = totalLeads > 0 ? Math.round((leadsWithAppointments / totalLeads) * 100) : 0;

    const stats = {
      totalLeads,
      qualifiedLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      appointments,
      conversionRate, // Legacy support
      totalExpectedRevenue,
      revenueForecast: totalEstimatedValue,
      averageLeadScore,
      leadConversionRate,
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

  async exportLeadsToExcel(businessId: string): Promise<Buffer> {
    const leads = await this.prisma.lead.findMany({
      where: { businessId },
      include: {
        business: true,
        intelligence: true,
        score: true,
        enrichment: true,
        revenuePrediction: true,
        conversations: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Leads
    const sheet1 = workbook.addWorksheet('Leads');
    sheet1.columns = [
      { header: 'Lead ID', key: 'id', width: 36 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Company', key: 'company', width: 25 },
      { header: 'Website', key: 'website', width: 25 },
      { header: 'Industry', key: 'industry', width: 20 },
      { header: 'Budget', key: 'budget', width: 15 },
      { header: 'Timeline', key: 'timeline', width: 15 },
      { header: 'Requested Service', key: 'requestedService', width: 30 },
      { header: 'Lead Score', key: 'leadScore', width: 15 },
      { header: 'Deal Probability', key: 'dealProbability', width: 18 },
      { header: 'Priority', key: 'priority', width: 15 },
      { header: 'Created Date', key: 'createdDate', width: 25 },
    ];

    for (const lead of leads) {
      const requestedServices = lead.intelligence?.requestedServices?.join(', ') || '';
      sheet1.addRow({
        id: lead.id,
        name: lead.name || 'Anonymous Visitor',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.enrichment?.companyName || lead.name || '',
        website: lead.enrichment?.website || '',
        industry: lead.enrichment?.industry || lead.business?.industry || '',
        budget: lead.budget || lead.revenuePrediction?.estimatedValue?.toString() || '',
        timeline: lead.intelligence?.timeline || '',
        requestedService: requestedServices,
        leadScore: lead.score?.score || lead.engagementScore || 0,
        dealProbability: lead.score?.dealProbability !== undefined ? `${Math.round(lead.score.dealProbability * 100)}%` : '0%',
        priority: lead.score?.classification || lead.status || 'COLD',
        createdDate: lead.createdAt.toISOString(),
      });
    }

    // Styling headers for Sheet 1
    sheet1.getRow(1).font = { bold: true };

    // Sheet 2: AI Summaries
    const sheet2 = workbook.addWorksheet('AI Summaries');
    sheet2.columns = [
      { header: 'Lead ID', key: 'id', width: 36 },
      { header: 'Summary', key: 'summary', width: 50 },
      { header: 'Pain Points', key: 'painPoints', width: 40 },
      { header: 'Goals', key: 'goals', width: 40 },
      { header: 'Recommended Action', key: 'recommendedAction', width: 40 },
    ];

    for (const lead of leads) {
      sheet2.addRow({
        id: lead.id,
        summary: lead.intelligence?.summary || '',
        painPoints: lead.intelligence?.painPoints || '',
        goals: lead.intelligence?.goals || '',
        recommendedAction: lead.intelligence?.recommendedAction || '',
      });
    }
    sheet2.getRow(1).font = { bold: true };

    // Sheet 3: Conversation History
    const sheet3 = workbook.addWorksheet('Conversation History');
    sheet3.columns = [
      { header: 'Lead ID', key: 'leadId', width: 36 },
      { header: 'Timestamp', key: 'timestamp', width: 25 },
      { header: 'Sender', key: 'sender', width: 15 },
      { header: 'Message', key: 'message', width: 60 },
    ];

    for (const lead of leads) {
      for (const conv of lead.conversations) {
        const messages = (conv.messages as any[]) || [];
        for (const msg of messages) {
          sheet3.addRow({
            leadId: lead.id,
            timestamp: conv.updatedAt.toISOString(),
            sender: msg.role === 'user' ? 'Customer' : 'Assistant',
            message: msg.content || '',
          });
        }
      }
    }
    sheet3.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;
    return buffer;
  }
}
