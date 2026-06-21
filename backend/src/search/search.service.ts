import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Search multiple entities scoped to a single tenant/business.
   */
  async searchAll(businessId: string, query: string): Promise<any> {
    if (!query || query.trim() === '') {
      return {
        leads: [],
        companies: [],
        conversations: [],
        users: [],
        appointments: [],
        workflows: [],
      };
    }

    const cleanQuery = query.trim();

    try {
      const [leads, companies, users, appointments, workflows] = await Promise.all([
        // 1. Leads: name, email, phone, budget
        this.prisma.lead.findMany({
          where: {
            businessId,
            OR: [
              { name: { contains: cleanQuery, mode: 'insensitive' } },
              { email: { contains: cleanQuery, mode: 'insensitive' } },
              { phone: { contains: cleanQuery, mode: 'insensitive' } },
              { budget: { contains: cleanQuery, mode: 'insensitive' } },
            ],
          },
          take: 8,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            engagementScore: true,
          },
        }),

        // 2. Companies (Enrichment records associated with Leads)
        this.prisma.companyEnrichment.findMany({
          where: {
            lead: { businessId },
            OR: [
              { companyName: { contains: cleanQuery, mode: 'insensitive' } },
              { website: { contains: cleanQuery, mode: 'insensitive' } },
              { industry: { contains: cleanQuery, mode: 'insensitive' } },
              { description: { contains: cleanQuery, mode: 'insensitive' } },
            ],
          },
          take: 8,
          select: {
            id: true,
            companyName: true,
            website: true,
            industry: true,
            leadId: true,
          },
        }),

        // 3. Users (Employees assigned to this business)
        this.prisma.user.findMany({
          where: {
            businessId,
            OR: [
              { name: { contains: cleanQuery, mode: 'insensitive' } },
              { email: { contains: cleanQuery, mode: 'insensitive' } },
              { role: { contains: cleanQuery, mode: 'insensitive' } },
            ],
          },
          take: 8,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        }),

        // 4. Appointments: date, time, status, lead name
        this.prisma.appointment.findMany({
          where: {
            businessId,
            OR: [
              { status: { contains: cleanQuery, mode: 'insensitive' } },
              { date: { contains: cleanQuery, mode: 'insensitive' } },
              { time: { contains: cleanQuery, mode: 'insensitive' } },
              { lead: { name: { contains: cleanQuery, mode: 'insensitive' } } },
            ],
          },
          take: 8,
          select: {
            id: true,
            date: true,
            time: true,
            status: true,
            leadId: true,
            lead: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        }),

        // 5. Workflows (Executions status or workflow names)
        this.prisma.workflowExecution.findMany({
          where: {
            workflow: { businessId },
            OR: [
              { status: { contains: cleanQuery, mode: 'insensitive' } },
              { workflow: { name: { contains: cleanQuery, mode: 'insensitive' } } },
              { workflow: { trigger: { contains: cleanQuery, mode: 'insensitive' } } },
            ],
          },
          take: 8,
          select: {
            id: true,
            status: true,
            workflowId: true,
            workflow: {
              select: {
                name: true,
                trigger: true,
              },
            },
          },
        }),
      ]);

      // 6. Conversations: query channel or messages JSON body content
      let conversations: any[] = [];
      try {
        // Raw postgres query for searching text in message history inside JSON column
        conversations = await this.prisma.$queryRawUnsafe<any[]>(
          `SELECT c.id, c."leadId", c.channel, c.messages, c."createdAt", l.name as "leadName"
           FROM "Conversation" c
           LEFT JOIN "Lead" l ON c."leadId" = l.id
           WHERE c."businessId" = $1 
             AND (c.channel ILIKE $2 OR CAST(c.messages AS text) ILIKE $2)
           LIMIT 8`,
          businessId,
          `%${cleanQuery}%`
        );
      } catch (err: any) {
        this.logger.warn(`Failed to execute raw query search for conversations: ${err.message}. Using Prisma contains fallback.`);
        // Fallback Prisma query
        conversations = await this.prisma.conversation.findMany({
          where: {
            businessId,
            OR: [
              { channel: { contains: cleanQuery, mode: 'insensitive' } },
              { lead: { name: { contains: cleanQuery, mode: 'insensitive' } } },
            ],
          },
          take: 8,
          include: {
            lead: {
              select: {
                name: true,
              },
            },
          },
        });
      }

      return {
        leads,
        companies,
        users,
        appointments,
        workflows,
        conversations: conversations.map((c) => ({
          id: c.id,
          leadId: c.leadId,
          channel: c.channel,
          leadName: c.leadName || c.lead?.name || 'Anonymous Prospect',
        })),
      };

    } catch (err: any) {
      this.logger.error(`Global Search error: ${err.message}`, err.stack);
      throw err;
    }
  }
}
