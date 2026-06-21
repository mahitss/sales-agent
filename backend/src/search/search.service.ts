import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SearchLead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  engagementScore: number | null;
}

export interface SearchCompany {
  id: string;
  companyName: string;
  website: string | null;
  industry: string | null;
  leadId: string | null;
}

export interface SearchUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface SearchAppointment {
  id: string;
  date: string;
  time: string;
  status: string;
  leadId: string | null;
  lead: {
    name: string;
    email: string | null;
  } | null;
}

export interface SearchWorkflow {
  id: string;
  status: string;
  workflowId: string | null;
  workflow: {
    name: string;
    trigger: string;
  } | null;
}

export interface SearchConversation {
  id: string;
  leadId: string | null;
  channel: string;
  leadName: string;
}

export interface SearchResult {
  leads: SearchLead[];
  companies: SearchCompany[];
  users: SearchUser[];
  appointments: SearchAppointment[];
  workflows: SearchWorkflow[];
  conversations: SearchConversation[];
}

interface RawConversationQueryResult {
  id: string;
  leadId: string | null;
  channel: string;
  leadName?: string;
  lead?: {
    name: string;
  } | null;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Search multiple entities scoped to a single tenant/business.
   */
  async searchAll(businessId: string, query: string): Promise<SearchResult> {
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
      const [leads, companies, users, appointments, workflows] =
        await Promise.all([
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
          }) as Promise<SearchLead[]>,

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
          }) as Promise<SearchCompany[]>,

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
          }) as Promise<SearchUser[]>,

          // 4. Appointments: date, time, status, lead name
          this.prisma.appointment.findMany({
            where: {
              businessId,
              OR: [
                { status: { contains: cleanQuery, mode: 'insensitive' } },
                { date: { contains: cleanQuery, mode: 'insensitive' } },
                { time: { contains: cleanQuery, mode: 'insensitive' } },
                {
                  lead: { name: { contains: cleanQuery, mode: 'insensitive' } },
                },
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
          }) as Promise<SearchAppointment[]>,

          // 5. Workflows (Executions status or workflow names)
          this.prisma.workflowExecution.findMany({
            where: {
              workflow: { businessId },
              OR: [
                { status: { contains: cleanQuery, mode: 'insensitive' } },
                {
                  workflow: {
                    name: { contains: cleanQuery, mode: 'insensitive' },
                  },
                },
                {
                  workflow: {
                    trigger: { contains: cleanQuery, mode: 'insensitive' },
                  },
                },
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
          }) as Promise<SearchWorkflow[]>,
        ]);

      // 6. Conversations: query channel or messages JSON body content
      let conversations: RawConversationQueryResult[] = [];
      try {
        // Raw postgres query for searching text in message history inside JSON column
        conversations = await this.prisma.$queryRawUnsafe<
          RawConversationQueryResult[]
        >(
          `SELECT c.id, c."leadId", c.channel, c.messages, c."createdAt", l.name as "leadName"
           FROM "Conversation" c
           LEFT JOIN "Lead" l ON c."leadId" = l.id
           WHERE c."businessId" = $1 
             AND (c.channel ILIKE $2 OR CAST(c.messages AS text) ILIKE $2)
           LIMIT 8`,
          businessId,
          `%${cleanQuery}%`,
        );
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Failed to execute raw query search for conversations: ${errMsg}. Using Prisma contains fallback.`,
        );
        // Fallback Prisma query
        const dbConvs = await this.prisma.conversation.findMany({
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
        conversations = dbConvs as unknown as RawConversationQueryResult[];
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
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const errStack = err instanceof Error ? err.stack : undefined;
      this.logger.error(`Global Search error: ${errMsg}`, errStack);
      throw err;
    }
  }
}
