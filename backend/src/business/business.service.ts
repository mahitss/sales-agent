import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto, CreateFAQDto } from './dto/business.dto';
import axios from 'axios';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateBusinessDto) {
    return this.prisma.business.create({
      data: {
        ownerId,
        companyName: dto.companyName,
        website: dto.website,
        industry: dto.industry,
        description: dto.description,
        whatsappEnabled: dto.whatsappEnabled ?? false,
        instagramEnabled: dto.instagramEnabled ?? false,
        emailEnabled: dto.emailEnabled ?? false,
        whatsappApiKey: dto.whatsappApiKey,
        instagramAccountId: dto.instagramAccountId,
        emailSmtp: dto.emailSmtp,
      },
    });
  }

  async getForUser(ownerId: string) {
    const business = await this.prisma.business.findFirst({
      where: { ownerId },
      include: { knowledgeBases: true },
    });
    if (!business) {
      return null;
    }
    return business;
  }

  async getById(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { knowledgeBases: true },
    });
    if (!business) {
      throw new NotFoundException('Business profile not found');
    }
    return business;
  }

  async update(businessId: string, ownerId: string, dto: CreateBusinessDto) {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, ownerId },
    });
    if (!business) {
      throw new NotFoundException('Business not found or access denied');
    }

    return this.prisma.business.update({
      where: { id: businessId },
      data: {
        companyName: dto.companyName,
        website: dto.website,
        industry: dto.industry,
        description: dto.description,
        whatsappEnabled: dto.whatsappEnabled ?? false,
        instagramEnabled: dto.instagramEnabled ?? false,
        emailEnabled: dto.emailEnabled ?? false,
        whatsappApiKey: dto.whatsappApiKey,
        instagramAccountId: dto.instagramAccountId,
        emailSmtp: dto.emailSmtp,
      },
    });
  }

  async createFAQ(businessId: string, ownerId: string, dto: CreateFAQDto) {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, ownerId },
    });
    if (!business) {
      throw new NotFoundException('Business not found or access denied');
    }

    return this.prisma.knowledgeBase.create({
      data: {
        businessId,
        title: dto.title,
        content: dto.content,
      },
    });
  }

  async getFAQs(businessId: string) {
    return this.prisma.knowledgeBase.findMany({
      where: { businessId },
    });
  }

  async deleteFAQ(faqId: string, ownerId: string) {
    const faq = await this.prisma.knowledgeBase.findUnique({
      where: { id: faqId },
      include: { business: true },
    });
    if (!faq || faq.business.ownerId !== ownerId) {
      throw new NotFoundException('FAQ not found or access denied');
    }

    await this.prisma.knowledgeBase.delete({
      where: { id: faqId },
    });
    return { success: true };
  }

  // --- Visitor Tracking Service ---
  async trackVisitor(businessId: string, data: { location: string; pagesViewed: string[]; duration: number }) {
    return this.prisma.visitorTrack.create({
      data: {
        businessId,
        location: data.location || 'Unknown',
        pagesViewed: JSON.stringify(data.pagesViewed || []),
        duration: data.duration || 0,
      },
    });
  }

  async getVisitorTracks(businessId: string) {
    const list = await this.prisma.visitorTrack.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });
    return list.map((item) => ({
      ...item,
      pagesViewed: JSON.parse(item.pagesViewed),
    }));
  }

  // --- Auto Website Scraper & FAQs extraction ---
  async scrapeWebsite(businessId: string, url: string) {
    const business = await this.getById(businessId);
    let faqList: Array<{ title: string; content: string }> = [];
    let scrapedText = '';

    try {
      const response = await axios.get(url, { timeout: 4000 });
      const html = response.data;
      
      // Basic text cleanup
      scrapedText = html
        .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
        .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .substring(0, 4000);
    } catch (err) {
      console.warn(`Direct crawl failed for ${url}, fallback to mock: ${err.message}`);
    }

    try {
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const response = await axios.post(`${aiServiceUrl}/extract-faqs`, {
        url,
        scraped_text: scrapedText,
        company_name: business.companyName,
        industry: business.industry,
        description: business.description,
      });
      faqList = response.data.faqs;
    } catch (err) {
      console.warn(`AI extraction failed, generating fallback FAQs: ${err.message}`);
      faqList = [
        {
          title: `What products/services does ${business.companyName} offer?`,
          content: `${business.companyName} operates in the ${business.industry} industry, providing expert services including ${business.description.substring(0, 80)}...`
        },
        {
          title: `How can I request support from ${business.companyName}?`,
          content: `You can reach out to our team directly through our website at ${url} or by leaving your contact details here in this chat widget.`
        },
        {
          title: `Why choose ${business.companyName}?`,
          content: `We focus on delivering premium, customized results for our clients. Learn more by browsing our portal or starting a live conversation with us.`
        }
      ];
    }

    const createdFAQs: any[] = [];
    for (const faq of faqList) {
      const created = await this.prisma.knowledgeBase.create({
        data: {
          businessId,
          title: faq.title,
          content: faq.content,
        },
      });
      createdFAQs.push(created);
    }

    return { count: createdFAQs.length, faqs: createdFAQs };
  }

  // --- Competitor Domain Analysis ---
  async competitorAnalysis(businessId: string, competitorUrl: string) {
    const business = await this.getById(businessId);
    let analysisResult: any = {};
    let scrapedText = '';

    try {
      const response = await axios.get(competitorUrl, { timeout: 4000 });
      const html = response.data;
      scrapedText = html
        .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
        .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .substring(0, 4000);
    } catch (err) {
      console.warn(`Competitor direct crawl failed for ${competitorUrl}: ${err.message}`);
    }

    try {
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const response = await axios.post(`${aiServiceUrl}/competitor-analysis`, {
        competitor_url: competitorUrl,
        scraped_text: scrapedText,
        my_business: {
          companyName: business.companyName,
          industry: business.industry,
          description: business.description,
        },
      });
      analysisResult = response.data;
    } catch (err) {
      console.warn(`AI competitor analysis failed: ${err.message}`);
      analysisResult = {
        serviceCompare: [
          { feature: 'Core Offerings', us: 'Custom ' + business.industry + ' services', competitor: 'Generic solutions' },
          { feature: 'Live AI Support', us: 'Yes (Instant)', competitor: 'No (Contact form only)' },
          { feature: 'Appointment Scheduling', us: 'Yes (Automated)', competitor: 'Manual' },
          { feature: 'Multi-Channel support', us: 'WhatsApp & Insta', competitor: 'Web only' },
        ],
        missingOfferings: [
          'Live instant CRM status callback logs',
          'Geo-location automated lead scoring rules',
          'Multi-user calendar integrations',
        ],
        contentGaps: [
          `SEO terms like 'best ${business.industry} automation'`,
          `Comparison blogs explaining '${business.companyName} vs ${competitorUrl.replace(/^https?:\/\//i, '')}'`,
          'Pricing details context logs',
        ],
      };
    }

    const saved = await this.prisma.competitorAnalysis.create({
      data: {
        businessId,
        competitorUrl,
        analysis: JSON.stringify(analysisResult),
      },
    });

    return {
      ...saved,
      analysis: analysisResult,
    };
  }

  async getCompetitorAnalyses(businessId: string) {
    const list = await this.prisma.competitorAnalysis.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return list.map((item) => ({
      ...item,
      analysis: JSON.parse(item.analysis),
    }));
  }

  // --- Dynamic AI Recommendations Engine ---
  async getRecommendations(businessId: string) {
    const leads = await this.prisma.lead.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const appointments = await this.prisma.appointment.findMany({
      where: { businessId },
      take: 10,
    });

    const recommendations: any[] = [];

    // Recommendation 1: High Priority Lead follow up
    const hotLeads = leads.filter((l) => l.status === 'HOT');
    if (hotLeads.length > 0) {
      const firstHot = hotLeads[0];
      recommendations.push({
        id: 'rec-1',
        title: 'Action Required: Contact Hot Lead',
        content: `Reach out to ${firstHot.name || 'Anonymous Visitor'} (${firstHot.email || firstHot.phone || 'no contact details provided'}) as soon as possible. AI qualified them as HOT with budget ${firstHot.budget || 'unspecified'}.`,
        priority: 'HIGH',
        category: 'LEAD',
        createdAt: new Date(),
      });
    } else {
      recommendations.push({
        id: 'rec-leads-empty',
        title: 'Boost Conversions',
        content: 'You have no HOT leads yet. Go to Widget Settings to test lead qualification in the chat sandbox.',
        priority: 'MEDIUM',
        category: 'LEAD',
        createdAt: new Date(),
      });
    }

    // Recommendation 2: Calendar appointments check
    const pendingAppts = appointments.filter((a) => a.status === 'PENDING');
    if (pendingAppts.length > 0) {
      recommendations.push({
        id: 'rec-2',
        title: 'Review Scheduled Bookings',
        content: `You have ${pendingAppts.length} pending appointments. Contact leads to confirm availability.`,
        priority: 'HIGH',
        category: 'LEAD',
        createdAt: new Date(),
      });
    }

    // Recommendation 3: Add FAQs based on content suggestions
    const faqs = await this.prisma.knowledgeBase.findMany({
      where: { businessId },
    });
    if (faqs.length < 5) {
      recommendations.push({
        id: 'rec-3',
        title: 'Improve AI Knowledge Base',
        content: `You have only ${faqs.length} FAQ items. Use "Auto Website Learning" to import FAQ context automatically from your business website.`,
        priority: 'MEDIUM',
        category: 'KB',
        createdAt: new Date(),
      });
    }

    // Recommendation 4: Connect WhatsApp/Instagram channel
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (business && !business.whatsappEnabled && !business.instagramEnabled) {
      recommendations.push({
        id: 'rec-4',
        title: 'Multiply Conversions',
        content: 'Integrate WhatsApp & Instagram in the multi-channel panel to engage users where they are active.',
        priority: 'LOW',
        category: 'COMPETITOR',
        createdAt: new Date(),
      });
    }

    return recommendations;
  }
}
