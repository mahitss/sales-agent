import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleSheetsService } from './google-sheets.service';
import { RedisService } from '../common/redis/redis.service';
import { AICostService } from '../common/ai-cost/ai-cost.service';
import axios from 'axios';

@Injectable()
export class LeadIntelligenceService {
  private readonly logger = new Logger(LeadIntelligenceService.name);

  constructor(
    private prisma: PrismaService,
    private googleSheetsService: GoogleSheetsService,
    private redisService: RedisService,
    private aiCostService: AICostService,
  ) {}

  /**
   * Processes lead intelligence after a conversation update.
   */
  async processLeadAnalysis(leadId: string): Promise<boolean> {
    try {
      this.logger.log(`Running Lead Intelligence analysis for lead: ${leadId}`);

      // 1. Fetch lead, business details, and conversation history
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          business: true,
          conversations: {
            orderBy: { updatedAt: 'desc' },
          },
        },
      });

      if (!lead) {
        this.logger.error(
          `Lead ${leadId} not found, aborting intelligence analysis.`,
        );
        return false;
      }

      const conversation = lead.conversations[0];
      if (!conversation) {
        this.logger.warn(
          `No conversations found for lead ${leadId}, skipping analysis.`,
        );
        return false;
      }

      const messages = (conversation.messages as any[]) || [];
      if (messages.length === 0) {
        this.logger.warn(
          `Conversation history is empty for lead ${leadId}, skipping analysis.`,
        );
        return false;
      }

      // 2. Prepare payload for FastAPI
      let aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      if (
        aiServiceUrl &&
        !aiServiceUrl.startsWith('http://') &&
        !aiServiceUrl.startsWith('https://')
      ) {
        aiServiceUrl = `http://${aiServiceUrl}`;
      }

      const payload = {
        messages: messages.map((m) => ({
          role: m.role || 'user',
          content: m.content || '',
        })),
        business_context: {
          companyName: lead.business.companyName,
          website: lead.business.website,
          industry: lead.business.industry,
          description: lead.business.description,
        },
      };

      // 3. Make HTTP request with timeout and retries
      let analysisResult: any;
      const maxRetries = 2;
      let attempt = 0;

      while (attempt <= maxRetries) {
        try {
          const res = await axios.post(
            `${aiServiceUrl}/analyze-lead`,
            payload,
            { timeout: 12000 },
          );
          analysisResult = res.data;
          break;
        } catch (err: any) {
          attempt++;
          this.logger.warn(
            `FastAPI /analyze-lead attempt ${attempt} failed: ${err.message}`,
          );
          if (attempt > maxRetries) {
            this.logger.error(
              'FastAPI /analyze-lead failed permanently. Using local fallback.',
            );
            analysisResult = this.generateFallbackAnalysis(lead, messages);
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, attempt * 500));
        }
      }

      // Estimate and log AI cost
      const promptStr = JSON.stringify(payload);
      const completionStr = JSON.stringify(analysisResult);
      const promptTokens = Math.max(10, Math.round(promptStr.length / 4));
      const completionTokens = Math.max(
        10,
        Math.round(completionStr.length / 4),
      );

      await this.aiCostService.logUsage(
        lead.businessId,
        'gemini-2.5-flash',
        promptTokens,
        completionTokens,
        'lead_analysis',
      );

      // 4. Save results atomically to database
      await this.saveAnalysisResults(leadId, analysisResult);

      // 5. Update Lead core fields (status, budget, sentiment, engagementScore)
      const coreUpdate: any = {
        status: analysisResult.scoring.classification || 'COLD',
        sentiment: analysisResult.intelligence.sentiment || 'Neutral',
        engagementScore: analysisResult.scoring.score || 0,
      };

      // Extract budget value string if not already present
      if (
        lead.budget === null ||
        lead.budget === 'Not provided yet' ||
        lead.budget === ''
      ) {
        coreUpdate.budget = `₹${analysisResult.revenue.estimated_value.toLocaleString()}`;
      }

      await this.prisma.lead.update({
        where: { id: leadId },
        data: coreUpdate,
      });

      // Clear cache for lead stats
      await this.redisService
        .del(`business:${lead.businessId}:lead-stats`)
        .catch(() => {});

      // 6. Trigger Google Sheets Sync
      if (lead.business.googleSheetsEnabled) {
        this.logger.log(
          `Sheets Sync enabled for business ${lead.businessId}. Triggering sync job...`,
        );
        // We call this asynchronously or synchronously. Since we are in the background queue/event context, we call it directly.
        await this.googleSheetsService.syncLead(leadId);
      }

      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to analyze lead ${leadId}: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Save structured analysis results to the schema tables.
   */
  private async saveAnalysisResults(leadId: string, data: any) {
    const summary = data.summary;
    const scoring = data.scoring;
    const enrichment = data.enrichment;
    const intelligence = data.intelligence;
    const revenue = data.revenue;

    // Upsert LeadIntelligence
    await this.prisma.leadIntelligence.upsert({
      where: { leadId },
      create: {
        leadId,
        summary: summary.summary || 'Summary unavailable.',
        goals: summary.goals || 'Goals unavailable.',
        painPoints: summary.pain_points || 'Pain points unavailable.',
        requestedServices: summary.requested_services || [],
        timeline: summary.timeline || 'Immediate',
        objections: summary.objections || 'None',
        recommendedAction: summary.recommended_action || 'Follow up with lead.',
        purchaseReadiness: intelligence.purchase_readiness || 'Medium',
        conversionRisk: intelligence.conversion_risk || 'Low',
        frequentTopics: intelligence.frequent_topics || [],
      },
      update: {
        summary: summary.summary || 'Summary unavailable.',
        goals: summary.goals || 'Goals unavailable.',
        painPoints: summary.pain_points || 'Pain points unavailable.',
        requestedServices: summary.requested_services || [],
        timeline: summary.timeline || 'Immediate',
        objections: summary.objections || 'None',
        recommendedAction: summary.recommended_action || 'Follow up with lead.',
        purchaseReadiness: intelligence.purchase_readiness || 'Medium',
        conversionRisk: intelligence.conversion_risk || 'Low',
        frequentTopics: intelligence.frequent_topics || [],
      },
    });

    // Upsert LeadScore
    await this.prisma.leadScore.upsert({
      where: { leadId },
      create: {
        leadId,
        score: scoring.score || 0,
        classification: scoring.classification || 'COLD',
        dealProbability: scoring.deal_probability || 0,
        urgency: scoring.factors?.urgency || 'Medium',
        decisionMakerStatus:
          scoring.factors?.decision_maker_status || 'Undetermined',
        businessSize: scoring.factors?.business_size || 'SMB',
        serviceMatch: scoring.factors?.service_match || 'Medium Match',
        engagement: scoring.factors?.engagement || 0,
      },
      update: {
        score: scoring.score || 0,
        classification: scoring.classification || 'COLD',
        dealProbability: scoring.deal_probability || 0,
        urgency: scoring.factors?.urgency || 'Medium',
        decisionMakerStatus:
          scoring.factors?.decision_maker_status || 'Undetermined',
        businessSize: scoring.factors?.business_size || 'SMB',
        serviceMatch: scoring.factors?.service_match || 'Medium Match',
        engagement: scoring.factors?.engagement || 0,
      },
    });

    // Upsert CompanyEnrichment
    await this.prisma.companyEnrichment.upsert({
      where: { leadId },
      create: {
        leadId,
        companyName: enrichment.company_name || 'Acme Corp',
        website: enrichment.website || null,
        industry: enrichment.industry || null,
        description: enrichment.description || null,
        companySize: enrichment.company_size || null,
        country: enrichment.country || null,
        socialLinks: enrichment.social_links || {},
      },
      update: {
        companyName: enrichment.company_name || 'Acme Corp',
        website: enrichment.website || null,
        industry: enrichment.industry || null,
        description: enrichment.description || null,
        companySize: enrichment.company_size || null,
        country: enrichment.country || null,
        socialLinks: enrichment.social_links || {},
      },
    });

    // Upsert RevenuePrediction
    await this.prisma.revenuePrediction.upsert({
      where: { leadId },
      create: {
        leadId,
        estimatedValue: revenue.estimated_value || 0.0,
        probability: revenue.deal_probability || 0.0,
        expectedValue: revenue.expected_revenue || 0.0,
      },
      update: {
        estimatedValue: revenue.estimated_value || 0.0,
        probability: revenue.deal_probability || 0.0,
        expectedValue: revenue.expected_revenue || 0.0,
      },
    });
  }

  /**
   * Generates a local fallback analysis structure when FastAPI is offline.
   */
  private generateFallbackAnalysis(lead: any, messages: any[]): any {
    const textCombined = messages
      .map((m) => m.content)
      .join(' ')
      .toLowerCase();

    // Estimate value from text
    let estimatedVal = 30000.0;
    if (
      textCombined.includes('100k') ||
      textCombined.includes('1,00') ||
      textCombined.includes('lakh')
    ) {
      estimatedVal = 100000.0;
    } else if (textCombined.includes('50k') || textCombined.includes('50,00')) {
      estimatedVal = 50000.0;
    }

    let prob = 0.6;
    if (
      textCombined.includes('urgent') ||
      textCombined.includes('immediate') ||
      textCombined.includes('schedule')
    ) {
      prob = 0.85;
    }

    const score = Math.round(prob * 100);
    const classification = score >= 80 ? 'HOT' : score >= 50 ? 'WARM' : 'COLD';

    return {
      summary: {
        summary: `Lead is discussing needs in ${lead.business.industry}.`,
        goals:
          'Expand business presence and integrate AI assistant capabilities.',
        pain_points: 'Lack of support coverage during offline hours.',
        requested_services: ['AI Chat Widget Setup'],
        timeline: '30 Days',
        objections: 'None',
        recommended_action:
          'Send onboarding email and follow up with custom demo scheduling.',
      },
      scoring: {
        score,
        deal_probability: prob,
        classification,
        factors: {
          budget: 'SMB budget range',
          urgency: textCombined.includes('urgent') ? 'High' : 'Medium',
          timeline: '30 Days',
          decision_maker_status: 'Undetermined',
          business_size: 'SMB',
          service_match: 'High Match',
          engagement: score,
        },
      },
      enrichment: {
        company_name:
          lead.name === 'Anonymous Visitor' ? 'Acme Corp' : lead.name + ' Inc.',
        website: 'https://clientbusiness.com',
        industry: lead.business.industry,
        description: 'Lead company operating in service field.',
        company_size: '1-10',
        country: 'India',
        social_links: {},
      },
      intelligence: {
        intent: 'Product Setup Inquiry',
        purchase_readiness: classification === 'HOT' ? 'High' : 'Medium',
        sentiment: 'Positive',
        objections: 'None',
        frequent_topics: ['pricing', 'onboarding'],
        conversion_risk: 'Low',
      },
      revenue: {
        estimated_value: estimatedVal,
        deal_probability: prob,
        expected_revenue: estimatedVal * prob,
      },
    };
  }
}
