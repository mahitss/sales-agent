import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';

@Injectable()
export class LeadService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLeadDto) {
    return this.prisma.lead.create({
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
  }

  async update(id: string, dto: UpdateLeadDto) {
    const existing = await this.prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Lead not found');
    }
    return this.prisma.lead.update({
      where: { id },
      data: dto,
    });
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

  async getByBusiness(businessId: string) {
    return this.prisma.lead.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats(businessId: string) {
    const totalLeads = await this.prisma.lead.count({ where: { businessId } });
    const hotLeads = await this.prisma.lead.count({ where: { businessId, status: 'HOT' } });
    const warmLeads = await this.prisma.lead.count({ where: { businessId, status: 'WARM' } });
    const coldLeads = await this.prisma.lead.count({ where: { businessId, status: 'COLD' } });
    const appointments = await this.prisma.appointment.count({ where: { businessId } });

    const qualifiedLeads = hotLeads + warmLeads;
    const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;

    return {
      totalLeads,
      qualifiedLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      appointments,
      conversionRate,
    };
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
}
