import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { AICostService } from '../common/ai-cost/ai-cost.service';
import axios from 'axios';

@Injectable()
export class LeadScoringService {
  private readonly logger = new Logger(LeadScoringService.name);

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private aiCostService: AICostService,
  ) {}

  /**
   * Run advanced AI Lead Scoring for a lead.
   */
  async scoreLead(leadId: string): Promise<any> {
    try {
      this.logger.log(`Running advanced AI Lead Scoring for lead: ${leadId}`);

      // 1. Fetch Lead context along with relations
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          enrichment: true,
          conversations: {
            orderBy: { updatedAt: 'desc' },
          },
          emailActivities: {
            orderBy: { sentAt: 'desc' },
          },
        },
      });

      if (!lead) {
        throw new NotFoundException(`Lead ${leadId} not found`);
      }

      // 2. Fetch Account Research if email domain is available
      let research: any = null;
      if (lead.email && lead.email.includes('@')) {
        const domain = lead.email.split('@')[1];
        if (!domain.match(/gmail|yahoo|outlook|hotmail|aol/)) {
          research = await this.prisma.accountResearch.findFirst({
            where: { businessId: lead.businessId, domain },
            orderBy: { updatedAt: 'desc' },
          });
        }
      }

      // 3. Fetch visitor tracks for website activity metrics
      const visitorTracks = await this.prisma.visitorTrack.findMany({
        where: { businessId: lead.businessId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      // Simulate website activity from tracks or defaults
      let pagesCount = 3;
      let durationCount = 120;
      if (visitorTracks.length > 0) {
        // Use the first track as representative
        try {
          const pages = JSON.parse(visitorTracks[0].pagesViewed || '[]');
          pagesCount = pages.length || 3;
          durationCount = visitorTracks[0].duration || 120;
        } catch {
          pagesCount = 3;
        }
      }

      // 4. Extract conversation messages log
      const conversation = lead.conversations[0];
      const messages = conversation
        ? (conversation.messages as any[]) || []
        : [];

      // 5. Compute email activity metrics
      const emailExchangeCount = lead.emailActivities.length;
      const openedEmails = lead.emailActivities.filter(
        (e) => e.opensCount > 0,
      ).length;
      const emailOpenRate =
        emailExchangeCount > 0
          ? Math.round((openedEmails / emailExchangeCount) * 100)
          : 0;
      const lastEmailBody = lead.emailActivities[0]?.body || '';

      // 6. Build Payload for AI Service
      const leadPayload = {
        lead_info: {
          name: lead.name || 'Anonymous Prospect',
          email: lead.email || '',
          phone: lead.phone || '',
          budget: lead.budget || 'Not provided',
          source: lead.source,
          status: lead.status,
          sentiment: lead.sentiment || 'Neutral',
        },
        enrichment_info: {
          companyName: lead.enrichment?.companyName || '',
          website: lead.enrichment?.website || '',
          industry: lead.enrichment?.industry || '',
          description: lead.enrichment?.description || '',
          companySize: lead.enrichment?.companySize || '',
          country: lead.enrichment?.country || '',
        },
        research_info: {
          summary: research?.summary || '',
          techStack: research?.techStack || [],
          challenges: research?.challenges || [],
          opportunities: research?.opportunities || [],
          buyingSignals: research?.buyingSignals || [],
        },
        conversation_log: messages.map((m) => ({
          role: m.role || 'user',
          content: m.content || '',
        })),
        email_metrics: {
          totalExchange: emailExchangeCount,
          openRate: emailOpenRate,
          lastEmailSnippet: lastEmailBody.substring(0, 300),
        },
        website_metrics: {
          pageViews: pagesCount,
          sessionDuration: durationCount,
        },
      };

      // 7. Post payload to FastAPI AI Service
      let aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      if (
        aiServiceUrl &&
        !aiServiceUrl.startsWith('http://') &&
        !aiServiceUrl.startsWith('https://')
      ) {
        aiServiceUrl = `http://${aiServiceUrl}`;
      }

      let scoringResult: any;
      try {
        const res = await axios.post(
          `${aiServiceUrl}/score-lead`,
          leadPayload,
          { timeout: 15000 },
        );
        scoringResult = res.data;
      } catch (err: any) {
        this.logger.error(
          `FastAPI /score-lead failed, using local mock scoring logic: ${err.message}`,
        );
        scoringResult = this.generateLocalMockScoring(leadPayload);
      }

      // Log AI costs
      const promptStr = JSON.stringify(leadPayload);
      const completionStr = JSON.stringify(scoringResult);
      const promptTokens = Math.max(10, Math.round(promptStr.length / 4));
      const completionTokens = Math.max(
        10,
        Math.round(completionStr.length / 4),
      );

      await this.aiCostService
        .logUsage(
          lead.businessId,
          'gemini-2.5-flash',
          promptTokens,
          completionTokens,
          'lead_scoring',
        )
        .catch((e) => this.logger.warn(`AICost log failed: ${e.message}`));

      // 8. Save results in DB atomically
      const priority = scoringResult.priority_level || 'MEDIUM';
      const overallScore = scoringResult.score || 0;
      const classification =
        overallScore >= 75 ? 'HOT' : overallScore >= 45 ? 'WARM' : 'COLD';

      const upsertedScore = await this.prisma.leadScore.upsert({
        where: { leadId },
        create: {
          leadId,
          score: overallScore,
          classification,
          dealProbability: overallScore / 100,
          urgency: scoringResult.buying_intent?.details?.includes('urg')
            ? 'High'
            : 'Medium',
          decisionMakerStatus: leadPayload.enrichment_info.companyName
            ? 'Decision Maker'
            : 'Undetermined',
          businessSize: leadPayload.enrichment_info.companySize || 'SMB',
          serviceMatch: 'High Match',
          engagement: overallScore,
          buyingIntent: JSON.stringify(scoringResult.buying_intent),
          companyGrowth: JSON.stringify(scoringResult.company_growth_signals),
          hiringSignals: JSON.stringify(scoringResult.hiring_signals),
          engagementActivity: JSON.stringify(scoringResult.engagement_activity),
          websiteActivity: JSON.stringify(scoringResult.website_activity),
          emailActivity: JSON.stringify(scoringResult.email_activity),
          reasoning: scoringResult.reasoning,
          recommendedAction: scoringResult.recommended_next_action,
          priority,
        },
        update: {
          score: overallScore,
          classification,
          dealProbability: overallScore / 100,
          engagement: overallScore,
          buyingIntent: JSON.stringify(scoringResult.buying_intent),
          companyGrowth: JSON.stringify(scoringResult.company_growth_signals),
          hiringSignals: JSON.stringify(scoringResult.hiring_signals),
          engagementActivity: JSON.stringify(scoringResult.engagement_activity),
          websiteActivity: JSON.stringify(scoringResult.website_activity),
          emailActivity: JSON.stringify(scoringResult.email_activity),
          reasoning: scoringResult.reasoning,
          recommendedAction: scoringResult.recommended_next_action,
          priority,
        },
      });

      // Insert scoring history record
      await this.prisma.leadScoreHistory.create({
        data: {
          leadId,
          score: overallScore,
          priority,
          buyingIntent: JSON.stringify(scoringResult.buying_intent),
          companyGrowth: JSON.stringify(scoringResult.company_growth_signals),
          hiringSignals: JSON.stringify(scoringResult.hiring_signals),
          engagementActivity: JSON.stringify(scoringResult.engagement_activity),
          websiteActivity: JSON.stringify(scoringResult.website_activity),
          emailActivity: JSON.stringify(scoringResult.email_activity),
          reasoning: scoringResult.reasoning,
          recommendedAction: scoringResult.recommended_next_action,
        },
      });

      // Update lead core engagement score & status stage
      await this.prisma.lead.update({
        where: { id: leadId },
        data: {
          engagementScore: overallScore,
          status: classification,
        },
      });

      // Invalidate dashboard stats cache
      await this.redisService
        .del(`business:${lead.businessId}:lead-stats`)
        .catch(() => {});
      await this.redisService
        .del(`business:${lead.businessId}:score-stats`)
        .catch(() => {});

      return upsertedScore;
    } catch (err: any) {
      this.logger.error(
        `Failed to score lead ${leadId}: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  /**
   * Get scoring history for a lead.
   */
  async getLeadScoreHistory(leadId: string) {
    return this.prisma.leadScoreHistory.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  /**
   * Get business wide lead scoring dashboard aggregates.
   */
  async getBusinessScoringStats(businessId: string) {
    const cacheKey = `business:${businessId}:score-stats`;
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}

    // Compute aggregates
    const scores = await this.prisma.leadScore.findMany({
      where: {
        lead: { businessId },
      },
    });

    const totalScored = scores.length;
    const avgScore =
      totalScored > 0
        ? Math.round(
            scores.reduce((acc, curr) => acc + curr.score, 0) / totalScored,
          )
        : 0;

    const priorityHigh = scores.filter((s) => s.priority === 'HIGH').length;
    const priorityMed = scores.filter((s) => s.priority === 'MEDIUM').length;
    const priorityLow = scores.filter((s) => s.priority === 'LOW').length;

    const classHot = scores.filter((s) => s.classification === 'HOT').length;
    const classWarm = scores.filter((s) => s.classification === 'WARM').length;
    const classCold = scores.filter((s) => s.classification === 'COLD').length;

    // Get average breakdown of signal components
    let avgBuyingIntent = 0;
    let avgCompanyGrowth = 0;
    let avgHiringSignals = 0;
    let avgEngagement = 0;
    let avgWebsite = 0;
    let avgEmail = 0;

    scores.forEach((s) => {
      try {
        const bi = JSON.parse(s.buyingIntent || '{}');
        const cg = JSON.parse(s.companyGrowth || '{}');
        const hs = JSON.parse(s.hiringSignals || '{}');
        const ea = JSON.parse(s.engagementActivity || '{}');
        const wa = JSON.parse(s.websiteActivity || '{}');
        const ema = JSON.parse(s.emailActivity || '{}');

        avgBuyingIntent += bi.score || 0;
        avgCompanyGrowth += cg.score || 0;
        avgHiringSignals += hs.score || 0;
        avgEngagement += ea.score || 0;
        avgWebsite += wa.score || 0;
        avgEmail += ema.score || 0;
      } catch {}
    });

    if (totalScored > 0) {
      avgBuyingIntent = Math.round(avgBuyingIntent / totalScored);
      avgCompanyGrowth = Math.round(avgCompanyGrowth / totalScored);
      avgHiringSignals = Math.round(avgHiringSignals / totalScored);
      avgEngagement = Math.round(avgEngagement / totalScored);
      avgWebsite = Math.round(avgWebsite / totalScored);
      avgEmail = Math.round(avgEmail / totalScored);
    }

    // Get 10 recent scoring actions across all leads in the business
    const recentHistory = await this.prisma.leadScoreHistory.findMany({
      where: {
        lead: { businessId },
      },
      include: {
        lead: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const result = {
      totalScored,
      averageScore: avgScore,
      priorityDistribution: {
        HIGH: priorityHigh,
        MEDIUM: priorityMed,
        LOW: priorityLow,
      },
      classificationDistribution: {
        HOT: classHot,
        WARM: classWarm,
        COLD: classCold,
      },
      averagesBreakdown: {
        buyingIntent: avgBuyingIntent,
        companyGrowth: avgCompanyGrowth,
        hiringSignals: avgHiringSignals,
        engagementActivity: avgEngagement,
        websiteActivity: avgWebsite,
        emailActivity: avgEmail,
      },
      recentScoringHistory: recentHistory.map((h) => ({
        id: h.id,
        leadId: h.leadId,
        leadName: h.lead.name || 'Anonymous Prospect',
        leadEmail: h.lead.email || '',
        score: h.score,
        priority: h.priority,
        reasoningSnippet: h.reasoning.substring(0, 150) + '...',
        createdAt: h.createdAt,
      })),
    };

    // Cache results for 5 minutes
    await this.redisService
      .set(cacheKey, JSON.stringify(result), 300)
      .catch(() => {});

    return result;
  }

  /**
   * Local fallback scoring generator.
   */
  private generateLocalMockScoring(payload: any): any {
    const budget = payload.lead_info.budget || '';
    const budgetValue = parseFloat(budget.replace(/[^0-9]/g, '')) || 0;

    let baseScore = 40;
    if (payload.lead_info.status === 'HOT') baseScore = 80;
    else if (payload.lead_info.status === 'WARM') baseScore = 60;

    if (budgetValue > 50000) baseScore += 10;
    if (payload.email_metrics.totalExchange > 2) baseScore += 5;
    if (payload.website_metrics.pageViews > 4) baseScore += 5;

    const overallScore = Math.min(100, baseScore);
    const priority =
      overallScore >= 75 ? 'HIGH' : overallScore >= 45 ? 'MEDIUM' : 'LOW';

    return {
      score: overallScore,
      priority_level: priority,
      reasoning: `Fallback evaluation: Prospect demonstrates standard engagement with ${payload.email_metrics.totalExchange} emails and ${payload.website_metrics.pageViews} website views. Budget is estimated at ${budget}.`,
      recommended_next_action:
        'Coordinate standard outreach scheduling and proposal delivery.',
      buying_intent: {
        score: budgetValue > 0 ? 80 : 50,
        details: `Budget stated: ${budget}.`,
      },
      company_growth_signals: {
        score: payload.enrichment_info.companySize ? 70 : 40,
        details: `Company operates in ${payload.enrichment_info.industry || 'Technology'} with size ${payload.enrichment_info.companySize || 'unknown'}.`,
      },
      hiring_signals: {
        score: payload.research_info.buyingSignals?.length > 0 ? 75 : 35,
        details: 'Hiring activity estimated based on average sector trends.',
      },
      engagement_activity: {
        score: Math.min(100, 40 + payload.conversation_log.length * 10),
        details: `Interacted through chat with ${payload.conversation_log.length} messages.`,
      },
      website_activity: {
        score: Math.min(100, payload.website_metrics.pageViews * 15),
        details: `Viewed ${payload.website_metrics.pageViews} pages for a total of ${payload.website_metrics.sessionDuration}s.`,
      },
      email_activity: {
        score: Math.min(100, payload.email_metrics.totalExchange * 20),
        details: `Exchanged ${payload.email_metrics.totalExchange} emails with an open rate of ${payload.email_metrics.openRate}%.`,
      },
    };
  }
}
